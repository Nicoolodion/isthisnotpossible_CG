import { config } from 'dotenv';
import { EmbedBuilder } from 'discord.js';
import { fetchAllGames, fetchThreadInfo, setThreadInfo } from '../utils/fileUtils';

config();

let channel_id = process.env.channel_id;
let games: any[] = [];

// Constants
const MAX_DESCRIPTION_LENGTH = 4096; // Max length for a single embed description
const MAX_TOTAL_SIZE = 6000; // Max total size for all embeds combined
const MAX_EMBEDS = 10; // Maximum number of embeds per message

// Function to split long descriptions into multiple embeds
function splitEmbedDescription(description: string): EmbedBuilder[] {
    const embeds: EmbedBuilder[] = [];
    let currentDescription = '';
    let totalCharacters = 0;

    const lines = description.split('\n');

    for (const line of lines) {
        // Check if adding the new line exceeds the max length for the current embed
        if (currentDescription.length + line.length + 1 > MAX_DESCRIPTION_LENGTH) {
            // Push the current embed if it exceeds the max length
            embeds.push(new EmbedBuilder()
                .setTitle(`Game List ${embeds.length + 1}`)
                .setDescription(currentDescription)
                .setColor(0x0099ff)
                .setFooter({ text: `Last updated: ${new Date().toLocaleDateString()}` }) // Footer for pagination
            );
            currentDescription = ''; // Reset the current description for the next embed
        }



        // Add the current line to the description
        currentDescription = currentDescription ? `${currentDescription}\n${line}` : line;



        // Update the total character count
        totalCharacters += line.length + 1;

        // If total characters exceed the limit or we have enough embeds, stop
        if (totalCharacters >= MAX_TOTAL_SIZE || embeds.length >= MAX_EMBEDS - 1) {
            break;
        }
    }
    

    // Add the last embed if there's any remaining content
    if (currentDescription && embeds.length < MAX_EMBEDS) {
        embeds.push(new EmbedBuilder()
            .setTitle(`Game List ${embeds.length + 1}`)
            .setDescription(currentDescription)
            .setColor(0x0099ff)
            .setFooter({ text: `Last updated: ${new Date().toLocaleDateString()}` }) // Footer for pagination
        );
    }

    return embeds;
}

export async function createThread(client: any) {
    const channel = client.channels.cache.get(channel_id);
    let thread_info = await fetchThreadInfo();
    games = await fetchAllGames();

    // Build the game descriptions list
    const gameDescriptions = games.length
        ? games.map(game => game.reason ? `${game.name} - ${game.reason}` : game.name).join('\n')
        : 'No games';

    // Split descriptions into multiple embeds
    const embeds = splitEmbedDescription(gameDescriptions);

    if (!thread_info?.thread_id) {
        // Create a new thread
        channel.threads.create({
            name: 'Game List',
            reason: 'Creating a thread for game info and sending message...',
            message: {
                embeds: embeds
            }
        }).then((newThread: { id: string; firstMessage: { id: any; }; }) => {
            setThreadInfo(newThread.id, newThread.firstMessage?.id || '');
        });
    } else {
        const existingThread = await channel.threads.fetch(thread_info.thread_id).catch(() => null);
        if (existingThread) {
            // Edit the existing message in the thread
            const message = await existingThread.messages.fetch({ limit: 1 }).then((messages: { first: () => any; }) => messages.first());
            if (message) {
                await message.edit({ embeds: embeds });
            }
        } else {
            // If the thread is not found, create a new one
            const newThread = await channel.threads.create({
                name: 'Game List',
                reason: 'Creating a thread for game info and sending message...',
                message: {
                    embeds: embeds
                }
            });
            setThreadInfo(newThread.id, newThread.firstMessage?.id || '');
        }
    }
}
