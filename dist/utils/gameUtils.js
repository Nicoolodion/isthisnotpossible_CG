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
exports.addPendingGame = exports.removeGame = exports.addGame = exports.searchGames = exports.loadGames = void 0;
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
exports.loadGames = loadGames;
const flexsearch_1 = __importDefault(require("flexsearch"));
function searchGames(name) {
    return __awaiter(this, void 0, void 0, function* () {
        const games = yield loadGames();
        const index = flexsearch_1.default.create({
            tokenize: 'full',
        });
        games.forEach((game, i) => index.add(i, game.name));
        const result = index.search(name);
        return result.map((id) => games[Number(id)]);
    });
}
exports.searchGames = searchGames;
function addGame(game) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, fileUtils_1.addGameToDatabase)(game.name, game.cracked, game.reason);
        gamesCache = null; // Invalidate cache
    });
}
exports.addGame = addGame;
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
exports.removeGame = removeGame;
function addPendingGame(game) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, fileUtils_1.addPendingGameToDatabase)(game.name, game.cracked, game.reason);
    });
}
exports.addPendingGame = addPendingGame;
