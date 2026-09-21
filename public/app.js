const form = document.querySelector("#search-form");
const input = document.querySelector("#destination");
const status = document.querySelector("#status");
const results = document.querySelector("#results");

const languageBtn = document.querySelector("#languageBtn");
const languageMenu = document.querySelector("#languageMenu");

let currentLanguage = "en";

const translations = {
  en: {
    button: "English ▾",
    eyebrow: "DISCOVER YOUR NEXT ESCAPE",
    title: "Where will your<br><em>story</em> take you?",
    intro: "Find the best stays, hidden gems, local flavours and travel details for any destination — all in one place.",
    placeholder: "Try Hyderabad, Goa, Paris...",
    search: "Plan my trip →",
    helper: "Searches are powered by live travel information",
    hotels: "Stays",
    hotelsText: "Hotels that suit your journey",
    places: "Explore",
    placesText: "Unmissable places and sights",
    restaurants: "Eat local",
    restaurantsText: "Restaurants worth visiting",
    travel: "Get there",
    travelText: "Helpful travel guidance",
    exploring: "Travelleo is exploring",
    starter: "YOUR TRAVEL STARTER PACK",
    discovering: "Discovering",
    open: "Open result →",
    empty: "No results found in this category."
  },

  te: {
    button: "తెలుగు ▾",
    eyebrow: "మీ తదుపరి ప్రయాణాన్ని కనుగొనండి",
    title: "మీ <br><em>కథ</em> మిమ్మల్ని ఎక్కడికి తీసుకెళ్తుంది?",
    intro: "ఏ గమ్యస్థానానికైనా ఉత్తమ హోటళ్లు, అందమైన ప్రదేశాలు, స్థానిక రుచులు మరియు ప్రయాణ వివరాలను ఒకే చోట కనుగొనండి.",
    placeholder: "హైదరాబాద్, గోవా, పారిస్ ప్రయత్నించండి...",
    search: "నా ప్రయాణాన్ని ప్లాన్ చేయండి →",
    helper: "లైవ్ ట్రావెల్ సమాచారం ద్వారా శోధనలు జరుగుతాయి",
    hotels: "బస",
    hotelsText: "మీ ప్రయాణానికి సరిపోయే హోటళ్లు",
    places: "ప్రదేశాలు",
    placesText: "తప్పక చూడాల్సిన ప్రదేశాలు",
    restaurants: "స్థానిక ఆహారం",
    restaurantsText: "తప్పక ప్రయత్నించాల్సిన రెస్టారెంట్లు",
    travel: "ఎలా చేరాలి",
    travelText: "ఉపయోగకరమైన ప్రయాణ సమాచారం",
    exploring: "Travelleo వెతుకుతోంది",
    starter: "మీ ప్రయాణ సమాచారం",
    discovering: "కనుగొనండి",
    open: "ఫలితాన్ని తెరవండి →",
    empty: "ఈ విభాగంలో ఫలితాలు లేవు."
  },

  hi: {
    button: "हिन्दी ▾",
    eyebrow: "अपनी अगली यात्रा खोजें",
    title: "आपकी <br><em>कहानी</em> आपको कहाँ ले जाएगी?",
    intro: "किसी भी गंतव्य के लिए बेहतरीन होटल, घूमने की जगहें, स्थानीय भोजन और यात्रा की जानकारी एक ही जगह पाएं।",
    placeholder: "हैदराबाद, गोवा, पेरिस आज़माएं...",
    search: "मेरी यात्रा प्लान करें →",
    helper: "खोज लाइव यात्रा जानकारी द्वारा संचालित है",
    hotels: "ठहरने की जगह",
    hotelsText: "आपकी यात्रा के लिए उपयुक्त होटल",
    places: "घूमने की जगहें",
    placesText: "देखने लायक खास जगहें",
    restaurants: "स्थानीय भोजन",
    restaurantsText: "देखने लायक रेस्टोरेंट",
    travel: "कैसे पहुंचें",
    travelText: "उपयोगी यात्रा जानकारी",
    exploring: "Travelleo खोज रहा है",
    starter: "आपकी यात्रा जानकारी",
    discovering: "खोज रहे हैं",
    open: "परिणाम खोलें →",
    empty: "इस श्रेणी में कोई परिणाम नहीं मिला।"
  }
};

