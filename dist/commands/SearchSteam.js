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
const dotenv_1 = require("dotenv");
const discord_js_1 = require("discord.js");
const axios_1 = __importDefault(require("axios"));
const axios_cookiejar_support_1 = require("axios-cookiejar-support");
const tough_cookie_1 = require("tough-cookie");
const cheerio = __importStar(require("cheerio"));
const fileUtils_1 = require("../utils/fileUtils");
const gameUtils_1 = require("../utils/gameUtils");
const permissions_1 = require("../utils/permissions");
(0, dotenv_1.config)();
// Keywords to search for on the Steam page
const keywords = ['Denuvo', 'Activision Account', 'Warframe Account', 'background use required', 'EA online activation'];
// Function to check the Steam page
function checkSteamPage(url) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const cookieJar = new tough_cookie_1.CookieJar();
            const client = (0, axios_cookiejar_support_1.wrapper)(axios_1.default.create({ jar: cookieJar }));
            const response = yield client.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
                },
            });
            const $ = cheerio.load(response.data);
            const gameName = $('#appHubAppName').text().trim();
            const drmNotice = $('.DRM_notice').text();
            const pageContent = drmNotice.toLowerCase();
            for (const keyword of keywords) {
                if (pageContent.includes(keyword.toLowerCase())) {
                    return { gameName, isClean: false, reason: keyword };
                }
            }
            return { gameName, isClean: true, reason: null };
        }
        catch (error) {
            console.error('Error fetching Steam page:', error.message);
            return { gameName: 'Error Fetching game', isClean: false, reason: 'Error fetching page' };
        }
    });
}
// Helper function to construct a Steam URL from an App ID
function buildSteamUrl(appId) {
    return `https://store.steampowered.com/app/${appId}`;
}
// Function to get top games from Steam
function getTopSteamGames() {
    return __awaiter(this, void 0, void 0, function* () {
        const gameLinks = [];
        try {
            let currentPage = 1;
            let totalGamesFetched = 0;
            const gamesPerPage = 50;
            const maxGames = 50;
            while (totalGamesFetched < maxGames) {
                const response = yield axios_1.default.get(`https://store.steampowered.com/search/?filter=topsellers&page=${currentPage}`);
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
        }
        catch (error) {
            console.error('Error fetching top Steam games:', error.message);
            return [];
        }
    });
}
function execute(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const userRoles = (_a = interaction.member) === null || _a === void 0 ? void 0 : _a.roles;
        const { adminUserId } = require('../data/permissions.json');
        const overrides = require('../data/permissions.json').overrides['review-games'];
        const allowedUserIds = overrides.allow;
        const disabledUserIds = overrides.deny;
        if (disabledUserIds.includes(interaction.user.id) || (!(0, permissions_1.checkPermissions)(userRoles, (_b = process.env.admin) !== null && _b !== void 0 ? _b : '') && !(0, permissions_1.checkPermissions)(userRoles, (_c = process.env.uploader) !== null && _c !== void 0 ? _c : '') && interaction.user.id !== adminUserId && !allowedUserIds.includes(interaction.user.id))) {
            const embed = new discord_js_1.EmbedBuilder()
                .setColor('#FF0000')
                .setDescription('You don\'t have permission to use this command.');
            yield interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }
        const input = (_d = interaction.options.get('name')) === null || _d === void 0 ? void 0 : _d.value;
        yield interaction.deferReply({ ephemeral: true });
        if (input) {
            // Process the provided game URL or ID
            let url;
            if (input.startsWith('http')) {
                url = input;
            }
            else {
                url = buildSteamUrl(input);
            }
            const { isClean, reason, gameName } = yield checkSteamPage(url);
            if (gameName) {
                const existingGames = yield (0, gameUtils_1.searchGamesExact)(gameName);
                if (existingGames.length === 0) {
                    const embed = new discord_js_1.EmbedBuilder()
                        .setColor(isClean ? '#00FF00' : '#FF0000')
                        .setTitle(isClean ? 'Game is Crackable' : 'Game Contains DRM')
                        .setDescription(`Checked URL: ${url}`)
                        .addFields({ name: 'Game Name', value: gameName || 'Unknown' }, { name: 'Result', value: isClean ? 'This game does not contain known DRM protections and might be crackable.' : 'This game contains DRM (e.g., Denuvo) and is not crackable.' }, { name: 'Reason', value: reason || 'Unknown' })
                        .setTimestamp();
                    yield interaction.followUp({ embeds: [embed], ephemeral: true });
                    try {
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
            // No game URL or ID provided, search top games
            const topGameLinks = yield getTopSteamGames();
            if (topGameLinks.length > 0) {
                const games = topGameLinks.map(url => checkSteamPage(url));
                const results = yield Promise.all(games);
                for (const { isClean, reason, gameName } of results) {
                    if (gameName) {
                        const existingGames = yield (0, gameUtils_1.searchGamesExact)(gameName);
                        if (existingGames.length === 0) {
                            try {
                                yield (0, fileUtils_1.addPendingGameToDatabase)(gameName, isClean, isClean ? null : reason);
                            }
                            catch (err) {
                                console.error('Error adding game to pending list:', err);
                            }
                        }
                    }
                }
                const embed = new discord_js_1.EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('Top Games Processed')
                    .setDescription('The top games have been checked and added to the pending games list if applicable.')
                    .setTimestamp();
                yield interaction.followUp({ embeds: [embed], ephemeral: true });
            }
            else {
                const embed = new discord_js_1.EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Error')
                    .setDescription('Failed to fetch the top games from Steam.')
                    .setTimestamp();
                yield interaction.followUp({ embeds: [embed], ephemeral: true });
            }
        }
    });
}
exports.execute = execute;
