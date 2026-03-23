//this is script.js

// 1. UI Elements - Define these at the top!
const startBtn = document.getElementById('start-adventure');
const cityInput = document.getElementById('city-input');
const displayArea = document.getElementById('itinerary-display');

// 2. Constants & API Config
const OPENAI_KEY = 's2ef662dn2q2';

// Global variable to store journey data across different steps
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

// 3. Logic Functions
async function getCoordinates(city) {
    const url = `https://cse2004.com/api/geocode?address=${encodeURIComponent(city)}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            return data.results[0].geometry.location;
        } else {
            throw new Error("City not found");
        }
    } catch (error) {
        console.error("Geocoding Error:", error);
        alert("We couldn't find that destination. Check your spelling!");
        return null;
    }
}

async function getAdventureOptions(city) {
    const url = 'https://cse2004.com/api/openai/responses';
    const prompt = `Give me 3 trendy, high-vibe, aesthetic activities or restaurants in ${city} for a 19-year-old college student.`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_KEY}`
            },
            body: JSON.stringify({
                input: prompt,
                text: { format: ADVENTURE_SCHEMA }
            })
        });
        const data = await response.json();
        return JSON.parse(data.text).options;
    } catch (error) {
        console.error("OpenAI Error:", error);
        return null;
    }
}

function displayAdventureOptions(options, coords) {
    displayArea.innerHTML = `<h2>Choose Your Vibe</h2><div class="card-container"></div>`;
    const container = displayArea.querySelector('.card-container');

    options.forEach(option => {
        const card = document.createElement('div');
        card.className = 'adventure-card';
        card.innerHTML = `
            <h3>${option.name}</h3>
            <p class="vibe-tag">${option.vibe}</p>
            <p>${option.description}</p>
        `;
        
        card.addEventListener('click', () => {
            selectAdventure(option, coords);
        });
        container.appendChild(card);
    });

    document.getElementById('step-1').style.display = 'none';
}

async function selectAdventure(choice, coords) {
    displayArea.innerHTML = `<h2 class="loading-text">Preparing the atmosphere for ${choice.name}...</h2>`;

    const weather = await getWeather(coords.lat, coords.lng);
    
    // SAVE data to our global variable
    currentAdventure.choice = choice;
    currentAdventure.weather = weather;
    currentAdventure.city = cityInput.value;

    triggerAtmosphericShift(weather.condition);
    
    // Transition to the Fit Check after the "vibe" settles
    setTimeout(() => {
        startFitCheck(); 
    }, 2000);
}

function triggerAtmosphericShift(condition) {
    const overlay = document.querySelector('.overlay');
    const envContainer = document.createElement('div');
    envContainer.id = 'environment-overlay';
    document.body.appendChild(envContainer);

    const cond = condition.toLowerCase();

    if (cond.includes('rain') || cond.includes('drizzle')) {
        overlay.style.background = 'rgba(20, 30, 48, 0.8)'; // Darker, bluer mood
        for(let i=0; i<100; i++) createParticle('rain-drop', envContainer);
    } else if (cond.includes('clear') || cond.includes('sun')) {
        overlay.style.background = 'rgba(255, 165, 0, 0.2)'; // Warm golden glow
        for(let i=0; i<30; i++) createParticle('sun-mote', envContainer);
    }
}

function createParticle(className, container) {
    const p = document.createElement('div');
    p.className = className;
    p.style.left = Math.random() * 100 + 'vw';
    p.style.animationDuration = (Math.random() * 1 + 0.5) + 's';
    p.style.opacity = Math.random();
    container.appendChild(p);
}

// Function to get real-time weather
async function getWeather(lat, lng) {
    const url = `https://cse2004.com/api/weather?latitude=${lat}&longitude=${lng}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        // We want the description (e.g., "Clear", "Rain", "Clouds")
        return {
            temp: data.temperature.degrees,
            condition: data.weatherCondition.description.text,
            isDay: data.isDay
        };
    } catch (error) {
        console.error("Weather Error:", error);
        return null;
    }
}

let isDrawing = false;
let ctx;

function startFitCheck(choice, weather) {
    displayArea.innerHTML = `
        <div class="canvas-container">
            <h2>Sketch Your Fit</h2>
            <p>Design an outfit for ${choice.name} in ${weather.temp}°F weather.</p>
            <canvas id="fit-canvas" width="400" height="500"></canvas>
            <div class="controls">
                <div class="color-btn" style="background: #ff4d4d;" onclick="setColor('#ff4d4d')"></div>
                <div class="color-btn" style="background: #4d79ff;" onclick="setColor('#4d79ff')"></div>
                <div class="color-btn" style="background: #ffffff;" onclick="setColor('#ffffff')"></div>
                <div class="color-btn" style="background: #000000;" onclick="setColor('#000000')"></div>
                <button id="clear-canvas">RESET</button>
                <button id="finish-btn">FINISH TICKET</button>
            </div>
        </div>
    `;

    const canvas = document.getElementById('fit-canvas');
    ctx = canvas.getContext('2d');
    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    // Drawing Logic
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    document.getElementById('clear-canvas').addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    document.getElementById('finish-btn').addEventListener('click', generateFinalTicket);
}

function startDrawing(e) {
    isDrawing = true;
    draw(e);
}

function draw(e) {
    if (!isDrawing) return;
    const canvas = document.getElementById('fit-canvas');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function stopDrawing() {
    isDrawing = false;
    ctx.beginPath();
}

function setColor(color) {
    ctx.strokeStyle = color;
}

// 4. The Main Event Listener
startBtn.addEventListener('click', async () => {
    const city = cityInput.value.trim();
    if (!city) return;

    // Start the "Loading" state
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
    } catch (err) {
        console.error("Critical Error:", err);
        alert("Something went wrong with the flight. Please try again!");
    } finally {
        // This line is the guarantee: it runs even if the API fails
        startBtn.disabled = false;
        startBtn.innerText = "CHECK IN";
    }
});

function generateFinalTicket(choice, weather, city) {
    const canvas = document.getElementById('fit-canvas');
    const outfitImage = canvas.toDataURL(); // Converts drawing to image

    displayArea.innerHTML = `
        <div class="ticket-container">
            <div class="ticket">
                <div class="ticket-main">
                    <h4>Passenger Visa</h4>
                    <h2>${city.toUpperCase()}</h2>
                    
                    <div style="margin-bottom: 20px;">
                        <h4>Itinerary</h4>
                        <p><strong>${choice.name}</strong></p>
                        <p style="font-size: 0.8rem; opacity: 0.7;">${choice.description}</p>
                    </div>

                    <div style="display: flex; gap: 40px;">
                        <div>
                            <h4>Weather</h4>
                            <p>${weather.temp}°F / ${weather.condition}</p>
                        </div>
                        <div>
                            <h4>Gate</h4>
                            <p>B19</p>
                        </div>
                    </div>
                    
                    <button class="share-btn" onclick="shareJourney()">SHARE JOURNEY</button>
                </div>
                
                <div class="ticket-stub">
                    <h4>Fit Check</h4>
                    <img src="${outfitImage}" class="outfit-preview" alt="My Vacation Fit">
                    <p style="font-size: 0.6rem; margin-top: 10px; color: #aaa;">PASSPORT VALIDATED</p>
                </div>
            </div>
        </div>
    `;
}

// Using the Web Share API (Bonus Browser API!)
async function shareJourney() {
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'My Digital Passport',
                text: 'Check out my dream vacation plans!',
                url: window.location.href
            });
        } catch (err) {
            console.log("Share cancelled or failed");
        }
    } else {
        alert("Itinerary copied to clipboard!");
    }
}