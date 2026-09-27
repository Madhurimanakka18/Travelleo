const http = require("http");
const fs = require("fs");
const path = require("path");
const { getJson } = require("serpapi");

function loadEnvironment() {
  const envFile = path.join(__dirname, ".env");
  if (!fs.existsSync(envFile)) return;
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}
loadEnvironment();

const PORT = process.env.PORT || 3000;
const PUBLIC_FOLDER = path.join(__dirname, "public");

const categoryQueries = {
  en: { hotels: "best hotels in", places: "top tourist attractions in", restaurants: "best restaurants in", travel: "how to reach" },
  te: { hotels: "ఉత్తమ హోటళ్లు", places: "చూడదగిన పర్యాటక ప్రదేశాలు", restaurants: "ఉత్తమ రెస్టారెంట్లు", travel: "ఎలా చేరుకోవాలి" },
  hi: { hotels: "सबसे अच्छे होटल", places: "प्रमुख पर्यटन स्थल", restaurants: "सबसे अच्छे रेस्टोरेंट", travel: "कैसे पहुंचें" }
};

const languages = {
  en: { hl: "en", gl: "us" },
  te: { hl: "te", gl: "in" },
  hi: { hl: "hi", gl: "in" }
};

// ---- Small IATA airport code lookup for the flight-prices feature ----
const airportCodes = {
  "hyderabad": "HYD", "delhi": "DEL", "new delhi": "DEL", "mumbai": "BOM", "bombay": "BOM",
  "bangalore": "BLR", "bengaluru": "BLR", "chennai": "MAA", "kolkata": "CCU", "calcutta": "CCU",
  "goa": "GOI", "pune": "PNQ", "ahmedabad": "AMD", "jaipur": "JAI", "lucknow": "LKO",
  "kochi": "COK", "cochin": "COK", "thiruvananthapuram": "TRV", "trivandrum": "TRV",
  "visakhapatnam": "VTZ", "vizag": "VTZ", "coimbatore": "CJB", "nagpur": "NAG",
  "indore": "IDR", "bhopal": "BHO", "chandigarh": "IXC", "amritsar": "ATQ",
  "guwahati": "GAU", "patna": "PAT", "ranchi": "IXR", "bhubaneswar": "BBI",
  "srinagar": "SXR", "varanasi": "VNS", "agra": "AGR", "udaipur": "UDR",
  "paris": "CDG", "london": "LHR", "new york": "JFK", "dubai": "DXB",
  "singapore": "SIN", "bangkok": "BKK", "tokyo": "HND", "sydney": "SYD",
  "los angeles": "LAX", "san francisco": "SFO", "toronto": "YYZ", "hong kong": "HKG",
  "kuala lumpur": "KUL", "doha": "DOH", "abu dhabi": "AUH", "rome": "FCO",
  "madrid": "MAD", "barcelona": "BCN", "amsterdam": "AMS", "frankfurt": "FRA",
  "munich": "MUC", "zurich": "ZRH", "istanbul": "IST", "male": "MLE",
  "maldives": "MLE", "bali": "DPS", "phuket": "HKT", "seoul": "ICN"
};

function getAirportCode(cityName) {
  if (!cityName) return null;
  return airportCodes[cityName.trim().toLowerCase()] || null;
}

// ---- Translation (free Google Translate endpoint, no key needed) ----
async function translateText(text, targetLang) {
  if (!text || targetLang === "en") return text;
  try {
    const url =
      "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=" +
      targetLang + "&dt=t&q=" + encodeURIComponent(text);

    const res = await fetch(url);
    if (!res.ok) return text;
    const json = await res.json();
    return json[0].map(part => part[0]).join("");
  } catch (error) {
    return text;
  }
}

async function translateItem(item, targetLang) {
  if (targetLang === "en") return item;

  const [title, snippet, address] = await Promise.all([
    translateText(item.title, targetLang),
    translateText(item.snippet, targetLang),
    item.address ? translateText(item.address, targetLang) : Promise.resolve(item.address)
  ]);

  return { ...item, title, snippet, address };
}

