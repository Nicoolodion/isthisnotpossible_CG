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
const discord_js_1 = require("discord.js");
const permissions_1 = require("../utils/permissions");
const gameUtils_1 = require("../utils/gameUtils");
const gameInfoManager_1 = require("../utils/gameInfoManager");
const index_1 = require("../index");
const deleteGamesCommand = {
    execute: (interaction) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const userRoles = (_a = interaction.member) === null || _a === void 0 ? void 0 : _a.roles;
        const { admins: [adminUserId] } = require('../data/permissions.json');
        const overrides = require('../data/permissions.json').overrides['delete-games'];
        const allowedUserIds = overrides.allow;
        const disabledUserIds = overrides.deny;
        // Check permissions
        if (disabledUserIds.includes(interaction.user.id) || (!(0, permissions_1.checkPermissions)(userRoles, (_b = process.env.admin) !== null && _b !== void 0 ? _b : '') && !(0, permissions_1.checkPermissions)(userRoles, (_c = process.env.uploader) !== null && _c !== void 0 ? _c : '') && interaction.user.id !== adminUserId && !allowedUserIds.includes(interaction.user.id))) {
            const embed = new discord_js_1.EmbedBuilder()
                .setColor('#FF0000')
                .setDescription('You don\'t have permission to use this command.');
            yield interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }
        const gameName = (_d = interaction.options.get('name')) === null || _d === void 0 ? void 0 : _d.value;
        if (!gameName) {
            yield interaction.reply({ content: "Please provide a game name to search for.", ephemeral: true });
            return;
        }
        // Search for games in the database
        const matchingGames = yield (0, gameUtils_1.searchGames)(gameName);
        if (matchingGames.length === 0) {
            yield interaction.reply({ content: `No games found matching "${gameName}".`, ephemeral: true });
            return;
        }
        if (matchingGames.length > 5) {
            const embed = new discord_js_1.EmbedBuilder()
                .setColor('#FF0000')
                .setDescription(`Too many results found. Please refine your search.`);
            yield interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }
        // Create an embed for the games found
        const embed = new discord_js_1.EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('Delete Games')
            .setDescription(`Found the following games matching "${gameName}":`)
            .addFields(matchingGames.map(game => ({
            name: game.name,
            value: game.cracked ? '✅ Cracked' : '❌ Not Cracked'
        })));
        // Create a select menu for selecting games
        const selectMenu = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId('delete-select')
            .setPlaceholder('Select games to delete')
            .setMinValues(1)
            .setMaxValues(matchingGames.length)
            .addOptions(matchingGames.map(game => ({
            label: game.name,
            value: game.name
        })));
        // Create buttons for confirming or canceling the deletion
        const deleteButton = new discord_js_1.ButtonBuilder()
            .setCustomId('confirm-delete')
            .setLabel('Delete')
            .setStyle(discord_js_1.ButtonStyle.Danger);
        const closeButton = new discord_js_1.ButtonBuilder()
            .setCustomId('close')
            .setLabel('Close')
            .setStyle(discord_js_1.ButtonStyle.Secondary);
        // Create action rows for buttons and select menu
        const actionRow = new discord_js_1.ActionRowBuilder()
            .addComponents(deleteButton, closeButton);
        const selectMenuRow = new discord_js_1.ActionRowBuilder()
            .addComponents(selectMenu);
        yield interaction.reply({
            embeds: [embed],
            components: [selectMenuRow, actionRow],
            ephemeral: true
        });
        // Store the games list for later use when the delete button is pressed
        interaction.client['matchingGames'] = matchingGames;
        interaction.client['selectedGames'] = [];
    }),
    handleInteraction: (interaction) => __awaiter(void 0, void 0, void 0, function* () {
        if (interaction.isButton()) {
            const matchingGames = interaction.client['matchingGames'];
            const selectedGames = interaction.client['selectedGames'];
            if (interaction.customId === 'close') {
                yield interaction.update({
                    embeds: [new discord_js_1.EmbedBuilder().setColor('#ff0000').setDescription("Action canceled.")],
                    components: [],
                });
            }
            else if (interaction.customId === 'confirm-delete') {
                if (!selectedGames || selectedGames.length === 0) {
                    yield interaction.update({
                        embeds: [new discord_js_1.EmbedBuilder().setColor('#ff0000').setDescription("No games selected for deletion.")],
                        components: [],
                    });
                    return;
                }
                // Delete selected games from the database
                for (const gameName of selectedGames) {
                    yield (0, gameUtils_1.removeGame)(gameName);
                }
                yield interaction.update({
                    embeds: [new discord_js_1.EmbedBuilder().setColor('#00ff00').setDescription("The selected games have been deleted from the main list.")],
                    components: [],
                });
                (0, gameUtils_1.reloadGameCache)();
                yield (0, gameInfoManager_1.createThread)(index_1.client);
            }
        }
        else if (interaction.isStringSelectMenu()) {
            const selectedGames = interaction.values;
            // Update the selected games list in the client
            interaction.client['selectedGames'] = selectedGames;
            // Update the interaction message to show selected games
            yield interaction.update({
                embeds: [new discord_js_1.EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('Selected Games')
                        .setDescription(`Selected games to delete: **${selectedGames.join(', ')}**`)],
                components: interaction.message.components
            });
        }
    })
};
exports.default = deleteGamesCommand;
