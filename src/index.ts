import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import config from '../config.json';
import gamesAvailableCommand from './commands/gamesAvailable';
import newGamesAddCommand from './commands/newGamesAdd';
import newGamesCommand from './commands/newGames';
import gamesReviewsCommand from './commands/gamesReview';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, // This is usually the only intent needed for interaction commands
        GatewayIntentBits.GuildMessages, // Needed if you are interacting with messages in guilds
        GatewayIntentBits.MessageContent // Needed if your bot is reading message content
    ]
});

client.once('ready', async () => {
    console.log('Bot is online!');

    // Registering commands with Discord
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

    const rest = new REST({ version: '10' }).setToken(config.token);

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
        const { commandName } = interaction;

        if (commandName === 'games-available') {
            await gamesAvailableCommand.execute(interaction);
        } else if (commandName === 'new-games-add') {
            await newGamesAddCommand.execute(interaction);
        } else if (commandName === 'new-games') {
            await newGamesCommand.execute(interaction);
        } else if (commandName === 'games-reviews') {
            await gamesReviewsCommand.execute(interaction);
        }
    } else if (interaction.isButton() || interaction.isSelectMenu()) {
        await gamesReviewsCommand.handleInteraction(interaction);
    }
});

client.login(config.token);
