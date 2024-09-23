import Database from 'better-sqlite3';
import path from 'path';

interface ThreadInfoRow {
    thread_id: string;
    message_id: string;
}

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

// Sort the games table by name in alphabetical order (a-z)
export function sortGamesByName(): void {
    try {
        const rows = db.prepare('SELECT * FROM games ORDER BY name ASC').all();
        // You can process the sorted `rows` if needed
    } catch (err) {
        console.error('Error sorting games:', err);
    }
}

// Fetch the thread_id and message_id from the 'thread_info' table
export function fetchThreadInfo(): { thread_id: string; message_id: string } | null {
    try {
        const row = db.prepare('SELECT * FROM thread_info').get();
        return row ? { thread_id: (row as ThreadInfoRow).thread_id, message_id: (row as ThreadInfoRow).message_id } : null;
    } catch (err) {
        console.error('Error fetching thread info:', err);
        return null;
    }
}

// Overwrite the thread_id and message_id in the 'thread_info' table
export function setThreadInfo(thread_id: string, message_id: string): void {
    try {
        const deleteStmt = db.prepare('DELETE FROM thread_info');
        deleteStmt.run();
        
        const insertStmt = db.prepare('INSERT INTO thread_info (thread_id, message_id) VALUES (?, ?)');
        insertStmt.run(thread_id, message_id);
    } catch (err) {
        console.error('Error setting thread info:', err);
    }
}

// Fetch all games from the 'games' table, sorted alphabetically by name (case insensitive)
export function fetchAllGames(): any[] {
    try {
        const rows = db.prepare('SELECT * FROM games ORDER BY LOWER(name) ASC').all();
        return rows;
    } catch (err) {
        console.error('Error fetching games:', err);
        return [];
    }
}

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

// Create a queue for removing games from the database to reduce the risk of conflicts
const removeGameQueue: Array<string> = [];
let isRemovingGame = false;

// Remove a game from the 'games' table
export async function removeGameFromDatabase(name: string): Promise<void> {
    removeGameQueue.push(name);

    if (!isRemovingGame) {
        isRemovingGame = true;
        await processRemoveGameQueue();
    }
}

async function processRemoveGameQueue(): Promise<void> {
    const nextGame = removeGameQueue.shift();
    if (!nextGame) {
        isRemovingGame = false;
        return;
    }

    try {
        const deleteStmt = db.prepare('DELETE FROM games WHERE name = ?');
        deleteStmt.run(nextGame);
    } catch (err) {
        console.error('Error removing game from database:', err);
    } finally {
        await processRemoveGameQueue();
    }
}

// Fetch all pending games from the 'pending_games' table
export function fetchAllPendingGames(): any[] {
    try {
        const rows = db.prepare('SELECT * FROM pending_games').all();
        return rows;
    } catch (err) {
        console.error('Error fetching pending games:', err);
        return [];
    }
}

// Add a game to the 'pending_games' table
export function addPendingGameToDatabase(name: string, cracked: boolean, reason: string | null, platform: string): void {
    try {
        const insertStmt = db.prepare('INSERT INTO pending_games (name, cracked, reason, platform) VALUES (?, ?, ?, ?)');
        insertStmt.run(name, cracked ? 1 : 0, reason, platform);
    } catch (err) {
        console.error('Error adding pending game to database:', err);
    }
}

// Remove a game from the 'pending_games' table
export function removePendingGameFromDatabase(name: string): void {
    try {
        const deleteStmt = db.prepare('DELETE FROM pending_games WHERE name = ?');
        deleteStmt.run(name);
    } catch (err) {
        console.error('Error removing pending game from database:', err);
    }
}

// Move a pending game to the main games list
export async function approvePendingGame(name: string): Promise<void> {
    try {
        const pendingGame = await fetchPendingGameByName(name);
        if (!pendingGame) throw new Error('Game not found in pending list');

        const transaction = db.transaction(() => {
            const insertStmt = db.prepare('INSERT INTO games (name, cracked, reason, platform) VALUES (?, ?, ?, ?)');
            insertStmt.run(pendingGame.name, pendingGame.cracked, pendingGame.reason, pendingGame.platform);

            const deleteStmt = db.prepare('DELETE FROM pending_games WHERE name = ?');
            deleteStmt.run(name);
        });

        transaction();
    } catch (err) {
        console.error('Error approving pending game:', err);
    }
}

// Fetch a single pending game by name
export function fetchPendingGameByName(name: string): any {
    try {
        const row = db.prepare('SELECT * FROM pending_games WHERE name = ?').get(name);
        return row;
    } catch (err) {
        console.error('Error fetching pending game by name:', err);
        return null;
    }
}

export default db;
