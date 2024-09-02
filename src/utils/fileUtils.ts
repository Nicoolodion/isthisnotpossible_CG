import fs from 'fs';
import path from 'path';

// Helper function to get the absolute path to the file
function getFilePath(filename: string): string {
    return path.resolve(__dirname, '../../dist/data', filename);
}

export function readJsonFile(filename: string) {
    const filePath = getFilePath(filename);
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return [];
    }
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading or parsing file ${filePath}:`, error);
        return [];
    }
}

export function writeJsonFile(filename: string, data: any) {
    const filePath = getFilePath(filename);
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`Error writing to file ${filePath}:`, error);
    }
}