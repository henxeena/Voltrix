const express = require('express');
const db = require('./database'); // Import database

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('API Todo List dengan Database SQLite berjalan!');
});

app.get('/todos', (req, res) => {
    const { search, completed, page = 1, limit = 10 } = req.query;
    
    let conditions = [];
    let params = [];
    
    if (search) {
        conditions.push('task LIKE ?');
        params.push(`%${search}%`);
    }
    
    if (completed !== undefined) {
        conditions.push('completed = ?');
        params.push(completed === 'true' ? 1 : 0);
    }
    
    const whereClause = conditions.length > 0 
        ? 'WHERE ' + conditions.join(' AND ') 
        : '';
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    
    const countSql = `SELECT COUNT(*) as total FROM todos ${whereClause}`;
    
    const dataSql = `
        SELECT * FROM todos 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
    `;
    
    db.get(countSql, params, (err, countResult) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        const total = countResult.total;
        const totalPages = Math.ceil(total / limitNum);
        
        if (pageNum > totalPages && total > 0) {
            return res.status(400).json({ 
                error: `Halaman ${pageNum} tidak tersedia. Total halaman: ${totalPages}` 
            });
        }
 
        const dataParams = [...params, limitNum, offset];
        
        db.all(dataSql, dataParams, (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            res.json({
                success: true,
                data: rows,
                pagination: {
                    current_page: pageNum,
                    per_page: limitNum,
                    total_data: total,
                    total_pages: totalPages,
                    has_next_page: pageNum < totalPages,
                    has_prev_page: pageNum > 1
                },
                filters: {
                    search: search || null,
                    completed: completed || null
                }
            });
        });
    });
});

app.get('/todos/:id', (req, res) => {
    const sql = 'SELECT * FROM todos WHERE id = ?';
    db.get(sql, [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Todo tidak ditemukan' });
        }
        res.json(row);
    });
});

app.post('/todos', (req, res) => {
    if (!req.body.task || req.body.task.trim() === '') {
        return res.status(400).json({ error: 'Task tidak boleh kosong' });
    }

    const sql = 'INSERT INTO todos (task, completed) VALUES (?, ?)';
    const params = [req.body.task.trim(), req.body.completed || 0];
    
    db.run(sql, params, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        db.get('SELECT * FROM todos WHERE id = ?', [this.lastID], (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json(row);
        });
    });
});

app.put('/todos/:id', (req, res) => {
    if (req.body.task === undefined && req.body.completed === undefined) {
        return res.status(400).json({ error: 'Minimal berikan task atau completed untuk diupdate' });
    }

    let updates = [];
    let params = [];
    
    if (req.body.task !== undefined) {
        if (req.body.task.trim() === '') {
            return res.status(400).json({ error: 'Task tidak boleh kosong' });
        }
        updates.push('task = ?');
        params.push(req.body.task.trim());
    }
    
    if (req.body.completed !== undefined) {
        updates.push('completed = ?');
        params.push(req.body.completed ? 1 : 0);
    }
    
    params.push(req.params.id);
    
    const sql = `UPDATE todos SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    db.run(sql, params, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Todo tidak ditemukan' });
        }
        
        db.get('SELECT * FROM todos WHERE id = ?', [req.params.id], (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(row);
        });
    });
});

app.delete('/todos/:id', (req, res) => {
    db.get('SELECT * FROM todos WHERE id = ?', [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Todo tidak ditemukan' });
        }
        
        db.run('DELETE FROM todos WHERE id = ?', [req.params.id], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ 
                message: 'Todo berhasil dihapus', 
                deleted: row 
            });
        });
    });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Terjadi kesalahan internal server' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    console.log(`💾 Database: todos.db`);
    console.log(`📚 Endpoint tersedia:`);
    console.log(`   GET    /todos     - Ambil semua todo`);
    console.log(`   GET    /todos/:id - Ambil todo spesifik`);
    console.log(`   POST   /todos     - Buat todo baru`);
    console.log(`   PUT    /todos/:id - Update todo`);
    console.log(`   DELETE /todos/:id - Hapus todo`);
});