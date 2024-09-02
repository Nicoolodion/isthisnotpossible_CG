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
const discord_js_1 = require("discord.js");
const config_json_1 = __importDefault(require("../config.json"));
const gamesAvailable_1 = __importDefault(require("./commands/gamesAvailable"));
const newGamesAdd_1 = __importDefault(require("./commands/newGamesAdd"));
const newGames_1 = __importDefault(require("./commands/newGames"));
const gamesReview_1 = __importDefault(require("./commands/gamesReview"));
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds, // This is usually the only intent needed for interaction commands
        discord_js_1.GatewayIntentBits.GuildMessages, // Needed if you are interacting with messages in guilds
        discord_js_1.GatewayIntentBits.MessageContent // Needed if your bot is reading message content
    ]
});
client.once('ready', () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
    const rest = new discord_js_1.REST({ version: '10' }).setToken(config_json_1.default.token);
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
    if (interaction.isCommand()) {
        const { commandName } = interaction;
        if (commandName === 'games-available') {
            yield gamesAvailable_1.default.execute(interaction);
        }
        else if (commandName === 'new-games-add') {
            yield newGamesAdd_1.default.execute(interaction);
        }
        else if (commandName === 'new-games') {
            yield newGames_1.default.execute(interaction);
        }
        else if (commandName === 'games-reviews') {
            yield gamesReview_1.default.execute(interaction);
        }
    }
    else if (interaction.isButton() || interaction.isSelectMenu()) {
        if (interaction.customId === 'override-add') {
            yield newGamesAdd_1.default.handleInteraction(interaction);
        }
        else if (interaction.customId === 'override-add-pending') {
            yield newGames_1.default.handleInteraction(interaction);
        }
        yield gamesReview_1.default.handleInteraction(interaction);
    }
}));
client.login(config_json_1.default.token);
