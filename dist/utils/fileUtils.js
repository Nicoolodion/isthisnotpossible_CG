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
exports.updateGameReason = updateGameReason;
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
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
// Open the SQLite database connection
const dbPath = path_1.default.resolve(__dirname, '../../dist/data/games.db');
const db = new better_sqlite3_1.default(dbPath, {}); // `better-sqlite3` automatically creates the file if it doesn't exist
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
}
catch (err) {
    console.error('Error initializing the database:', err);
    process.exit(1);
}
// Sort the games table by name in alphabetical order (a-z)
function sortGamesByName() {
    try {
        const rows = db.prepare('SELECT * FROM games ORDER BY name ASC').all();
        // You can process the sorted `rows` if needed
    }
    catch (err) {
        console.error('Error sorting games:', err);
    }
}
// Update the reason for a specific game
function updateGameReason(gameName, reason) {
    try {
        const updateStmt = db.prepare('UPDATE games SET reason = ? WHERE name = ?');
        updateStmt.run(reason, gameName);
    }
    catch (err) {
        console.error('Error updating game reason:', err);
    }
}
// Fetch the thread_id and message_id from the 'thread_info' table
function fetchThreadInfo() {
    try {
        const row = db.prepare('SELECT * FROM thread_info').get();
        return row ? { thread_id: row.thread_id, message_id: row.message_id } : null;
    }
    catch (err) {
        console.error('Error fetching thread info:', err);
        return null;
    }
}
// Overwrite the thread_id and message_id in the 'thread_info' table
function setThreadInfo(thread_id, message_id) {
    try {
        const deleteStmt = db.prepare('DELETE FROM thread_info');
        deleteStmt.run();
        const insertStmt = db.prepare('INSERT INTO thread_info (thread_id, message_id) VALUES (?, ?)');
        insertStmt.run(thread_id, message_id);
    }
    catch (err) {
        console.error('Error setting thread info:', err);
    }
}
// Fetch all games from the 'games' table, sorted alphabetically by name (case insensitive)
function fetchAllGames() {
    try {
        const rows = db.prepare('SELECT * FROM games ORDER BY LOWER(name) ASC').all();
        return rows;
    }
    catch (err) {
        console.error('Error fetching games:', err);
        return [];
    }
}
// Create a queue for adding games to the database to reduce the risk of conflicts
const addGameQueue = [];
let isAddingGame = false;
// Add a game to the 'games' table
function addGameToDatabase(name, cracked, reason, platform) {
    return __awaiter(this, void 0, void 0, function* () {
        addGameQueue.push({
            name,
            cracked, // Convert boolean to 1 or 0
            reason: reason || null, // Ensure `reason` is either a string or `null`
            platform: platform || null // Ensure `platform` is either a string or `null`
        });
        if (!isAddingGame) {
            isAddingGame = true;
            yield processAddGameQueue();
        }
    });
}
function processAddGameQueue() {
    return __awaiter(this, void 0, void 0, function* () {
        const nextGame = addGameQueue.shift();
        if (!nextGame) {
            isAddingGame = false;
            return;
        }
        try {
            const insertStmt = db.prepare('INSERT INTO games (name, cracked, reason, platform) VALUES (?, ?, ?, ?)');
            insertStmt.run(nextGame.name, nextGame.cracked ? 1 : 0, nextGame.reason, nextGame.platform);
        }
        catch (err) {
            console.error('Error adding game to database:', err);
        }
        finally {
            yield processAddGameQueue();
        }
    });
}
// Create a queue for removing games from the database to reduce the risk of conflicts
const removeGameQueue = [];
let isRemovingGame = false;
// Remove a game from the 'games' table
function removeGameFromDatabase(name) {
    return __awaiter(this, void 0, void 0, function* () {
        removeGameQueue.push(name);
        if (!isRemovingGame) {
            isRemovingGame = true;
            yield processRemoveGameQueue();
        }
    });
}
function processRemoveGameQueue() {
    return __awaiter(this, void 0, void 0, function* () {
        const nextGame = removeGameQueue.shift();
        if (!nextGame) {
            isRemovingGame = false;
            return;
        }
        try {
            const deleteStmt = db.prepare('DELETE FROM games WHERE name = ?');
            deleteStmt.run(nextGame);
        }
        catch (err) {
            console.error('Error removing game from database:', err);
        }
        finally {
            yield processRemoveGameQueue();
        }
    });
}
// Fetch all pending games from the 'pending_games' table
function fetchAllPendingGames() {
    try {
        const rows = db.prepare('SELECT * FROM pending_games').all();
        return rows;
    }
    catch (err) {
        console.error('Error fetching pending games:', err);
        return [];
    }
}
// Add a game to the 'pending_games' table
function addPendingGameToDatabase(name, cracked, reason, platform) {
    try {
        const insertStmt = db.prepare('INSERT INTO pending_games (name, cracked, reason, platform) VALUES (?, ?, ?, ?)');
        insertStmt.run(name, cracked ? 1 : 0, reason, platform);
    }
    catch (err) {
        console.error('Error adding pending game to database:', err);
    }
}
// Remove a game from the 'pending_games' table
function removePendingGameFromDatabase(name) {
    try {
        const deleteStmt = db.prepare('DELETE FROM pending_games WHERE name = ?');
        deleteStmt.run(name);
    }
    catch (err) {
        console.error('Error removing pending game from database:', err);
    }
}
// Move a pending game to the main games list
function approvePendingGame(name) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pendingGame = yield fetchPendingGameByName(name);
            if (!pendingGame)
                throw new Error('Game not found in pending list');
            const transaction = db.transaction(() => {
                const insertStmt = db.prepare('INSERT INTO games (name, cracked, reason, platform) VALUES (?, ?, ?, ?)');
                insertStmt.run(pendingGame.name, pendingGame.cracked, pendingGame.reason, pendingGame.platform);
                const deleteStmt = db.prepare('DELETE FROM pending_games WHERE name = ?');
                deleteStmt.run(name);
            });
            transaction();
        }
        catch (err) {
            console.error('Error approving pending game:', err);
        }
    });
}
// Fetch a single pending game by name
function fetchPendingGameByName(name) {
    try {
        const row = db.prepare('SELECT * FROM pending_games WHERE name = ?').get(name);
        return row;
    }
    catch (err) {
        console.error('Error fetching pending game by name:', err);
        return null;
    }
}
exports.default = db;