async function translateItems(items, targetLang) {
  if (targetLang === "en") return items;
  return Promise.all(items.map(item => translateItem(item, targetLang)));
}

async function searchGoogle(query, language) {
  const lang = languages[language] || languages.en;
  const json = await getJson({
    engine: "google", q: query, hl: lang.hl, gl: lang.gl,
    api_key: process.env.SERPAPI_KEY
  });
  if (json.error) throw new Error(json.error);
  return (json.organic_results || []).slice(0, 5).map(({ title, link, snippet }) => ({
    title, link, snippet: snippet || "No description available."
  }));
}

async function searchMaps(query, language) {
  const lang = languages[language] || languages.en;
  const json = await getJson({
    engine: "google_maps", q: query, type: "search",
    hl: lang.hl, gl: lang.gl, api_key: process.env.SERPAPI_KEY
  });
  if (json.error) throw new Error(json.error);
  return (json.local_results || []).slice(0, 6).map(place => ({
    title: place.title,
    link: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(place.title) +
      (place.place_id ? "&query_place_id=" + place.place_id : ""),
    snippet: place.type || "",
    address: place.address,
    rating: place.rating,
    reviews: place.reviews,
    price: place.price,
    thumbnail: place.serpapi_thumbnail || place.thumbnail,
    latitude: place.gps_coordinates ? place.gps_coordinates.latitude : null,
    longitude: place.gps_coordinates ? place.gps_coordinates.longitude : null
  }));
}

function dateString(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

async function searchHotels(destination, language) {
  const lang = languages[language] || languages.en;
  const json = await getJson({
    engine: "google_hotels", q: `hotels in ${destination}`,
    check_in_date: dateString(30), check_out_date: dateString(31),
    adults: 2, currency: "INR", hl: lang.hl, gl: lang.gl,
    api_key: process.env.SERPAPI_KEY
  });
  if (json.error) throw new Error(json.error);
  return (json.properties || []).slice(0, 6).map(hotel => ({
    title: hotel.name,
    link: hotel.link || "https://www.google.com/travel/hotels?q=" + encodeURIComponent(hotel.name),
    snippet: hotel.description || hotel.type || "",
    rating: hotel.overall_rating,
    reviews: hotel.reviews,
    price: hotel.rate_per_night ? hotel.rate_per_night.lowest + " / night" : "",
    thumbnail: hotel.images && hotel.images[0] ? hotel.images[0].thumbnail : "",
    latitude: hotel.gps_coordinates ? hotel.gps_coordinates.latitude : null,
    longitude: hotel.gps_coordinates ? hotel.gps_coordinates.longitude : null
  }));
}

async function searchFlights(originCity, destinationCity, language) {
  const lang = languages[language] || languages.en;
  const departureId = getAirportCode(originCity);
  const arrivalId = getAirportCode(destinationCity);

  if (!departureId || !arrivalId) {
    throw new Error("No airport code mapping available for this route");
  }

  const json = await getJson({
    engine: "google_flights",
    departure_id: departureId,
    arrival_id: arrivalId,
    outbound_date: dateString(30),
    type: "2",
    currency: "INR",
    hl: lang.hl,
    gl: lang.gl,
    api_key: process.env.SERPAPI_KEY
  });

  if (json.error) throw new Error(json.error);

  const flightGroups = [...(json.best_flights || []), ...(json.other_flights || [])];

  const items = flightGroups.slice(0, 6).map(group => {
    const legs = group.flights || [];
    const firstLeg = legs[0] || {};
    const lastLeg = legs[legs.length - 1] || firstLeg;
    const stops = legs.length > 0 ? legs.length - 1 : 0;

    const departTime = firstLeg.departure_airport ? firstLeg.departure_airport.time : "";
    const arriveTime = lastLeg.arrival_airport ? lastLeg.arrival_airport.time : "";
    const durationMins = group.total_duration || 0;
    const durationText = durationMins
      ? `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`
      : "";
    const stopsText = stops === 0 ? "Non-stop" : `${stops} stop(s)`;

    return {
      title: `${firstLeg.airline || "Flight"} · ${departureId} → ${arrivalId}`,
      link: "https://www.google.com/travel/flights?q=" +
        encodeURIComponent(`flights from ${originCity} to ${destinationCity}`),
      snippet: [departTime && arriveTime ? `${departTime} - ${arriveTime}` : "", stopsText, durationText]
        .filter(Boolean).join(" · "),
      price: group.price ? "₹" + group.price : "",
      thumbnail: firstLeg.airline_logo || ""
    };
  });

  return items;
}

const transportQueryText = {
  en: "by train, bus and car",
  te: "రైలు, బస్సు మరియు కారు ద్వారా",
  hi: "ट्रेन, बस और कार से"
};

async function searchTravelOptions(origin, destination, phrase, language) {
  const combined = [];

  if (origin) {
    try {
      const flights = await searchFlights(origin, destination, language);
      combined.push(...flights);
    } catch (error) {
      console.error("Flights failed, showing other travel options only:", error.message);
    }
  }

  const extraWords = transportQueryText[language] || transportQueryText.en;
  const query = origin
    ? `${phrase} ${destination} from ${origin} ${extraWords}`
    : `${phrase} ${destination}`;

  const generalLinks = await searchGoogle(query, language);
  combined.push(...generalLinks);

  return combined;
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, { "Content-Type": "application/json" });
  response.end(JSON.stringify(data));
}

