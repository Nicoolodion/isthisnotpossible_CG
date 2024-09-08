const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to your SQLite database file
const dbPath = path.join(__dirname, 'games.db');

// Open the database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to the SQLite database.');

    // Delete all entries from the pending_games table
    db.run('DELETE FROM pending_games', function(err) {
        if (err) {
            console.error('Error deleting entries:', err.message);
        } else {
            console.log(`All entries deleted from pending_games table. Rows affected: ${this.changes}`);
        }

        // Close the database connection
        db.close((err) => {
            if (err) {
                console.error('Error closing the database:', err.message);
            } else {
                console.log('Closed the database connection.');
            }
        });
    });
});
