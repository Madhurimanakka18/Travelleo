const form = document.querySelector("#search-form");
const input = document.querySelector("#destination");
const originInput = document.querySelector("#originInput");
const status = document.querySelector("#status");
const results = document.querySelector("#results");

const languageBtn = document.querySelector("#languageBtn");
const languageMenu = document.querySelector("#languageMenu");
const micButton = document.querySelector("#micButton");

const favouritesBtn = document.querySelector("#favouritesBtn");
const favouritesPanel = document.querySelector("#favouritesPanel");
const favouritesList = document.querySelector("#favouritesList");
const closeFavourites = document.querySelector("#closeFavourites");

let currentLanguage = "en";
let currentAccessText = null;
let leafletMap = null;
let lastResultsData = null;

// ---- Styles (no styles.css edit needed) ----
const extraStyle = document.createElement("style");
extraStyle.textContent = `
  .result-link { display: flex; gap: 14px; align-items: flex-start; position: relative; }
  .result-photo { width: 96px; height: 96px; object-fit: cover; border-radius: 12px; flex-shrink: 0; }
  .result-info { flex: 1; min-width: 0; }
  .result-meta { font-weight: 600; color: #1f4d45; }

  .nav-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .favourites-btn {
    min-height: 42px;
    padding: 8px 14px;
    border-radius: 10px;
    border: 1px solid #d8cfc3;
    background: #fff;
    color: #1f4d45;
    cursor: pointer;
    font-weight: 600;
  }

  .favourites-panel {
    background: #fff;
    border: 1px solid #e7ded2;
    border-radius: 16px;
    padding: 20px;
    margin: 16px auto;
    max-width: 900px;
  }
  .favourites-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .favourites-header button {
    border: none;
    background: none;
    font-size: 1.3rem;
    cursor: pointer;
  }
  .favourites-empty { color: #7a7168; }

  #micButton {
    min-height: 44px;
    min-width: 44px;
    font-size: 1.2rem;
    border-radius: 50%;
    border: 1px solid #d8cfc3;
    background: #fff;
    color: #1f4d45;
    cursor: pointer;
    margin-right: 4px;
  }
  #micButton.listening {
    background: #e04b4b;
    color: #fff;
    border-color: #e04b4b;
  }

  .search-box { flex-wrap: wrap; }
  .search-box input { flex: 1 1 160px; min-width: 140px; }

  .map-box {
    height: 380px;
    width: 100%;
    border-radius: 16px;
    margin: 20px 0;
    overflow: hidden;
    border: 1px solid #e7ded2;
  }

  #tripPlanBtn {
    display: inline-block;
    margin: 8px 0 20px;
    padding: 10px 18px;
    border-radius: 10px;
    border: 1px solid #1f4d45;
    background: #1f4d45;
    color: #fff;
    cursor: pointer;
    font-weight: 600;
  }
  .trip-plan {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 14px;
    margin-bottom: 24px;
  }
  .trip-day {
    background: #fff;
    border: 1px solid #e7ded2;
    border-radius: 14px;
    padding: 16px;
  }
  .trip-day h3 { margin-top: 0; color: #1f4d45; }
  .trip-day p { margin: 6px 0; }

  .fav-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    border: none;
    background: rgba(255,255,255,0.9);
    border-radius: 50%;
    width: 36px;
    height: 36px;
    font-size: 1.05rem;
    cursor: pointer;
  }
`;
document.head.appendChild(extraStyle);

