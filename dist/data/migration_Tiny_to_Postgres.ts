import Database from 'better-sqlite3';
import path from 'path';


// Open the SQLite database connection
const dbPath = path.resolve(__dirname, '../../dist/data/games.db');
const db = new Database(dbPath, { }); // `better-sqlite3` automatically creates the file if it doesn't exist

try {
    db.pragma('journal_mode = WAL');
    db.pragma('cache_size = 10000');
    db.pragma('wal_autocheckpoint = 1000');

    // Initialize the tables and indexes for games and pending games
    db.exec(`
        CREATE TABLE IF NOT EXISTS games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            cracked BOOLEAN NOT NULL,
            reason TEXT,
            platform TEXT
        );
        
        CREATE TABLE IF NOT EXISTS pending_games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            cracked BOOLEAN NOT NULL,
            reason TEXT,
            platform TEXT
        );
        
        CREATE TABLE IF NOT EXISTS thread_info (
            thread_id TEXT PRIMARY KEY,
            message_id TEXT
        );
        
        CREATE INDEX IF NOT EXISTS idx_games_name ON games(name);
        CREATE INDEX IF NOT EXISTS idx_pending_games_name ON pending_games(name);
    `);
} catch (err) {
    console.error('Error initializing the database:', err);
    process.exit(1);
}

async function importGames() {
    // Connect to the old SQLite database
    const oldDb = new Database(dbPath);

    // Query to select all games from the old database
    const selectGames = oldDb.prepare('SELECT * FROM games');
    const games = selectGames.all();

    // Iterate through the games and import them into the new database
    for (const game of games as { name: string, cracked: boolean, reason: string | null, platform: string | null }[]) {
        const { name, cracked, reason, platform } = game;

        // Call the function to add the game to the new database
        await addGameToDatabase(name, cracked, reason, platform);
    }

    // Close the old database connection
    oldDb.close();

    console.log('Import completed successfully.');
}

// Run the import function
importGames().catch((error) => {
    console.error('Error importing games:', error);
});

// Create a queue for adding games to the database to reduce the risk of conflicts
const addGameQueue: Array<{ name: string; cracked: boolean; reason: string | null; platform: string }> = [];
let isAddingGame = false;

// Add a game to the 'games' table
export async function addGameToDatabase(name: string, cracked: boolean, reason: string | null, platform: any): Promise<void> {
    addGameQueue.push({
        name, 
        cracked,    // Convert boolean to 1 or 0
        reason: reason || null,    // Ensure `reason` is either a string or `null`
        platform: platform || null // Ensure `platform` is either a string or `null`
    });
    if (!isAddingGame) {
        isAddingGame = true;
        await processAddGameQueue();
    }
}

async function processAddGameQueue(): Promise<void> {
    const nextGame = addGameQueue.shift();
    if (!nextGame) {
        isAddingGame = false;
        return;
    }

    try {
        const insertStmt = db.prepare('INSERT INTO games (name, cracked, reason, platform) VALUES (?, ?, ?, ?)');
        insertStmt.run(nextGame.name, nextGame.cracked ? 1 : 0, nextGame.reason, nextGame.platform);
    } catch (err) {
        console.error('Error adding game to database:', err);
    } finally {
        await processAddGameQueue();
    }
}