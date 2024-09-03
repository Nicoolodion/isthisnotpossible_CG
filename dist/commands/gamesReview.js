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
const gameUtils_1 = require("../utils/gameUtils");
(0, dotenv_1.config)();
const gamesReviewsCommand = {
    execute: (interaction) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        const userRoles = (_a = interaction.member) === null || _a === void 0 ? void 0 : _a.roles;
        const { adminUserId } = require('../data/permissions.json');
        const overrides = require('../data/permissions.json').overrides['request-blacklist-info'];
        const allowedUserIds = overrides.allow;
        const disabledUserIds = overrides.deny;
        if (disabledUserIds.includes(interaction.user.id) || (!(0, permissions_1.checkPermissions)(userRoles, (_b = process.env.admin) !== null && _b !== void 0 ? _b : '') && !(0, permissions_1.checkPermissions)(userRoles, (_c = process.env.uploader) !== null && _c !== void 0 ? _c : '') && interaction.user.id !== adminUserId && !allowedUserIds.includes(interaction.user.id))) {
            const embed = new discord_js_1.EmbedBuilder()
                .setColor('#FF0000')
                .setDescription('You don\'t have permission to use this command.');
            yield interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }
        const pendingGames = (0, fileUtils_1.readJsonFile)('pending-games.json');
        if (pendingGames.length === 0) {
            yield interaction.reply({ content: "There are no pending games to review.", ephemeral: true });
            return;
        }
        // Create an embed for the list of pending games
        const embed = new discord_js_1.EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Pending Games for Review')
            .setDescription(pendingGames.map((game) => `**Game:** \`${game.name}\`\n**Cracked:** ${game.cracked ? '✅ Yes' : '❌ No'}${game.reason ? `\n**Reason:** ${game.reason}` : ''}`).join('\n\n'))
            .setTimestamp();
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
            embeds: [embed],
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
                (0, gameUtils_1.reloadCache)();
                yield interaction.update({
                    embeds: [new discord_js_1.EmbedBuilder()
                            .setColor('#0099ff')
                            .setTitle('Review Status')
                            .setDescription("All pending games have been approved and added to the main list.")
                            .setTimestamp()
                    ],
                    components: []
                });
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
                yield interaction.update({
                    embeds: [new discord_js_1.EmbedBuilder()
                            .setColor('#0099ff')
                            .setTitle('Select Games to Remove')
                            .setDescription("Select the games to remove from the pending list:")
                            .setTimestamp()
                    ],
                    components: [row]
                });
            }
        }
        else if (interaction.isStringSelectMenu()) {
            const pendingGames = (0, fileUtils_1.readJsonFile)('pending-games.json');
            const selectedIndexes = interaction.values.map((value) => parseInt(value));
            const newPendingGames = pendingGames.filter((_, index) => !selectedIndexes.includes(index));
            (0, fileUtils_1.writeJsonFile)('pending-games.json', newPendingGames);
            (0, gameUtils_1.reloadCache)();
            yield interaction.update({
                embeds: [new discord_js_1.EmbedBuilder()
                        .setColor('#0099ff')
                        .setTitle('Update Status')
                        .setDescription("The selected games have been removed from the pending list.")
                        .setTimestamp()
                ],
                components: []
            });
        }
    })
};
exports.default = gamesReviewsCommand;
