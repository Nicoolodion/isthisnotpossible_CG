import { config } from 'dotenv';
import { CommandInteraction, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ButtonStyle, ComponentType, EmbedBuilder } from 'discord.js';
import { checkPermissions } from '../utils/permissions';
import { readJsonFile, writeJsonFile } from '../utils/fileUtils';
import { reloadCache } from '../utils/gameUtils';

config();

const gamesReviewsCommand = {
    execute: async (interaction: CommandInteraction) => {
        const userRoles = interaction.member?.roles as any;
        const { adminUserId } = require('../data/permissions.json');
        const overrides = require('../data/permissions.json').overrides['request-blacklist-info'];
        const allowedUserIds = overrides.allow;
        const disabledUserIds = overrides.deny;

        if (disabledUserIds.includes(interaction.user.id) || (!checkPermissions(userRoles, process.env.admin ?? '') && !checkPermissions(userRoles, process.env.uploader ?? '') && interaction.user.id !== adminUserId && !allowedUserIds.includes(interaction.user.id))) {
            const embed = new EmbedBuilder()
            .setColor('#FF0000')
                .setDescription('You don\'t have permission to use this command.');
            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        const pendingGames = readJsonFile('pending-games.json');

        if (pendingGames.length === 0) {
            await interaction.reply({ content: "There are no pending games to review.", ephemeral: true });
            return;
        }

        // Create an embed for the list of pending games
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Pending Games for Review')
            .setDescription(pendingGames.map((game: { name: string; cracked: boolean; reason?: string }) => 
                `**Game:** \`${game.name}\`\n**Cracked:** ${game.cracked ? '✅ Yes' : '❌ No'}${game.reason ? `\n**Reason:** ${game.reason}` : ''}`
            ).join('\n\n'))
            .setTimestamp();

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
            embeds: [embed],
            components: [row],
            ephemeral: true
        });
    },
    
    handleInteraction: async (interaction: any) => {
        if (interaction.isButton()) {
            const pendingGames = readJsonFile('pending-games.json');
            if (interaction.customId === 'approve') {
                const games = readJsonFile('games.json');
                games.push(...pendingGames);
                writeJsonFile('games.json', games);
                writeJsonFile('pending-games.json', []);
                reloadCache();
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
        } else if (interaction.isStringSelectMenu()) {
            const pendingGames = readJsonFile('pending-games.json');
            const selectedIndexes = interaction.values.map((value: string) => parseInt(value));
            const newPendingGames = pendingGames.filter((_: any, index: number) => !selectedIndexes.includes(index));
            writeJsonFile('pending-games.json', newPendingGames);
            reloadCache();
            await interaction.update({ 
                embeds: [new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('Update Status')
                    .setDescription("The selected games have been removed from the pending list.")
                    .setTimestamp()
                ],
                components: [] 
            });
        }
    }
};

export default gamesReviewsCommand;
