const fs = require('fs');
const path = require('path');
const { addGameToDatabase } = require('../utils/fileUtils'); // Adjust the path to your utils file

// Path to the JSON file containing the games
const gamesJsonPath = path.resolve(__dirname, './games.json');

// Read the JSON file
fs.readFile(gamesJsonPath, 'utf8', async (err, data) => {
    if (err) {
        console.error('Error reading JSON file:', err);
        return;
    }

    try {
        // Parse the JSON data
        const games = JSON.parse(data);

        // Iterate through the games and add them to the database
        for (const game of games) {
            const { name, cracked, reason = null } = game;

            try {
                // Add the game to the database
                await addGameToDatabase(name, cracked, reason);
                console.log(`Successfully added game: ${name}`);
            } catch (dbErr) {
                console.error(`Error adding game ${name}:`, dbErr);
            }
        }

        console.log('All games have been processed.');
    } catch (parseErr) {
        console.error('Error parsing JSON file:', parseErr);
    }
});