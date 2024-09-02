import { config } from 'dotenv';
import { CommandInteraction, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import { checkPermissions } from '../utils/permissions';
import { readJsonFile, writeJsonFile } from '../utils/fileUtils';

config();

const newGamesAddCommand = {
    execute: async (interaction: CommandInteraction) => {
        const userRoles = interaction.member?.roles as any;
        const expectedAdminUserId = process.env.expection_admin_userID;
        if (!checkPermissions(userRoles, process.env.admin ?? '') && !checkPermissions(userRoles, process.env.uploader ?? '') && interaction.user.id !== expectedAdminUserId) {
            await interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
            return;
        }

        const gameName = interaction.options.get('name')?.value as string;
        const reason = interaction.options.get('reason')?.value as string | null;
        const games = readJsonFile('games.json');
        const isGameOnList = games.some((game: any) => game.name.toLowerCase() === gameName.toLowerCase());

        if (isGameOnList) {
            const overrideButton = new ButtonBuilder()
                .setCustomId('override-add')
                .setLabel('Add Anyway ✅')
                .setStyle(ButtonStyle.Success);

            const row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(overrideButton);

            await interaction.reply({
                content: `The game \`${gameName}\` is already on the list. Reason provided: \`${reason}\`.`,
                components: [row],
                ephemeral: true
            });
        } else {
            const newGame = {
                name: gameName,
                cracked: false,
                reason: reason
            };

            games.push(newGame);
            writeJsonFile('games.json', games);

            await interaction.reply({ content: `The game \`${gameName}\` has been added to the list.`, ephemeral: true });
        }
    },

    handleInteraction: async (interaction: any) => {
        if (interaction.isButton() && interaction.customId === 'override-add') {
            // Extract the game name and reason from the message content
            const gameNameMatch = interaction.message.content.match(/`(.*?)`/);
            const reasonMatch = interaction.message.content.match(/Reason provided: `([^`]*)`/);
            const gameName = gameNameMatch ? gameNameMatch[1] : null;
            const reason = reasonMatch ? reasonMatch[1] : 'No reason provided';

            if (!gameName) {
                await interaction.reply({ content: 'Error: Game name could not be determined.', ephemeral: true });
                return;
            }

            const newGame = {
                name: gameName,
                cracked: false,
                ...(reason.trim() && reason.trim() !== 'No reason provided' ? { reason: reason.trim() } : {})
            };

            const games = readJsonFile('games.json');
            games.push(newGame);
            writeJsonFile('games.json', games);

            await interaction.update({ content: `The game \`${gameName}\` has been added to the list despite being already present.`, components: [] });
        }
    }
};

export default newGamesAddCommand;