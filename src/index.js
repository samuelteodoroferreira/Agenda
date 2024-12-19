import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 3000;
const db = new sqlite3.Database('./db.sqlite3');

// Middleware para aceitar JSON no body
app.use(express.json());

// Servir arquivos estáticos da pasta 'public'
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// Criar tabela e inserir seed
db.serialize(() => {
    db.run(`DROP TABLE IF EXISTS students`);
    db.run(`
        CREATE TABLE students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error("Erro ao criar tabela: ", err);
        } else {
            console.log("Tabela 'students' criada com sucesso.");
        }
    });
});

// Rota para inserir um novo estudante
app.post('/cadastrar', (req, res) => {
    const { name, phone } = req.body;
    if (!name || !phone) {
        return res.status(400).send('Nome e telefone são obrigatórios.');
    }

    const stmt = db.prepare('INSERT INTO students (name, phone) VALUES (?, ?)');
    stmt.run(name, phone, function (err) {
        if (err) {
            return res.status(500).send('Erro ao cadastrar estudante.');
        }
        res.status(201).json({ id: this.lastID, name, phone });
    });
});

// Rota para buscar todos os estudantes
app.get('/students', (req, res) => {
    db.all('SELECT * FROM students', (err, rows) => {
        if (err) {
            return res.status(500).send('Erro ao buscar estudantes.');
        }
        res.json(rows);
    });
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});