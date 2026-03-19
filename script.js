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