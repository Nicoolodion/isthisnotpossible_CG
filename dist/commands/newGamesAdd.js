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
const newGamesAddCommand = {
    execute: (interaction) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        const userRoles = (_a = interaction.member) === null || _a === void 0 ? void 0 : _a.roles;
        const { adminUserId } = require('../data/permissions.json');
        const overrides = require('../data/permissions.json').overrides['new-games-add'];
        const allowedUserIds = overrides.allow;
        const disabledUserIds = overrides.deny;
        const hasTeamRole = (0, permissions_1.checkPermissions)(userRoles, (_b = process.env.team) !== null && _b !== void 0 ? _b : '');
        const hasUploaderOrAdminRole = (0, permissions_1.checkPermissions)(userRoles, (_c = process.env.admin) !== null && _c !== void 0 ? _c : '') || (0, permissions_1.checkPermissions)(userRoles, (_d = process.env.uploader) !== null && _d !== void 0 ? _d : '') || allowedUserIds.includes(interaction.user.id);
        if (disabledUserIds.includes(interaction.user.id) || (!hasTeamRole && !hasUploaderOrAdminRole && interaction.user.id !== adminUserId)) {
            const embed = new discord_js_1.EmbedBuilder()
                .setColor('#FF0000')
                .setDescription('You don\'t have permission to use this command.');
            yield interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }
        const gameName = (_e = interaction.options.get('name')) === null || _e === void 0 ? void 0 : _e.value;
        const reason = (_f = interaction.options.get('reason')) === null || _f === void 0 ? void 0 : _f.value;
        let targetFile, alreadyOnListMessage, addedMessage;
        if (hasTeamRole && !hasUploaderOrAdminRole) {
            targetFile = 'pending-games.json';
            alreadyOnListMessage = `The game \`${gameName}\` is already on the Pending list.`;
            addedMessage = `The game \`${gameName}\` has been Submitted for Review.`;
        }
        else {
            targetFile = 'games.json';
            alreadyOnListMessage = `The game \`${gameName}\` is already on the list.`;
            addedMessage = `The game \`${gameName}\` has been added to the list.`;
        }
        const gamesList = (0, fileUtils_1.readJsonFile)(targetFile);
        const isGameOnList = gamesList.some((game) => game.name.toLowerCase() === gameName.toLowerCase());
        if (isGameOnList) {
            const overrideButton = new discord_js_1.ButtonBuilder()
                .setCustomId(`override-add-${hasTeamRole && !hasUploaderOrAdminRole ? 'pending' : ''}`)
                .setLabel('Add Anyway ✅')
                .setStyle(discord_js_1.ButtonStyle.Success);
            const row = new discord_js_1.ActionRowBuilder()
                .addComponents(overrideButton);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor('#FF0000')
                .setDescription(`${alreadyOnListMessage} Reason provided: \`${reason || 'No reason provided'}\`.`);
            yield interaction.reply({
                embeds: [embed],
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
            gamesList.push(newGame);
            (0, fileUtils_1.writeJsonFile)(targetFile, gamesList);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor('#00FF00')
                .setTitle(`**${hasTeamRole && !hasUploaderOrAdminRole ? 'Game Submitted for Review!' : 'Game Added!'}**`)
                .setDescription(addedMessage)
                .setFooter({ text: 'Thanks for contributing!' })
                .setTimestamp();
            yield interaction.reply({ embeds: [embed], ephemeral: true });
            (0, gameUtils_1.reloadCache)(); // Reload cache after adding a game
        }
    }),
    handleInteraction: (interaction) => __awaiter(void 0, void 0, void 0, function* () {
        if (interaction.isButton()) {
            const customId = interaction.customId;
            const isPendingOverride = customId === 'override-add-pending';
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
            const targetFile = isPendingOverride ? 'pending-games.json' : 'games.json';
            const gamesList = (0, fileUtils_1.readJsonFile)(targetFile);
            gamesList.push(newGame);
            (0, fileUtils_1.writeJsonFile)(targetFile, gamesList);
            yield interaction.update({ content: `The game \`${gameName}\` has been added to the ${isPendingOverride ? 'pending list' : 'list'} despite being already present.`, components: [] });
            (0, gameUtils_1.reloadCache)(); // Reload cache after adding a game
        }
    })
};
exports.default = newGamesAddCommand;
