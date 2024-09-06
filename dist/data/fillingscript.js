const sqlite3 = require('sqlite3');
const path = require('path');

// Open the SQLite database connection
const dbPath = path.resolve(__dirname, '../../dist/data/games.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Function to generate random cracked status and reason
function getRandomCrackedStatus() {
    return Math.random() < 0.5; // 50% chance
}

function getRandomReason() {
    const reasons = ['Corrupted file', 'Unstable build', 'Version mismatch', 'Not compatible'];
    return reasons[Math.floor(Math.random() * reasons.length)];
}

// Function to populate the database with 1000 games
async function populateDatabase() {
    // Use a transaction to batch inserts for better performance
    db.serialize(() => {
        db.run('BEGIN TRANSACTION;');
        const stmt = db.prepare('INSERT INTO games (name, cracked, reason) VALUES (?, ?, ?)');

        for (let i = 1; i <= 50000; i++) {
            const name = `Filling_${i}`;
            const cracked = getRandomCrackedStatus();
            const reason = getRandomCrackedStatus() ? getRandomReason() : null;
            stmt.run(name, cracked, reason);
        }

        stmt.finalize();
        db.run('COMMIT;', (err) => {
            if (err) {
                console.error('Error committing transaction:', err);
            } else {
                console.log('Successfully populated database with 1000 games.');
            }
            db.close();
        });
    });
}

populateDatabase();
