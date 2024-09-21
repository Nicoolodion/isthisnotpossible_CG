import fs from 'fs';
import path from 'path';
import Fuse from 'fuse.js';
import {
    fetchAllGames,
    addGameToDatabase,
    removeGameFromDatabase,
    fetchAllPendingGames,
    addPendingGameToDatabase
} from './fileUtils';

interface Game {
    name: string;
    cracked: boolean;
    reason: string | null;
    platform: string
}

let gamesCache: Game[] | null = null; // Cache for games

// Load games from the database into cache
export async function loadGames(): Promise<Game[]> {
    if (!gamesCache) {
        try {
            const games = await fetchAllGames();
            gamesCache = games;
        } catch (error) {
            console.error('Error loading games from database:', error);
            gamesCache = [];
        }
    }
    return gamesCache as Game[];
}


export async function searchGames(name: string): Promise<Game[]> {
    const games = await loadGames();
    // Perform fuzzy search on the loaded games
    const fuse = new Fuse(games, {
        keys: ['name'],
        threshold: 0.2
    });

    const result = fuse.search(name);
    return result.map(res => res.item);
}

export async function searchGamesExact(name: string): Promise<Game[]> {
    const games = await loadGames();
    // Perform fuzzy search on the loaded games
    const fuse = new Fuse(games, {
        keys: ['name'],
        threshold: 0.05
    });

    const result = fuse.search(name);
    return result.map(res => res.item);
}

export async function addGame(game: Game): Promise<void> {
    await addGameToDatabase(game.name, game.cracked, game.reason, game.platform);
    gamesCache = null; // Invalidate cache
}

export async function removeGame(name: string): Promise<boolean> {
    try {
        await removeGameFromDatabase(name);
        gamesCache = null; // Invalidate cache
        return true;
    } catch (error) {
        console.error('Error removing game:', error);
        return false;
    }
}

export async function addPendingGame(game: Game): Promise<void> {
    await addPendingGameToDatabase(game.name, game.cracked, game.reason, game.platform);
}