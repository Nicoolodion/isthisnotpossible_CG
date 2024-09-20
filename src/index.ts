import { config } from 'dotenv';
import { Client, GatewayIntentBits, REST, Routes, TextChannel, EmbedBuilder, Interaction } from 'discord.js';

import newGamesAddCommand from './commands/newGamesAdd';
import gamesReviewsCommand from './commands/gamesReview';
import deleteGamesCommand from './commands/deleteGamesCommand';
import sqlite3 from 'sqlite3';
import { createThread } from './utils/gameInfoManager';
import { sortGamesByName } from './utils/fileUtils';

config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});


// TODO: Maybe delete this and other variable call
const showID = process.env.show_ID === 'true';

client.once('ready', async () => {
    console.log('Bot is online!');

    const commands = [];



    if (true) {
        commands.push(
            {
                name: 'review-games',
                description: 'Review pending games',
                options: []
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
                name: 'delete-games',
                description: 'Delete games from the list',
                options: [
                    {
                        name: 'name',
                        type: 3, // String
                        description: 'Name of the game to delete',
                        required: true,
                    }
                ]
            }
        );
    }

    const rest = new REST({ version: '10' }).setToken(process.env.discord_bot_token!);

    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(Routes.applicationCommands(client.user?.id || ''), { body: commands });

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }

    await createThread(client);

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
        const input = options.get('name') ? `${options.get('name')?.value}` : undefined;
        const reason = options.get('reason') ? `${options.get('reason')?.value}` : undefined;

        const channelId = process.env.channel_id;
        let channel;
        if (channelId) {
            channel = client.channels.cache.get(channelId) as TextChannel;
        }

        if (commandName === 'new-games-add') {
            await newGamesAddCommand.execute(interaction);
            sortGamesByName();
            await createThread(client);
        } else if (commandName === 'review-games') {
            await gamesReviewsCommand.execute(interaction);
            sortGamesByName();
            await createThread(client);
        } else if (commandName === 'delete-games') {
            await deleteGamesCommand.execute(interaction);
            await createThread(client);
        }

    } else if (interaction.isButton() || interaction.isSelectMenu()) {
        const { customId, user } = interaction;
        const username = user.username;
        const userId = user.id;

        if (customId === 'override-add') {
            await newGamesAddCommand.handleInteraction(interaction);
        } else if (customId === 'approve' || customId === 'remove' || customId === 'remove-select') {
            await gamesReviewsCommand.handleInteraction(interaction);
        } else if (customId === 'close' || customId === 'confirm-delete' || customId === 'delete-select') {  
            await deleteGamesCommand.handleInteraction(interaction);
        }

    }
});


client.login(process.env.discord_bot_token);

export { client };
