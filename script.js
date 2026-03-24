const startBtn = document.getElementById('start-adventure');
const cityInput = document.getElementById('city-input');

const OPENAI_KEY = 's2ef662dn2q2';
const COLORS = { crimson: "#E52B50", teal: "#91C6C6", plum: "#591D35", sky: "#9BDDFF", olive: "#C9D179", forest: "#2B3328" };

let currentAdventure = { city: '', choice: null, weather: null };

function revealAndScroll(sectionId) {
    const section = document.getElementById(sectionId);
    section.classList.remove('hidden');
    section.classList.add('revealed');
    setTimeout(() => { section.scrollIntoView({ behavior: 'smooth' }); }, 50);
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
            body: JSON.stringify({ input: `Give me 3 trendy, aesthetic, student-friendly activities in ${city}.`, text: { format: { type: 'json_schema', name: 'adventure_options', schema: { type: 'object', properties: { options: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, vibe: { type: 'string' }, description: { type: 'string' } }, required: ['name', 'vibe', 'description'], additionalProperties: false } } }, required: ['options'], additionalProperties: false }, strict: true } } })
        });
        const data = await response.json();
        return JSON.parse(data.text).options;
    } catch (e) {
        return [
            { name: "The Local Bistro", vibe: "Chic & Organic", description: "A beautifully curated space with slow-living energy." },
            { name: "Main Character View", vibe: "Cinematic", description: "The city's best vantage point for film-style photography." },
            { name: "Heritage Archive", vibe: "Moody & Historic", description: "A vintage space filled with stories and deep atmosphere." }
        ];
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
    
    // 🖼️ PASTE YOUR PINTEREST IMAGE LINKS FOR STAMPS HERE
    const stampImages = [
        "https://i.pinimg.com/736x/1d/b3/28/1db3287417ca5664dffc2f0a581b11e0.jpg",
        "https://i.pinimg.com/736x/cb/d1/01/cbd10165dd355b6a123f20c14f04b076.jpg",
        "https://i.pinimg.com/736x/f5/1e/46/f51e465ae429c54d1e81f250b49726b1.jpg"
    ];

    wrapper.innerHTML = `
        <div class="itinerary-postcard">
            <h4 style="color:${COLORS.crimson}; letter-spacing:3px; font-size:0.8rem;">GREETINGS FROM</h4>
            <h2 style="margin:10px 0;">${currentAdventure.city.toUpperCase()}</h2>
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
                <div class="stamp-overlay"></div>
                <h3>${opt.name}</h3>
            </div>
            <div class="stamp-back">
                <h4 style="color:${COLORS.crimson}; font-size:0.7rem; margin-bottom:10px; font-weight:700;">${opt.vibe.toUpperCase()}</h4>
                <p style="color:#444;">${opt.description}</p>
                <button class="choose-btn">Choose Me</button>
            </div>
        `;
        card.querySelector('.choose-btn').onclick = (e) => {
            e.stopPropagation();
            selectAdventure(opt, coords);
        };
        row.appendChild(card);
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

let isDrawing = false;
let ctx;

function startFitCheck() {
    const area = document.getElementById('canvas-area');
    area.innerHTML = `
        <div class="canvas-container">
            <h2 style="font-size: 3.5rem; margin-bottom: 10px; color: ${COLORS.crimson};">packing check</h2>
            <p style="font-family:'Playfair Display'; font-style:italic; margin-bottom: 30px; font-size:1.2rem;">Sketch your look for ${currentAdventure.city}.</p>
            <canvas id="fit-canvas" width="400" height="500"></canvas>
            <div style="margin-top: 30px; display: flex; gap: 20px; justify-content: center;">
                <div onclick="setColor('${COLORS.sky}')" style="width:35px; height:35px; border-radius:50%; background:${COLORS.sky}; border:2px solid ${COLORS.forest}; cursor:pointer;"></div>
                <div onclick="setColor('${COLORS.crimson}')" style="width:35px; height:35px; border-radius:50%; background:${COLORS.crimson}; border:2px solid ${COLORS.forest}; cursor:pointer;"></div>
                <div onclick="setColor('${COLORS.forest}')" style="width:35px; height:35px; border-radius:50%; background:${COLORS.forest}; border:2px solid ${COLORS.forest}; cursor:pointer;"></div>
                <button id="clear-canvas" style="background:none; border:2.5px solid ${COLORS.forest}; padding: 10px 20px; font-weight:700; cursor:pointer;">Reset</button>
                <button id="finish-btn" style="background:${COLORS.forest}; color:white; border:none; padding: 10px 25px; font-weight:700; cursor:pointer; text-transform:uppercase;">Finalize</button>
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

function generateFinalTicket() {
    const img = document.getElementById('fit-canvas').toDataURL();
    const area = document.getElementById('final-ticket-area');
    area.innerHTML = `
        <div class="ticket">
            <div style="padding: 50px; flex: 2; border-right: 3px dashed #eee; text-align: left;">
                <h4 style="font-size: 0.7rem; letter-spacing: 5px; color: ${COLORS.crimson}; font-weight:700; margin-bottom:15px;">OFFICIAL BOARDING PASS</h4>
                <h2 style="font-size: 4.5rem; color: ${COLORS.forest}; margin-bottom: 20px;">${currentAdventure.city.toUpperCase()}</h2>
                <div style="background:${COLORS.off_white}; padding:20px; border-left:4px solid ${COLORS.crimson};">
                    <p style="font-weight: 700; font-size:1.2rem;">${currentAdventure.choice.name}</p>
                    <p style="font-family: 'Playfair Display'; font-style: italic; opacity: 0.7;">${currentAdventure.weather.temp}°F — ${currentAdventure.weather.condition}</p>
                </div>
                <button onclick="shareJourney()" style="background:${COLORS.deep_black}; color:white; border:none; padding:15px 30px; margin-top:40px; font-weight:700; cursor:pointer; text-transform:uppercase; letter-spacing:1px;">Share Journey</button>
            </div>
            <div style="padding: 50px; flex: 1; background: #fafafa; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <h4 style="font-size: 0.6rem; letter-spacing: 2px; margin-bottom: 20px; color: ${COLORS.forest}; opacity:0.5;">PHOTO ID</h4>
                <img src="${img}" style="width: 100%; border: 3px solid white; box-shadow:0 10px 20px rgba(0,0,0,0.1); filter: contrast(1.05);">
                <p style="font-size: 0.7rem; margin-top: 25px; font-weight:700; color: ${COLORS.crimson}; letter-spacing:1px;">GATE B19</p>
            </div>
        </div>
    `;
    revealAndScroll('ticket-section');
}

startBtn.onclick = async () => {
    const city = cityInput.value.trim();
    if (!city) return;
    startBtn.innerText = "PACKING...";
    currentAdventure.city = city;
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