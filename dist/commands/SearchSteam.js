"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = void 0;
const discord_js_1 = require("discord.js");
const axios_1 = __importDefault(require("axios"));
const axios_cookiejar_support_1 = require("axios-cookiejar-support"); // Support for cookies
const tough_cookie_1 = require("tough-cookie"); // Cookie jar for managing cookies
const cheerio = __importStar(require("cheerio"));
const fileUtils_1 = require("../utils/fileUtils"); // Import the function to add games to database
const gameUtils_1 = require("../utils/gameUtils"); // Import the function to search games in the database
// Keywords to search for on the Steam page (add more as needed)
const keywords = ['Denuvo', 'Requires 3rd-Party Account'];
// Function to check the Steam page
function checkSteamPage(url) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Create a cookie jar to handle cookies
            const cookieJar = new tough_cookie_1.CookieJar();
            // Wrap axios to support cookies with the jar
            const client = (0, axios_cookiejar_support_1.wrapper)(axios_1.default.create({ jar: cookieJar }));
            // Add User-Agent to mimic a real browser request
            const response = yield client.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
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
        }
        catch (error) {
            console.error('Error fetching Steam page:', error.message);
            return { gameName: 'Error Fetching game', isClean: false, reason: 'Error fetching page' }; // Default to false in case of an error
        }
    });
}
// Helper function to construct a Steam URL from an App ID
function buildSteamUrl(appId) {
    return `https://store.steampowered.com/app/${appId}`;
}
function execute(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const input = (_a = interaction.options.get('name')) === null || _a === void 0 ? void 0 : _a.value;
        if (input) {
            yield interaction.deferReply({ ephemeral: true }); // Defer the initial reply, only visible to the user
            // Determine if the input is a URL or a Steam App ID
            let url;
            if (input.startsWith('http')) {
                // If input starts with 'http', treat it as a URL
                url = input;
            }
            else {
                // Otherwise, assume it's a Steam App ID and build the URL
                url = buildSteamUrl(input);
            }
            const { isClean, reason, gameName } = yield checkSteamPage(url);
            if (gameName) {
                // Search the database for the game
                const existingGames = yield (0, gameUtils_1.searchGamesExact)(gameName);
                if (existingGames.length === 0) {
                    // Create embed response
                    const embed = new discord_js_1.EmbedBuilder()
                        .setColor(isClean ? '#00FF00' : '#FF0000')
                        .setTitle(isClean ? 'Game is Crackable' : 'Game Contains DRM')
                        .setDescription(`Checked URL: ${url}`)
                        .addFields({ name: 'Game Name', value: gameName || 'Unknown' }, { name: 'Result', value: isClean ? 'This game does not contain known DRM protections and might be crackable.' : 'This game contains DRM (e.g., Denuvo) and is not crackable.' }, { name: 'Reason', value: reason || 'Unknown' })
                        .setTimestamp();
                    // Send response
                    yield interaction.followUp({ embeds: [embed], ephemeral: true });
                    // Add to pending games list
                    try {
                        // If clean, set `cracked` to true and no reason
                        yield (0, fileUtils_1.addPendingGameToDatabase)(gameName, isClean, isClean ? null : reason);
                    }
                    catch (err) {
                        console.error('Error adding game to pending list:', err);
                    }
                }
                else {
                    const embed = new discord_js_1.EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('Game Already Exists')
                        .setDescription(`The game **"${gameName}"** is already in the database.`)
                        .setTimestamp();
                    yield interaction.followUp({ embeds: [embed], ephemeral: true });
                }
            }
            else {
                const embed = new discord_js_1.EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('No game information found')
                    .setDescription('No game information could be found for the provided URL or App ID.')
                    .setTimestamp();
                yield interaction.followUp({ embeds: [embed], ephemeral: true });
            }
        }
        else {
            const embed = new discord_js_1.EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('Please provide a valid Steam store URL or App ID.')
                .setTimestamp();
            yield interaction.followUp({ embeds: [embed], ephemeral: true });
        }
    });
}
exports.execute = execute;
