import { config } from 'dotenv';
import { EmbedBuilder } from 'discord.js';
import { fetchAllGames, fetchThreadInfo, setThreadInfo } from '../utils/fileUtils';

config();

let channel_id = process.env.channel_id;
let games: any[] = [];

//TODO: If it has no id stored in the db and no thread it only shows part 2 as the thread message -- NOT a Huge Problem
//TODO: Make it failsafe?
//TODO: Make UI Better
//TODO: Set Up VPN on rasbperry to host it

// Constants
const MAX_DESCRIPTION_LENGTH = 4050; // Max length for a single embed description
const MAX_TOTAL_SIZE = 6000; // Max total size for all embeds combined
const MAX_EMBEDS = 10; // Maximum number of embeds per message

// Function to split long descriptions into multiple embeds
function splitEmbedDescription(description: string): EmbedBuilder[] {
    const embeds: EmbedBuilder[] = [];
    let currentDescription = '';
    let totalCharacters = 0;
    let characterCount = 0; // Add a character counter
  
    const lines = description.split('\n');
  
    for (const line of lines) {
      const formattedLine = ` ${line.trim()}`;
  
      // Check if adding the new line exceeds the max length for the current embed
      if (currentDescription.length + formattedLine.length + 1 > MAX_DESCRIPTION_LENGTH) {
        // Push the current embed if it exceeds the max length
        embeds.push(
          new EmbedBuilder()
            .setTitle(`Uncrackable Games - Part ${embeds.length + 1}`)
            .setDescription(`${currentDescription}`)
            .setColor(0x0099ff)
            .setFooter({ text: `----------------------------------------\nLast updated: ${new Date().toLocaleDateString()}` }) // Footer for pagination
        );
        currentDescription = ''; // Reset the current description for the next embed
        totalCharacters = 0;
      }

      // Add the current line to the description
      currentDescription = currentDescription ? `${currentDescription}\n${formattedLine}` : formattedLine;

  
      // Update the total character count and character count
      totalCharacters += formattedLine.length + 1;
      characterCount += formattedLine.length;
  
      // If total characters exceed the limit or we have enough embeds, stop
      if (totalCharacters >= MAX_TOTAL_SIZE || embeds.length >= MAX_EMBEDS - 1) {
        break;
      }

    }


    // Add the last embed if there's any remaining content
    if (currentDescription && embeds.length < MAX_EMBEDS) {
        embeds.push(new EmbedBuilder()
            .setTitle(`Uncrackable Games - Part ${embeds.length + 1}`)
            .setDescription(currentDescription)
            .setColor(0x0099ff)
            .setFooter({ text: `----------------------------------------\nLast updated: ${new Date().toLocaleDateString()}` }) // Footer for pagination
        );
    }
        // Log the character count at the end
        console.log(`Total characters: ${characterCount}`);
        console.log(`Total embeds: ${embeds.length}`);

    return embeds;
}

// Function to split embeds into two messages if the total character count exceeds 6000
function splitEmbedsIntoMessages(embeds: EmbedBuilder[]): { firstMessageEmbeds: EmbedBuilder[], secondMessageEmbeds: EmbedBuilder[] } {
    let firstMessageEmbeds: EmbedBuilder[] = [];
    let secondMessageEmbeds: EmbedBuilder[] = [];
    let totalCharacters = 0;
    console.log(embeds.length);
    for (const embed of embeds) {
        const embedLength = embed.data.description?.length || 0;
        console.log(totalCharacters);
        console.log(embedLength);
        console.log(totalCharacters + embedLength);
        if (totalCharacters + embedLength > MAX_TOTAL_SIZE) {
            console.log('2_I did my JOB!111111111111111111111111111111111111111111')
            secondMessageEmbeds.push(embed); // Move the remaining embeds to the second message
            totalCharacters += embedLength;
        } else {
            console.log('1_I did ALSO DID my JOB!111111111111111111111111111111111111111111')
            firstMessageEmbeds.push(embed);
            totalCharacters += embedLength;
        }
    }



    return { firstMessageEmbeds, secondMessageEmbeds };
}

export async function createThread(client: any) {
    const channel = client.channels.cache.get(channel_id);
    let thread_info = await fetchThreadInfo();
    const newGames = await fetchAllGames();
    if (JSON.stringify(newGames) === JSON.stringify(games))return;

    games = newGames;

    // Build the game descriptions list with better formatting
    const gameDescriptions = games.length
        ? games.map(game => game.reason 
            ? `**${game.name}**\n*Reason: ${game.reason}*` 
            : `**${game.name}**`).join('\n\n') // Proper spacing between games
        : 'No games available';

    // Split descriptions into multiple embeds
    const embeds = splitEmbedDescription(gameDescriptions);

    // Split into two messages if necessary

    const { firstMessageEmbeds, secondMessageEmbeds } = splitEmbedsIntoMessages(embeds);

    if (!thread_info?.thread_id) {
        // Create a new thread
        const newThread = await channel.threads.create({
            name: '❌Not Crackable Stuff❌',
            reason: 'Creating a thread for game info and sending message...',
            message: {
                embeds: firstMessageEmbeds
            }
        });


        // Store the thread ID and first message ID
        setThreadInfo(newThread.id, newThread.firstMessage?.id || '');

        // If there are more embeds for a second message, send it
        if (secondMessageEmbeds.length > 0) {
            console.log("neMessage" + newThread.id)
            await newThread.send({ embeds: secondMessageEmbeds });
        }
    } else {
        const existingThread = await channel.threads.fetch(thread_info.thread_id).catch(() => null);
        if (existingThread) {
            // Edit the existing message in the thread
            const message = await existingThread.messages.fetch({ limit: 100 }).then((messages: { filter: (arg0: (msg: any) => boolean) => { (): any; new(): any; sort: { (arg0: (a: any, b: any) => number): { (): any; new(): any; first: { (): any; new(): any; }; }; new(): any; }; }; }) => {
                const newestBotMessage = messages.filter((msg) => msg.author.id === client.user?.id).sort((b, a) => b.createdTimestamp - a.createdTimestamp).first();
                return newestBotMessage;
            });
            if (message) {
                await message.edit({ embeds: firstMessageEmbeds });
            }
            
            // If there's a second message needed, either edit or create a new message
            if (secondMessageEmbeds.length > 0) {
                const secondMessage = await existingThread.messages.fetch({ limit: 100 }).then((messages: { filter: (arg0: (msg: any) => boolean) => { (): any; new(): any; sort: { (arg0: (a: any, b: any) => number): { (): any; new(): any; first: { (): any; new(): any; }; }; new(): any; }; }; }) => {
                    const newestBotMessage = messages.filter((msg) => msg.author.id === client.user?.id).sort((a, b) => b.createdTimestamp - a.createdTimestamp).first();
                    return newestBotMessage;
                });
                if (secondMessage) {
                    console.log('1')
                    console.log(secondMessage.id)
                    await secondMessage.edit({ embeds: secondMessageEmbeds });
                } else {
                    await existingThread.send({ embeds: secondMessageEmbeds });
                }
            }
        } else {
            // If the thread is not found, create a new one
            const newThread = await channel.threads.create({
                name: '❌Not Crackable Stuff❌',
                reason: 'Creating a thread for game info and sending message...',
                message: {
                    embeds: firstMessageEmbeds
                }
            });
            setThreadInfo(newThread.id, newThread.firstMessage?.id || '');

            // If there are more embeds for a second message, send it
            if (secondMessageEmbeds.length > 0) {
                console.log("neMessage" + newThread.id)
                await newThread.send({ embeds: secondMessageEmbeds });
            }
        }
    }
}
