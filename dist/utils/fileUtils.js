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
exports.fetchPendingGameByName = exports.approvePendingGame = exports.removePendingGameFromDatabase = exports.addPendingGameToDatabase = exports.fetchAllPendingGames = exports.removeGameFromDatabase = exports.addGameToDatabase = exports.fetchAllGames = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
// Open the SQLite database connection
const dbPath = path_1.default.resolve(__dirname, '../../dist/data/games.db');
const db = new sqlite3_1.default.Database(dbPath, sqlite3_1.default.OPEN_READWRITE, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    }
    else {
        console.log('Connected to the SQLite database.');
    }
});
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
    // Create indexes to improve query performance
    db.run('CREATE INDEX IF NOT EXISTS idx_games_name ON games(name);');
    db.run('CREATE INDEX IF NOT EXISTS idx_pending_games_name ON pending_games(name);');
});
// Fetch all games from the 'games' table
function fetchAllGames() {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM games', (err, rows) => {
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
exports.fetchAllGames = fetchAllGames;
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
exports.addGameToDatabase = addGameToDatabase;
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
exports.removeGameFromDatabase = removeGameFromDatabase;
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
exports.fetchAllPendingGames = fetchAllPendingGames;
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
exports.addPendingGameToDatabase = addPendingGameToDatabase;
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
exports.removePendingGameFromDatabase = removePendingGameFromDatabase;
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
exports.approvePendingGame = approvePendingGame;
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
exports.fetchPendingGameByName = fetchPendingGameByName;
exports.default = db;
