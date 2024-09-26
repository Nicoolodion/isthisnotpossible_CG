import { CommandInteraction, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ButtonStyle, EmbedBuilder, Client } from 'discord.js';
import { checkPermissions } from '../utils/permissions';
import { searchGames, removeGame, reloadGameCache } from '../utils/gameUtils';
import { createThread } from '../utils/gameInfoManager';
import { client } from '../index';


const deleteGamesCommand = {
    execute: async (interaction: CommandInteraction) => {
        const userRoles = interaction.member?.roles as any;
        const { admins: [adminUserId] } = require('../data/permissions.json');
        const overrides = require('../data/permissions.json').overrides['delete-games'];
        const allowedUserIds = overrides.allow;
        const disabledUserIds = overrides.deny;

        // Check permissions
        if (disabledUserIds.includes(interaction.user.id) || (!checkPermissions(userRoles, process.env.admin ?? '') && !checkPermissions(userRoles, process.env.uploader ?? '') && interaction.user.id !== adminUserId && !allowedUserIds.includes(interaction.user.id))) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription('You don\'t have permission to use this command.');
            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        const gameName = interaction.options.get('name')?.value as string;
        if (!gameName) {
            await interaction.reply({ content: "Please provide a game name to search for.", ephemeral: true });
            return;
        }

        // Search for games in the database
        const matchingGames = await searchGames(gameName);

        if (matchingGames.length === 0) {
            await interaction.reply({ content: `No games found matching "${gameName}".`, ephemeral: true });
            return;
        }

        if (matchingGames.length > 5) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription(`Too many results found. Please refine your search.`);
            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        // Create an embed for the games found
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('Delete Games')
            .setDescription(`Found the following games matching "${gameName}":`)
            .addFields(matchingGames.map(game => ({
                name: game.name,
                value: game.cracked ? '✅ Cracked' : '❌ Not Cracked'
            })));

        // Create a select menu for selecting games
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('delete-select')
            .setPlaceholder('Select games to delete')
            .setMinValues(1)
            .setMaxValues(matchingGames.length)
            .addOptions(matchingGames.map(game => ({
                label: game.name,
                value: game.name
            })));

        // Create buttons for confirming or canceling the deletion
        const deleteButton = new ButtonBuilder()
            .setCustomId('confirm-delete')
            .setLabel('Delete')
            .setStyle(ButtonStyle.Danger);

        const closeButton = new ButtonBuilder()
            .setCustomId('close')
            .setLabel('Close')
            .setStyle(ButtonStyle.Secondary);

        // Create action rows for buttons and select menu
        const actionRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(deleteButton, closeButton);

        const selectMenuRow = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(selectMenu);

        await interaction.reply({
            embeds: [embed],
            components: [selectMenuRow, actionRow],
            ephemeral: true
        });

        // Store the games list for later use when the delete button is pressed
        (interaction.client as any)['matchingGames'] = matchingGames;
        (interaction.client as any)['selectedGames'] = [];
    },

    handleInteraction: async (interaction: any) => {
        if (interaction.isButton()) {
            const matchingGames = interaction.client['matchingGames'];
            const selectedGames = interaction.client['selectedGames'];

            if (interaction.customId === 'close') {
                await interaction.update({
                    embeds: [new EmbedBuilder().setColor('#ff0000').setDescription("Action canceled.")],
                    components: [],
                });
            } else if (interaction.customId === 'confirm-delete') {
                if (!selectedGames || selectedGames.length === 0) {
                    await interaction.update({
                        embeds: [new EmbedBuilder().setColor('#ff0000').setDescription("No games selected for deletion.")],
                        components: [],
                    });
                    return;
                }

                // Delete selected games from the database
                for (const gameName of selectedGames) {
                    await removeGame(gameName);
                }

                await interaction.update({
                    embeds: [new EmbedBuilder().setColor('#00ff00').setDescription("The selected games have been deleted from the main list.")],
                    components: [],
                });
                reloadGameCache()
                await createThread(client);
            }
        } else if (interaction.isStringSelectMenu()) {
            const selectedGames = interaction.values;

            // Update the selected games list in the client
            interaction.client['selectedGames'] = selectedGames;

            // Update the interaction message to show selected games
            await interaction.update({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Selected Games')
                    .setDescription(`Selected games to delete: **${selectedGames.join(', ')}**`)],
                components: interaction.message.components
            });
        }
    }
};

export default deleteGamesCommand;