function applyLanguage(lang) {
  currentLanguage = lang;
  const t = translations[lang];

  languageBtn.textContent = t.button;
  document.querySelector("#eyebrow").textContent = t.eyebrow;
  document.querySelector("#heroTitle").innerHTML = t.title;
  document.querySelector("#intro").textContent = t.intro;
  input.placeholder = t.placeholder;
  document.querySelector("#searchButton").textContent = t.search;
  document.querySelector("#helper").textContent = t.helper;

  document.querySelector("#featureHotels").textContent = t.hotels;
  document.querySelector("#featureHotelsText").textContent = t.hotelsText;
  document.querySelector("#featurePlaces").textContent = t.places;
  document.querySelector("#featurePlacesText").textContent = t.placesText;
  document.querySelector("#featureRestaurants").textContent = t.restaurants;
  document.querySelector("#featureRestaurantsText").textContent = t.restaurantsText;
  document.querySelector("#featureTravel").textContent = t.travel;
  document.querySelector("#featureTravelText").textContent = t.travelText;

  languageMenu.style.display = "none";
}

languageBtn.addEventListener("click", () => {
  languageMenu.style.display =
    languageMenu.style.display === "block" ? "none" : "block";
});

languageMenu.querySelectorAll("button").forEach(button => {
  button.addEventListener("click", () => {
    applyLanguage(button.dataset.lang);
  });
});

function escapeHtml(value = "") {
  const node = document.createElement("div");
  node.textContent = value;
  return node.innerHTML;
}

function renderResults(destination, data) {
  const t = translations[currentLanguage];

  const categoryNames = {
    hotels: t.hotels,
    places: t.places,
    restaurants: t.restaurants,
    travel: t.travel
  };

  const icons = {
    hotels: "🏨",
    places: "📍",
    restaurants: "🍴",
    travel: "🚗"
  };

  const cards = Object.entries(data).map(([category, items]) => {
    const links = items.length
      ? items.map(item => `
          <a class="result-link"
             href="${escapeHtml(item.link)}"
             target="_blank"
             rel="noreferrer">
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.snippet)}</p>
            <span>${t.open}</span>
          </a>
        `).join("")
      : `<p class="empty">${t.empty}</p>`;

    return `
      <article class="result-group">
        <div class="result-heading">
          <span>${icons[category]}</span>
          <h2>${categoryNames[category]}</h2>
        </div>
        ${links}
      </article>
    `;
  }).join("");

  results.innerHTML = `
    <div class="results-title">
      <p class="eyebrow">${t.starter}</p>
      <h2>${t.discovering} <em>${escapeHtml(destination)}</em></h2>
    </div>

    <div class="results-grid">${cards}</div>
  `;

  results.hidden = false;
}

form.addEventListener("submit", async event => {
  event.preventDefault();

  const destination = input.value.trim();
  if (!destination) return;

  const button = form.querySelector("button");
  const t = translations[currentLanguage];

  button.disabled = true;
  button.textContent = "Searching...";

  status.hidden = false;
  status.className = "status loading";
  status.textContent = `${t.exploring} ${destination}...`;

  results.hidden = true;

  try {
    const response = await fetch(
      `/api/search?destination=${encodeURIComponent(destination)}&language=${currentLanguage}`
    );

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error);
    }

    status.hidden = true;
    renderResults(payload.destination, payload.results);

    results.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  } catch (error) {
    status.className = "status error";
    status.textContent =
      error.message || "Something went wrong. Please try again.";
  } finally {
    button.disabled = false;
    button.textContent = t.search;
  }
});

applyLanguage("en");
