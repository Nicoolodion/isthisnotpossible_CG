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
const dotenv_1 = require("dotenv");
const discord_js_1 = require("discord.js");
const permissions_1 = require("../utils/permissions");
const gameUtils_1 = require("../utils/gameUtils");
(0, dotenv_1.config)();
const gamesAvailableCommand = {
    execute: (interaction) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        const userRoles = (_a = interaction.member) === null || _a === void 0 ? void 0 : _a.roles;
        const { adminUserId } = require('../data/permissions.json');
        const overrides = require('../data/permissions.json').overrides['request-blacklist-info'];
        const allowedUserIds = overrides.allow;
        const disabledUserIds = overrides.deny;
        if (disabledUserIds.includes(interaction.user.id) || (!(0, permissions_1.checkPermissions)(userRoles, (_b = process.env.team) !== null && _b !== void 0 ? _b : '') && interaction.user.id !== adminUserId && !allowedUserIds.includes(interaction.user.id))) {
            const embed = new discord_js_1.EmbedBuilder()
                .setColor('#FF0000')
                .setDescription('You don\'t have permission to use this command.');
            yield interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }
        const gameName = (_c = interaction.options.get('name')) === null || _c === void 0 ? void 0 : _c.value;
        if (!gameName) {
            const embed = new discord_js_1.EmbedBuilder()
                .setColor('#FF0000')
                .setDescription('Please provide a game name.');
            yield interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }
        const games = yield (0, gameUtils_1.searchGames)(gameName); // Use searchGames to search from the DB
        if (games.length === 0) {
            const embed = new discord_js_1.EmbedBuilder()
                .setColor('#FF0000')
                .setDescription('Nothing has been found.');
            yield interaction.reply({ embeds: [embed], ephemeral: true });
        }
        else if (games.length > 3) {
            const embed = new discord_js_1.EmbedBuilder()
                .setColor('#FF0000')
                .setDescription('Too many results found. Please be more specific.');
            yield interaction.reply({ embeds: [embed], ephemeral: true });
        }
        else {
            const embed = new discord_js_1.EmbedBuilder()
                .setColor('#008000')
                .setDescription(games
                .slice(0, 3) // Only show up to 3 results
                .map(game => `**Game:** \`${game.name}\`\n**Cracked:** ${game.cracked ? '✅ Yes' : '❌ No'}${game.reason ? `\n**Reason:** ${game.reason}` : ''}`)
                .join('\n\n')); // Separate each game with a double newline for readability
            yield interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }),
};
exports.default = gamesAvailableCommand;
