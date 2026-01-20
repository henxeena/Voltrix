// database.js 
const sqlite3 = require('sqlite3').verbose();

const dbPath = process.env.NODE_ENV === 'production' 
  ? ':memory:'           // Vercel - data hilang saat sleep
  : './todos.db';       // Local - data tersimpan

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database error:', err.message);
  } else {
    console.log('✅ Connected to', 
      dbPath === ':memory:' 
        ? 'IN-MEMORY SQLite (Vercel)' 
        : 'LOCAL SQLite file'
    );
    
    // Buat tabel
    db.run(`
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task TEXT NOT NULL,
        completed BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Table error:', err.message);
      else console.log('✅ Todos table ready');
    });
  }
});

module.exports = db;