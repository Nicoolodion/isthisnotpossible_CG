"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createThread = createThread;
const dotenv_1 = require("dotenv");
const discord_js_1 = require("discord.js");
const fileUtils_1 = require("../utils/fileUtils");
(0, dotenv_1.config)();
let channel_id = process.env.channel_id;
let games = [];
//TODO: If it has no id stored in the db and no thread it only shows part 2 as the thread message
//TODO: Make it failsafe?
//TODO: Make UI Better
//TODO: Look into weird sorting
// Constants
const MAX_DESCRIPTION_LENGTH = 4050; // Max length for a single embed description
const MAX_TOTAL_SIZE = 6000; // Max total size for all embeds combined
const MAX_EMBEDS = 10; // Maximum number of embeds per message
// Function to split long descriptions into multiple embeds
function splitEmbedDescription(description) {
    const embeds = [];
    let currentDescription = '';
    let totalCharacters = 0;
    let characterCount = 0; // Add a character counter
    const lines = description.split('\n');
    for (const line of lines) {
        const formattedLine = ` ${line.trim()}`;
        // Check if adding the new line exceeds the max length for the current embed
        if (currentDescription.length + formattedLine.length + 1 > MAX_DESCRIPTION_LENGTH) {
            // Push the current embed if it exceeds the max length
            embeds.push(new discord_js_1.EmbedBuilder()
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
        embeds.push(new discord_js_1.EmbedBuilder()
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
function splitEmbedsIntoMessages(embeds) {
    var _a;
    let firstMessageEmbeds = [];
    let secondMessageEmbeds = [];
    let totalCharacters = 0;
    console.log(embeds.length);
    for (const embed of embeds) {
        const embedLength = ((_a = embed.data.description) === null || _a === void 0 ? void 0 : _a.length) || 0;
        console.log(totalCharacters);
        console.log(embedLength);
        console.log(totalCharacters + embedLength);
        if (totalCharacters + embedLength > MAX_TOTAL_SIZE) {
            console.log('2_I did my JOB!111111111111111111111111111111111111111111');
            secondMessageEmbeds.push(embed); // Move the remaining embeds to the second message
            totalCharacters += embedLength;
        }
        else {
            console.log('1_I did ALSO DID my JOB!111111111111111111111111111111111111111111');
            firstMessageEmbeds.push(embed);
            totalCharacters += embedLength;
        }
    }
    return { firstMessageEmbeds, secondMessageEmbeds };
}
function createThread(client) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const channel = client.channels.cache.get(channel_id);
        let thread_info = yield (0, fileUtils_1.fetchThreadInfo)();
        const newGames = yield (0, fileUtils_1.fetchAllGames)();
        if (JSON.stringify(newGames) === JSON.stringify(games))
            return;
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
        if (!(thread_info === null || thread_info === void 0 ? void 0 : thread_info.thread_id)) {
            // Create a new thread
            const newThread = yield channel.threads.create({
                name: '❌Not Crackable Stuff❌',
                reason: 'Creating a thread for game info and sending message...',
                message: {
                    embeds: firstMessageEmbeds
                }
            });
            // Store the thread ID and first message ID
            (0, fileUtils_1.setThreadInfo)(newThread.id, ((_a = newThread.firstMessage) === null || _a === void 0 ? void 0 : _a.id) || '');
            // If there are more embeds for a second message, send it
            if (secondMessageEmbeds.length > 0) {
                console.log("neMessage" + newThread.id);
                yield newThread.send({ embeds: secondMessageEmbeds });
            }
        }
        else {
            const existingThread = yield channel.threads.fetch(thread_info.thread_id).catch(() => null);
            if (existingThread) {
                // Edit the existing message in the thread
                const message = yield existingThread.messages.fetch({ limit: 100 }).then((messages) => {
                    const newestBotMessage = messages.filter((msg) => { var _a; return msg.author.id === ((_a = client.user) === null || _a === void 0 ? void 0 : _a.id); }).sort((b, a) => b.createdTimestamp - a.createdTimestamp).first();
                    return newestBotMessage;
                });
                if (message) {
                    yield message.edit({ embeds: firstMessageEmbeds });
                }
                // If there's a second message needed, either edit or create a new message
                if (secondMessageEmbeds.length > 0) {
                    const secondMessage = yield existingThread.messages.fetch({ limit: 100 }).then((messages) => {
                        const newestBotMessage = messages.filter((msg) => { var _a; return msg.author.id === ((_a = client.user) === null || _a === void 0 ? void 0 : _a.id); }).sort((a, b) => b.createdTimestamp - a.createdTimestamp).first();
                        return newestBotMessage;
                    });
                    if (secondMessage) {
                        console.log('1');
                        console.log(secondMessage.id);
                        yield secondMessage.edit({ embeds: secondMessageEmbeds });
                    }
                    else {
                        yield existingThread.send({ embeds: secondMessageEmbeds });
                    }
                }
            }
            else {
                // If the thread is not found, create a new one
                const newThread = yield channel.threads.create({
                    name: '❌Not Crackable Stuff❌',
                    reason: 'Creating a thread for game info and sending message...',
                    message: {
                        embeds: firstMessageEmbeds
                    }
                });
                (0, fileUtils_1.setThreadInfo)(newThread.id, ((_b = newThread.firstMessage) === null || _b === void 0 ? void 0 : _b.id) || '');
                // If there are more embeds for a second message, send it
                if (secondMessageEmbeds.length > 0) {
                    console.log("neMessage" + newThread.id);
                    yield newThread.send({ embeds: secondMessageEmbeds });
                }
            }
        }
    });
}
