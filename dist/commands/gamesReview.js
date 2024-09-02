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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const permissions_1 = require("../utils/permissions");
const fileUtils_1 = require("../utils/fileUtils");
const config_json_1 = __importDefault(require("../../config.json"));
const gamesReviewsCommand = {
    execute: (interaction) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const userRoles = (_a = interaction.member) === null || _a === void 0 ? void 0 : _a.roles;
        if (!(0, permissions_1.checkPermissions)(userRoles, config_json_1.default.roles.admin) && !(0, permissions_1.checkPermissions)(userRoles, config_json_1.default.roles.uploader)) {
            yield interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
            return;
        }
        const pendingGames = (0, fileUtils_1.readJsonFile)('pending-games.json');
        console.log('Pending games:', pendingGames); // Debugging statement
        if (pendingGames.length === 0) {
            yield interaction.reply({ content: "There are no pending games to review.", ephemeral: true });
            return;
        }
        const gamesList = pendingGames.map((game) => `**Game:** \`${game.name}\`\n**Cracked:** ${game.cracked ? '✅ Yes' : '❌ No'}${game.reason ? `\n**Reason:** ${game.reason}` : ''}`).join('\n\n');
        const approveButton = new discord_js_1.ButtonBuilder()
            .setCustomId('approve')
            .setLabel('Approve ✅')
            .setStyle(discord_js_1.ButtonStyle.Success);
        const removeButton = new discord_js_1.ButtonBuilder()
            .setCustomId('remove')
            .setLabel('Remove ❌')
            .setStyle(discord_js_1.ButtonStyle.Danger);
        const row = new discord_js_1.ActionRowBuilder()
            .addComponents(approveButton, removeButton);
        yield interaction.reply({
            content: `Here are the pending games:\n\n${gamesList}`,
            components: [row],
            ephemeral: true
        });
    }),
    handleInteraction: (interaction) => __awaiter(void 0, void 0, void 0, function* () {
        if (interaction.isButton()) {
            const pendingGames = (0, fileUtils_1.readJsonFile)('pending-games.json');
            if (interaction.customId === 'approve') {
                const games = (0, fileUtils_1.readJsonFile)('games.json');
                games.push(...pendingGames);
                (0, fileUtils_1.writeJsonFile)('games.json', games);
                (0, fileUtils_1.writeJsonFile)('pending-games.json', []);
                yield interaction.update({ content: "All pending games have been approved and added to the main list.", components: [] });
            }
            else if (interaction.customId === 'remove') {
                const options = pendingGames.map((game, index) => ({
                    label: game.name,
                    value: index.toString()
                }));
                const selectMenu = new discord_js_1.StringSelectMenuBuilder()
                    .setCustomId('remove-select')
                    .setPlaceholder('Select games to remove')
                    .setMinValues(1)
                    .setMaxValues(options.length)
                    .addOptions(options);
                const row = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
                yield interaction.update({ content: "Select the games to remove:", components: [row] });
            }
        }
        else if (interaction.isStringSelectMenu()) {
            const pendingGames = (0, fileUtils_1.readJsonFile)('pending-games.json');
            const selectedIndexes = interaction.values.map((value) => parseInt(value));
            const newPendingGames = pendingGames.filter((_, index) => !selectedIndexes.includes(index));
            (0, fileUtils_1.writeJsonFile)('pending-games.json', newPendingGames);
            yield interaction.update({ content: "The selected games have been removed from the pending list.", components: [] });
        }
    })
};
exports.default = gamesReviewsCommand;
