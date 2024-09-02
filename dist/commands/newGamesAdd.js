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
const fileUtils_1 = require("../utils/fileUtils");
(0, dotenv_1.config)();
const newGamesAddCommand = {
    execute: (interaction) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        const userRoles = (_a = interaction.member) === null || _a === void 0 ? void 0 : _a.roles;
        if (!(0, permissions_1.checkPermissions)(userRoles, (_b = process.env.admin) !== null && _b !== void 0 ? _b : '') && !(0, permissions_1.checkPermissions)(userRoles, (_c = process.env.uploader) !== null && _c !== void 0 ? _c : '')) {
            yield interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
            return;
        }
        const gameName = (_d = interaction.options.get('name')) === null || _d === void 0 ? void 0 : _d.value;
        const reason = (_e = interaction.options.get('reason')) === null || _e === void 0 ? void 0 : _e.value;
        const games = (0, fileUtils_1.readJsonFile)('games.json');
        const isGameOnList = games.some((game) => game.name.toLowerCase() === gameName.toLowerCase());
        if (isGameOnList) {
            const overrideButton = new discord_js_1.ButtonBuilder()
                .setCustomId('override-add')
                .setLabel('Add Anyway ✅')
                .setStyle(discord_js_1.ButtonStyle.Success);
            const row = new discord_js_1.ActionRowBuilder()
                .addComponents(overrideButton);
            yield interaction.reply({
                content: `The game \`${gameName}\` is already on the list. Reason provided: \`${reason}\`.`,
                components: [row],
                ephemeral: true
            });
        }
        else {
            const newGame = {
                name: gameName,
                cracked: false,
                reason: reason
            };
            games.push(newGame);
            (0, fileUtils_1.writeJsonFile)('games.json', games);
            yield interaction.reply({ content: `The game \`${gameName}\` has been added to the list.`, ephemeral: true });
        }
    }),
    handleInteraction: (interaction) => __awaiter(void 0, void 0, void 0, function* () {
        if (interaction.isButton() && interaction.customId === 'override-add') {
            // Extract the game name and reason from the message content
            const gameNameMatch = interaction.message.content.match(/`(.*?)`/);
            const reasonMatch = interaction.message.content.match(/Reason provided: `([^`]*)`/);
            const gameName = gameNameMatch ? gameNameMatch[1] : null;
            const reason = reasonMatch ? reasonMatch[1] : 'No reason provided';
            if (!gameName) {
                yield interaction.reply({ content: 'Error: Game name could not be determined.', ephemeral: true });
                return;
            }
            const newGame = Object.assign({ name: gameName, cracked: false }, (reason.trim() && reason.trim() !== 'No reason provided' ? { reason: reason.trim() } : {}));
            const games = (0, fileUtils_1.readJsonFile)('games.json');
            games.push(newGame);
            (0, fileUtils_1.writeJsonFile)('games.json', games);
            yield interaction.update({ content: `The game \`${gameName}\` has been added to the list despite being already present.`, components: [] });
        }
    })
};
exports.default = newGamesAddCommand;
