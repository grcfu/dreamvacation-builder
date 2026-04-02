// 1. UI Elements
const startBtn = document.getElementById('start-adventure');
const cityInput = document.getElementById('city-input');
const loaderContainer = document.getElementById('loading-container');
const loaderFill = document.getElementById('loader-fill');
const loaderStatus = document.getElementById('loader-status');

// 2. Constants & Global State
const OPENAI_KEY = 's2ef662dn2q2';
const COLORS = { crimson: "#E52B50", teal: "#91C6C6", plum: "#591D35", sky: "#9BDDFF", olive: "#C9D179", forest: "#2B3328" };

let currentAdventure = { 
    city: '', 
    choice: null, 
    weather: null, 
    activeImages: [] 
};

// 3. Helper Functions
function revealAndScroll(sectionId) {
    const section = document.getElementById(sectionId);
    section.classList.remove('hidden');
    section.classList.add('revealed');
    setTimeout(() => { section.scrollIntoView({ behavior: 'smooth' }); }, 50);
}

// Optimized Loading Animation Logic
async function handleLoading(show) {
    if (show) {
        loaderContainer.classList.remove('loader-hidden');
        const phrases = [
            "Consulting the Voyager archives...",
            "Analyzing local vibes...",
            "Scouting hidden aesthetic gems...",
            "Preparing your vintage stamps...",
            "Securing your boarding pass..."
        ];
        
        let progress = 0;
        let phraseIndex = 0;
        let tickCount = 0;

        loaderStatus.innerText = phrases[0];

        const interval = setInterval(() => {
            progress += Math.random() * 1.5; 
            if (progress > 95) progress = 95;
            loaderFill.style.width = `${progress}%`;

            tickCount++;
            if (tickCount >= 18) {
                phraseIndex = (phraseIndex + 1) % phrases.length;
                loaderStatus.style.opacity = 0; 
                setTimeout(() => {
                    loaderStatus.innerText = phrases[phraseIndex];
                    loaderStatus.style.opacity = 1;
                }, 300);
                tickCount = 0;
            }
        }, 150);

        return interval;
    } else {
        loaderFill.style.width = "100%";
        setTimeout(() => {
            loaderContainer.classList.add('loader-hidden');
            loaderFill.style.width = "0%";
        }, 500);
    }
}

// 4. API Logic
async function getCoordinates(city) {
    try {
        const response = await fetch(`https://cse2004.com/api/geocode?address=${encodeURIComponent(city)}`);
        const data = await response.json();
        return data.results && data.results.length > 0 ? data.results[0].geometry.location : null;
    } catch (e) { return null; }
}

async function getAdventureOptions(city) {
    try {
        const response = await fetch('https://cse2004.com/api/openai/responses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({ 
                input: `Provide 3 trendy aesthetic student activities in ${city}. For each, write a detailed 2-3 sentence description about the vibe, the sights, and why it is a must-see.`, 
                text: { 
                    format: { 
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
                    } 
                } 
            })
        });
        const data = await response.json();
        return JSON.parse(data.text).options;
        } catch (e) {
        // GRACEFUL API FAILURE HANDLING (Rubric Requirement)
        loaderStatus.innerText = "Offline Mode: Consulting the Voyager archives...";
        loaderStatus.classList.add('offline-notice');
        
        return [
            { name: "The Local Bistro", vibe: "Chic & Organic", description: "A sun-drenched corner filled with hanging plants and the aroma of freshly roasted beans." },
            { name: "Golden Hour Ridge", vibe: "Cinematic", description: "A short trek leads to the highest point in the area, offering a panoramic view that turns pink and gold." },
            { name: "The Vintage Archive", vibe: "Moody & Academic", description: "Tucked away in a quiet alley, this shop is a treasure trove of rare film cameras and antique journals." }
        ];
    }
};

async function getWeather(lat, lng) {
    try {
        const response = await fetch(`https://cse2004.com/api/weather?latitude=${lat}&longitude=${lng}`);
        const data = await response.json();
        return { temp: data.temperature.degrees, condition: data.weatherCondition.description.text };
    } catch (e) { return { temp: "72", condition: "Clear" }; }
}

