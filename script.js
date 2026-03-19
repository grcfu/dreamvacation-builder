// Grab our UI elements
const startBtn = document.getElementById('start-adventure');
const cityInput = document.getElementById('city-input');

// This is where the magic starts
startBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    
    if (city === "") {
        alert("Please enter a destination to check in!");
        return;
    }

    console.log(`Starting adventure for: ${city}`);
    // Next step will be calling the Geocoding API!
});