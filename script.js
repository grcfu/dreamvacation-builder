// 1. UI Elements
const startBtn = document.getElementById('start-adventure');
const cityInput = document.getElementById('city-input');

// 2. Constants & Global State (Updated Palette)
const OPENAI_KEY = 's2ef662dn2q2';
const COLORS = {
    crimson: "#E52B50",
    teal: "#91C6C6",
    plum: "#591D35",
    sky: "#9BDDFF",
    olive: "#C9D179",
    forest: "#2B3328"
};

let currentAdventure = { city: '', choice: null, weather: null };

const ADVENTURE_SCHEMA = {
  type: 'json_schema',
  name: 'adventure_options',
  schema: {
    type: 'object',
    properties: {
      options: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            vibe: { type: 'string' },
            description: { type: 'string' }
          },
          required: ['name', 'vibe', 'description'],
          additionalProperties: false
        }
      }
    },
    required: ['options'],
    additionalProperties: false
  },
  strict: true
};

// 3. Helper Functions
function revealAndScroll(sectionId) {
    const section = document.getElementById(sectionId);
    section.classList.remove('hidden');
    section.classList.add('revealed');
    setTimeout(() => { section.scrollIntoView({ behavior: 'smooth' }); }, 50);
}

// 4. API Logic
async function getCoordinates(city) {
    const url = `https://cse2004.com/api/geocode?address=${encodeURIComponent(city)}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.results && data.results.length > 0 ? data.results[0].geometry.location : null;
    } catch (e) { return null; }
}

async function getAdventureOptions(city) {
    const url = 'https://cse2004.com/api/openai/responses';
    const prompt = `Give me 3 trendy, aesthetic, high-vibe activities or restaurants in ${city} for a 19-year-old student.`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({ input: prompt, text: { format: ADVENTURE_SCHEMA } })
        });
        const data = await response.json();
        return JSON.parse(data.text).options;
    } catch (e) {
        return [
            { name: "The Curated Gallery", vibe: "Sophisticated & Moody", description: "An industrial space featuring high-contrast art and deep vibes." },
            { name: "Crimson Sunset Terrace", vibe: "Cinematic", description: "The best vantage point in the city for dramatic golden hour lighting." },
            { name: "Forest Edge Café", vibe: "Organic & Earthy", description: "A minimalist glass structure surrounded by deep greens." }
        ];
    }
}

async function getWeather(lat, lng) {
    const url = `https://cse2004.com/api/weather?latitude=${lat}&longitude=${lng}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return { temp: data.temperature.degrees, condition: data.weatherCondition.description.text };
    } catch (e) { return { temp: "72", condition: "Clear" }; }
}

// 5. UI Rendering
function displayAdventureOptions(options, coords) {
    const wrapper = document.getElementById('itinerary-display');
    wrapper.innerHTML = `<h2 style="font-size: 3.5rem; margin-bottom: 30px; font-family: 'DM Serif Display'; color: ${COLORS.plum};">featured itineraries</h2><div class="card-container"></div>`;
    const container = wrapper.querySelector('.card-container');

    options.forEach((opt, i) => {
        const card = document.createElement('div');
        card.className = 'adventure-card';
        card.style.setProperty('--rotation', i % 2 === 0 ? '-3deg' : '3deg');
        card.innerHTML = `<span style="font-style: italic; color: ${COLORS.teal}; font-family: 'Playfair Display'; font-weight:700;">${opt.vibe}</span><h3 style="margin: 10px 0; color: ${COLORS.forest};">${opt.name}</h3><p style="color: #666; font-size: 0.9rem;">${opt.description}</p>`;
        card.onclick = () => selectAdventure(opt, coords);
        container.appendChild(card);
    });
    revealAndScroll('selection-section');
}

async function selectAdventure(choice, coords) {
    const weather = await getWeather(coords.lat, coords.lng);
    currentAdventure = { city: cityInput.value, choice, weather };
    triggerAtmosphericShift(weather.condition);
    startFitCheck();
}

function triggerAtmosphericShift(condition) {
    const env = document.getElementById('environment-overlay');
    env.innerHTML = '';
    const cond = condition.toLowerCase();

    if (cond.includes('rain') || cond.includes('cloud')) {
        for(let i=0; i<80; i++) createParticle('rain-drop', env);
    } else {
        for(let i=0; i<30; i++) createParticle('sun-mote', env);
    }
}

function createParticle(cls, parent) {
    const p = document.createElement('div');
    p.className = cls;
    p.style.left = Math.random() * 100 + 'vw';
    p.style.animationDuration = (Math.random() * 2 + 1) + 's';
    p.style.opacity = Math.random();
    parent.appendChild(p);
}

// 6. Canvas Station
let isDrawing = false;
let ctx;

