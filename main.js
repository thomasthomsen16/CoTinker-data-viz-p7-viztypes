let chartView = [];
let globalData = [];

document.addEventListener("DOMContentLoaded", function () {
    fetch('https://raw.githubusercontent.com/thomasthomsen16/dataset-p2/refs/heads/main/30000_spotify_songs.csv')
        .then(response => response.text())
        .then(csvData => {
            const parsedData = parseCSV(csvData);
            globalData = getRandomSample(parsedData, 60);
            renderChart(scatterFunc, globalData);
        })
});

document.getElementById("scatterplotBTN").addEventListener("click", function () {
    renderChart(scatterFunc, globalData);
}
);
document.getElementById("barchartBTN").addEventListener("click", function () {
    renderChart(barchartFunc, globalData);
});

// A function to render the chart
// It takes a specification function and data as arguments
function renderChart(specFunction, data) {
    const container = document.getElementById("chart-container");
    container.innerHTML = ''; // Optional: clear previous chart
    const spec = specFunction(data);
    spec.width = 800;
    spec.height = 400;
    spec.autosize = { type: "fit", contains: "padding" };
    vegaEmbed('#chart-container', spec, { actions: false });
};

// Function to create a Vega-Lite scatter plot specification
function scatterFunc(data) {
    return {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": "A scatter plot with embedded data.",
        "data": {
            "values": data
        },
        "mark": "point",
        "encoding": {
            "x": { "field": "tempo", "type": "quantitative" },
            "y": { "field": "danceability", "type": "quantitative" },
            "color": { "field": "playlist_genre", "type": "nominal" }
        }
    };
}

function barchartFunc(data) {
    return {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": "A bar chart with embedded data.",
        "data": {
            "values": data
        },
        "mark": "bar",
        "encoding": {
            "x": { "field": "playlist_genre", "type": "nominal" },
            "y": { "aggregate": "count", "type": "quantitative" }
        }
    };
}


// Function to parse CSV data into an array of objects
function parseCSV(csvData) {
    const rows = csvData.split("\n").filter(row => row.trim() !== "");
    const header = rows[0].split(",").map(column => column.trim());

    return rows.slice(1).map(row => {
        const values = row.split(",");

        if (values.length !== header.length) {
            return null;
        }

        let parsedRow = {};
        header.forEach((column, index) => {
            let value = values[index].trim();
            parsedRow[column] = isNaN(value) ? value : parseFloat(value);
        });

        return parsedRow;
    }).filter(row => row !== null);
}

// Function to get a random sample of data from the dataset
// It ensures that the sample contains songs from different genres
function getRandomSample(data, sampleSize) {
    const requiredFields = ["tempo", "danceability", "energy", "valence", "speechiness", "instrumentalness", "duration_ms", "liveness", "release_year"];
    const validData = data.filter(row => requiredFields.every(field => row[field] !== null));

    // Group songs by playlist_genre
    const groupedByGenre = validData.reduce((acc, row) => {
        const genre = row.playlist_genre; // Updated to use playlist_genre
        if (!acc[genre]) acc[genre] = [];
        acc[genre].push(row);
        return acc;
    }, {});

    // Determine how many songs to take from each genre
    const genres = Object.keys(groupedByGenre);
    const genreSampleSize = Math.floor(sampleSize / genres.length);

    // Select a random sample from each genre
    const sampleFromEachGenre = genres.map(genre => {
        const genreSongs = groupedByGenre[genre];
        const selectedSongs = genreSongs
            .sort(() => 0.5 - Math.random()) // Randomize order
            .slice(0, genreSampleSize); // Take a random sample
        return selectedSongs;
    });

    // Flatten the array of samples
    const allSelectedSongs = sampleFromEachGenre.flat();

    // If we still need more songs due to rounding, fill up the remaining spots randomly
    if (allSelectedSongs.length < sampleSize) {
        const remainingSongs = validData
            .filter(song => !allSelectedSongs.includes(song)) // Exclude already selected songs
            .sort(() => 0.5 - Math.random())
            .slice(0, sampleSize - allSelectedSongs.length);
        allSelectedSongs.push(...remainingSongs);
    }

    // Shuffle the final list to avoid any bias
    return allSelectedSongs
        .sort(() => 0.5 - Math.random()) // Shuffle
        .map((row, i) => ({ ...row, index: i })); // Assign index
}