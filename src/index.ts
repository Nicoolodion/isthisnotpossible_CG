import { config } from 'dotenv';
import { Client, GatewayIntentBits, REST, Routes, TextChannel, EmbedBuilder, Interaction } from 'discord.js';
import gamesAvailableCommand from './commands/gamesAvailable';
import newGamesAddCommand from './commands/newGamesAdd';
import newGamesCommand from './commands/newGames';
import gamesReviewsCommand from './commands/gamesReview';

config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Log a message to the specified log channel
async function logToChannel(interaction: Interaction, action: string, input?: string, reason?: string) {
    const logChannelId = process.env.log_channel_id!;
    const channel = await client.channels.fetch(logChannelId) as TextChannel;
    if (channel) {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
            .addFields({ name: 'Action', value: action, inline: true })
            .setTimestamp();

        if (input) {
            embed.addFields({ name: 'Input', value: input, inline: true });
        }

        if (reason) {
            embed.addFields({ name: 'Reason', value: reason, inline: true });
        }

        await channel.send({ embeds: [embed] });
    } else {
        console.error('Log channel not found.');
    }
}

// Get whether to show user IDs from environment variable
const showID = process.env.show_ID === 'true';

client.once('ready', async () => {
    console.log('Bot is online!');

    const commands = [
        {
            name: 'games-available',
            description: 'Check if a game can be cracked',
            options: [
                {
                    name: 'name',
                    type: 3, // String
                    description: 'Name of the game',
                    required: true,
                }
            ]
        },
        {
            name: 'new-games-add',
            description: 'Add a new game to the list',
            options: [
                {
                    name: 'name',
                    type: 3, // String
                    description: 'Name of the game',
                    required: true,
                },
                {
                    name: 'reason',
                    type: 3, // String
                    description: 'Reason why the game can\'t be cracked',
                    required: false,
                }
            ]
        },
        {
            name: 'new-games',
            description: 'Submit a game for review',
            options: [
                {
                    name: 'name',
                    type: 3, // String
                    description: 'Name of the game',
                    required: true,
                },
                {
                    name: 'reason',
                    type: 3, // String
                    description: 'Reason for submission',
                    required: false,
                }
            ]
        },
        {
            name: 'games-reviews',
            description: 'Review pending games',
            options: []
        }
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.discord_bot_token!);

    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(Routes.applicationCommands(client.user?.id || ''), { body: commands });

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        const { commandName, user, options } = interaction;
        const username = user.username;
        const userId = user.id;

        // Format the action and input for the embed
        const action = showID
            ? `\`/${commandName}\` (ID: ${userId})`
            : `\`/${commandName}\``;
        const input = options.get('name') ? `**${options.get('name')?.value}**` : undefined;
        const reason = options.get('reason') ? `**${options.get('reason')?.value}**` : undefined;

        if (commandName === 'games-available') {
            await gamesAvailableCommand.execute(interaction);
            await logToChannel(interaction, action, input, reason);
        } else if (commandName === 'new-games-add') {
            await newGamesAddCommand.execute(interaction);
            await logToChannel(interaction, action, input, reason);
        } else if (commandName === 'new-games') {
            await newGamesCommand.execute(interaction);
            await logToChannel(interaction, action, input, reason);
        } else if (commandName === 'games-reviews') {
            await gamesReviewsCommand.execute(interaction);
            await logToChannel(interaction, action, input);
        }
    } else if (interaction.isButton() || interaction.isSelectMenu()) {
        const { customId, user } = interaction;
        const username = user.username;
        const userId = user.id;

        let action;
        if (customId === 'override-add') {
            await newGamesAddCommand.handleInteraction(interaction);
            action = showID
                ? `override-add button (ID: ${userId})`
                : `override-add button`;
        } else if (customId === 'override-add-pending') {
            await newGamesCommand.handleInteraction(interaction);
            action = showID
                ? `override-add-pending button (ID: ${userId})`
                : `override-add-pending button`;
        } else {
            await gamesReviewsCommand.handleInteraction(interaction);
            action = showID
                ? `games-reviews button (ID: ${userId})`
                : `games-reviews button`;
        }

        await logToChannel(interaction, action);
    }
});

client.login(process.env.discord_bot_token);
