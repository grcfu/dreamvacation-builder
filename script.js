// The API Key provided by your prof
const OPENAI_KEY = 's2ef662dn2q2';

// The "Rules" for how OpenAI should respond
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

// Function to get 3 trendy options from AI
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
        // The structured data comes back inside data.text as a string, so we parse it
        return JSON.parse(data.text).options;
    } catch (error) {
        console.error("OpenAI Error:", error);
        return null;
    }
}

// Function to get coordinates from a city name
async function getCoordinates(city) {
    const url = `https://cse2004.com/api/geocode?address=${encodeURIComponent(city)}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");
        
        const data = await response.json();
        
        // Check if Google actually found a place
        if (data.results && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            console.log("Found location:", location);
            return location; // Returns { lat: 38.627, lng: -90.199 }
        } else {
            throw new Error("City not found");
        }
    } catch (error) {
        console.error("Geocoding Error:", error);
        alert("We couldn't find that destination. Check your spelling!");
        return null;
    }
}

function displayAdventureOptions(options) {
    const displayArea = document.getElementById('itinerary-display');
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
            selectAdventure(option);
        });

        container.appendChild(card);
    });

    // Hide the initial search step
    document.getElementById('step-1').style.display = 'none';
}

function selectAdventure(choice) {
    console.log("Grace selected:", choice.name);
    // This is where we will trigger the Weather & Atmospheric Shift next!
}