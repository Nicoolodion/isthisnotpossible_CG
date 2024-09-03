import { config } from 'dotenv';
import { CommandInteraction, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { checkPermissions } from '../utils/permissions';
import { readJsonFile, writeJsonFile } from '../utils/fileUtils';
import { reloadCache } from '../utils/gameUtils';

config();

const newGamesCommand = {
    execute: async (interaction: CommandInteraction) => {
        const userRoles = interaction.member?.roles as any;
        const { adminUserId } = require('../data/permissions.json');
        const overrides = require('../data/permissions.json').overrides['request-blacklist-info'];
        const allowedUserIds = overrides.allow;
        const disabledUserIds = overrides.deny;

        if (disabledUserIds.includes(interaction.user.id) || (!checkPermissions(userRoles, process.env.team ?? '') && interaction.user.id !== adminUserId && !allowedUserIds.includes(interaction.user.id))) {
            const embed = new EmbedBuilder()
            .setColor('#FF0000')
                .setDescription('You don\'t have permission to use this command.');
            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        const gameName = interaction.options.get('name')?.value as string;
        const reason = interaction.options.get('reason')?.value as string | null;
        const pendingGames = readJsonFile('pending-games.json');
        const isGamePending = pendingGames.some((game: any) => game.name.toLowerCase() === gameName.toLowerCase());

        if (isGamePending) {
            const overrideButton = new ButtonBuilder()
                .setCustomId('override-add-pending')
                .setLabel('Add Anyway ✅')
                .setStyle(ButtonStyle.Success);

            const row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(overrideButton);

                const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription(`The game \`${gameName}\` is already on the Pending list. Reason provided: \`${reason || 'No reason provided'}\`.`);
            await interaction.reply({
                embeds: [embed],
                components: [row],
                ephemeral: true
            });
        } else {
            const newPendingGame = {
                name: gameName,
                cracked: false,
                reason: reason
            };

            pendingGames.push(newPendingGame);
            writeJsonFile('pending-games.json', pendingGames);

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('**Game Submitted for Review!**')
                .setDescription(`The game \`${gameName}\` has been Submitted for Review.`)
                .setFooter({ text: 'Thanks for contributing!'})
                .setTimestamp()
            await interaction.reply({ embeds: [embed], ephemeral: true });
            reloadCache();  // Reload cache after adding a game
        }
    },

    handleInteraction: async (interaction: any) => {
        if (interaction.isButton() && interaction.customId === 'override-add-pending') {
            // Extract the game name and reason from the message content
            const gameNameMatch = interaction.message.content.match(/`(.*?)`/);
            const reasonMatch = interaction.message.content.match(/Reason provided: `([^`]*)`/);
            const gameName = gameNameMatch ? gameNameMatch[1] : null;
            const reason = reasonMatch ? reasonMatch[1] : 'No reason provided';

            if (!gameName) {
                await interaction.reply({ content: 'Error: Game name could not be determined.', ephemeral: true });
                return;
            }

            const newPendingGame = {
                name: gameName,
                cracked: false,
                ...(reason.trim() && reason.trim() !== 'No reason provided' ? { reason: reason.trim() } : {})
            };

            const pendingGames = readJsonFile('pending-games.json');
            pendingGames.push(newPendingGame);
            writeJsonFile('pending-games.json', pendingGames);

            await interaction.update({ content: `The game \`${gameName}\` has been added to the pending list despite being already present.`, components: [] });
            reloadCache();  // Reload cache after adding a game
        }
    }
};

export default newGamesCommand;
