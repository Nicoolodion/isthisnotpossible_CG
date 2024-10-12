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
exports.autoRefreshThread = autoRefreshThread;
const dotenv_1 = require("dotenv");
const discord_js_1 = require("discord.js");
const fileUtils_1 = require("./fileUtils");
const gameUtils_1 = require("./gameUtils");
(0, dotenv_1.config)();
let channel_id = process.env.channel_id;
let games = [];
const MAX_DESCRIPTION_LENGTH = 4050; // Max length for a single embed description
const MAX_TOTAL_SIZE = 6000; // Max total size for all embeds combined
const MAX_EMBEDS = 10; // Maximum number of embeds per message
const EXTRA_MESSAGES = parseInt(process.env.EXTRA_MESSAGES || '1'); // Default to 1 if not provided
const REFRESH_INTERVAL = 1800000; // Auto-refresh thread every 30 minutes (adjust as needed)
//const REFRESH_INTERVAL = 3000; // Auto-refresh thread every 1 minute (adjust as needed)
const platformTitles = {
    Games: '🎮 Games',
    Software: '💻 Software',
    VR: '🕶 VR',
    Other: '🌀 Other',
};
const platformColors = {
    Games: 0x00FF00, // Green for games
    Software: 0x0000FF, // Blue for software
    VR: 0x09dee6, // blueish turkis
    Other: 0xFFA500, // Orange for other
};
// Function to split long descriptions into multiple embeds
function splitEmbedDescription(title, description, platform) {
    const embeds = [];
    let currentDescription = '';
    let totalCharacters = 0;
    const lines = description.split('\n');
    for (const line of lines) {
        const formattedLine = ` ${line.trim()}`;
        if (currentDescription.length + formattedLine.length + 1 > MAX_DESCRIPTION_LENGTH) {
            embeds.push(new discord_js_1.EmbedBuilder()
                .setTitle(`${title} - Part ${embeds.length + 1}`)
                .setDescription(`${currentDescription}`)
                .setColor(platformColors[platform] || 0x0099ff) // Color customization
                .setFooter({ text: `Last updated: ${new Date().toLocaleDateString().replace(/\./g, '/')} ` }));
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
        embeds.push(new discord_js_1.EmbedBuilder()
            .setTitle(title)
            .setDescription(currentDescription)
            .setColor(platformColors[platform] || 0x0099ff)
            .setFooter({ text: `Last updated: ${new Date().toLocaleDateString().replace(/\./g, '/')} ` }));
    }
    return embeds;
}
// Function to split embeds into multiple messages with a configurable number of extra messages
function splitEmbedsIntoMessages(embeds) {
    var _a;
    const messageEmbeds = [];
    let currentMessage = [];
    let totalCharacters = 0;
    const maxMessages = EXTRA_MESSAGES + 1; // 1 for the main thread message
    for (const embed of embeds) {
        const embedLength = ((_a = embed.data.description) === null || _a === void 0 ? void 0 : _a.length) || 0;
        if (totalCharacters + embedLength > MAX_TOTAL_SIZE || currentMessage.length >= MAX_EMBEDS) {
            if (messageEmbeds.length >= maxMessages)
                break; // Stop if max messages reached
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
function autoRefreshThread(client) {
    setInterval(() => __awaiter(this, void 0, void 0, function* () {
        yield createThread(client);
    }), REFRESH_INTERVAL);
}
// Create or update a thread with embed messages
function createThread(client) {
    return __awaiter(this, void 0, void 0, function* () {
        const channel = client.channels.cache.get(channel_id);
        let thread_info = yield (0, fileUtils_1.fetchThreadInfo)();
        const newGames = yield (0, gameUtils_1.loadGames)();
        if (JSON.stringify(newGames) === JSON.stringify(games))
            return;
        games = newGames;
        const platforms = ['Games', 'Software', 'VR', 'Other'];
        const platformEmbeds = [];
        for (const platform of platforms) {
            const gamesForPlatform = games.filter(game => game.platform === platform || (!game.platform && platform === 'Games'));
            if (gamesForPlatform.length > 0) {
                const gameDescriptions = gamesForPlatform.map(game => game.reason ? `**${game.name}**\n*Reason: ${game.reason}*` : `**${game.name}**`).join('\n\n');
                const platformEmbedDescription = splitEmbedDescription(platformTitles[platform], gameDescriptions, platform);
                platformEmbeds.push(...platformEmbedDescription);
            }
        }
        const messageEmbeds = splitEmbedsIntoMessages(platformEmbeds);
        if (!(thread_info === null || thread_info === void 0 ? void 0 : thread_info.thread_id)) {
            yield createNewThread(channel, client, messageEmbeds);
        }
        else {
            yield updateExistingThread(channel, client, thread_info, messageEmbeds);
        }
    });
}
function createNewThread(channel, client, messageEmbeds) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const newThread = yield channel.threads.create({
            name: '❌ Not Crackable Stuff ❌',
            reason: 'Creating a thread for game info and sending message...',
            message: {
                embeds: messageEmbeds[0],
            },
            appliedTags: [process.env.TAG_INFO],
        });
        (0, fileUtils_1.setThreadInfo)(newThread.id, ((_a = newThread.firstMessage) === null || _a === void 0 ? void 0 : _a.id) || '');
        for (let i = 1; i < messageEmbeds.length; i++) {
            yield newThread.send({ embeds: messageEmbeds[i] });
        }
    });
}
function updateExistingThread(channel, client, thread_info, messageEmbeds) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const existingThread = yield channel.threads.fetch(thread_info.thread_id).catch(() => null);
        if (existingThread) {
            const messages = yield existingThread.messages.fetch({ limit: 100 }).then((msgs) => msgs.filter((msg) => { var _a; return msg.author.id === ((_a = client.user) === null || _a === void 0 ? void 0 : _a.id); }).sort((a, b) => a.createdTimestamp - b.createdTimestamp));
            for (let i = 0; i < messageEmbeds.length; i++) {
                const message = messages.at(i);
                if (message) {
                    yield message.edit({ embeds: messageEmbeds[i] });
                }
                else {
                    yield existingThread.send({ embeds: messageEmbeds[i] });
                }
            }
            for (let i = messageEmbeds.length; i < messages.size; i++) {
                yield ((_a = messages.at(i)) === null || _a === void 0 ? void 0 : _a.delete());
            }
        }
        else {
            yield createNewThread(channel, client, messageEmbeds);
        }
    });
}