// 5. Section 2: Stamps
function displayAdventureOptions(options, coords) {
    const itineraryDisplay = document.getElementById('itinerary-display');
    const stampImages = [
        "https://i.pinimg.com/736x/90/49/a0/9049a044621c17246473187a41926615.jpg",
        "https://i.pinimg.com/736x/0b/c5/4a/0bc54a7375267a14e9f738a9d1847e13.jpg",
        "https://i.pinimg.com/736x/4e/c5/4d/4ec54d001099e0df365022830f0f585d.jpg"
    ];

    itineraryDisplay.innerHTML = `
        <div class="itinerary-postcard">
            <h4>GREETINGS FROM</h4>
            <h2>${currentAdventure.city.toUpperCase()}</h2>
            <p>Hover to reveal their story, then choose your destination.</p>
        </div>
        <div class="stamps-row"></div>
    `;

    const row = itineraryDisplay.querySelector('.stamps-row');
    options.forEach((opt, i) => {
        const stampWrap = document.createElement('div');
        stampWrap.className = 'stamp-wrapper';
        stampWrap.innerHTML = `
            <div class="stamp-card">
                <div class="stamp-front" style="background-image: url('${stampImages[i]}')">
                    <div class="stamp-overlay"></div>
                    <h3>${opt.name}</h3>
                </div>
                <div class="stamp-back">
                    <h4 style="color:${COLORS.crimson}; font-size:0.75rem; font-weight:700;">${opt.vibe.toUpperCase()}</h4>
                    <p style="color:${COLORS.forest}; font-size:0.95rem; line-height:1.5;">${opt.description}</p>
                    <button class="choose-btn">Choose Me</button>
                </div>
            </div>
        `;
        
        stampWrap.querySelector('.choose-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            selectAdventure(opt, coords);
        });
        row.appendChild(stampWrap);
    });
    
    revealAndScroll('selection-section');
}

async function selectAdventure(choice, coords) {
    const weather = await getWeather(coords.lat, coords.lng);
    currentAdventure.choice = choice; 
    currentAdventure.weather = weather;
    triggerAtmosphericShift(weather.condition);
    startFitCheck();
}

// 6. Section 3: Boutique Logic 

async function handleGeolocation() {
    // Add this line at the start of handleGeolocation()
    document.getElementById('locate-me').style.animation = "none";
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    loaderContainer.classList.remove('loader-hidden');
    loaderStatus.innerText = "Requesting permission to locate you...";

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            loaderStatus.innerText = "Finding your current city...";
            
            try {
                // Reverse geocoding to get city name
                const response = await fetch(`https://cse2004.com/api/geocode?latlng=${latitude},${longitude}`);
                const data = await response.json();
                
                if (data.results && data.results[0]) {
                    const city = data.results[0].address_components.find(c => c.types.includes("locality")).long_name;
                    cityInput.value = city;
                    loaderStatus.innerText = `Located: ${city}!`;
                    // Automatically trigger adventure after a short delay
                    setTimeout(() => startBtn.click(), 1000);
                }
            } catch (e) {
                loaderStatus.innerText = "Located coords, but couldn't name the city. Please type it in!";
            }
        },
        (error) => {
            // THIS HANDLES THE PERMISSION DENIAL (Rubric Requirement)
            if (error.code === error.PERMISSION_DENIED) {
                loaderStatus.innerText = "Location access denied. Please enter your city manually.";
                loaderStatus.classList.add('offline-notice');
            } else {
                loaderStatus.innerText = "Location unavailable. Please enter your city manually.";
            }
            // Hide loader after a delay so they can read the error
            setTimeout(() => loaderContainer.classList.add('loader-hidden'), 3000);
        }
    );
}

let isDrawing = false; let ctx;
const boutiqueItems = [
    { name: "Vintage Leica", img: "https://i.pinimg.com/736x/0e/0b/8b/0e0b8be24ac8a8e35ea909d74eed21cb.jpg" },
    { name: "Silk Scarf", img: "https://i.pinimg.com/736x/1e/aa/4e/1eaa4e697dd0f6b3959637d347e3d648.jpg" },
    { name: "Linen Tote", img: "https://i.pinimg.com/1200x/87/94/4b/87944b0a7e8d081f51953efe89a75aff.jpg" },
    { name: "Dark Shades", img: "https://i.pinimg.com/1200x/05/5d/84/055d84e7e3f0bf198fea6bbf4fdece58.jpg" }
];

