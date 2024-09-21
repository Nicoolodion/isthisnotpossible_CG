import { config } from 'dotenv';
import { EmbedBuilder } from 'discord.js';
import { fetchAllGames, fetchThreadInfo, setThreadInfo } from '../utils/fileUtils';

config();

let channel_id = process.env.channel_id;
let games: any[] = [];


//TODO: Make UI Better
//TODO: Set Up VPN on rasbperry to host it
//TODO: Add multiple messages / Optimize the current


//TODO: Let the other Bot sort this list somehow. Search Steam for game
//TODO: Make it failsafe?       Should be?
//TODO: think about using "better-sqlite3"



const MAX_DESCRIPTION_LENGTH = 4050; // Max length for a single embed description
const MAX_TOTAL_SIZE = 6000; // Max total size for all embeds combined
const MAX_EMBEDS = 10; // Maximum number of embeds per message


const platformTitles = {
    Games: '🎮 Games',
    Software: '💻 Software',
    VR: ':eyeglasses:  VR',
    Other: '🌀 Other',
};

// Function to split long descriptions into multiple embeds
function splitEmbedDescription(title: string, description: string): EmbedBuilder[] {
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
                    .setColor(0x0099ff)
                    .setFooter({ text: `Last updated: ${new Date().toLocaleDateString()}` })
                    //.setFooter({ text: `----------------------------------------\nLast updated: ${new Date().toLocaleDateString()}` }) // Footer for pagination
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
                .setTitle(`${title} - Part ${embeds.length + 1}`)
                .setDescription(currentDescription)
                .setColor(0x0099ff)
                .setFooter({ text: `Last updated: ${new Date().toLocaleDateString()}` })
                //.setFooter({ text: `----------------------------------------\nLast updated: ${new Date().toLocaleDateString()}` }) // Footer for pagination
        );
    }

    return embeds;
}

// Function to split embeds into two messages if the total character count exceeds 6000
function splitEmbedsIntoMessages(embeds: EmbedBuilder[]): EmbedBuilder[][] {
    const messageEmbeds: EmbedBuilder[][] = [];
    let currentMessage: EmbedBuilder[] = [];
    let totalCharacters = 0;

    for (const embed of embeds) {
        const embedLength = embed.data.description?.length || 0;

        if (totalCharacters + embedLength > MAX_TOTAL_SIZE || currentMessage.length >= MAX_EMBEDS) {
            messageEmbeds.push(currentMessage);
            currentMessage = [];
            totalCharacters = 0;
        }

        currentMessage.push(embed);
        totalCharacters += embedLength;
    }

    if (currentMessage.length > 0) {
        messageEmbeds.push(currentMessage);
    }

    return messageEmbeds;
}



export async function createThread(client: any) {
    const channel = client.channels.cache.get(channel_id);
    let thread_info = await fetchThreadInfo();
    const newGames = await fetchAllGames();
    if (JSON.stringify(newGames) === JSON.stringify(games)) return;

    games = newGames;

    const platforms = ['Games', 'Software', 'VR', 'Other'];
    const platformEmbeds: EmbedBuilder[] = [];

    // Build embeds for each platform
    for (const platform of platforms) {
        const gamesForPlatform = games.filter(game => game.platform === platform || (!game.platform && platform === 'Games'));

        if (gamesForPlatform.length > 0) {
            const gameDescriptions = gamesForPlatform.map(game =>
                game.reason ? `**${game.name}**\n*Reason: ${game.reason}*` : `**${game.name}**`
            ).join('\n\n');

            const platformEmbedDescription = splitEmbedDescription((platformTitles as {[key: string]: string})[platform], gameDescriptions);
            platformEmbeds.push(...platformEmbedDescription);
        }
    }

    // Split platform embeds across multiple messages
    const messageEmbeds = splitEmbedsIntoMessages(platformEmbeds);

    if (!thread_info?.thread_id) {
        // Create a new thread and send the first message with the initial embeds
        const newThread = await channel.threads.create({
            name: '❌ Not Crackable Stuff ❌',
            reason: 'Creating a thread for game info and sending message...',
            message: {
                embeds: messageEmbeds[0]
            }
        });

        setThreadInfo(newThread.id, newThread.firstMessage?.id || '');

        // Send additional messages if there are more embeds
        for (let i = 1; i < messageEmbeds.length; i++) {
            await newThread.send({ embeds: messageEmbeds[i] });
        }

    } else {
        const existingThread = await channel.threads.fetch(thread_info.thread_id).catch(() => null);
        if (existingThread) {
            // Fetch all bot messages from the thread and edit them
            const messages = await existingThread.messages.fetch({ limit: 100 }).then((msgs: any[]) =>
                msgs.filter((msg) => msg.author.id === client.user?.id).sort((a, b) => a.createdTimestamp - b.createdTimestamp)
            );

            // Edit existing messages and create new ones if necessary
            for (let i = 0; i < messageEmbeds.length; i++) {
                const message = messages.at(i);
                if (message) {
                    await message.edit({ embeds: messageEmbeds[i] });
                } else {
                    await existingThread.send({ embeds: messageEmbeds[i] });
                }
            }

            // Delete any extra messages that are no longer needed
            for (let i = messageEmbeds.length; i < messages.size; i++) {
                await messages.at(i)?.delete();
            }

        } else {
            // If the thread is not found, create a new one
            const newThread = await channel.threads.create({
                name: '❌ Not Crackable Stuff ❌',
                reason: 'Creating a thread for game info and sending message...',
                message: {
                    embeds: messageEmbeds[0]
                }
            });
            setThreadInfo(newThread.id, newThread.firstMessage?.id || '');

            // Send any remaining messages
            for (let i = 1; i < messageEmbeds.length; i++) {
                await newThread.send({ embeds: messageEmbeds[i] });
            }
        }
    }
}