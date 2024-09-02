import { CommandInteraction } from 'discord.js';
import { checkPermissions } from '../utils/permissions';
import { addPendingGame } from '../utils/gameUtils';
import config from '../../config.json';

const newGamesCommand = {
    execute: async (interaction: CommandInteraction) => {
        const userRoles = interaction.member?.roles as any;
        if (!checkPermissions(userRoles, config.roles.team)) {
            await interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
            return;
        }

        const gameName = interaction.options.get('name')?.value as string;
        const reason = interaction.options.get('reason')?.value as string | null;

        if (!gameName) {
            await interaction.reply({ content: "Please provide a game name.", ephemeral: true });
            return;
        }

        addPendingGame({ name: gameName, cracked: false, reason });
        await interaction.reply({ content: `${gameName} has been submitted for review.`, ephemeral: true });
    },
};

export default newGamesCommand;