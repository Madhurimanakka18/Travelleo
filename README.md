# Travelleo ✦ — Your Travel Companion

Travelleo turns a single destination search into a complete trip starter pack — real hotels, places, restaurants, flights, and a day-by-day plan, powered live by SerpApi.

**Live app:** https://travelleo.onrender.com/

## What it does

Type any destination (and optionally where you're flying from), and Travelleo instantly shows:

- 🏨 **Stays** — real hotels with photos, ratings, and price per night
- 📍 **Explore** — top attractions with photos, ratings, and addresses
- 🍴 **Eat local** — restaurants with photos, ratings, and addresses
- 🚗 **Get there** — real flight prices (when a "Flying from" city is given) plus train, bus, and car guidance

On top of that:

- 🗺️ **Interactive map** — every hotel, place, and restaurant plotted with pins
- 📝 **Day-by-day trip plan** — one click turns the results into a simple 3-day itinerary
- ❤️ **Favourites** — save any card and revisit it later, saved in your browser
- 🎤 **Voice search** — speak a destination instead of typing
- 🌐 **Multi-language** — full results in English, Telugu (తెలుగు), and Hindi (हिन्दी), including live-translated descriptions

## Built with SerpApi

Travelleo calls SerpApi live on every search, using four different engines:

| Engine | Used for |
|---|---|
| `google` | General travel guidance, and a fallback if other engines return nothing |
| `google_maps` | Real places and restaurants — photos, ratings, addresses, coordinates |
| `google_hotels` | Real hotel listings — photos, ratings, live prices, coordinates |
| `google_flights` | Real flight prices and timings between supported cities |

## Tech stack

- **Backend:** Node.js (built-in `http` module, no framework) + the `serpapi` npm package
- **Frontend:** Plain HTML, CSS, and JavaScript (no build tools)
- **Map:** Leaflet.js with OpenStreetMap tiles
- **Translation:** Free Google Translate endpoint for live result translation
- **Voice search:** Browser's built-in Speech Recognition API
- **Hosting:** Render (backend) + GitHub (source)

## Running it locally

```bash
git clone https://github.com/Madhurimanakka18/Travelleo.git
cd Travelleo
npm install
```

Create a `.env` file in the project root with:

```
SERPAPI_KEY=your_serpapi_key_here
```

Then run:

```bash
node index.js
```

Open `http://localhost:3000` in your browser.

## Project structure

```
Travelleo/
├── index.js           # Server: routes, SerpApi calls, translation
├── package.json
├── .env                # Your SerpApi key (not committed)
└── public/
    ├── index.html      # Page structure
    ├── app.js          # Front-end logic: search, map, trip plan, favourites, voice
    └── styles.css       # Styling
```

## Notes for judges

- Every search makes live SerpApi calls in real time — nothing is cached or hardcoded.
- Flight prices work for major cities (see `airportCodes` in `index.js`); for others, the app gracefully falls back to normal travel links so nothing ever breaks.
- If a category ever returns no results from a specialised engine (Maps/Hotels/Flights), the app automatically falls back to a normal Google search, so the page never shows an empty section unnecessarily.

---
Made for the curious traveller ✦ Travelleo
