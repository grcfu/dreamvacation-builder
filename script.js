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

// NEW: Optimized Loading Animation Logic
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
        let tickCount = 0; // This will track how many times the interval has run

        // Initially set the first phrase
        loaderStatus.innerText = phrases[0];

        const interval = setInterval(() => {
            // 1. Smooth Bar Movement
            // We update this every 150ms so the bar doesn't look laggy
            progress += Math.random() * 1.5; 
            if (progress > 95) progress = 95;
            loaderFill.style.width = `${progress}%`;

            // 2. Slow Text Changes
            // We only change the text every 18 ticks (approx. every 2.7 seconds)
            tickCount++;
            if (tickCount >= 18) {
                phraseIndex = (phraseIndex + 1) % phrases.length;
                loaderStatus.style.opacity = 0; // Brief fade out for aesthetics
                
                setTimeout(() => {
                    loaderStatus.innerText = phrases[phraseIndex];
                    loaderStatus.style.opacity = 1;
                }, 300);
                
                tickCount = 0; // Reset counter for the next phrase
            }

        }, 150); // Faster interval makes the progress bar move much smoother

        return interval;
    } else {
        // Finishing state
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
            body: JSON.stringify({ input: `3 trendy aesthetic student activities in ${city}.`, text: { format: { type: 'json_schema', name: 'adventure_options', schema: { type: 'object', properties: { options: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, vibe: { type: 'string' }, description: { type: 'string' } }, required: ['name', 'vibe', 'description'], additionalProperties: false } } }, required: ['options'], additionalProperties: false }, strict: true } } })
        });
        const data = await response.json();
        return JSON.parse(data.text).options;
    } catch (e) {
        return [{ name: "The Local Bistro", vibe: "Chic", description: "Beautiful curated space." }, { name: "Sunset View", vibe: "Cinematic", description: "Best city views." }, { name: "Vintage Archive", vibe: "Moody", description: "Filled with stories." }];
    }
}

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
        const stampWrap = document.createElement('div'); // ⬅️ Renamed from 'wrapper'
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
        
        stampWrap.querySelector('.choose-btn').onclick = (e) => {
            e.stopPropagation();
            selectAdventure(opt, coords); // This will now work without crashing!
        };
        row.appendChild(stampWrap);
    });
    
    revealAndScroll('selection-section');
}

async function selectAdventure(choice, coords) {
    const weather = await getWeather(coords.lat, coords.lng);
    currentAdventure.choice = choice; currentAdventure.weather = weather;
    triggerAtmosphericShift(weather.condition);
    startFitCheck();
}

// 6. Section 3: Boutique Logic 
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
    
    // Popup logic
    const modal = document.getElementById('instruction-modal');
    modal.classList.remove('modal-hidden');
    document.getElementById('close-modal').onclick = () => modal.classList.add('modal-hidden');

    picker.innerHTML = `<h2 style="font-size: 2.2rem; margin-bottom: 25px; color: white;">The Boutique</h2>`;
    boutiqueItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'essential-item';
        div.innerHTML = `<img src="${item.img}" class="item-img-thumb"><div><strong>${item.name}</strong><br><small>Click to Pack</small></div>`;
        div.onclick = () => toggleItem(item, div);
        picker.appendChild(div);
    });

    area.innerHTML = `
        <div class="canvas-container">
            <canvas id="fit-canvas" width="450" height="500"></canvas>
            <div class="controls-vibrant">
                <div onclick="setColor('${COLORS.crimson}')" class="color-btn" style="background:${COLORS.crimson};"></div>
                <div onclick="setColor('${COLORS.teal}')" class="color-btn" style="background:${COLORS.teal};"></div>
                <div onclick="setColor('${COLORS.forest}')" class="color-btn" style="background:${COLORS.forest};"></div>
                <button id="clear-canvas">Reset</button>
                <button id="finish-btn">Finalize</button>
            </div>
        </div>
    `;

    const canvas = document.getElementById('fit-canvas'); ctx = canvas.getContext('2d');
    ctx.strokeStyle = COLORS.forest; ctx.lineWidth = 4; ctx.lineCap = "round";
    
    canvas.onmousedown = (e) => { isDrawing = true; draw(e); };
    window.onmousemove = (e) => draw(e); window.onmouseup = () => { isDrawing = false; ctx.beginPath(); };
    document.getElementById('clear-canvas').onclick = () => { 
        ctx.clearRect(0,0,450,500); 
        currentAdventure.activeImages = []; 
        document.querySelectorAll('.essential-item').forEach(el => el.classList.remove('selected'));
    };
    document.getElementById('finish-btn').onclick = generateFinalTicket;
    
    revealAndScroll('fit-section');
}

