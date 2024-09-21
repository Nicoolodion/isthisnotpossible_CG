import sqlite3 from 'sqlite3';
import path from 'path';

interface ThreadInfoRow {
    thread_id: string;
    message_id: string;
  }

// Open the SQLite database connection
const dbPath = path.resolve(__dirname, '../../dist/data/games.db');
let db: sqlite3.Database;
try {
     db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
            console.error('Error opening database:', err);
        } else {
            console.log('Connected to the SQLite database.');
        }
    });
} catch (err) {
    console.error('Error creating database:', err);
    process.exit(1);
}

// Initialize the tables and indexes for games and pending games
db.serialize(() => {
    // Use WAL mode for better performance in write-heavy workloads
    db.run('PRAGMA journal_mode = WAL;');
    db.run('PRAGMA cache_size = 10000;');
    db.run('PRAGMA wal_autocheckpoint = 1000;');

    // Create tables with indexes
    db.run(`
        CREATE TABLE IF NOT EXISTS games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            cracked BOOLEAN NOT NULL,
            reason TEXT,
            platform TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS pending_games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            cracked BOOLEAN NOT NULL,
            reason TEXT,
            platform TEXT
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS thread_info (
            thread_id TEXT PRIMARY KEY,
            message_id TEXT
        )
    `);

    // Create indexes to improve query performance
    db.run('CREATE INDEX IF NOT EXISTS idx_games_name ON games(name);');
    db.run('CREATE INDEX IF NOT EXISTS idx_pending_games_name ON pending_games(name);');
});

// Sort the games table by name in alphabetical order (a-z)
export function sortGamesByName(): Promise<void> {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM games ORDER BY name ASC', (err, rows) => {
            if (err) {
                console.error('Error sorting games:', err);
                reject(err);
            } else {
                // Optionally, if you need to perform any additional operations with the sorted rows
                // you could process `rows` here before resolving.
                //console.log('Games sorted alphabetically:');
                //console.table(rows);

                // As the sorting itself doesn't modify the database, there's no need to re-save anything.
                // We just need to retrieve and use the sorted data.
                resolve();
            }
        });
    });
}




// Fetch the thread_id and message_id from the 'thread_info' table
export function fetchThreadInfo(): Promise<{ thread_id: string, message_id: string } | null> {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM thread_info', (err, row) => {
            if (err) {
                console.error('Error fetching thread info:', err);
                reject(err);
            } else {
                resolve(row ? { thread_id: (row as ThreadInfoRow).thread_id, message_id: (row as ThreadInfoRow).message_id } : null);
            }
        });
    });
}

// Overwrite the thread_id and message_id in the 'thread_info' table
export function setThreadInfo(thread_id: string, message_id: string): Promise<void> {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM thread_info;', (err1) => {
            if (err1) {
                console.error('Error deleting thread info:', err1);
                reject(err1);
            } else {
                db.run('INSERT INTO thread_info (thread_id, message_id) VALUES (?, ?)', [thread_id, message_id], (err2) => {
                    if (err2) {
                        console.error('Error setting thread info:', err2);
                        reject(err2);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

// Fetch all games from the 'games' table, sorted alphabetically by name (case insensitive)
export function fetchAllGames(): Promise<any[]> {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM games ORDER BY LOWER(name) ASC', (err, rows) => {
            if (err) {
                console.error('Error fetching games:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Create a queue for adding games to the database to reduce the risk of conflicts
const addGameQueue: Array<{ name: string; cracked: boolean; reason: string | null; platform: string }> = [];
let isAddingGame = false;

// Add a game to the 'games' table
export function addGameToDatabase(name: string, cracked: boolean, reason: string | null, platform: any): Promise<void> {
    return new Promise((resolve, reject) => {
        addGameQueue.push({ name, cracked, reason, platform });

        // If no one is currently adding a game, start adding the game now
        if (!isAddingGame) {
            isAddingGame = true;
            processAddGameQueue();
        }

        function processAddGameQueue(): void {
            const nextGame = addGameQueue.shift();
            if (!nextGame) {
                isAddingGame = false;
                return;
            }

            db.run(
                `INSERT INTO games (name, cracked, reason, platform) VALUES (?, ?, ?, ?)`,
                [nextGame.name, nextGame.cracked, nextGame.reason, nextGame.platform],
                (err) => {
                    if (err) {
                        console.error('Error adding game to database:', err);
                        reject(err);
                    } else {
                        resolve();
                    }
                    processAddGameQueue();
                }
            );
        }
    });
}

// Create a queue for removing games from the database to reduce the risk of conflicts
const removeGameQueue: Array<string> = [];
let isRemovingGame = false;

// Remove a game from the 'games' table
export function removeGameFromDatabase(name: string): Promise<void> {
    return new Promise((resolve, reject) => {
        //TODO: Make sure this queue works
        removeGameQueue.push(name);

        // If no one is currently removing a game, start removing the game now
        if (!isRemovingGame) {
            isRemovingGame = true;
            processRemoveGameQueue();
        }

        function processRemoveGameQueue(): void {
            const nextGame = removeGameQueue.shift();
            if (!nextGame) {
                isRemovingGame = false;
                return;
            }

            db.run(`DELETE FROM games WHERE name = ?`, [nextGame], (err) => {
                if (err) {
                    console.error('Error removing game from database:', err);
                    reject(err);
                } else {
                    resolve();
                }
                processRemoveGameQueue();
            });
        }
    });
}

// Fetch all pending games from the 'pending_games' table
export function fetchAllPendingGames(): Promise<any[]> {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM pending_games', (err, rows) => {
            if (err) {
                console.error('Error fetching pending games:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Add a game to the 'pending_games' table
export function addPendingGameToDatabase(name: string, cracked: boolean, reason: string | null, platform: string): Promise<void> {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO pending_games (name, cracked, reason, platform) VALUES (?, ?, ?, ?)`,
            [name, cracked, reason, platform],
            (err) => {
                if (err) {
                    console.error('Error adding pending game to database:', err);
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
}

// Remove a game from the 'pending_games' table
export function removePendingGameFromDatabase(name: string): Promise<void> {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM pending_games WHERE name = ?`, [name], (err) => {
            if (err) {
                console.error('Error removing pending game from database:', err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

// Move a pending game to the main games list
export function approvePendingGame(name: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {
            const pendingGame = await fetchPendingGameByName(name);
            if (!pendingGame) throw new Error('Game not found in pending list');

            // Start transaction
            await db.run('BEGIN TRANSACTION');

            await addGameToDatabase(pendingGame.name, pendingGame.cracked, pendingGame.reason, pendingGame.platform);
            await removePendingGameFromDatabase(name);

            // Commit transaction
            await db.run('COMMIT');


            resolve();
        } catch (err) {
            console.error('Error approving pending game:', err);
            try {
                // Rollback transaction if something fails
                await db.run('ROLLBACK');
            } catch (error) {
                console.error('Error rolling back transaction:', error);
            }
            reject(err);
        }
    });
}

// Fetch a single pending game by name
export function fetchPendingGameByName(name: string): Promise<any> {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM pending_games WHERE name = ?`, [name], (err, row) => {
            if (err) {
                console.error('Error fetching pending game by name:', err);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}



export default db;
