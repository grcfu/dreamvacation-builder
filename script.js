// 1. UI Elements
const startBtn = document.getElementById('start-adventure');
const cityInput = document.getElementById('city-input');

// 2. Constants & Global State
const OPENAI_KEY = 's2ef662dn2q2';

let currentAdventure = {
    city: '',
    choice: null,
    weather: null
};

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
    
    // Slight delay to ensure the DOM has rendered the new height
    setTimeout(() => {
        section.scrollIntoView({ behavior: 'smooth' });
    }, 50);
}

// 4. API Logic Functions
async function getCoordinates(city) {
    const url = `https://cse2004.com/api/geocode?address=${encodeURIComponent(city)}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Geocoding failed");
        const data = await response.json();
        return data.results && data.results.length > 0 ? data.results[0].geometry.location : null;
    } catch (error) {
        alert("Destination not found!");
        return null;
    }
}

async function getAdventureOptions(city) {
    const url = 'https://cse2004.com/api/openai/responses';
    const prompt = `Give me 3 trendy, high-vibe, aesthetic activities or restaurants in ${city} for a 19-year-old college student.`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({ input: prompt, text: { format: ADVENTURE_SCHEMA } })
        });
        const data = await response.json();
        return JSON.parse(data.text).options;
    } catch (error) {
        console.error("AI Error, using backup:", error);
        // This ensures the app keeps moving even if the API is down
        return [
            { name: "Local Coffee House", vibe: "Cozy & Aesthetic", description: "The perfect spot for a latte and people-watching." },
            { name: "Sunset Viewpoint", vibe: "Main Character Energy", description: "A hidden gem for the best golden hour photos." },
            { name: "Trendy Fusion Bistro", vibe: "Foodie Heaven", description: "Incredible vibes and even better seafood boils." }
        ];
    }
}

async function getWeather(lat, lng) {
    const url = `https://cse2004.com/api/weather?latitude=${lat}&longitude=${lng}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return {
            temp: data.temperature.degrees,
            condition: data.weatherCondition.description.text
        };
    } catch (error) {
        return { temp: "75", condition: "Clear" }; // Fail-safe
    }
}

// 5. UI Rendering Functions
function displayAdventureOptions(options, coords) {
    const wrapper = document.getElementById('itinerary-display');
    wrapper.innerHTML = `<h2>Choose Your Vibe</h2><div class="card-container"></div>`;
    const container = wrapper.querySelector('.card-container');

    options.forEach(option => {
        const card = document.createElement('div');
        card.className = 'adventure-card';
        card.innerHTML = `
            <span class="vibe-tag">${option.vibe}</span>
            <h3>${option.name}</h3>
            <p>${option.description}</p>
        `;
        card.addEventListener('click', () => selectAdventure(option, coords));
        container.appendChild(card);
    });

    revealAndScroll('selection-section');
}

async function selectAdventure(choice, coords) {
    const weather = await getWeather(coords.lat, coords.lng);
    
    // Save to global state
    currentAdventure.choice = choice;
    currentAdventure.weather = weather;
    currentAdventure.city = cityInput.value;

    triggerAtmosphericShift(weather.condition);
    startFitCheck(); // Triggers transition to Step 3
}

function triggerAtmosphericShift(condition) {
    const overlay = document.querySelector('.overlay');
    const envContainer = document.getElementById('environment-overlay');
    envContainer.innerHTML = ''; // Clear previous particles

    const cond = condition.toLowerCase();
    if (cond.includes('rain') || cond.includes('cloud')) {
        overlay.style.background = 'rgba(20, 30, 48, 0.8)';
        for(let i=0; i<80; i++) createParticle('rain-drop', envContainer);
    } else {
        overlay.style.background = 'rgba(255, 165, 0, 0.2)';
        for(let i=0; i<30; i++) createParticle('sun-mote', envContainer);
    }
}

function createParticle(className, container) {
    const p = document.createElement('div');
    p.className = className;
    p.style.left = Math.random() * 100 + 'vw';
    p.style.animationDuration = (Math.random() * 1 + 1) + 's';
    p.style.opacity = Math.random();
    container.appendChild(p);
}

// 6. Canvas / Fit Check Logic
let isDrawing = false;
let ctx;

function startFitCheck() {
    const wrapper = document.getElementById('canvas-area');
    wrapper.innerHTML = `
        <div class="canvas-container">
            <h2>Sketch Your Fit</h2>
            <p>What are you wearing for ${currentAdventure.choice.name} in ${currentAdventure.weather.temp}°F weather?</p>
            <canvas id="fit-canvas" width="400" height="500"></canvas>
            <div class="controls">
                <div class="color-btn" style="background: #ff4d4d;" onclick="setColor('#ff4d4d')"></div>
                <div class="color-btn" style="background: #4d79ff;" onclick="setColor('#4d79ff')"></div>
                <div class="color-btn" style="background: #ffffff;" onclick="setColor('#ffffff')"></div>
                <button id="clear-canvas">RESET</button>
                <button id="finish-btn">FINISH VISA</button>
            </div>
        </div>
    `;

    const canvas = document.getElementById('fit-canvas');
    ctx = canvas.getContext('2d');
    ctx.strokeStyle = "white";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    
    document.getElementById('clear-canvas').onclick = () => ctx.clearRect(0, 0, 400, 500);
    document.getElementById('finish-btn').onclick = generateFinalTicket;

    revealAndScroll('fit-section');
}

function startDrawing(e) { isDrawing = true; draw(e); }
function stopDrawing() { isDrawing = false; ctx.beginPath(); }
function setColor(color) { ctx.strokeStyle = color; }

function draw(e) {
    if (!isDrawing) return;
    const canvas = document.getElementById('fit-canvas');
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

// 7. Final Ticket Logic
function generateFinalTicket() {
    const canvas = document.getElementById('fit-canvas');
    const outfitImage = canvas.toDataURL();
    const wrapper = document.getElementById('final-ticket-area');

    wrapper.innerHTML = `
        <div class="ticket">
            <div class="ticket-main">
                <h4>OFFICIAL VISA</h4>
                <h2>${currentAdventure.city.toUpperCase()}</h2>
                <div style="margin: 15px 0;">
                    <p><strong>${currentAdventure.choice.name}</strong></p>
                    <p style="font-size: 0.8rem; opacity: 0.7;">${currentAdventure.weather.temp}°F | ${currentAdventure.weather.condition}</p>
                </div>
                <button class="share-btn" onclick="shareJourney()">SHARE JOURNEY</button>
            </div>
            <div class="ticket-stub">
                <h4>MY FIT</h4>
                <img src="${outfitImage}" class="outfit-preview">
                <p style="font-size: 0.6rem; margin-top: 10px;">GATE B19</p>
            </div>
        </div>
    `;

    revealAndScroll('ticket-section');
}

// 8. Main Event Listener
startBtn.addEventListener('click', async () => {
    const city = cityInput.value.trim();
    if (!city) return;

    startBtn.disabled = true;
    startBtn.innerText = "PACKING BAGS...";

    try {
        const coords = await getCoordinates(city);
        if (coords) {
            const options = await getAdventureOptions(city);
            if (options) {
                displayAdventureOptions(options, coords);
            }
        }
    } finally {
        startBtn.disabled = false;
        startBtn.innerText = "CHECK IN";
    }
});

async function shareJourney() {
    if (navigator.share) {
        await navigator.share({ title: 'My Digital Passport', url: window.location.href });
    } else {
        alert("Passport details copied!");
    }
}