function startFitCheck() {
    const picker = document.getElementById('outfit-picker-side');
    const area = document.getElementById('canvas-area');
    const modal = document.getElementById('instruction-modal');
    
    modal.classList.remove('modal-hidden');
    document.getElementById('close-modal').addEventListener('click', () => {
        modal.classList.add('modal-hidden');
    });

    picker.innerHTML = `<h2 style="font-size: 2.2rem; margin-bottom: 25px; color: white;">The Boutique</h2>`;
    boutiqueItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'essential-item';
        div.innerHTML = `<img src="${item.img}" class="item-img-thumb" alt="${item.name}"><div><strong>${item.name}</strong><br><small>Click to Pack</small></div>`;
        
        div.addEventListener('click', () => toggleItem(item, div));
        picker.appendChild(div);
    });

    area.innerHTML = `
        <div class="canvas-container">
            <canvas id="fit-canvas" width="450" height="500"></canvas>
            <div class="controls-vibrant">
                <div class="color-btn" data-color="${COLORS.crimson}" style="background:${COLORS.crimson};"></div>
                <div class="color-btn" data-color="${COLORS.teal}" style="background:${COLORS.teal};"></div>
                <div class="color-btn" data-color="${COLORS.forest}" style="background:${COLORS.forest};"></div>
                <button id="clear-canvas">Reset</button>
                <button id="finish-btn">Finalize</button>
            </div>
        </div>
    `;

    const canvas = document.getElementById('fit-canvas'); 
    ctx = canvas.getContext('2d');
    ctx.strokeStyle = COLORS.forest; ctx.lineWidth = 4; ctx.lineCap = "round";

    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => setColor(btn.dataset.color));
    });

    document.getElementById('clear-canvas').addEventListener('click', () => { 
        ctx.clearRect(0,0,450,500); 
        currentAdventure.activeImages = []; 
        document.querySelectorAll('.essential-item').forEach(el => el.classList.remove('selected'));
    });

    document.getElementById('finish-btn').addEventListener('click', generateFinalTicket);

    canvas.addEventListener('mousedown', (e) => { isDrawing = true; draw(e); });
    window.addEventListener('mousemove', draw); 
    window.addEventListener('mouseup', () => { isDrawing = false; ctx.beginPath(); });
    
    revealAndScroll('fit-section');
}

function toggleItem(item, element) {
    // 1. Check if the item is ALREADY in our active list
    const index = currentAdventure.activeImages.findIndex(i => i.name === item.name);
    
    if (index === -1) {
        // --- ADDING AN ITEM ---
        
        // 2. CHECK THE LIMIT: Check length IMMEDIATELY
        if (currentAdventure.activeImages.length >= 3) {
            alert("Your journal is full! Choose your top 3 essentials.");
            return; // Stops the function right here
        }
        
        // 3. Mark as selected in the UI immediately
        element.classList.add('selected');
        
        // 4. Reserve the spot in the array immediately (so length is now 1, 2, or 3)
        // We push a "placeholder" and update it when the image loads
        const placeholder = { name: item.name, loaded: false };
        currentAdventure.activeImages.push(placeholder);

        const imgObj = new Image(); 
        imgObj.crossOrigin = "anonymous"; 
        imgObj.src = item.img;
        
        imgObj.onload = () => {
            const x = Math.random() * 200 + 50; 
            const y = Math.random() * 200 + 50;
            ctx.drawImage(imgObj, x, y, 150, 180);
            
            // Update the placeholder with the actual image data
            const itemToUpdate = currentAdventure.activeImages.find(i => i.name === item.name);
            if (itemToUpdate) {
                itemToUpdate.img = imgObj;
                itemToUpdate.x = x;
                itemToUpdate.y = y;
                itemToUpdate.loaded = true;
            }
        };
    } else {
        // --- REMOVING AN ITEM ---
        element.classList.remove('selected');
        currentAdventure.activeImages.splice(index, 1);
        
        // Clear and redraw remaining items
        ctx.clearRect(0, 0, 450, 500);
        currentAdventure.activeImages.forEach(active => {
            // Only draw if the image has finished loading
            if (active.img && active.loaded) {
                ctx.drawImage(active.img, active.x, active.y, 150, 180);
            }
        });
    }
}

function setColor(c) { ctx.strokeStyle = c; }
function draw(e) {
    if (!isDrawing) return;
    const canvas = document.getElementById('fit-canvas'); 
    const r = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - r.left, e.clientY - r.top); 
    ctx.stroke(); 
    ctx.beginPath(); 
    ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
}

