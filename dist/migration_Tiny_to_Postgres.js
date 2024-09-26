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
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const db_1 = __importDefault(require("./db")); // Import your Prisma client
// Open the SQLite database connection
const dbPath = path_1.default.resolve(__dirname, './data/games.db');
const oldDb = new better_sqlite3_1.default(dbPath, {});
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
}
catch (err) {
    console.error('Error initializing the old database:', err);
    process.exit(1);
}
function importGames() {
    return __awaiter(this, void 0, void 0, function* () {
        // Query to select all games from the old database
        const selectGames = oldDb.prepare('SELECT * FROM games');
        const games = selectGames.all();
        // Iterate through the games and import them into the new database
        for (const game of games) {
            const { name, cracked, reason, platform } = game;
            // Convert cracked to boolean
            const isCracked = !!cracked; // Converts 1 to true and 0 to false
            // Call the function to add the game to the new database using Prisma
            yield addGameToDatabase(name, isCracked, reason, platform);
        }
        // Close the old database connection
        oldDb.close();
        console.log('Import completed successfully.');
    });
}
// Run the import function
importGames().catch((error) => {
    console.error('Error importing games:', error);
});
// Add a game to the new database using Prisma
function addGameToDatabase(name, cracked, reason, platform) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Check if the game already exists in the new database
            const existingGame = yield db_1.default.game.findUnique({
                where: { name: name },
            });
            console.log(`Checking if game "${name}" exists:`, existingGame);
            if (!existingGame) {
                // Insert the new game
                yield db_1.default.game.create({
                    data: {
                        name,
                        cracked,
                        reason,
                        platform,
                    },
                });
                console.log(`Inserted game "${name}" into database.`);
            }
            else {
                console.log(`Game with name "${name}" already exists. Skipping insertion.`);
            }
        }
        catch (err) {
            console.error(`Error adding game "${name}" to database:`, err);
        }
    });
}
