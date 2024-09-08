import { CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support'; // Support for cookies
import { CookieJar } from 'tough-cookie'; // Cookie jar for managing cookies
import * as cheerio from 'cheerio';
import { addPendingGameToDatabase } from '../utils/fileUtils'; // Import the function to add games to database
import { searchGamesExact } from '../utils/gameUtils'; // Import the function to search games in the database
import puppeteer from 'puppeteer';

// Keywords to search for on the Steam page (add more as needed)
const keywords = ['Denuvo', 'Requires 3rd-Party Account'];

// Function to check the Steam page
async function checkSteamPage(url: string): Promise<{ isClean: boolean; reason: string | null; gameName: string }> {
    try {
        // Create a cookie jar to handle cookies
        const cookieJar = new CookieJar();

        // Wrap axios to support cookies with the jar
        const client = wrapper(axios.create({ jar: cookieJar }));

        // Add User-Agent to mimic a real browser request
        const response = await client.get(url, {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
            },
        });

        // Load the page content with cheerio
        const $ = cheerio.load(response.data);

        const gameName = $('#appHubAppName').text().trim(); // Adjust selector if needed

        // Target specific sections of the Steam page
        const drmNotice = $('.DRM_notice').text(); // DRM notice section (if available)
        const fullContent = [drmNotice].join(' ');

        // Convert page content to lowercase for case-insensitive comparison
        const pageContent = fullContent.toLowerCase();

        // Determine if any keywords are found
        for (const keyword of keywords) {
            if (pageContent.includes(keyword.toLowerCase())) {
                return { gameName, isClean: false, reason: keyword };
            }
        }

        return { gameName, isClean: true, reason: null };
    } catch (error: any) {
        console.error('Error fetching Steam page:', error.message);
        return { gameName: 'Error Fetching game', isClean: false, reason: 'Error fetching page' }; // Default to false in case of an error
    }
}

// Helper function to construct a Steam URL from an App ID
function buildSteamUrl(appId: string): string {
    return `https://store.steampowered.com/app/${appId}`;
}

export async function execute(interaction: CommandInteraction) {
    const input = interaction.options.get('name')?.value as string;

    if (input) {
        await interaction.deferReply({ ephemeral: true }); // Defer the initial reply, only visible to the user

        // Determine if the input is a URL or a Steam App ID
        let url: string;

        if (input.startsWith('http')) {
            // If input starts with 'http', treat it as a URL
            url = input;
        } else {
            // Otherwise, assume it's a Steam App ID and build the URL
            url = buildSteamUrl(input);
        }

        const { isClean, reason, gameName } = await checkSteamPage(url);

        if (gameName) {
            // Search the database for the game
            const existingGames = await searchGamesExact(gameName);

            if (existingGames.length === 0) {
                // Create embed response
                const embed = new EmbedBuilder()
                    .setColor(isClean ? '#00FF00' : '#FF0000')
                    .setTitle(isClean ? 'Game is Crackable' : 'Game Contains DRM')
                    .setDescription(`Checked URL: ${url}`)
                    .addFields(
                        { name: 'Game Name', value: gameName || 'Unknown' },
                        { name: 'Result', value: isClean ? 'This game does not contain known DRM protections and might be crackable.' : 'This game contains DRM (e.g., Denuvo) and is not crackable.' },
                        { name: 'Reason', value: reason || 'Unknown' }
                    )
                    .setTimestamp();

                // Send response
                await interaction.followUp({ embeds: [embed], ephemeral: true });

                // Add to pending games list
                try {
                    // If clean, set `cracked` to true and no reason
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
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('Error')
            .setDescription('Please provide a valid Steam store URL or App ID.')
            .setTimestamp();

        await interaction.followUp({ embeds: [embed], ephemeral: true });
    }
}
