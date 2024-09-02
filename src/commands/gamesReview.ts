import { CommandInteraction, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { checkPermissions } from '../utils/permissions';
import { readJsonFile, writeJsonFile } from '../utils/fileUtils';
import config from '../../config.json';

const gamesReviewsCommand = {
    execute: async (interaction: CommandInteraction) => {
        const userRoles = interaction.member?.roles as any;
        if (!checkPermissions(userRoles, config.roles.admin) && !checkPermissions(userRoles, config.roles.uploader)) {
            await interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
            return;
        }

        const pendingGames = readJsonFile('pending-games.json');
        console.log('Pending games:', pendingGames);  // Debugging statement

        if (pendingGames.length === 0) {
            await interaction.reply({ content: "There are no pending games to review.", ephemeral: true });
            return;
        }

        const gamesList = pendingGames.map((game: { name: string; cracked: boolean; reason?: string }) => `**Game:** \`${game.name}\`\n**Cracked:** ${game.cracked ? '✅ Yes' : '❌ No'}${game.reason ? `\n**Reason:** ${game.reason}` : ''}`).join('\n\n');

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
            content: `Here are the pending games:\n\n${gamesList}`,
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
                await interaction.update({ content: "All pending games have been approved and added to the main list.", components: [] });
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
                await interaction.update({ content: "Select the games to remove:", components: [row] });
            }
        } else if (interaction.isStringSelectMenu()) {
            const pendingGames = readJsonFile('pending-games.json');
            const selectedIndexes = interaction.values.map((value: string) => parseInt(value));
            const newPendingGames = pendingGames.filter((_: any, index: number) => !selectedIndexes.includes(index));
            writeJsonFile('pending-games.json', newPendingGames);

            await interaction.update({ content: "The selected games have been removed from the pending list.", components: [] });
        }
    }
};

export default gamesReviewsCommand;
