// migrate.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('todos.db');

db.run(`
    ALTER TABLE todos ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
        console.error('Error:', err.message);
    } else {
        console.log('✅ Kolom created_at berhasil ditambahkan');
    }
    db.close();
});