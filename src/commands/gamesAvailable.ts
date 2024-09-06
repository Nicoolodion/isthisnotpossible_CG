import { config } from 'dotenv';
import { CommandInteraction, EmbedBuilder } from 'discord.js';
import { checkPermissions } from '../utils/permissions';
import { searchGames } from '../utils/gameUtils';

config();

const gamesAvailableCommand = {
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
        if (!gameName) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription('Please provide a game name.');
            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        const games = await searchGames(gameName); // Use searchGames to search from the DB

        if (games.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription('Nothing has been found.');
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } else if (games.length > 3) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription('Too many results found. Please be more specific.');
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } else {
            const embed = new EmbedBuilder()
                .setColor('#008000')
                .setDescription(games
                    .slice(0, 3)  // Only show up to 3 results
                    .map(game => `**Game:** \`${game.name}\`\n**Cracked:** ${game.cracked ? '✅ Yes' : '❌ No'}${game.reason ? `\n**Reason:** ${game.reason}` : ''}`)
                    .join('\n\n'));  // Separate each game with a double newline for readability

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};

export default gamesAvailableCommand;
