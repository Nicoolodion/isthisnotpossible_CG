import prisma from '../db';

// Sort the games table by name in alphabetical order (a-z)
export async function sortGamesByName(): Promise<void> {
    try {
        const games = await prisma.game.findMany({
            orderBy: { name: 'asc' }
        });
        // You can process the sorted `games` if needed
    } catch (err) {
        console.error('Error sorting games:', err);
    }
}

// Update the reason for a specific game
export async function updateGameReason(gameName: string, reason: string | null): Promise<void> {
    try {
        await prisma.game.update({
            where: { name: gameName },
            data: { reason }
        });
    } catch (err) {
        console.error('Error updating game reason:', err);
    }
}

// Fetch the thread_id and message_id from the 'thread_info' table
export async function fetchThreadInfo(): Promise<{ thread_id: string; message_id: string } | null> {
    try {
        const threadInfo = await prisma.threadInfo.findFirst();
        return threadInfo || null;
    } catch (err) {
        console.error('Error fetching thread info:', err);
        return null;
    }
}

// Overwrite the thread_id and message_id in the 'thread_info' table
export async function setThreadInfo(thread_id: string, message_id: string): Promise<void> {
    try {
        await prisma.threadInfo.deleteMany();
        await prisma.threadInfo.create({
            data: {
                thread_id,
                message_id
            }
        });
    } catch (err) {
        console.error('Error setting thread info:', err);
    }
}

// Fetch all games from the 'games' table, sorted alphabetically by name (case insensitive)
export async function fetchAllGames(): Promise<any[]> {
    try {
        const games = await prisma.game.findMany({
            orderBy: { name: 'asc' }
        });
        return games;
    } catch (err) {
        console.error('Error fetching games:', err);
        return [];
    }
}

// Add a game to the 'games' table
export async function addGameToDatabase(name: string, cracked: boolean, reason: string | null, platform: string): Promise<void> {
    try {
        await prisma.game.create({
            data: {
                name,
                cracked,
                reason,
                platform
            }
        });
    } catch (err) {
        console.error('Error adding game to database:', err);
    }
}

// Remove a game from the 'games' table
export async function removeGameFromDatabase(name: string): Promise<void> {
    try {
        await prisma.game.delete({
            where: { name }
        });
    } catch (err) {
        console.error('Error removing game from database:', err);
    }
}

// Fetch all pending games from the 'pending_games' table
export async function fetchAllPendingGames(): Promise<any[]> {
    try {
        const pendingGames = await prisma.pendingGame.findMany();
        return pendingGames;
    } catch (err) {
        console.error('Error fetching pending games:', err);
        return [];
    }
}

// Add a game to the 'pending_games' table
export async function addPendingGameToDatabase(name: string, cracked: boolean, reason: string | null, platform: string): Promise<void> {
    try {
        await prisma.pendingGame.create({
            data: {
                name,
                cracked,
                reason,
                platform
            }
        });
    } catch (err) {
        console.error('Error adding pending game to database:', err);
    }
}

// Remove a game from the 'pending_games' table
export async function removePendingGameFromDatabase(name: string): Promise<void> {
    try {
        await prisma.pendingGame.delete({
            where: { name }
        });
    } catch (err) {
        console.error('Error removing pending game from database:', err);
    }
}

// Move a pending game to the main games list
export async function approvePendingGame(name: string): Promise<void> {
    try {
        const pendingGame = await fetchPendingGameByName(name);
        if (!pendingGame) throw new Error('Game not found in pending list');
        await prisma.$transaction([
            prisma.game.create({
                data: {
                    name: pendingGame.name,
                    cracked: pendingGame.cracked,
                    reason: pendingGame.reason,
                    platform: pendingGame.platform,
                }
            }),
            prisma.pendingGame.delete({
                where: { name }
            })
        ]);
    } catch (err) {
        console.error('Error approving pending game:', err);
    }
}

// Fetch a single pending game by name
export async function fetchPendingGameByName(name: string): Promise<any> {
    try {
        const pendingGame = await prisma.pendingGame.findUnique({
            where: { name }
        });
        return pendingGame;
    } catch (err) {
        console.error('Error fetching pending game by name:', err);
        return null;
    }
}
