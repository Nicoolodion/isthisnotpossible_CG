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
const db_1 = __importDefault(require("../db"));
// Sort the games table by name in alphabetical order (a-z)
function sortGamesByName() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const games = yield db_1.default.game.findMany({
                orderBy: { name: 'asc' }
            });
            // You can process the sorted `games` if needed
        }
        catch (err) {
            console.error('Error sorting games:', err);
        }
    });
}
// Update the reason for a specific game
function updateGameReason(gameName, reason) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield db_1.default.game.update({
                where: { name: gameName },
                data: { reason }
            });
        }
        catch (err) {
            console.error('Error updating game reason:', err);
        }
    });
}
// Fetch the thread_id and message_id from the 'thread_info' table
function fetchThreadInfo() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const threadInfo = yield db_1.default.threadInfo.findFirst();
            return threadInfo || null;
        }
        catch (err) {
            console.error('Error fetching thread info:', err);
            return null;
        }
    });
}
// Overwrite the thread_id and message_id in the 'thread_info' table
function setThreadInfo(thread_id, message_id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield db_1.default.threadInfo.deleteMany();
            yield db_1.default.threadInfo.create({
                data: {
                    thread_id,
                    message_id
                }
            });
        }
        catch (err) {
            console.error('Error setting thread info:', err);
        }
    });
}
// Fetch all games from the 'games' table, sorted alphabetically by name (case insensitive)
function fetchAllGames() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const games = yield db_1.default.game.findMany({
                orderBy: { name: 'asc' }
            });
            return games;
        }
        catch (err) {
            console.error('Error fetching games:', err);
            return [];
        }
    });
}
// Add a game to the 'games' table
function addGameToDatabase(name, cracked, reason, platform) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield db_1.default.game.create({
                data: {
                    name,
                    cracked,
                    reason,
                    platform
                }
            });
        }
        catch (err) {
            console.error('Error adding game to database:', err);
        }
    });
}
// Remove a game from the 'games' table
function removeGameFromDatabase(name) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield db_1.default.game.delete({
                where: { name }
            });
        }
        catch (err) {
            console.error('Error removing game from database:', err);
        }
    });
}
// Fetch all pending games from the 'pending_games' table
function fetchAllPendingGames() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pendingGames = yield db_1.default.pendingGame.findMany();
            return pendingGames;
        }
        catch (error) {
            console.error('Error fetching games out of the pending games table');
            return [];
        }
    });
}
// Add a game to the 'pending_games' table
function addPendingGameToDatabase(name, cracked, reason, platform) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield db_1.default.pendingGame.create({
                data: {
                    name,
                    cracked,
                    reason,
                    platform
                }
            });
        }
        catch (err) {
            console.error('Error adding pending game to database:', err);
        }
    });
}
// Remove a game from the 'pending_games' table
function removePendingGameFromDatabase(name) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield db_1.default.pendingGame.delete({
                where: { name }
            });
        }
        catch (err) {
            console.error('Error removing pending game from database:', err);
        }
    });
}
// Move a pending game to the main games list
function approvePendingGame(name) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pendingGame = yield fetchPendingGameByName(name);
            if (!pendingGame)
                throw new Error('Game not found in pending list');
            yield db_1.default.$transaction([
                db_1.default.game.create({
                    data: {
                        name: pendingGame.name,
                        cracked: pendingGame.cracked,
                        reason: pendingGame.reason,
                        platform: pendingGame.platform,
                    }
                }),
                db_1.default.pendingGame.delete({
                    where: { name }
                })
            ]);
        }
        catch (err) {
            console.error('Error approving pending game:', err);
        }
    });
}
// Fetch a single pending game by name
function fetchPendingGameByName(name) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pendingGame = yield db_1.default.pendingGame.findUnique({
                where: { name }
            });
            return pendingGame;
        }
        catch (err) {
            console.error('Error fetching pending game by name:', err);
            return null;
        }
    });
}
