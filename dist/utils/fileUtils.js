"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeJsonFile = exports.readJsonFile = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Helper function to get the absolute path to the file
function getFilePath(filename) {
    return path_1.default.resolve(__dirname, '../../dist/data', filename);
}
function readJsonFile(filename) {
    const filePath = getFilePath(filename);
    if (!fs_1.default.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return [];
    }
    try {
        const data = fs_1.default.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    }
    catch (error) {
        console.error(`Error reading or parsing file ${filePath}:`, error);
        return [];
    }
}
exports.readJsonFile = readJsonFile;
function writeJsonFile(filename, data) {
    const filePath = getFilePath(filename);
    try {
        fs_1.default.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    }
    catch (error) {
        console.error(`Error writing to file ${filePath}:`, error);
    }
}
exports.writeJsonFile = writeJsonFile;
