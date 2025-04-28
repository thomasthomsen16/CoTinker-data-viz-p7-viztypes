let chartView = [];

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