// ---- Labels for voice search + favourites, per language ----
const accessibilityText = {
  en: {
    mic: "Search by voice",
    micListening: "Listening...",
    micUnsupported: "Voice search is not supported on this browser.",
    micDenied: "Microphone access was blocked. Please allow microphone access for this site and try again.",
    micNoSpeech: "I didn't hear anything. Please try again.",
    micNetwork: "Voice search needs an internet connection. Please check your connection and try again.",
    favAdd: "Save to favourites",
    favRemove: "Remove from favourites",
    favouritesTitle: "My favourites",
    noFavourites: "You haven't saved anything yet.",
    originPlaceholder: "Flying from (optional)",
    tripPlanButton: "📝 Make my day-by-day plan",
    day: "Day"
  },
  te: {
    mic: "వాయిస్‌తో వెతకండి",
    micListening: "వింటోంది...",
    micUnsupported: "ఈ బ్రౌజర్‌లో వాయిస్ సెర్చ్ అందుబాటులో లేదు.",
    micDenied: "మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. దయచేసి ఈ సైట్ కోసం మైక్రోఫోన్ అనుమతి ఇచ్చి మళ్లీ ప్రయత్నించండి.",
    micNoSpeech: "ఏమీ వినిపించలేదు. దయచేసి మళ్లీ ప్రయత్నించండి.",
    micNetwork: "వాయిస్ సెర్చ్‌కు ఇంటర్నెట్ కనెక్షన్ అవసరం. దయచేసి మీ కనెక్షన్‌ని తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.",
    favAdd: "ఇష్టమైనవాటిలో చేర్చు",
    favRemove: "ఇష్టమైనవాటి నుండి తీసివేయి",
    favouritesTitle: "నా ఇష్టమైనవి",
    noFavourites: "మీరు ఇంకా ఏమీ సేవ్ చేయలేదు.",
    originPlaceholder: "ఎక్కడ నుండి బయలుదేరుతున్నారు (ఐచ్ఛికం)",
    tripPlanButton: "📝 రోజువారీ ప్రణాళిక తయారు చేయి",
    day: "రోజు"
  },
  hi: {
    mic: "आवाज़ से खोजें",
    micListening: "सुन रहा है...",
    micUnsupported: "इस ब्राउज़र में आवाज़ से खोज उपलब्ध नहीं है।",
    micDenied: "माइक्रोफ़ोन एक्सेस ब्लॉक कर दिया गया है। कृपया इस साइट के लिए माइक्रोफ़ोन की अनुमति दें और फिर से प्रयास करें।",
    micNoSpeech: "कुछ भी सुनाई नहीं दिया। कृपया फिर से प्रयास करें।",
    micNetwork: "आवाज़ से खोज के लिए इंटरनेट कनेक्शन आवश्यक है। कृपया कनेक्शन जांचकर फिर से प्रयास करें।",
    favAdd: "पसंदीदा में जोड़ें",
    favRemove: "पसंदीदा से हटाएं",
    favouritesTitle: "मेरी पसंदीदा सूची",
    noFavourites: "आपने अभी तक कुछ भी सेव नहीं किया है.",
    originPlaceholder: "कहाँ से उड़ान भरेंगे (वैकल्पिक)",
    tripPlanButton: "📝 दिन-वार योजना बनाएं",
    day: "दिन"
  }
};

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
    hotels: "హోటళ్లు",
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
  currentAccessText = accessibilityText[lang];

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

  micButton.setAttribute("aria-label", currentAccessText.mic);
  micButton.title = currentAccessText.mic;
  originInput.placeholder = currentAccessText.originPlaceholder;
  favouritesBtn.textContent = "❤️ " + currentAccessText.favouritesTitle;
  document.querySelector("#favouritesTitle").textContent = currentAccessText.favouritesTitle;

  languageMenu.style.display = "none";

  if (!favouritesPanel.hidden) renderFavouritesPanel();
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

// ---- Favourites (saved in this browser only) ----
const FAVOURITES_KEY = "travelleo_favourites";

function loadFavourites() {
  try {
    return JSON.parse(localStorage.getItem(FAVOURITES_KEY) || "[]");
  } catch (error) {
    return [];
  }
}

function saveFavourites(list) {
  try {
    localStorage.setItem(FAVOURITES_KEY, JSON.stringify(list));
  } catch (error) {
    console.warn("Could not save favourites:", error.message);
  }
}

function isFavourited(favourites, title, link) {
  return favourites.some(f => f.title === title && f.link === link);
}

function toggleFavourite(item) {
  let favourites = loadFavourites();
  const already = isFavourited(favourites, item.title, item.link);

  if (already) {
    favourites = favourites.filter(f => !(f.title === item.title && f.link === item.link));
  } else {
    favourites.push(item);
  }

  saveFavourites(favourites);
  return !already;
}

function renderFavouritesPanel() {
  const favourites = loadFavourites();
  const t = accessibilityText[currentLanguage];

  if (!favourites.length) {
    favouritesList.innerHTML = `<p class="favourites-empty">${t.noFavourites}</p>`;
    return;
  }

  favouritesList.innerHTML = `
    <div class="results-grid">
      ${favourites.map(item => `
        <a class="result-link" href="${escapeHtml(item.link || "#")}" target="_blank" rel="noreferrer">
          ${item.thumbnail ? `<img class="result-photo" src="${escapeHtml(item.thumbnail)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'">` : ""}
          <div class="result-info">
            <h3>${escapeHtml(item.title)}</h3>
            ${item.rating ? `<p class="result-meta">⭐ ${escapeHtml(String(item.rating))}${item.price ? ` · ${escapeHtml(String(item.price))}` : ""}</p>` : ""}
            <p>${escapeHtml(item.address || "")}</p>
          </div>
          <button type="button" class="fav-btn" data-title="${escapeHtml(item.title)}" data-link="${escapeHtml(item.link || "")}" aria-label="${escapeHtml(t.favRemove)}">❤️</button>
        </a>
      `).join("")}
    </div>
  `;
}

