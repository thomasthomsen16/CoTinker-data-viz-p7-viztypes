let chartView = [];
let globalData = [];

document.addEventListener("DOMContentLoaded", function () {
    fetch('https://raw.githubusercontent.com/thomasthomsen16/dataset-p2/refs/heads/main/30000_spotify_songs.csv')
        .then(response => response.text())
        .then(csvData => {
            const parsedData = parseCSV(csvData);
            globalData = getRandomSample(parsedData, 60);
            renderChart(scatterFunc, globalData);
            console.log(globalData);
        })
});

document.getElementById("scatterplotBTN").addEventListener("click", function () {
    renderChart(scatterFunc, globalData);
    document.getElementById("plot-header").innerHTML = "Scatter plot";
}
);
document.getElementById("barchartBTN").addEventListener("click", function () {
    renderChart(barchartFunc, globalData);
    document.getElementById("plot-header").innerHTML = "Bar chart";
});

document.getElementById("histogramBTN").addEventListener("click", function () {
    renderChart(histogramFunc, globalData);
    document.getElementById("plot-header").innerHTML = "Histogram";
});

document.getElementById("linechartBTN").addEventListener("click", function () {
    renderChart(lineplotFunc, globalData);
    document.getElementById("plot-header").innerHTML = "Line chart";
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
};

function barchartFunc(data) {
    return {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": "A bar chart with embedded data.",
        "data": {
            "values": data
        },
        "mark": "bar",
        "encoding": {
            "x": { "field": "track_album_release_date", "type": "temporal" },
            "y": { "aggregate": "count", "type": "quantitative" },
            "color": { "field": "playlist_genre", "type": "nominal" }
        }
    };
};

function histogramFunc(data) {
    return {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": "A histogram with embedded data.",
        "data": {
            "values": data
        },
        "mark": "bar",
        "encoding": {
            "x": { "field": "release_year", "type": "ordinal", bin: true },
            "y": { "aggregate": "count", "type": "quantitative" },
            "color": { "field": "playlist_genre", "type": "nominal" }
        }
    };
};

function lineplotFunc(data) {
    return {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": "A line plot of danceability over time, grouped by genre.",
        "data": {
            "values": data
        },
        "mark": "line",
        "encoding": {
            "x": { "field": "tempo", "type": "quantitative" },
            "y": { "field": "danceability", "type": "quantitative" },
            "color": { "field": "playlist_genre", "type": "nominal" }
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

        // Extract release_year from track_album_release_date if it's a valid date string
        if (parsedRow["track_album_release_date"]) {
            const date = new Date(parsedRow["track_album_release_date"]);
            if (!isNaN(date)) {
                parsedRow["release_year"] = date.getFullYear();
            } else {
                parsedRow["release_year"] = null; // Fallback for invalid dates
            }
        } else {
            parsedRow["release_year"] = null;
        }

        return parsedRow;
    }).filter(row => row !== null);
}


// Function to get a random sample of data from the dataset
// It ensures that the sample contains songs from different genres
function getRandomSample(data, sampleSize) {
    const requiredFields = ["tempo", "danceability", "energy", "valence", "speechiness", "instrumentalness", "duration_ms", "liveness", "track_album_release_date"];
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

