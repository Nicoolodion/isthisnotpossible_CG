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
exports.createThread = void 0;
const dotenv_1 = require("dotenv");
const discord_js_1 = require("discord.js");
const fileUtils_1 = require("../utils/fileUtils");
(0, dotenv_1.config)();
let channel_id = process.env.channel_id;
let games = [];
// Constants
const MAX_DESCRIPTION_LENGTH = 4096; // Max length for a single embed description
const MAX_TOTAL_SIZE = 6000; // Max total size for all embeds combined
const MAX_EMBEDS = 10; // Maximum number of embeds per message
// Function to split long descriptions into multiple embeds
function splitEmbedDescription(description) {
    const embeds = [];
    let currentDescription = '';
    let totalCharacters = 0;
    const lines = description.split('\n');
    for (const line of lines) {
        // Check if adding the new line exceeds the max length for the current embed
        if (currentDescription.length + line.length + 1 > MAX_DESCRIPTION_LENGTH) {
            // Push the current embed if it exceeds the max length
            embeds.push(new discord_js_1.EmbedBuilder()
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
        embeds.push(new discord_js_1.EmbedBuilder()
            .setTitle(`Game List ${embeds.length + 1}`)
            .setDescription(currentDescription)
            .setColor(0x0099ff)
            .setFooter({ text: `Last updated: ${new Date().toLocaleDateString()}` }) // Footer for pagination
        );
    }
    return embeds;
}
function createThread(client) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const channel = client.channels.cache.get(channel_id);
        let thread_info = yield (0, fileUtils_1.fetchThreadInfo)();
        games = yield (0, fileUtils_1.fetchAllGames)();
        // Build the game descriptions list
        const gameDescriptions = games.length
            ? games.map(game => game.reason ? `${game.name} - ${game.reason}` : game.name).join('\n')
            : 'No games';
        // Split descriptions into multiple embeds
        const embeds = splitEmbedDescription(gameDescriptions);
        if (!(thread_info === null || thread_info === void 0 ? void 0 : thread_info.thread_id)) {
            // Create a new thread
            channel.threads.create({
                name: 'Game List',
                reason: 'Creating a thread for game info and sending message...',
                message: {
                    embeds: embeds
                }
            }).then((newThread) => {
                var _a;
                (0, fileUtils_1.setThreadInfo)(newThread.id, ((_a = newThread.firstMessage) === null || _a === void 0 ? void 0 : _a.id) || '');
            });
        }
        else {
            const existingThread = yield channel.threads.fetch(thread_info.thread_id).catch(() => null);
            if (existingThread) {
                // Edit the existing message in the thread
                const message = yield existingThread.messages.fetch({ limit: 1 }).then((messages) => messages.first());
                if (message) {
                    yield message.edit({ embeds: embeds });
                }
            }
            else {
                // If the thread is not found, create a new one
                const newThread = yield channel.threads.create({
                    name: 'Game List',
                    reason: 'Creating a thread for game info and sending message...',
                    message: {
                        embeds: embeds
                    }
                });
                (0, fileUtils_1.setThreadInfo)(newThread.id, ((_a = newThread.firstMessage) === null || _a === void 0 ? void 0 : _a.id) || '');
            }
        }
    });
}
exports.createThread = createThread;