function toggleItem(item, element) {
    const index = currentAdventure.activeImages.findIndex(i => i.name === item.name);
    
    if (index === -1) {
        // Limit to 3 items as per instructions
        if (currentAdventure.activeImages.length >= 3) {
            alert("Your journal is full! Choose your top 3 essentials.");
            return;
        }
        
        element.classList.add('selected');
        const imgObj = new Image(); 
        imgObj.crossOrigin = "anonymous"; 
        imgObj.src = item.img;
        imgObj.onload = () => {
            const x = Math.random() * 200 + 50; 
            const y = Math.random() * 200 + 50;
            ctx.drawImage(imgObj, x, y, 150, 180);
            currentAdventure.activeImages.push({ name: item.name, x, y, img: imgObj });
        };
    } else {
        // REMOVE LOGIC
        element.classList.remove('selected');
        currentAdventure.activeImages.splice(index, 1);
        
        // Clear and redraw ONLY the remaining images
        // Note: Manual doodles (flowers) will still clear here. 
        // To fix that perfectly, we redraw the active boutique items.
        ctx.clearRect(0, 0, 450, 500);
        currentAdventure.activeImages.forEach(active => {
            ctx.drawImage(active.img, active.x, active.y, 150, 180);
        });
    }
}

function setColor(c) { ctx.strokeStyle = c; }
function draw(e) {
    if (!isDrawing) return;
    const canvas = document.getElementById('fit-canvas'); const r = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - r.left, e.clientY - r.top); ctx.stroke(); ctx.beginPath(); ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
}

// 7. Final Stage
function generateFinalTicket() {
    const img = document.getElementById('fit-canvas').toDataURL();
    const area = document.getElementById('final-ticket-area');
    area.innerHTML = `
        <div class="ticket">
            <div class="ticket-main">
                <h4 style="font-size: 0.7rem; letter-spacing: 5px; color: ${COLORS.crimson}; font-weight:700; margin-bottom:15px;">OFFICIAL BOARDING PASS</h4>
                <h2 style="font-size: 4rem; color: ${COLORS.forest}; margin-bottom: 20px;">${currentAdventure.city.toUpperCase()}</h2>
                <div style="background:${COLORS.off_white}; padding:20px; border-left:4px solid ${COLORS.crimson};">
                    <p style="font-weight: 700; font-size:1.3rem;">${currentAdventure.choice.name}</p>
                    <p style="font-family: 'Playfair Display'; font-style: italic; opacity: 0.7;">${currentAdventure.weather.temp}°F — ${currentAdventure.weather.condition}</p>
                </div>
                <button class="share-btn" onclick="shareJourney()">Share Journey</button>
            </div>
            <div class="ticket-stub">
                <h4 style="font-size: 0.6rem; letter-spacing: 2px; margin-bottom: 20px; color: ${COLORS.forest}; opacity:0.5;">PHOTO ID</h4>
                <img src="${img}" style="width: 100%; border: 3px solid white; box-shadow:0 10px 20px rgba(0,0,0,0.1); filter: contrast(1.05);">
                <p style="font-size: 0.7rem; margin-top: 25px; font-weight:700; color: ${COLORS.crimson};">GATE B19</p>
            </div>
        </div>
    `;
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
startBtn.onclick = async () => {
    const city = cityInput.value.trim(); 
    if (!city) return;

    // Start the aesthetic loading sequence
    const loadingInterval = await handleLoading(true); 
    startBtn.disabled = true; 
    startBtn.innerText = "SEARCHING...";
    
    // Clear any previous error colors
    loaderStatus.style.color = "var(--plum)";

    currentAdventure.city = city;
    const coords = await getCoordinates(city);

    if (coords) { 
        // SUCCESS: Unlock the rest of the site
        document.getElementById('locked-notice').classList.add('notice-unlocked');
        const opts = await getAdventureOptions(city); 
        
        clearInterval(loadingInterval); 
        await handleLoading(false); 
        displayAdventureOptions(opts, coords); 
    } else {
        // ERROR: Handle invalid city/country/gibberish
        clearInterval(loadingInterval);
        
        // Keep the loader visible but change the message to an editorial error
        loaderFill.style.width = "0%";
        loaderStatus.innerText = "Destination not found in the archives. Try a specific city?";
        loaderStatus.style.color = "var(--crimson)"; // Turn the text red for notice
        
        // Reset the button so they can try again
        startBtn.disabled = false;
        startBtn.innerText = "CHECK IN";
        
        // Shake the input bar for a bit of "oops" feedback
        const searchBar = document.querySelector('.entry-submission-overlay');
        searchBar.style.animation = "shake 0.5s ease";
        setTimeout(() => searchBar.style.animation = "", 500);
    }
};

async function shareJourney() { if (navigator.share) await navigator.share({ title: 'The Voyager Edit', url: window.location.href }); else alert("Journey details copied!"); }