favouritesBtn.addEventListener("click", () => {
  favouritesPanel.hidden = !favouritesPanel.hidden;
  if (!favouritesPanel.hidden) {
    renderFavouritesPanel();
    favouritesPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

closeFavourites.addEventListener("click", () => {
  favouritesPanel.hidden = true;
});

favouritesList.addEventListener("click", event => {
  const btn = event.target.closest(".fav-btn");
  if (!btn) return;
  event.preventDefault();
  event.stopPropagation();

  toggleFavourite({ title: btn.dataset.title, link: btn.dataset.link });
  renderFavouritesPanel();
});

// ---- Map ----
function initMap(markersData) {
  const mapDiv = document.querySelector("#map");
  if (!mapDiv) return;

  if (!markersData.length || typeof L === "undefined") {
    mapDiv.hidden = true;
    return;
  }

  mapDiv.hidden = false;

  if (leafletMap) {
    leafletMap.remove();
    leafletMap = null;
  }

  leafletMap = L.map(mapDiv).setView([markersData[0].lat, markersData[0].lng], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19
  }).addTo(leafletMap);

  const bounds = [];
  markersData.forEach(marker => {
    L.marker([marker.lat, marker.lng])
      .addTo(leafletMap)
      .bindPopup(`<strong>${marker.icon} ${escapeHtml(marker.title)}</strong>`);
    bounds.push([marker.lat, marker.lng]);
  });

  if (bounds.length > 1) {
    leafletMap.fitBounds(bounds, { padding: [30, 30] });
  }
}

// ---- Trip plan ----
function buildTripPlan(data) {
  const places = data.places || [];
  const restaurants = data.restaurants || [];
  const dayCount = 3;
  const plan = Array.from({ length: dayCount }, () => ({ places: [], restaurants: [] }));

  places.forEach((place, i) => plan[i % dayCount].places.push(place));
  restaurants.forEach((restaurant, i) => plan[i % dayCount].restaurants.push(restaurant));

  return plan;
}

function renderTripPlan(plan) {
  const t = translations[currentLanguage];
  const a = accessibilityText[currentLanguage];

  return plan.map((day, index) => {
    const items = [
      ...day.places.map(p => `<p>📍 ${escapeHtml(p.title)}</p>`),
      ...day.restaurants.map(r => `<p>🍴 ${escapeHtml(r.title)}</p>`)
    ].join("");

    return `
      <div class="trip-day">
        <h3>${a.day} ${index + 1}</h3>
        ${items || `<p class="empty">${t.empty}</p>`}
      </div>
    `;
  }).join("");
}

function renderResults(destination, data) {
  const t = translations[currentLanguage];
  const a = accessibilityText[currentLanguage];
  lastResultsData = data;

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

  const favourites = loadFavourites();
  const markersData = [];

  const cards = Object.entries(data).map(([category, items]) => {
    const links = items.length
      ? items.map(item => {
          if (item.latitude && item.longitude) {
            markersData.push({
              lat: item.latitude,
              lng: item.longitude,
              title: item.title,
              icon: icons[category]
            });
          }

          const favourited = isFavourited(favourites, item.title, item.link);

          return `
          <a class="result-link"
             href="${escapeHtml(item.link || "#")}"
             target="_blank"
             rel="noreferrer">
            ${item.thumbnail ? `<img class="result-photo" src="${escapeHtml(item.thumbnail)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'">` : ""}
            <div class="result-info">
              <h3>${escapeHtml(item.title)}</h3>
              ${item.rating ? `<p class="result-meta">⭐ ${escapeHtml(String(item.rating))}${item.reviews ? ` (${escapeHtml(String(item.reviews))})` : ""}${item.price ? ` · ${escapeHtml(String(item.price))}` : ""}</p>` : ""}
              <p>${escapeHtml(item.address || item.snippet || "")}</p>
              <span>${t.open}</span>
            </div>
            <button type="button"
                    class="fav-btn"
                    data-title="${escapeHtml(item.title)}"
                    data-link="${escapeHtml(item.link || "")}"
                    data-thumb="${escapeHtml(item.thumbnail || "")}"
                    data-price="${escapeHtml(item.price || "")}"
                    data-rating="${escapeHtml(item.rating ? String(item.rating) : "")}"
                    data-address="${escapeHtml(item.address || item.snippet || "")}"
                    aria-label="${favourited ? escapeHtml(a.favRemove) : escapeHtml(a.favAdd)}">
              ${favourited ? "❤️" : "🤍"}
            </button>
          </a>
        `;
        }).join("")
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

    <div id="map" class="map-box" hidden></div>

    <button type="button" id="tripPlanBtn">${a.tripPlanButton}</button>
    <div id="tripPlanOutput" class="trip-plan" hidden></div>

    <div class="results-grid">${cards}</div>
  `;

  results.hidden = false;

  initMap(markersData);

  const tripPlanBtn = document.querySelector("#tripPlanBtn");
  const tripPlanOutput = document.querySelector("#tripPlanOutput");
  tripPlanBtn.addEventListener("click", () => {
    const plan = buildTripPlan(data);
    tripPlanOutput.innerHTML = renderTripPlan(plan);
    tripPlanOutput.hidden = false;
  });
}

// Favourite heart clicks inside the results grid
results.addEventListener("click", event => {
  const btn = event.target.closest(".fav-btn");
  if (!btn) return;

  event.preventDefault();
  event.stopPropagation();

  const item = {
    title: btn.dataset.title,
    link: btn.dataset.link,
    thumbnail: btn.dataset.thumb,
    price: btn.dataset.price,
    rating: btn.dataset.rating,
    address: btn.dataset.address
  };

  const nowFavourited = toggleFavourite(item);
  btn.textContent = nowFavourited ? "❤️" : "🤍";
  btn.setAttribute(
    "aria-label",
    nowFavourited ? accessibilityText[currentLanguage].favRemove : accessibilityText[currentLanguage].favAdd
  );
});

// ---- Voice search ----
const SpeechRecognitionAPI =
  window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isListening = false;

if (SpeechRecognitionAPI) {
  recognition = new SpeechRecognitionAPI();
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.addEventListener("result", event => {
    const transcript = event.results[0][0].transcript;
    input.value = transcript;
    status.hidden = true;
    if (form.requestSubmit) form.requestSubmit();
    else form.dispatchEvent(new Event("submit", { cancelable: true }));
  });

  recognition.addEventListener("end", () => {
    isListening = false;
    micButton.classList.remove("listening");
    micButton.textContent = "🎤";
  });

  recognition.addEventListener("error", event => {
    isListening = false;
    micButton.classList.remove("listening");
    micButton.textContent = "🎤";

    let message = currentAccessText.micUnsupported;
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      message = currentAccessText.micDenied;
    } else if (event.error === "no-speech") {
      message = currentAccessText.micNoSpeech;
    } else if (event.error === "network") {
      message = currentAccessText.micNetwork;
    }

    console.warn("Voice search error:", event.error);

    status.hidden = false;
    status.className = "status error";
    status.textContent = message;
  });
} else {
  micButton.disabled = true;
}

micButton.addEventListener("click", () => {
  if (!recognition) {
    alert(currentAccessText.micUnsupported);
    return;
  }

  if (isListening) {
    recognition.stop();
    return;
  }

  const langMap = { en: "en-IN", te: "te-IN", hi: "hi-IN" };
  recognition.lang = langMap[currentLanguage] || "en-IN";

  isListening = true;
  micButton.classList.add("listening");
  micButton.textContent = "🎙️";

  status.hidden = false;
  status.className = "status loading";
  status.textContent = currentAccessText.micListening;
  results.hidden = true;

  recognition.start();
});

form.addEventListener("submit", async event => {
  event.preventDefault();

  const destination = input.value.trim();
  if (!destination) return;

  const origin = originInput.value.trim();
  const button = form.querySelector("#searchButton");
  const t = translations[currentLanguage];

  button.disabled = true;
  button.textContent = "Searching...";

  status.hidden = false;
  status.className = "status loading";
  status.textContent = `${t.exploring} ${destination}...`;

  results.hidden = true;

  try {
    const originParam = origin ? `&origin=${encodeURIComponent(origin)}` : "";
    const response = await fetch(
      `/api/search?destination=${encodeURIComponent(destination)}&language=${currentLanguage}${originParam}`
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