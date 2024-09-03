import fs from 'fs';
import path from 'path';

const gamesFilePath = path.resolve(__dirname, '../data/games.json');
const pendingGamesFilePath = path.resolve(__dirname, '../data/pending-games.json');

interface Game {
    name: string;
    cracked: boolean;
    reason: string | null;
}

export function searchGames(name: string): Game[] {
    const games: Game[] = JSON.parse(fs.readFileSync(gamesFilePath, 'utf-8'));
    return games.filter(game => game.name.toLowerCase().includes(name.toLowerCase()));
}

export function addGame(game: Game): void {
    const games: Game[] = JSON.parse(fs.readFileSync(gamesFilePath, 'utf-8'));
    games.push(game);
    fs.writeFileSync(gamesFilePath, JSON.stringify(games, null, 2));
}

export function addPendingGame(game: Game): void {
    const pendingGames: Game[] = JSON.parse(fs.readFileSync(pendingGamesFilePath, 'utf-8'));
    pendingGames.push(game);
    fs.writeFileSync(pendingGamesFilePath, JSON.stringify(pendingGames, null, 2));
}