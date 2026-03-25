const startBtn = document.getElementById('start-adventure');
const cityInput = document.getElementById('city-input');
const loaderContainer = document.getElementById('loading-container');
const loaderFill = document.getElementById('loader-fill');
const loaderStatus = document.getElementById('loader-status');

const OPENAI_KEY = 's2ef662dn2q2';
const COLORS = { crimson: "#E52B50", teal: "#91C6C6", plum: "#591D35", sky: "#9BDDFF", olive: "#C9D179", forest: "#2B3328" };

let currentAdventure = { 
    city: '', 
    choice: null, 
    weather: null,
    selectedItems: [] // Track items picked in the carousel
};

function revealAndScroll(sectionId) {
    const section = document.getElementById(sectionId);
    section.classList.remove('hidden');
    section.classList.add('revealed');
    setTimeout(() => { section.scrollIntoView({ behavior: 'smooth' }); }, 50);
}

async function handleLoading(show) {
    if (show) {
        loaderContainer.classList.remove('loader-hidden');
        const phrases = ["Consulting the archives...", "Analyzing local vibes...", "Scouting hidden gems...", "Preparing stamps..."];
        let progress = 0; let pIdx = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 12;
            if (progress > 95) progress = 95;
            loaderFill.style.width = `${progress}%`;
            loaderStatus.innerText = phrases[pIdx];
            pIdx = (pIdx + 1) % phrases.length;
        }, 700);
        return interval;
    } else {
        loaderFill.style.width = "100%";
        setTimeout(() => { loaderContainer.classList.add('loader-hidden'); loaderFill.style.width = "0%"; }, 400);
    }
}

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

function displayAdventureOptions(options, coords) {
    const wrapper = document.getElementById('itinerary-display');
    const stampImages = [
        "https://i.pinimg.com/736x/90/49/a0/9049a044621c17246473187a41926615.jpg",
        "https://i.pinimg.com/736x/0b/c5/4a/0bc54a7375267a14e9f738a9d1847e13.jpg",
        "https://i.pinimg.com/736x/4e/c5/4d/4ec54d001099e0df365022830f0f585d.jpg"
    ];

    wrapper.innerHTML = `
        <div class="itinerary-postcard">
            <h4 style="color:${COLORS.crimson}; letter-spacing:3px;">GREETINGS FROM</h4>
            <h2>${currentAdventure.city.toUpperCase()}</h2>
            <p>I found three hidden gems for your collection. Hover to reveal their story, then choose the one that speaks to you.</p>
        </div>
        <div class="stamps-row"></div>
    `;

    const row = wrapper.querySelector('.stamps-row');
    options.forEach((opt, i) => {
        const card = document.createElement('div');
        card.className = 'stamp-card';
        card.innerHTML = `
            <div class="stamp-front" style="background-image: url('${stampImages[i]}')">
                <div class="stamp-overlay"></div><h3>${opt.name}</h3>
            </div>
            <div class="stamp-back">
                <h4 style="color:${COLORS.crimson}; font-size:0.75rem; font-weight:700;">${opt.vibe.toUpperCase()}</h4>
                <p style="color:#444; font-size:0.9rem;">${opt.description}</p>
                <button class="choose-btn">Choose Me</button>
            </div>
        `;
        card.querySelector('.choose-btn').onclick = (e) => { e.stopPropagation(); selectAdventure(opt, coords); };
        row.appendChild(card);
    });
    revealAndScroll('selection-section');
}

async function selectAdventure(choice, coords) {
    const weather = await getWeather(coords.lat, coords.lng);
    currentAdventure.choice = choice; currentAdventure.weather = weather;
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
    p.className = cls; p.style.left = Math.random() * 100 + 'vw';
    p.style.animationDuration = (Math.random() * 2 + 1) + 's'; p.style.opacity = Math.random();
    parent.appendChild(p);
}

