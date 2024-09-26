import { config } from 'dotenv';
import { EmbedBuilder } from 'discord.js';
import { fetchAllGames, fetchThreadInfo, setThreadInfo } from '../utils/fileUtils';
import { loadGames } from './gameUtils';

config();

let channel_id = process.env.channel_id;
let games: any[] = [];

const MAX_DESCRIPTION_LENGTH = 4050; // Max length for a single embed description
const MAX_TOTAL_SIZE = 6000; // Max total size for all embeds combined
const MAX_EMBEDS = 10; // Maximum number of embeds per message
const EXTRA_MESSAGES = parseInt(process.env.EXTRA_MESSAGES || '1'); // Default to 1 if not provided
const REFRESH_INTERVAL = 1800000; // Auto-refresh thread every 30 minutes (adjust as needed)

const platformTitles = {
    Games: '🎮 Games',
    Software: '💻 Software',
    VR: '🕶 VR',
    Other: '🌀 Other',
};

const platformColors = {
    Games: 0x00FF00,   // Green for games
    Software: 0x0000FF, // Blue for software
    VR: 0x09dee6,      // blueish turkis
    Other: 0xFFA500,   // Orange for other
};

// Function to split long descriptions into multiple embeds
function splitEmbedDescription(title: string, description: string, platform: string): EmbedBuilder[] {
    const embeds: EmbedBuilder[] = [];
    let currentDescription = '';
    let totalCharacters = 0;

    const lines = description.split('\n');

    for (const line of lines) {
        const formattedLine = ` ${line.trim()}`;

        if (currentDescription.length + formattedLine.length + 1 > MAX_DESCRIPTION_LENGTH) {
            embeds.push(
                new EmbedBuilder()
                    .setTitle(`${title} - Part ${embeds.length + 1}`)
                    .setDescription(`${currentDescription}`)
                    .setColor(platformColors[platform as keyof typeof platformColors] || 0x0099ff) // Color customization
                    .setFooter({ text: `Last updated: ${new Date().toLocaleDateString()}` })
            );
            currentDescription = '';
            totalCharacters = 0;
        }

        currentDescription = currentDescription ? `${currentDescription}\n${formattedLine}` : formattedLine;
        totalCharacters += formattedLine.length + 1;

        if (totalCharacters >= MAX_TOTAL_SIZE || embeds.length >= MAX_EMBEDS - 1) {
            break;
        }
    }

    if (currentDescription && embeds.length < MAX_EMBEDS) {
        embeds.push(
            new EmbedBuilder()
                .setTitle(title)
                .setDescription(currentDescription)
                .setColor(platformColors[platform as keyof typeof platformColors] || 0x0099ff)
                .setFooter({ text: `Last updated: ${new Date().toLocaleDateString()}` })
        );
    }

    return embeds;
}

// Function to split embeds into multiple messages with a configurable number of extra messages
function splitEmbedsIntoMessages(embeds: EmbedBuilder[]): EmbedBuilder[][] {
    const messageEmbeds: EmbedBuilder[][] = [];
    let currentMessage: EmbedBuilder[] = [];
    let totalCharacters = 0;
    const maxMessages = EXTRA_MESSAGES + 1; // 1 for the main thread message

    for (const embed of embeds) {
        const embedLength = embed.data.description?.length || 0;

        if (totalCharacters + embedLength > MAX_TOTAL_SIZE || currentMessage.length >= MAX_EMBEDS) {
            if (messageEmbeds.length >= maxMessages) break; // Stop if max messages reached
            messageEmbeds.push(currentMessage);
            currentMessage = [];
            totalCharacters = 0;
        }

        currentMessage.push(embed);
        totalCharacters += embedLength;
    }

    if (currentMessage.length > 0 && messageEmbeds.length < maxMessages) {
        messageEmbeds.push(currentMessage);
    }

    return messageEmbeds;
}

// Auto-refresh functionality
function autoRefreshThread(client: any) {
    setInterval(async () => {
        await createThread(client);
    }, REFRESH_INTERVAL);
}

// Create or update a thread with embed messages
async function createThread(client: any) {
    const channel = client.channels.cache.get(channel_id);
    let thread_info = await fetchThreadInfo();
    const newGames = await loadGames();

    if (JSON.stringify(newGames) === JSON.stringify(games)) return;
    games = newGames;

    const platforms = ['Games', 'Software', 'VR', 'Other'];
    const platformEmbeds: EmbedBuilder[] = [];

    for (const platform of platforms) {
        const gamesForPlatform = games.filter(game => game.platform === platform || (!game.platform && platform === 'Games'));

        if (gamesForPlatform.length > 0) {
            const gameDescriptions = gamesForPlatform.map(game =>
                game.reason ? `**${game.name}**\n*Reason: ${game.reason}*` : `**${game.name}**`
            ).join('\n\n');

const platformEmbedDescription = splitEmbedDescription(platformTitles[platform as keyof typeof platformTitles], gameDescriptions, platform);
            platformEmbeds.push(...platformEmbedDescription);
        }
    }

    const messageEmbeds = splitEmbedsIntoMessages(platformEmbeds);

    if (!thread_info?.thread_id) {
        await createNewThread(channel, client, messageEmbeds);
    } else {
        await updateExistingThread(channel, client, thread_info, messageEmbeds);
    }
}

async function createNewThread(channel: any, client: any, messageEmbeds: EmbedBuilder[][]) {
    const newThread = await channel.threads.create({
        name: '❌ Not Crackable Stuff ❌',
        reason: 'Creating a thread for game info and sending message...',
        message: {
            embeds: messageEmbeds[0],
        },
        appliedTags: [process.env.TAG_INFO],
    });
    setThreadInfo(newThread.id, newThread.firstMessage?.id || '');

    for (let i = 1; i < messageEmbeds.length; i++) {
        await newThread.send({ embeds: messageEmbeds[i] });
    }

}

async function updateExistingThread(channel: any, client: any, thread_info: any, messageEmbeds: EmbedBuilder[][]) {
    const existingThread = await channel.threads.fetch(thread_info.thread_id).catch(() => null);
    
    if (existingThread) {
        const messages = await existingThread.messages.fetch({ limit: 100 }).then((msgs: any[]) =>
            msgs.filter((msg) => msg.author.id === client.user?.id).sort((a, b) => a.createdTimestamp - b.createdTimestamp)
        );

        for (let i = 0; i < messageEmbeds.length; i++) {
            const message = messages.at(i);
            if (message) {
                await message.edit({ embeds: messageEmbeds[i] });
            } else {
                await existingThread.send({ embeds: messageEmbeds[i] });
            }
        }

        for (let i = messageEmbeds.length; i < messages.size; i++) {
            await messages.at(i)?.delete();
        }
    } else {
        await createNewThread(channel, client, messageEmbeds);
    }
}

export { createThread, autoRefreshThread };
