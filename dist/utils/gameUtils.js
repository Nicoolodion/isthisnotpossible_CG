"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPendingGame = exports.removeGame = exports.addGame = exports.searchGames = exports.reloadCache = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const fuse_js_1 = __importDefault(require("fuse.js"));
const gamesFilePath = path_1.default.resolve(__dirname, '../data/games.json');
const pendingGamesFilePath = path_1.default.resolve(__dirname, '../data/pending-games.json');
let gamesCache = null; // Cache for games
function loadGames() {
    if (!gamesCache) {
        try {
            gamesCache = JSON.parse(fs_1.default.readFileSync(gamesFilePath, 'utf-8'));
        }
        catch (error) {
            console.error('Error reading the games file:', error);
            gamesCache = [];
        }
    }
    return gamesCache;
}
function reloadCache() {
    gamesCache = null; // Reset cache
    loadGames(); // Reload cache
}
exports.reloadCache = reloadCache;
function searchGames(name) {
    const games = loadGames();
    // Setting up Fuse.js for fuzzy search
    const fuse = new fuse_js_1.default(games, {
        keys: ['name'],
        threshold: 0.2
    });
    const result = fuse.search(name);
    return result.map(res => res.item);
}
exports.searchGames = searchGames;
function addGame(game) {
    const games = loadGames();
    games.push(game);
    fs_1.default.writeFileSync(gamesFilePath, JSON.stringify(games, null, 2));
    reloadCache(); // Reload cache after adding a game
}
exports.addGame = addGame;
function removeGame(name) {
    const games = loadGames();
    const index = games.findIndex(game => game.name.toLowerCase() === name.toLowerCase());
    if (index !== -1) {
        games.splice(index, 1);
        fs_1.default.writeFileSync(gamesFilePath, JSON.stringify(games, null, 2));
        reloadCache(); // Reload cache after removing a game
        return true;
    }
    else {
        console.error('Game not found');
        return false;
    }
}
exports.removeGame = removeGame;
function addPendingGame(game) {
    let pendingGames;
    try {
        pendingGames = JSON.parse(fs_1.default.readFileSync(pendingGamesFilePath, 'utf-8'));
    }
    catch (error) {
        console.error('Error reading the pending games file:', error);
        pendingGames = [];
    }
    pendingGames.push(game);
    fs_1.default.writeFileSync(pendingGamesFilePath, JSON.stringify(pendingGames, null, 2));
}
exports.addPendingGame = addPendingGame;
