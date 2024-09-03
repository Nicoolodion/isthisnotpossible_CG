import fs from 'fs';
import path from 'path';
import Fuse from 'fuse.js';

const gamesFilePath = path.resolve(__dirname, '../data/games.json');
const pendingGamesFilePath = path.resolve(__dirname, '../data/pending-games.json');

interface Game {
    name: string;
    cracked: boolean;
    reason: string | null;
}

let gamesCache: Game[] | null = null; // Cache for games

function loadGames(): Game[] {
    if (!gamesCache) {
        try {
            gamesCache = JSON.parse(fs.readFileSync(gamesFilePath, 'utf-8'));
        } catch (error) {
            console.error('Error reading the games file:', error);
            gamesCache = [];
        }
    }
    return gamesCache as Game[];
}

export function reloadCache(): void {
    gamesCache = null;  // Reset cache
    loadGames();        // Reload cache
}

export function searchGames(name: string): Game[] {
    const games = loadGames();

    // Setting up Fuse.js for fuzzy search
    const fuse = new Fuse(games, {
        keys: ['name'],
        threshold: 0.2
    });

    const result = fuse.search(name);
    return result.map(res => res.item);
}

export function addGame(game: Game): void {
    const games = loadGames();
    games.push(game);
    fs.writeFileSync(gamesFilePath, JSON.stringify(games, null, 2));
    reloadCache();  // Reload cache after adding a game
}

export function removeGame(name: string): boolean {
    const games = loadGames();
    const index = games.findIndex(game => game.name.toLowerCase() === name.toLowerCase());

    if (index !== -1) {
        games.splice(index, 1);
        fs.writeFileSync(gamesFilePath, JSON.stringify(games, null, 2));
        reloadCache();  // Reload cache after removing a game
        return true;
    } else {
        console.error('Game not found');
        return false;
    }
}

export function addPendingGame(game: Game): void {
    let pendingGames: Game[];
    try {
        pendingGames = JSON.parse(fs.readFileSync(pendingGamesFilePath, 'utf-8'));
    } catch (error) {
        console.error('Error reading the pending games file:', error);
        pendingGames = [];
    }
    pendingGames.push(game);
    fs.writeFileSync(pendingGamesFilePath, JSON.stringify(pendingGames, null, 2));
}
