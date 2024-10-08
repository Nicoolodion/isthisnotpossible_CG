import { config } from 'dotenv';
import { CommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { checkPermissions } from '../utils/permissions';
import { loadGames, addGame, addPendingGame } from '../utils/gameUtils';


config();

const newGamesAddCommand = {
    execute: async (interaction: CommandInteraction) => {
        const userRoles = interaction.member?.roles as any;
        const { adminUserId } = require('../data/permissions.json');
        const overrides = require('../data/permissions.json').overrides['new-games-add'];
        const allowedUserIds = overrides.allow;
        const disabledUserIds = overrides.deny;

        const hasTeamRole = checkPermissions(userRoles, process.env.team ?? '');
        const hasUploaderOrAdminRole = checkPermissions(userRoles, process.env.admin ?? '') || checkPermissions(userRoles, process.env.uploader ?? '') || allowedUserIds.includes(interaction.user.id);

        if (disabledUserIds.includes(interaction.user.id) || (!hasTeamRole && !hasUploaderOrAdminRole && interaction.user.id !== adminUserId)) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription('You don\'t have permission to use this command.');
            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        const gameName = interaction.options.get('name')?.value as string;
        const reason = interaction.options.get('reason')?.value as string | null;

        let targetFile, alreadyOnListMessage, addedMessage;
        if (hasTeamRole && !hasUploaderOrAdminRole) {
            targetFile = 'pending-games.json';
            alreadyOnListMessage = `The game \`${gameName}\` is already on the Pending list.`;
            addedMessage = `The game \`${gameName}\` has been Submitted for Review.`;
        } else {
            targetFile = 'games.json';
            alreadyOnListMessage = `The game \`${gameName}\` is already on the list.`;
            addedMessage = `The game \`${gameName}\` has been added to the list.`;
        }

        const gamesList = await loadGames();
        const isGameOnList = gamesList.some((game: any) => game.name.toLowerCase() === gameName.toLowerCase());

        if (isGameOnList) {
            //const overrideButton = new ButtonBuilder()
            //    .setCustomId(`override-add-${hasTeamRole && !hasUploaderOrAdminRole ? 'pending' : ''}`)
            //    .setLabel('Add Anyway ✅')
            //    .setStyle(ButtonStyle.Success);

            //const row = new ActionRowBuilder<ButtonBuilder>()
            //    .addComponents(overrideButton);

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription(`${alreadyOnListMessage} Reason provided: \`${reason || 'No reason provided'}\`.`);
            await interaction.reply({
                embeds: [embed],
            //    components: [row],
                ephemeral: true
            });
        } else {
            const newGame = {
                name: gameName,
                cracked: false,
                reason: reason
            };

            if (hasTeamRole && !hasUploaderOrAdminRole) {
                await addPendingGame(newGame);
            } else {
                await addGame(newGame);
            }

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle(`**${hasTeamRole && !hasUploaderOrAdminRole ? 'Game Submitted for Review!' : 'Game Added!'}**`)
                .setDescription(addedMessage)
                .setFooter({ text: 'Thanks for contributing!' })
                .setTimestamp()
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },

    handleInteraction: async (interaction: any) => {
        if (interaction.isButton()) {
            const customId = interaction.customId
            const isPendingOverride = customId === 'override-add-pending';

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
                reason: reason.trim() || 'No reason provided'
              };

            const targetFile = isPendingOverride ? 'pending-games.json' : 'games.json';
            if (isPendingOverride) {
                await addPendingGame(newGame);
            } else {
                await addGame(newGame);
            }
            await interaction.update({ content: `The game \`${gameName}\` has been added to the ${isPendingOverride ? 'pending list' : 'list'} despite being already present.`, components: [] });
        }
    }
};

export default newGamesAddCommand;
