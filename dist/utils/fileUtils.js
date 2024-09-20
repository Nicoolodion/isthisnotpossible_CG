"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortGamesByName = sortGamesByName;
exports.fetchThreadInfo = fetchThreadInfo;
exports.setThreadInfo = setThreadInfo;
exports.fetchAllGames = fetchAllGames;
exports.addGameToDatabase = addGameToDatabase;
exports.removeGameFromDatabase = removeGameFromDatabase;
exports.fetchAllPendingGames = fetchAllPendingGames;
exports.addPendingGameToDatabase = addPendingGameToDatabase;
exports.removePendingGameFromDatabase = removePendingGameFromDatabase;
exports.approvePendingGame = approvePendingGame;
exports.fetchPendingGameByName = fetchPendingGameByName;
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
// Open the SQLite database connection
const dbPath = path_1.default.resolve(__dirname, '../../dist/data/games.db');
let db;
try {
    db = new sqlite3_1.default.Database(dbPath, sqlite3_1.default.OPEN_READWRITE | sqlite3_1.default.OPEN_CREATE, (err) => {
        if (err) {
            console.error('Error opening database:', err);
        }
        else {
            console.log('Connected to the SQLite database.');
        }
    });
}
catch (err) {
    console.error('Error creating database:', err);
    process.exit(1);
}
// Initialize the tables and indexes for games and pending games
db.serialize(() => {
    // Use WAL mode for better performance in write-heavy workloads
    db.run('PRAGMA journal_mode = WAL;');
    db.run('PRAGMA cache_size = 10000;');
    // Create tables with indexes
    db.run(`
        CREATE TABLE IF NOT EXISTS games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            cracked BOOLEAN NOT NULL,
            reason TEXT
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS pending_games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            cracked BOOLEAN NOT NULL,
            reason TEXT
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
function sortGamesByName() {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM games ORDER BY name ASC', (err, rows) => {
            if (err) {
                console.error('Error sorting games:', err);
                reject(err);
            }
            else {
                // Optionally, if you need to perform any additional operations with the sorted rows
                // you could process `rows` here before resolving.
                console.log('Games sorted alphabetically:');
                console.table(rows);
                // As the sorting itself doesn't modify the database, there's no need to re-save anything.
                // We just need to retrieve and use the sorted data.
                resolve();
            }
        });
    });
}
// Fetch the thread_id and message_id from the 'thread_info' table
function fetchThreadInfo() {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM thread_info', (err, row) => {
            if (err) {
                console.error('Error fetching thread info:', err);
                reject(err);
            }
            else {
                resolve(row ? { thread_id: row.thread_id, message_id: row.message_id } : null);
            }
        });
    });
}
// Overwrite the thread_id and message_id in the 'thread_info' table
function setThreadInfo(thread_id, message_id) {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM thread_info;', (err1) => {
            if (err1) {
                console.error('Error deleting thread info:', err1);
                reject(err1);
            }
            else {
                db.run('INSERT INTO thread_info (thread_id, message_id) VALUES (?, ?)', [thread_id, message_id], (err2) => {
                    if (err2) {
                        console.error('Error setting thread info:', err2);
                        reject(err2);
                    }
                    else {
                        resolve();
                    }
                });
            }
        });
    });
}
// Fetch all games from the 'games' table, sorted alphabetically by name (case insensitive)
function fetchAllGames() {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM games ORDER BY LOWER(name) ASC', (err, rows) => {
            if (err) {
                console.error('Error fetching games:', err);
                reject(err);
            }
            else {
                resolve(rows);
            }
        });
    });
}
// Add a game to the 'games' table
function addGameToDatabase(name, cracked, reason) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO games (name, cracked, reason) VALUES (?, ?, ?)`, [name, cracked, reason], (err) => {
            if (err) {
                console.error('Error adding game to database:', err);
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
// Remove a game from the 'games' table
function removeGameFromDatabase(name) {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM games WHERE name = ?`, [name], (err) => {
            if (err) {
                console.error('Error removing game from database:', err);
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
// Fetch all pending games from the 'pending_games' table
function fetchAllPendingGames() {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM pending_games', (err, rows) => {
            if (err) {
                console.error('Error fetching pending games:', err);
                reject(err);
            }
            else {
                resolve(rows);
            }
        });
    });
}
// Add a game to the 'pending_games' table
function addPendingGameToDatabase(name, cracked, reason) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO pending_games (name, cracked, reason) VALUES (?, ?, ?)`, [name, cracked, reason], (err) => {
            if (err) {
                console.error('Error adding pending game to database:', err);
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
// Remove a game from the 'pending_games' table
function removePendingGameFromDatabase(name) {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM pending_games WHERE name = ?`, [name], (err) => {
            if (err) {
                console.error('Error removing pending game from database:', err);
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
// Move a pending game to the main games list
function approvePendingGame(name) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            const pendingGame = yield fetchPendingGameByName(name);
            if (!pendingGame)
                throw new Error('Game not found in pending list');
            // Start transaction
            yield db.run('BEGIN TRANSACTION');
            yield addGameToDatabase(pendingGame.name, pendingGame.cracked, pendingGame.reason);
            yield removePendingGameFromDatabase(name);
            // Commit transaction
            yield db.run('COMMIT');
            resolve();
        }
        catch (err) {
            console.error('Error approving pending game:', err);
            try {
                // Rollback transaction if something fails
                yield db.run('ROLLBACK');
            }
            catch (error) {
                console.error('Error rolling back transaction:', error);
            }
            reject(err);
        }
    }));
}
// Fetch a single pending game by name
function fetchPendingGameByName(name) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM pending_games WHERE name = ?`, [name], (err, row) => {
            if (err) {
                console.error('Error fetching pending game by name:', err);
                reject(err);
            }
            else {
                resolve(row);
            }
        });
    });
}
exports.default = db;
