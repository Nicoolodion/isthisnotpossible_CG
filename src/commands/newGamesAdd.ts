import { CommandInteraction } from 'discord.js';
import { checkPermissions } from '../utils/permissions';
import { addGame } from '../utils/gameUtils';
import config from '../../config.json';

const newGamesAddCommand = {
    execute: async (interaction: CommandInteraction) => {
        const userRoles = interaction.member?.roles as any;
        if (!checkPermissions(userRoles, config.roles.uploader) && !checkPermissions(userRoles, config.roles.admin)) {
            await interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
            return;
        }

        const gameName = interaction.options.get('name')?.value as string;
        const reason = interaction.options.get('reason')?.value as string | null;

        if (!gameName) {
            await interaction.reply({ content: "Please provide a game name.", ephemeral: true });
            return;
        }

        addGame({ name: gameName, cracked: false, reason });
        await interaction.reply({ content: `${gameName} has been added to the list.`, ephemeral: true });
    },
};

export default newGamesAddCommand;