import Database from 'better-sqlite3';
import path from 'path';
import prisma from './db';  // Import your Prisma client

// Open the SQLite database connection
const dbPath = path.resolve(__dirname, './data/games.db');
const oldDb = new Database(dbPath, {});

// Initialize the tables and indexes for games if not already set
try {
    oldDb.exec(`
        CREATE TABLE IF NOT EXISTS games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            cracked BOOLEAN NOT NULL,
            reason TEXT,
            platform TEXT
        );
    `);
} catch (err) {
    console.error('Error initializing the old database:', err);
    process.exit(1);
}

async function importGames() {
    // Query to select all games from the old database
    const selectGames = oldDb.prepare('SELECT * FROM games');
    const games = selectGames.all();

    // Iterate through the games and import them into the new database
    for (const game of games as { name: string; cracked: number; reason: string | null; platform: string | null }[]) {
        const { name, cracked, reason, platform } = game;

        // Convert cracked to boolean
        const isCracked = !!cracked; // Converts 1 to true and 0 to false

        // Call the function to add the game to the new database using Prisma
        await addGameToDatabase(name, isCracked, reason, platform);
    }

    // Close the old database connection
    oldDb.close();

    console.log('Import completed successfully.');
}

// Run the import function
importGames().catch((error) => {
    console.error('Error importing games:', error);
});

// Add a game to the new database using Prisma
async function addGameToDatabase(name: string, cracked: boolean, reason: string | null, platform: string | null): Promise<void> {
    try {
        // Check if the game already exists in the new database
        const existingGame = await prisma.game.findUnique({
            where: { name: name },
        });

        console.log(`Checking if game "${name}" exists:`, existingGame);

        if (!existingGame) {
            // Insert the new game
            await prisma.game.create({
                data: {
                    name,
                    cracked,
                    reason,
                    platform,
                },
            });
            console.log(`Inserted game "${name}" into database.`);
        } else {
            console.log(`Game with name "${name}" already exists. Skipping insertion.`);
        }
    } catch (err) {
        console.error(`Error adding game "${name}" to database:`, err);
    }
}
