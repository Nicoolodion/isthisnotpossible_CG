import { config } from 'dotenv';
import { CommandInteraction, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { checkPermissions } from '../utils/permissions';
import { fetchAllPendingGames, approvePendingGame, removePendingGameFromDatabase } from '../utils/fileUtils';

config();

const MAX_DESCRIPTION_LENGTH = 4096; // Discord limit for description length
const GAMES_PER_EMBED = 10; // Number of games per embed
const MAX_OPTIONS_PER_MENU = 25; // Maximum options in a select menu

const gamesReviewsCommand = {
    execute: async (interaction: CommandInteraction) => {
        const userRoles = interaction.member?.roles as any;
        const { adminUserId } = require('../data/permissions.json');
        const overrides = require('../data/permissions.json').overrides['review-games'];
        const allowedUserIds = overrides.allow;
        const disabledUserIds = overrides.deny;

        if (disabledUserIds.includes(interaction.user.id) || (!checkPermissions(userRoles, process.env.admin ?? '') && !checkPermissions(userRoles, process.env.uploader ?? '') && interaction.user.id !== adminUserId && !allowedUserIds.includes(interaction.user.id))) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription('You don\'t have permission to use this command.');
            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        const pendingGames = await fetchAllPendingGames(); // Fetch pending games from DB

        if (pendingGames.length === 0) {
            await interaction.reply({ content: "There are no pending games to review.", ephemeral: true });
            return;
        }

        // Split the game list into multiple embeds
        const embeds = [];
        let currentDescription = '';

        pendingGames.forEach((game: { name: string; cracked: boolean; reason?: string }, index: number) => {
            const gameDetails = `**Game:** \`${game.name}\`\n**Cracked:** ${game.cracked ? '✅ Yes' : '❌ No'}${game.reason ? `\n**Reason:** ${game.reason}` : ''}\n\n`;

            if ((currentDescription + gameDetails).length > MAX_DESCRIPTION_LENGTH) {
                embeds.push(new EmbedBuilder().setColor('#0099ff').setTitle(`Pending Games for Review (Page ${embeds.length + 1})`).setDescription(currentDescription).setTimestamp());
                currentDescription = '';
            }

            currentDescription += gameDetails;
        });

        if (currentDescription) {
            embeds.push(new EmbedBuilder().setColor('#0099ff').setTitle(`Pending Games for Review (Page ${embeds.length + 1})`).setDescription(currentDescription).setTimestamp());
        }

        // Create buttons for approval and removal
        const approveButton = new ButtonBuilder()
            .setCustomId('approve')
            .setLabel('Approve ✅')
            .setStyle(ButtonStyle.Success);

        const removeButton = new ButtonBuilder()
            .setCustomId('remove')
            .setLabel('Remove ❌')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(approveButton, removeButton);

        await interaction.reply({
            embeds: embeds,
            components: [row],
            ephemeral: true
        });
    },

    handleInteraction: async (interaction: any) => {
        const pendingGames = await fetchAllPendingGames();

        if (interaction.isButton()) {
            if (interaction.customId === 'approve') {
                for (const game of pendingGames) {
                    await approvePendingGame(game.name); // Approve and move games to the main list
                }
                await interaction.update({ 
                    embeds: [new EmbedBuilder()
                        .setColor('#0099ff')
                        .setTitle('Review Status')
                        .setDescription("All pending games have been approved and added to the main list.")
                        .setTimestamp()
                    ],
                    components: [] 
                });
            } else if (interaction.customId === 'remove') {
                const selectMenus = [];
                for (let i = 0; i < pendingGames.length; i += MAX_OPTIONS_PER_MENU) {
                    const chunk = pendingGames.slice(i, i + MAX_OPTIONS_PER_MENU);
                    const options = chunk.map((game: any, index: number) => ({
                        label: game.name,
                        value: (i + index).toString() // Use the absolute index as the value
                    }));

                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId(`remove-select-${i}`)
                        .setPlaceholder('Select games to remove')
                        .setMinValues(1)
                        .setMaxValues(options.length)
                        .addOptions(options);

                    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
                    selectMenus.push(row);
                }

                await interaction.update({
                    embeds: [new EmbedBuilder()
                        .setColor('#0099ff')
                        .setTitle('Select Games to Remove')
                        .setDescription("Select the games to remove from the pending list:")
                        .setTimestamp()
                    ],
                    components: selectMenus
                });
            }
        } else if (interaction.isStringSelectMenu()) {
            // Defer the interaction response to keep it alive while processing
            await interaction.deferUpdate();

            const selectedIndexes = interaction.values.map((value: string) => parseInt(value));
            for (const index of selectedIndexes) {
                const game = pendingGames[index];
                await removePendingGameFromDatabase(game.name); // Remove selected pending games
            }

            await interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('Update Status')
                    .setDescription("The selected games have been removed from the pending list.")
                    .setTimestamp()
                ],
                components: [] // Remove the components after the interaction is complete
            });
        }
    }
};

export default gamesReviewsCommand;