// =========================================
// THE REVAMPED FIT CHECK LOGIC
// =========================================
let isDrawing = false; let ctx;
const suitcaseItems = [
    { name: "Vintage Camera", icon: "📸", vibe: "Cinematic" },
    { name: "Silk Scarf", icon: "🧣", vibe: "Elegant" },
    { name: "Travel Journal", icon: "📓", vibe: "Reflective" },
    { name: "Dark Shades", icon: "🕶️", vibe: "Mysterious" },
    { name: "Linen Tote", icon: "👜", vibe: "Organic" },
    { name: "Film Roll", icon: "🎞️", vibe: "Analog" }
];

function startFitCheck() {
    const picker = document.getElementById('outfit-picker-side');
    const area = document.getElementById('canvas-area');

    // 1. Build the Essential Carousel
    picker.innerHTML = `<h2 style="font-size: 2.5rem; margin-bottom: 20px;">Curated Essentials</h2>`;
    suitcaseItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'essential-item';
        div.innerHTML = `<span class="essential-icon">${item.icon}</span><div><strong>${item.name}</strong><br><small>${item.vibe}</small></div>`;
        div.onclick = () => toggleSuitcaseItem(item, div);
        picker.appendChild(div);
    });

    // 2. Build the Journal Canvas
    area.innerHTML = `
        <div class="canvas-container">
            <h2 style="font-size: 2.5rem; margin-bottom: 5px; color: ${COLORS.forest};">vibe check</h2>
            <p style="font-family:'Playfair Display'; font-style:italic; margin-bottom: 20px; color: ${COLORS.plum};">Select your gear, then doodle your vibe.</p>
            <canvas id="fit-canvas" width="450" height="500"></canvas>
            <div style="margin-top: 20px; display: flex; gap: 15px; justify-content: center; align-items: center;">
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
    document.getElementById('clear-canvas').onclick = () => { ctx.clearRect(0,0,450,500); currentAdventure.selectedItems = []; };
    document.getElementById('finish-btn').onclick = generateFinalTicket;
    
    revealAndScroll('fit-section');
}

function toggleSuitcaseItem(item, element) {
    element.classList.toggle('selected');
    if (element.classList.contains('selected')) {
        currentAdventure.selectedItems.push(item);
        // "Animation": Draw the icon onto the canvas randomly
        ctx.font = "40px serif";
        ctx.fillText(item.icon, Math.random() * 350 + 20, Math.random() * 400 + 50);
    }
}

function setColor(c) { ctx.strokeStyle = c; }
function draw(e) {
    if (!isDrawing) return;
    const canvas = document.getElementById('fit-canvas'); const r = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - r.left, e.clientY - r.top);
    ctx.stroke(); ctx.beginPath(); ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
}

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
                <h4 style="font-size: 0.6rem; letter-spacing: 2px; margin-bottom: 20px; color: ${COLORS.forest}; opacity:0.5;">VIBE CHECK ID</h4>
                <img src="${img}" class="outfit-preview">
                <p style="font-size: 0.7rem; margin-top: 25px; font-weight:700; color: ${COLORS.crimson};">GATE B19</p>
            </div>
        </div>
    `;
    revealAndScroll('ticket-section');
}

startBtn.onclick = async () => {
    const city = cityInput.value.trim();
    if (!city) return;
    const loadingInterval = await handleLoading(true);
    startBtn.disabled = true; startBtn.innerText = "WAITING...";
    currentAdventure.city = city;
    const coords = await getCoordinates(city);
    if (coords) {
        const opts = await getAdventureOptions(city);
        clearInterval(loadingInterval); await handleLoading(false);
        displayAdventureOptions(opts, coords);
    }
    startBtn.disabled = false; startBtn.innerText = "CHECK IN";
};

async function shareJourney() {
    if (navigator.share) await navigator.share({ title: 'The Voyager Edit', url: window.location.href });
    else alert("Journey details copied!");
}