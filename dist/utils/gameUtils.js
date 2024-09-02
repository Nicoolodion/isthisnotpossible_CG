"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPendingGame = exports.addGame = exports.searchGames = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const gamesFilePath = path_1.default.resolve(__dirname, '../data/games.json');
const pendingGamesFilePath = path_1.default.resolve(__dirname, '../data/pending-games.json');
function searchGames(name) {
    const games = JSON.parse(fs_1.default.readFileSync(gamesFilePath, 'utf-8'));
    return games.filter(game => game.name.toLowerCase().includes(name.toLowerCase()));
}
exports.searchGames = searchGames;
function addGame(game) {
    const games = JSON.parse(fs_1.default.readFileSync(gamesFilePath, 'utf-8'));
    games.push(game);
    fs_1.default.writeFileSync(gamesFilePath, JSON.stringify(games, null, 2));
}
exports.addGame = addGame;
function addPendingGame(game) {
    const pendingGames = JSON.parse(fs_1.default.readFileSync(pendingGamesFilePath, 'utf-8'));
    pendingGames.push(game);
    fs_1.default.writeFileSync(pendingGamesFilePath, JSON.stringify(pendingGames, null, 2));
}
exports.addPendingGame = addPendingGame;
