const http = require("http");
const fs = require("fs");
const path = require("path");
const { getJson } = require("serpapi");

function loadEnvironment() {
  const envFile = path.join(__dirname, ".env");
  if (!fs.existsSync(envFile)) return;

  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  }
}

loadEnvironment();

const PORT = process.env.PORT || 3000;
const PUBLIC_FOLDER = path.join(__dirname, "public");

const categoryQueries = {
  en: {
    hotels: "best hotels in",
    places: "top tourist attractions in",
    restaurants: "best restaurants in",
    travel: "how to reach"
  },

  te: {
    hotels: "ఉత్తమ హోటళ్లు",
    places: "చూడదగిన పర్యాటక ప్రదేశాలు",
    restaurants: "ఉత్తమ రెస్టారెంట్లు",
    travel: "ఎలా చేరుకోవాలి"
  },

  hi: {
    hotels: "सबसे अच्छे होटल",
    places: "प्रमुख पर्यटन स्थल",
    restaurants: "सबसे अच्छे रेस्टोरेंट",
    travel: "कैसे पहुंचें"
  }
};
const languages = {
  en: { hl: "en", gl: "us" },
  te: { hl: "te", gl: "in" },
  hi: { hl: "hi", gl: "in" }
};

async function searchGoogle(query, language) {
  const lang = languages[language] || languages.en;

  const json = await getJson({
    engine: "google",
    q: query,
   hl: lang.hl,
gl: lang.gl,

    api_key: process.env.SERPAPI_KEY
  });

  if (json.error) {
    throw new Error(json.error);
  }

  return (json.organic_results || [])
    .slice(0, 5)
    .map(({ title, link, snippet }) => ({
      title,
      link,
      snippet: snippet || "No description available."
    }));
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json"
  });

  response.end(JSON.stringify(data));
}

function serveFile(response, fileName) {
  const filePath = path.join(
    PUBLIC_FOLDER,
    fileName === "/" ? "index.html" : fileName
  );

  if (
    !filePath.startsWith(PUBLIC_FOLDER) ||
    !fs.existsSync(filePath)
  ) {
    response.writeHead(404);
    return response.end("Not found");
  }

  const types = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript"
  };

  response.writeHead(200, {
    "Content-Type":
      `${types[path.extname(filePath)] || "text/plain"}; charset=utf-8`
  });

  response.end(fs.readFileSync(filePath));
}

http.createServer(async (request, response) => {
  const url = new URL(
    request.url,
    `http://${request.headers.host}`
  );

  if (request.method === "GET" && url.pathname === "/api/search") {
    const destination =
      (url.searchParams.get("destination") || "").trim();

    const language =
      url.searchParams.get("language") || "en";

    if (!destination || destination.length > 80) {
      return sendJson(response, 400, {
        error: "Please enter a destination (up to 80 characters)."
      });
    }

    if (!languages[language]) {
      return sendJson(response, 400, {
        error: "Invalid language selected."
      });
    }

    if (!process.env.SERPAPI_KEY) {
      return sendJson(response, 500, {
        error: "SERPAPI_KEY is missing from the .env file."
      });
    }

    try {
      const queries = categoryQueries[language] || categoryQueries.en;

const jobs = Object.entries(queries).map(
  async ([name, phrase]) => [
    name,
    await searchGoogle(
      `${phrase} ${destination}`,
      language
    )
  ]
);

      const results = Object.fromEntries(
        await Promise.all(jobs)
      );

      return sendJson(response, 200, {
        destination,
        language,
        results
      });

    } catch (error) {
      console.error(
        "SerpApi search error:",
        error.message
      );

      return sendJson(response, 502, {
        error:
          "Travelleo could not complete that search. Please try again."
      });
    }
  }

  if (request.method === "GET") {
    return serveFile(response, url.pathname);
  }

  response.writeHead(405);
  response.end("Method not allowed");

}).listen(PORT, () => {
  console.log(
    `Travelleo is ready at http://localhost:${PORT}`
  );
});