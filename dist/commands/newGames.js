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
const permissions_1 = require("../utils/permissions");
const gameUtils_1 = require("../utils/gameUtils");
const config_json_1 = __importDefault(require("../../config.json"));
const newGamesCommand = {
    execute: (interaction) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        const userRoles = (_a = interaction.member) === null || _a === void 0 ? void 0 : _a.roles;
        if (!(0, permissions_1.checkPermissions)(userRoles, config_json_1.default.roles.team)) {
            yield interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
            return;
        }
        const gameName = (_b = interaction.options.get('name')) === null || _b === void 0 ? void 0 : _b.value;
        const reason = (_c = interaction.options.get('reason')) === null || _c === void 0 ? void 0 : _c.value;
        if (!gameName) {
            yield interaction.reply({ content: "Please provide a game name.", ephemeral: true });
            return;
        }
        (0, gameUtils_1.addPendingGame)({ name: gameName, cracked: false, reason });
        yield interaction.reply({ content: `${gameName} has been submitted for review.`, ephemeral: true });
    }),
};
exports.default = newGamesCommand;
