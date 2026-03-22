//this is script.js

// 1. UI Elements - Define these at the top!
const startBtn = document.getElementById('start-adventure');
const cityInput = document.getElementById('city-input');
const displayArea = document.getElementById('itinerary-display');

// 2. Constants & API Config
const OPENAI_KEY = 's2ef662dn2q2';

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
    console.log("Grace selected:", choice.name);
    
    // 1. Clear the screen for the next phase
    displayArea.innerHTML = `<h2 class="loading-text">Preparing the atmosphere for ${choice.name}...</h2>`;

    // 2. Fetch the weather
    const weather = await getWeather(coords.lat, coords.lng);
    
    if (weather) {
        triggerAtmosphericShift(weather.condition);
        
        // 3. Move to the next step: The Fit Check (We will build this next!)
        setTimeout(() => {
            // startFitCheck(choice, weather); 
            displayArea.innerHTML = `<h2>It's ${weather.temp}°F and ${weather.condition}.</h2><p>Perfect for ${choice.name}.</p>`;
        }, 2000);
    }
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

// 4. The Main Event Listener
startBtn.addEventListener('click', async () => {
    const city = cityInput.value.trim();
    if (!city) return;

    startBtn.disabled = true;
    startBtn.innerText = "PACKING BAGS...";

    const coords = await getCoordinates(city);
    if (coords) {
        const options = await getAdventureOptions(city);
        if (options) {
            displayAdventureOptions(options, coords);
        }
    }

    startBtn.disabled = false;
    startBtn.innerText = "CHECK IN";
});