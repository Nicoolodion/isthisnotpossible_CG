"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const discord_js_1 = require("discord.js");
const gamesAvailable_1 = __importDefault(require("./commands/gamesAvailable"));
const newGamesAdd_1 = __importDefault(require("./commands/newGamesAdd"));
const newGames_1 = __importDefault(require("./commands/newGames"));
const gamesReview_1 = __importDefault(require("./commands/gamesReview"));
(0, dotenv_1.config)();
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent
    ]
});
// Log a message to the specified log channel
function logToChannel(interaction, action, input, reason) {
    return __awaiter(this, void 0, void 0, function* () {
        const logChannelId = process.env.log_channel_id;
        const channel = yield client.channels.fetch(logChannelId);
        if (channel) {
            const embed = new discord_js_1.EmbedBuilder()
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
            yield channel.send({ embeds: [embed] });
        }
        else {
            console.error('Log channel not found.');
        }
    });
}
// Get whether to show user IDs from environment variable
const showID = process.env.show_ID === 'true';
client.once('ready', () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
    const rest = new discord_js_1.REST({ version: '10' }).setToken(process.env.discord_bot_token);
    try {
        console.log('Started refreshing application (/) commands.');
        yield rest.put(discord_js_1.Routes.applicationCommands(((_a = client.user) === null || _a === void 0 ? void 0 : _a.id) || ''), { body: commands });
        console.log('Successfully reloaded application (/) commands.');
    }
    catch (error) {
        console.error(error);
    }
}));
client.on('interactionCreate', (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c;
    if (interaction.isCommand()) {
        const { commandName, user, options } = interaction;
        const username = user.username;
        const userId = user.id;
        // Format the action and input for the embed
        const action = showID
            ? `\`/${commandName}\` (ID: ${userId})`
            : `\`/${commandName}\``;
        const input = options.get('name') ? `**${(_b = options.get('name')) === null || _b === void 0 ? void 0 : _b.value}**` : undefined;
        const reason = options.get('reason') ? `**${(_c = options.get('reason')) === null || _c === void 0 ? void 0 : _c.value}**` : undefined;
        if (commandName === 'games-available') {
            yield gamesAvailable_1.default.execute(interaction);
            yield logToChannel(interaction, action, input, reason);
        }
        else if (commandName === 'new-games-add') {
            yield newGamesAdd_1.default.execute(interaction);
            yield logToChannel(interaction, action, input, reason);
        }
        else if (commandName === 'new-games') {
            yield newGames_1.default.execute(interaction);
            yield logToChannel(interaction, action, input, reason);
        }
        else if (commandName === 'games-reviews') {
            yield gamesReview_1.default.execute(interaction);
            yield logToChannel(interaction, action, input);
        }
    }
    else if (interaction.isButton() || interaction.isSelectMenu()) {
        const { customId, user } = interaction;
        const username = user.username;
        const userId = user.id;
        let action;
        if (customId === 'override-add') {
            yield newGamesAdd_1.default.handleInteraction(interaction);
            action = showID
                ? `override-add button (ID: ${userId})`
                : `override-add button`;
        }
        else if (customId === 'override-add-pending') {
            yield newGames_1.default.handleInteraction(interaction);
            action = showID
                ? `override-add-pending button (ID: ${userId})`
                : `override-add-pending button`;
        }
        else {
            yield gamesReview_1.default.handleInteraction(interaction);
            action = showID
                ? `games-reviews button (ID: ${userId})`
                : `games-reviews button`;
        }
        yield logToChannel(interaction, action);
    }
}));
client.login(process.env.discord_bot_token);
