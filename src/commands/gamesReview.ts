import { config } from 'dotenv';
import { CommandInteraction, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { checkPermissions } from '../utils/permissions';
import { fetchAllPendingGames, approvePendingGame, removePendingGameFromDatabase } from '../utils/fileUtils';
import { createThread } from '../utils/gameInfoManager';
import { client } from '..';
import { reloadGameCache } from '../utils/gameUtils';

config();

const MAX_DESCRIPTION_LENGTH = 4096; // Discord limit for description length
const GAMES_PER_EMBED = 10; // Number of games per embed
const MAX_OPTIONS_PER_MENU = 25; // Maximum options in a select menu

const gamesReviewsCommand = {
    execute: async (interaction: CommandInteraction) => {
        const userRoles = interaction.member?.roles as any;
        const { admins: [adminUserId] } = require('../data/permissions.json');
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

        reloadGameCache()

        const pendingGames = await fetchAllPendingGames(); // Fetch pending games from DB

        if (pendingGames.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription('There are no pending games to review.');
            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        // Split the game list into multiple embeds
        const MAX_DESCRIPTION_LENGTH = 4096; // Discord limit for description length
        const embeds = [];
        let currentDescription = '';

        pendingGames.forEach((game: { name: string; cracked: boolean; reason?: string, platform?: string }, index: number) => {
            const gameDetails = `**Game:** \`${game.name}\`\n**Cracked:** ${game.cracked ? '✅ Yes' : '❌ No'}${game.reason ? `\n**Reason:** ${game.reason}` : ''}${game.platform ? `\n**Platform:** ${game.platform}` : ''}\n\n`;

            if ((currentDescription + gameDetails).length > MAX_DESCRIPTION_LENGTH) {
                embeds.push(new EmbedBuilder().setColor('#0099ff').setTitle(`Pending Games for Review (Page ${embeds.length + 1})`).setDescription(currentDescription).setTimestamp());
                currentDescription = '';
            }

            currentDescription += gameDetails;
        });

        if (currentDescription) {
            if (embeds.length > 0) {
                embeds.push(new EmbedBuilder().setColor('#0099ff').setTitle(`Pending Games for Review (Page ${embeds.length + 1})`).setDescription(currentDescription).setTimestamp());
            } else {
                embeds.push(new EmbedBuilder().setColor('#0099ff').setTitle('Pending Games for Review').setDescription(currentDescription).setTimestamp());
            }
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
                reloadGameCache()
                await createThread(client);
            } else if (interaction.customId === 'remove') {
                const options = pendingGames.map((game: any, index: number) => ({
                    label: game.name,
                    value: index.toString()
                }));

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('remove-select')
                    .setPlaceholder('Select games to remove')
                    .setMinValues(1)
                    .setMaxValues(options.length)
                    .addOptions(options);

                const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
                await interaction.update({ 
                    embeds: [new EmbedBuilder()
                        .setColor('#0099ff')
                        .setTitle('Select Games to Remove')
                        .setDescription("Select the games to remove from the pending list:")
                        .setTimestamp()
                    ],
                    components: [row] 
                });
            }
            reloadGameCache()
        } else if (interaction.isStringSelectMenu()) {
            const selectedIndexes = interaction.values.map((value: string) => parseInt(value));
            for (const index of selectedIndexes) {
                const game = pendingGames[index];
                await removePendingGameFromDatabase(game.name); // Remove selected pending games
            }
            await interaction.update({ 
                embeds: [new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('Update Status')
                    .setDescription("The selected games have been removed from the pending list.")
                    .setTimestamp()
                ],
                components: [] 
            });
            reloadGameCache()
        }
    }
};

export default gamesReviewsCommand;