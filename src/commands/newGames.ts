import { config } from 'dotenv';
import { CommandInteraction, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import { checkPermissions } from '../utils/permissions';
import { readJsonFile, writeJsonFile } from '../utils/fileUtils';

config();

const newGamesCommand = {
    execute: async (interaction: CommandInteraction) => {
        const userRoles = interaction.member?.roles as any;
        if (!checkPermissions(userRoles, process.env.team ?? '')) {
            await interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
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

            await interaction.reply({
                content: `The game \`${gameName}\` is already in the pending list. Reason provided: \`${reason || 'No reason provided'}\`.`,
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

            await interaction.reply({ content: `The game \`${gameName}\` has been submitted for review.`, ephemeral: true });
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
        }
    }
};

export default newGamesCommand;