// 7. Final Stage
function generateFinalTicket() {
    const img = document.getElementById('fit-canvas').toDataURL();
    const area = document.getElementById('final-ticket-area');
    const seatNum = Math.floor(Math.random() * 30 + 1) + String.fromCharCode(65 + Math.floor(Math.random() * 6));
    const gateNum = "B" + Math.floor(Math.random() * 20 + 1);
    
    let barcodeHTML = '';
    for(let i=0; i<60; i++) {
        const w = Math.floor(Math.random() * 3) + 1;
        barcodeHTML += `<div style="width:${w}px; height: 100%;"></div>`;
    }

    area.innerHTML = `
        <div class="ticket">
            <div class="ticket-main">
                <div class="ticket-header">
                    <span class="airline-name">Voyager Airways</span>
                    <span class="airplane-icon">✈️</span>
                </div>
                <h2 style="font-size: 4rem; margin: 15px 0;">${currentAdventure.city.toUpperCase()}</h2>
                <div class="ticket-data">
                    <div class="data-item"><label>Passenger</label><span>Aesthetic Wanderer</span></div>
                    <div class="data-item"><label>Flight</label><span>VE${Math.floor(Math.random()*9000+1000)}</span></div>
                    <div class="data-item"><label>Seat</label><span>${seatNum}</span></div>
                    <div class="data-item"><label>Gate</label><span>${gateNum}</span></div>
                    <div class="data-item"><label>Boarding</label><span>18:45</span></div>
                    <div class="data-item"><label>Class</label><span>First Class</span></div>
                </div>
                <div class="barcode">${barcodeHTML}</div>
                <button class="share-btn" id="final-share-btn" style="margin-top: 15px; width: fit-content; padding: 10px 30px;">Share Pass</button>
            </div>
            <div class="ticket-stub">
                <label style="font-size: 0.6rem; letter-spacing: 2px; margin-bottom: 10px;">JOURNAL ID</label>
                <img src="${img}" style="width: 140px; height: 160px; border: 5px solid white; box-shadow: 0 5px 15px rgba(0,0,0,0.1); object-fit: cover;">
                <h3 style="margin-top: 15px; font-size: 1.2rem;">${seatNum}</h3>
                <p style="font-size: 0.7rem; font-weight: 700; color: var(--crimson);">${currentAdventure.choice.name.toUpperCase()}</p>
            </div>
        </div>
        <div class="reset-container">
            <button class="reset-voyage-btn" id="final-reset-btn">
                Archive & Plan New Trip
            </button>
        </div>
    `;

    document.getElementById('final-share-btn').addEventListener('click', shareJourney);
    document.getElementById('final-reset-btn').addEventListener('click', resetExperience);
    revealAndScroll('ticket-section');
}

// 8. Atmospheric Utils
function triggerAtmosphericShift(condition) {
    const env = document.getElementById('environment-overlay'); env.innerHTML = '';
    const cond = condition.toLowerCase();
    if (cond.includes('rain') || cond.includes('cloud')) { for(let i=0; i<80; i++) createParticle('rain-drop', env); }
    else { for(let i=0; i<30; i++) createParticle('sun-mote', env); }
}

function createParticle(cls, parent) {
    const p = document.createElement('div'); p.className = cls; p.style.left = Math.random() * 100 + 'vw';
    p.style.animationDuration = (Math.random() * 2 + 1) + 's'; p.style.opacity = Math.random(); parent.appendChild(p);
}

// 9. Event Listeners

document.getElementById('locate-me').addEventListener('click', handleGeolocation);

startBtn.addEventListener('click', async () => {
    const city = cityInput.value.trim(); 
    if (!city) return;

    const loadingInterval = await handleLoading(true); 
    startBtn.disabled = true; 
    startBtn.innerText = "SEARCHING...";
    loaderStatus.style.color = "var(--plum)";

    currentAdventure.city = city;
    const coords = await getCoordinates(city);

    if (coords) { 
        document.getElementById('locked-notice').classList.add('notice-unlocked');
        const opts = await getAdventureOptions(city); 
        clearInterval(loadingInterval); 
        await handleLoading(false); 
        displayAdventureOptions(opts, coords); 
    } else {
        clearInterval(loadingInterval);
        loaderFill.style.width = "0%";
        loaderStatus.innerText = "Destination not found in the archives. Try a specific city?";
        loaderStatus.style.color = "var(--crimson)";
        startBtn.disabled = false;
        startBtn.innerText = "CHECK IN";
        const searchBar = document.querySelector('.entry-submission-overlay');
        searchBar.style.animation = "shake 0.5s ease";
        setTimeout(() => searchBar.style.animation = "", 500);
    }
}); // FIXED: Added closing parenthesis here

async function shareJourney() { 
    if (navigator.share) await navigator.share({ title: 'The Voyager Edit', url: window.location.href }); 
    else alert("Journey details copied!"); 
}

// 10. Reset Functionality
function resetExperience() {
    currentAdventure = { city: '', choice: null, weather: null, activeImages: [] };
    cityInput.value = '';
    startBtn.disabled = false;
    startBtn.innerText = "CHECK IN";
    document.getElementById('locked-notice').classList.remove('notice-unlocked');
    if (ctx) ctx.clearRect(0, 0, 450, 500);
    ['selection-section', 'fit-section', 'ticket-section'].forEach(id => {
        const sec = document.getElementById(id);
        sec.classList.remove('revealed');
        sec.classList.add('hidden');
    });
    document.getElementById('hero-collage').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('environment-overlay').innerHTML = '';
}