function serveFile(response, fileName) {
  const filePath = path.join(PUBLIC_FOLDER, fileName === "/" ? "index.html" : fileName);
  if (!filePath.startsWith(PUBLIC_FOLDER) || !fs.existsSync(filePath)) {
    response.writeHead(404);
    return response.end("Not found");
  }
  const types = { ".html": "text/html", ".css": "text/css", ".js": "application/javascript" };
  response.writeHead(200, {
    "Content-Type": `${types[path.extname(filePath)] || "text/plain"}; charset=utf-8`
  });
  response.end(fs.readFileSync(filePath));
}

http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "GET" && url.pathname === "/api/search") {
    const destination = (url.searchParams.get("destination") || "").trim();
    const language = url.searchParams.get("language") || "en";
    const origin = (url.searchParams.get("origin") || "").trim();

    if (!destination || destination.length > 80) {
      return sendJson(response, 400, { error: "Please enter a destination (up to 80 characters)." });
    }
    if (!languages[language]) {
      return sendJson(response, 400, { error: "Invalid language selected." });
    }
    if (!process.env.SERPAPI_KEY) {
      return sendJson(response, 500, { error: "SERPAPI_KEY is missing from the .env file." });
    }

    try {
      const queries = categoryQueries[language] || categoryQueries.en;

      const jobs = Object.entries(queries).map(async ([name, phrase]) => {
        let items;
        try {
          if (name === "hotels") items = await searchHotels(destination, language);
          else if (name === "places") items = await searchMaps(`${phrase} ${destination}`, language);
          else if (name === "restaurants") items = await searchMaps(`${phrase} ${destination}`, language);
          else if (name === "travel") items = await searchTravelOptions(origin, destination, phrase, language);
        } catch (error) {
          console.error(`${name} failed, using normal search:`, error.message);
        }

        if (!items || items.length === 0) {
          items = await searchGoogle(`${phrase} ${destination}`, language);
        }

        items = await translateItems(items, language);
        return [name, items];
      });

      const results = Object.fromEntries(await Promise.all(jobs));
      return sendJson(response, 200, { destination, language, results });
    } catch (error) {
      console.error("SerpApi search error:", error.message);
      return sendJson(response, 502, { error: "Travelleo could not complete that search. Please try again." });
    }
  }

  if (request.method === "GET") return serveFile(response, url.pathname);

  response.writeHead(405);
  response.end("Method not allowed");
}).listen(PORT, () => {
  console.log(`Travelleo is ready at http://localhost:${PORT}`);
});