function startFitCheck() {
    const area = document.getElementById('canvas-area');
    area.innerHTML = `
        <div class="canvas-container">
            <h2 style="font-size: 3rem; margin-bottom: 10px; font-family: 'DM Serif Display'; color: ${COLORS.crimson};">packing check</h2>
            <p style="font-family:'Playfair Display'; font-style:italic; margin-bottom: 20px; color: ${COLORS.forest};">Sketch your look for ${currentAdventure.city}.</p>
            <canvas id="fit-canvas" width="400" height="500"></canvas>
            <div style="margin-top: 25px; display: flex; gap: 15px; justify-content: center;">
                <div onclick="setColor('${COLORS.sky}')" style="width:35px; height:35px; border-radius:50%; background:${COLORS.sky}; border:2px solid ${COLORS.plum}; cursor:pointer;"></div>
                <div onclick="setColor('${COLORS.crimson}')" style="width:35px; height:35px; border-radius:50%; background:${COLORS.crimson}; border:2px solid ${COLORS.plum}; cursor:pointer;"></div>
                <div onclick="setColor('${COLORS.forest}')" style="width:35px; height:35px; border-radius:50%; background:${COLORS.forest}; border:2px solid ${COLORS.plum}; cursor:pointer;"></div>
                <button id="clear-canvas" style="background:none; border:2px solid ${COLORS.forest}; padding: 8px 20px; font-weight:700; cursor:pointer;">Reset</button>
                <button id="finish-btn" style="background:${COLORS.forest}; color:white; border:none; padding: 10px 25px; font-weight:700; cursor:pointer;">Finalize</button>
            </div>
        </div>
    `;

    const canvas = document.getElementById('fit-canvas');
    ctx = canvas.getContext('2d');
    ctx.strokeStyle = COLORS.forest; ctx.lineWidth = 4; ctx.lineCap = "round";

    canvas.onmousedown = (e) => { isDrawing = true; draw(e); };
    window.onmousemove = (e) => draw(e);
    window.onmouseup = () => { isDrawing = false; ctx.beginPath(); };

    document.getElementById('clear-canvas').onclick = () => ctx.clearRect(0, 0, 400, 500);
    document.getElementById('finish-btn').onclick = generateFinalTicket;
    revealAndScroll('fit-section');
}

function setColor(c) { ctx.strokeStyle = c; }
function draw(e) {
    if (!isDrawing) return;
    const canvas = document.getElementById('fit-canvas');
    const r = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - r.left, e.clientY - r.top);
    ctx.stroke(); ctx.beginPath(); ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
}

// 7. Finale
function generateFinalTicket() {
    const img = document.getElementById('fit-canvas').toDataURL();
    const area = document.getElementById('final-ticket-area');
    area.innerHTML = `
        <div class="ticket">
            <div style="padding: 45px; flex: 2; border-right: 3px dashed #ddd; text-align: left;">
                <h4 style="font-size: 0.7rem; letter-spacing: 4px; opacity: 0.5; color: ${COLORS.plum}; font-weight:700;">BOARDING PASS</h4>
                <h2 style="font-size: 4.5rem; color: ${COLORS.crimson}; font-family: 'DM Serif Display';">${currentAdventure.city}</h2>
                <p style="font-weight: 700; margin-top: 15px; color: ${COLORS.forest}; font-size: 1.2rem;">${currentAdventure.choice.name}</p>
                <p style="font-family: 'Playfair Display'; font-style: italic; opacity: 0.8; color: ${COLORS.forest};">${currentAdventure.weather.temp}°F — ${currentAdventure.weather.condition}</p>
                <button onclick="shareJourney()" style="background:${COLORS.plum}; color:white; border:none; padding:15px 30px; margin-top:30px; font-weight:700; cursor:pointer; text-transform:uppercase;">Share Journey</button>
            </div>
            <div style="padding: 45px; flex: 1; background: #fafafa; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <h4 style="font-size: 0.6rem; letter-spacing: 2px; margin-bottom: 15px; color: ${COLORS.forest};">VISA PHOTO</h4>
                <img src="${img}" style="width: 100%; border: 2px solid ${COLORS.forest}; filter: contrast(1.1);">
                <p style="font-size: 0.6rem; margin-top: 20px; font-weight:700; color: ${COLORS.crimson};">GATE B19</p>
            </div>
        </div>
    `;
    revealAndScroll('ticket-section');
}

startBtn.onclick = async () => {
    const city = cityInput.value.trim();
    if (!city) return;
    startBtn.innerText = "PACKING...";
    const coords = await getCoordinates(city);
    if (coords) {
        const opts = await getAdventureOptions(city);
        displayAdventureOptions(opts, coords);
    }
    startBtn.innerText = "CHECK IN";
};

async function shareJourney() {
    if (navigator.share) await navigator.share({ title: 'The Voyager Edit', url: window.location.href });
    else alert("Journey details copied!");
}