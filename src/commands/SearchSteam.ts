import { config } from 'dotenv';
import { CommandInteraction, EmbedBuilder } from 'discord.js';
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';
import { addPendingGameToDatabase, fetchAllPendingGames, approvePendingGame } from '../utils/fileUtils';
import { searchGamesExact } from '../utils/gameUtils';
import { checkPermissions } from '../utils/permissions';

config();

// Keywords to search for on the Steam page
const keywords = ['Denuvo', 'Activision Account', 'Warframe Account', 'background use required', 'EA online activation'];

// Multiplayer-related and exception keywords
const multiplayerKeywords = ['Multiplayer-only', 'Online-only', 'Requires constant internet connection'];
const gameExceptions = ['Fortnite', 'Apex Legends', 'Hogwarts Legacy']; // Add any special case games here

// Function to check the Steam page
async function checkSteamPage(url: string): Promise<{ isClean: boolean; reason: string | null; gameName: string }> {

    try {
        const cookieJar = new CookieJar();
        const client = wrapper(axios.create({ jar: cookieJar }));
        const response = await client.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
            },
        });

        const $ = cheerio.load(response.data);
        const gameName = $('#appHubAppName').text().trim();
        const drmNotice = $('.DRM_notice').text();
        const pageContent = drmNotice.toLowerCase();

        // Handle known exceptions
        if (gameExceptions.includes(gameName)) {
            return { gameName, isClean: false, reason: 'Known exception: ' + gameName };
        }

        // Handle multiplayer/online-only games
        for (const multiplayerKeyword of multiplayerKeywords) {
            if (pageContent.includes(multiplayerKeyword.toLowerCase())) {
                return { gameName, isClean: false, reason: 'Multiplayer/Online-only' };
            }
        }

        // Handle regular DRM checks
        for (const keyword of keywords) {
            if (pageContent.includes(keyword.toLowerCase())) {
                return { gameName, isClean: false, reason: keyword };
            }
        }

        return { gameName, isClean: true, reason: null };
    } catch (error: any) {
        console.error('Error fetching Steam page:', error.message);
        return { gameName: 'Error Fetching game', isClean: false, reason: 'Error fetching page' };
    }
}

// Helper function to construct a Steam URL from an App ID
function buildSteamUrl(appId: string): string {
    return `https://store.steampowered.com/app/${appId}`;
}

// Function to refresh game statuses in the database
async function refreshPendingGameStatuses() {
    const pendingGames = await fetchAllPendingGames();

    for (const pendingGame of pendingGames) {
        const url = buildSteamUrl(pendingGame.id);
        const { isClean, reason, gameName } = await checkSteamPage(url);

        if (gameName && gameName !== 'Error Fetching game') {
            if (pendingGame.cracked !== isClean) {
                await approvePendingGame(gameName); // Update status
            }
        }
    }
}

// Function to get top games from Steam
async function getTopSteamGames(): Promise<string[]> {
    const gameLinks: string[] = [];

    try {
        let currentPage = 1;
        let totalGamesFetched = 0;
        const gamesPerPage = 50;
        const maxGames = 50;

        while (totalGamesFetched < maxGames) {
            const response = await axios.get(`https://store.steampowered.com/search/?filter=topsellers&page=${currentPage}`);
            const $ = cheerio.load(response.data);

            $('.search_result_row').each((i, element) => {
                const link = $(element).attr('href');
                if (link && gameLinks.length < maxGames) {
                    gameLinks.push(link);
                }
            });

            totalGamesFetched = gameLinks.length;
            currentPage++;

            // If no more results are found, break the loop
            if ($('.search_result_row').length === 0) {
                break;
            }
        }

        console.log('getTopSteamGames: Found', gameLinks.length, 'games on Steam.');
        return gameLinks;
    } catch (error: any) {
        console.error('Error fetching top Steam games:', error.message);
        return [];
    }
}

export async function execute(interaction: CommandInteraction) {
    const userRoles = interaction.member?.roles as any;
    const { adminUserId } = require('../data/permissions.json');
    const overrides = require('../data/permissions.json').overrides['review-games'];
    const allowedUserIds = overrides.allow;
    const disabledUserIds = overrides.deny;

    if (disabledUserIds.includes(interaction.user.id) || (!checkPermissions(userRoles, process.env.admin ?? '') && !checkPermissions(userRoles, process.env.uploader ?? '') && interaction.user.id !== adminUserId && !allowedUserIds.includes(interaction.user.id))) {
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription('You don\'t have permission to use this command.');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }

    const input = interaction.options.get('name')?.value as string;
    await interaction.deferReply({ ephemeral: true });

    if (input) {
        // Process the provided game URL or ID
        let url: string;

        if (input.startsWith('http')) {
            url = input;
        } else {
            url = buildSteamUrl(input);
        }

        const { isClean, reason, gameName } = await checkSteamPage(url);

        if (gameName) {
            const existingGames = await searchGamesExact(gameName);

            if (existingGames.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(isClean ? '#00FF00' : '#FF0000')
                    .setTitle(isClean ? 'Game is Crackable ✅' : 'Game Contains DRM 🚫')
                    .setDescription(`Checked URL: ${url}`)
                    .addFields(
                        { name: 'Game Name', value: gameName || 'Unknown' },
                        { name: 'Result', value: isClean ? 'This game does not contain known DRM protections and might be crackable.' : 'This game contains DRM (e.g., Denuvo) or is multiplayer/online-only and is not crackable.' },
                        { name: 'Reason', value: reason || 'Unknown' }
                    )
                    .setTimestamp();

                await interaction.followUp({ embeds: [embed], ephemeral: true });

                try {
                    await addPendingGameToDatabase(gameName, isClean, isClean ? null : reason);
                } catch (err) {
                    console.error('Error adding game to pending list:', err);
                }
            } else {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Game Already Exists')
                    .setDescription(`The game **"${gameName}"** is already in the database.`)
                    .setTimestamp();

                await interaction.followUp({ embeds: [embed], ephemeral: true });
            }
        } else {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('No game information found')
                .setDescription('No game information could be found for the provided URL or App ID.')
                .setTimestamp();

            await interaction.followUp({ embeds: [embed], ephemeral: true });
        }
    } else {
        // No game URL or ID provided, search top games
        const topGameLinks = await getTopSteamGames();

        if (topGameLinks.length > 0) {
            const games = topGameLinks.map(url => checkSteamPage(url));
            const results = await Promise.all(games);

            let processedCount = 0;
            const totalGames = results.length;

            for (const { isClean, reason, gameName } of results) {
                if (gameName) {
                    const existingGames = await searchGamesExact(gameName);

                    if (existingGames.length === 0) {
                        try {
                            await addPendingGameToDatabase(gameName, isClean, isClean ? null : reason);
                        } catch (err) {
                            console.error('Error adding game to pending list:', err);
                        }
                    }
                }

                processedCount++;
                if (processedCount % 10 === 0) {
                    // Send progress update every 10 games
                    const progressEmbed = new EmbedBuilder()
                        .setColor('#0099ff')
                        .setDescription(`Processed ${processedCount}/${totalGames} games...`);
                    if (!interaction.deferred) {
                        await interaction.deferReply({ ephemeral: true });
                    }

                    interaction.editReply({ embeds: [progressEmbed] });
                }
            }

            const finalEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setDescription(`Finished processing ${totalGames} games.`)
                .setTimestamp();

            await interaction.editReply({ embeds: [finalEmbed]});
        }
    }
}

