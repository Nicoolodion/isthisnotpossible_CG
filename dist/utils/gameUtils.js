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
exports.loadGames = loadGames;
exports.searchGames = searchGames;
exports.searchGamesExact = searchGamesExact;
exports.addGame = addGame;
exports.removeGame = removeGame;
exports.addPendingGame = addPendingGame;
const fuse_js_1 = __importDefault(require("fuse.js"));
const fileUtils_1 = require("./fileUtils");
let gamesCache = null; // Cache for games
// Load games from the database into cache
function loadGames() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!gamesCache) {
            try {
                const games = yield (0, fileUtils_1.fetchAllGames)();
                gamesCache = games;
            }
            catch (error) {
                console.error('Error loading games from database:', error);
                gamesCache = [];
            }
        }
        return gamesCache;
    });
}
function searchGames(name) {
    return __awaiter(this, void 0, void 0, function* () {
        const games = yield loadGames();
        // Perform fuzzy search on the loaded games
        const fuse = new fuse_js_1.default(games, {
            keys: ['name'],
            threshold: 0.2
        });
        const result = fuse.search(name);
        return result.map(res => res.item);
    });
}
function searchGamesExact(name) {
    return __awaiter(this, void 0, void 0, function* () {
        const games = yield loadGames();
        // Perform fuzzy search on the loaded games
        const fuse = new fuse_js_1.default(games, {
            keys: ['name'],
            threshold: 0.05
        });
        const result = fuse.search(name);
        return result.map(res => res.item);
    });
}
function addGame(game) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, fileUtils_1.addGameToDatabase)(game.name, game.cracked, game.reason);
        gamesCache = null; // Invalidate cache
    });
}
function removeGame(name) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, fileUtils_1.removeGameFromDatabase)(name);
            gamesCache = null; // Invalidate cache
            return true;
        }
        catch (error) {
            console.error('Error removing game:', error);
            return false;
        }
    });
}
function addPendingGame(game) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, fileUtils_1.addPendingGameToDatabase)(game.name, game.cracked, game.reason);
    });
}
