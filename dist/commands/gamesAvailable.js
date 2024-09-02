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
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const permissions_1 = require("../utils/permissions");
const gameUtils_1 = require("../utils/gameUtils");
(0, dotenv_1.config)();
const gamesAvailableCommand = {
    execute: (interaction) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        const userRoles = (_a = interaction.member) === null || _a === void 0 ? void 0 : _a.roles;
        if (!(0, permissions_1.checkPermissions)(userRoles, (_b = process.env.team) !== null && _b !== void 0 ? _b : '')) {
            yield interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
            return;
        }
        const gameName = (_c = interaction.options.get('name')) === null || _c === void 0 ? void 0 : _c.value;
        if (!gameName) {
            yield interaction.reply({ content: "Please provide a game name.", ephemeral: true });
            return;
        }
        const games = (0, gameUtils_1.searchGames)(gameName);
        if (games.length === 0) {
            yield interaction.reply({ content: "Nothing has been found.", ephemeral: true });
        }
        else if (games.length > 3) {
            yield interaction.reply({ content: "Too many results found. Please be more specific.", ephemeral: true });
        }
        else {
            const replyMessage = games
                .slice(0, 3) // Only show up to 3 results
                .map(game => `**Game:** \`${game.name}\`\n**Cracked:** ${game.cracked ? '✅ Yes' : '❌ No'}${game.reason ? `\n**Reason:** ${game.reason}` : ''}`)
                .join('\n\n'); // Separate each game with a double newline for readability
            yield interaction.reply({ content: replyMessage, ephemeral: true });
        }
    }),
};
exports.default = gamesAvailableCommand;
