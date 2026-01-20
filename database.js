// database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');  // Jangan lupa import path

// Tentukan path database berdasarkan environment
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/data/todos.db'           // Untuk production (Render.com)
  : path.join(__dirname, 'todos.db');  // Untuk local development

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Gagal konek ke database:', err.message);
    } else {
        console.log('✅ Terhubung ke database SQLite di:', dbPath);
        initializeDatabase();
    }
});

// Buat tabel jika belum ada
function initializeDatabase() {
    const sql = `
        CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task TEXT NOT NULL,
            completed BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    db.run(sql, (err) => {
        if (err) {
            console.error('❌ Gagal buat tabel:', err.message);
        } else {
            console.log('✅ Tabel todos siap digunakan');
        }
    });
}

module.exports = db;