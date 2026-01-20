const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('todos.db');

// Tambahkan kolom updated_at jika belum ada
db.run(`ALTER TABLE todos ADD COLUMN updated_at TIMESTAMP`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding updated_at:', err.message);
    } else {
        console.log('✅ Kolom updated_at berhasil ditambahkan');
    }
    db.close();
});