import { config } from 'dotenv';
import { CommandInteraction } from 'discord.js';
import { checkPermissions } from '../utils/permissions';
import { searchGames } from '../utils/gameUtils';

config();

const gamesAvailableCommand = {
    execute: async (interaction: CommandInteraction) => {
        const userRoles = interaction.member?.roles as any;
        if (!checkPermissions(userRoles, process.env.team ?? '')) {
            await interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
            return;
        }

        const gameName = interaction.options.get('name')?.value as string;
        if (!gameName) {
            await interaction.reply({ content: "Please provide a game name.", ephemeral: true });
            return;
        }

        const games = searchGames(gameName);

        if (games.length === 0) {
            await interaction.reply({ content: "Nothing has been found.", ephemeral: true });
        } else if (games.length > 3) {
            await interaction.reply({ content: "Too many results found. Please be more specific.", ephemeral: true });
        } else {
            const replyMessage = games
                .slice(0, 3)  // Only show up to 3 results
                .map(game => `**Game:** \`${game.name}\`\n**Cracked:** ${game.cracked ? '✅ Yes' : '❌ No'}${game.reason ? `\n**Reason:** ${game.reason}` : ''}`)
                .join('\n\n');  // Separate each game with a double newline for readability

            await interaction.reply({ content: replyMessage, ephemeral: true });
        }
    },
};

export default gamesAvailableCommand;