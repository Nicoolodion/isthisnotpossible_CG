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

// Function to delete all entries with names starting with 'Filling_'
async function deleteFillingEntries() {
    // Use a transaction for better performance
    db.serialize(() => {
        db.run('BEGIN TRANSACTION;');

        db.run(`DELETE FROM pending_games WHERE name LIKE 'Filling_%';`, (err) => {
            if (err) {
                console.error('Error deleting filling entries:', err);
            } else {
                console.log('Successfully deleted all Filling_ entries.');
            }
            db.run('COMMIT;', (err) => {
                if (err) {
                    console.error('Error committing transaction:', err);
                }
                db.close();
            });
        });
    });
}

deleteFillingEntries();
