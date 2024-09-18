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
exports.client = void 0;
const dotenv_1 = require("dotenv");
const discord_js_1 = require("discord.js");
const newGamesAdd_1 = __importDefault(require("./commands/newGamesAdd"));
const gamesReview_1 = __importDefault(require("./commands/gamesReview"));
const deleteGamesCommand_1 = __importDefault(require("./commands/deleteGamesCommand"));
const gameInfoManager_1 = require("./utils/gameInfoManager");
(0, dotenv_1.config)();
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent
    ]
});
exports.client = client;
// TODO: Maybe delete this and other variable call
const showID = process.env.show_ID === 'true';
client.once('ready', () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log('Bot is online!');
    const commands = [];
    if (true) {
        commands.push({
            name: 'review-games',
            description: 'Review pending games',
            options: []
        }, {
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
        }, {
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
        });
    }
    const rest = new discord_js_1.REST({ version: '10' }).setToken(process.env.discord_bot_token);
    try {
        console.log('Started refreshing application (/) commands.');
        yield rest.put(discord_js_1.Routes.applicationCommands(((_a = client.user) === null || _a === void 0 ? void 0 : _a.id) || ''), { body: commands });
        console.log('Successfully reloaded application (/) commands.');
    }
    catch (error) {
        console.error(error);
    }
    yield (0, gameInfoManager_1.createThread)(client);
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
        const input = options.get('name') ? `${(_b = options.get('name')) === null || _b === void 0 ? void 0 : _b.value}` : undefined;
        const reason = options.get('reason') ? `${(_c = options.get('reason')) === null || _c === void 0 ? void 0 : _c.value}` : undefined;
        const channelId = process.env.channel_id;
        let channel;
        if (channelId) {
            channel = client.channels.cache.get(channelId);
        }
        if (commandName === 'new-games-add') {
            yield newGamesAdd_1.default.execute(interaction);
            yield (0, gameInfoManager_1.createThread)(client);
        }
        else if (commandName === 'review-games') {
            yield gamesReview_1.default.execute(interaction);
            yield (0, gameInfoManager_1.createThread)(client);
        }
        else if (commandName === 'delete-games') {
            yield deleteGamesCommand_1.default.execute(interaction);
            yield (0, gameInfoManager_1.createThread)(client);
        }
    }
    else if (interaction.isButton() || interaction.isSelectMenu()) {
        const { customId, user } = interaction;
        const username = user.username;
        const userId = user.id;
        if (customId === 'override-add') {
            yield newGamesAdd_1.default.handleInteraction(interaction);
        }
        else if (customId === 'approve' || customId === 'remove' || customId === 'remove-select') {
            yield gamesReview_1.default.handleInteraction(interaction);
        }
        else if (customId === 'close' || customId === 'confirm-delete' || customId === 'delete-select') {
            yield deleteGamesCommand_1.default.handleInteraction(interaction);
        }
    }
}));
client.login(process.env.discord_bot_token);
