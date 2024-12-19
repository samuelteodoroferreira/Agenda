import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 3000;
const db = new sqlite3.Database('./db.sqlite3');

// Middleware para aceitar JSON no body
app.use(express.json());

// Configuração do caminho estático para servir os arquivos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// HTML estático embutido
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Populando Banco de Dados</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    background-color: #f9f9f9;
                    color: #333;
                }
                h1 {
                    text-align: center;
                    color: #555;
                }
                .cadArea {
                    max-width: 400px;
                    margin: 0 auto;
                    background: #fff;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: bold;
                }
                input {
                    width: 100%;
                    padding: 8px;
                    margin-bottom: 16px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
                button {
                    width: 100%;
                    padding: 10px;
                    background-color: #007BFF;
                    color: #fff;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                button:hover {
                    background-color: #0056b3;
                }
                table {
                    width: 100%;
                    margin-top: 20px;
                    border-collapse: collapse;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: #f4f4f4;
                }
                #loading {
                    text-align: center;
                    color: red;
                    font-weight: bold;
                    margin-top: 10px;
                }
            </style>
        </head>
        <body>
            <h1>Recepção de Dados</h1>
            <div class="cadArea">
                <form id="Cadastro" onsubmit="event.preventDefault(); cadastrar();">
                    <label for="nome">Nome:</label>
                    <input type="text" id="nome" name="nome" required>

                    <label for="phone">Telefone:</label>
                    <input type="text" id="phone" name="phone" required placeholder="Ex.: 11-912345678">

                    <button type="submit">Registrar</button>
                </form>
            </div>

            <button type="button" onclick="atualizarTabela()">Carregar Dados</button>
            <div id="loading" style="display: none;">Carregando...</div>
            <table id="data-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Telefone</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            </table>

            <script>
                // Validação de telefone aceita "XX-XXXXXXXXX" ou "XXXXXXXXXXX"
                function validarTelefone(phone) {
                    const regex = /^\\d{2}-\\d{9}$|^\\d{11}$/;
                    return regex.test(phone);
                }

                async function cadastrar() {
                    const nome = document.getElementById('nome').value;
                    const phone = document.getElementById('phone').value;

                    if (!validarTelefone(phone)) {
                        alert('Por favor, insira um telefone no formato válido (XX-XXXXXXXXX ou XXXXXXXXXXX).');
                        return;
                    }

                    try {
                        const response = await fetch('/cadastrar', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: nome, phone: phone }),
                        });

                        if (!response.ok) {
                            throw new Error('Erro ao cadastrar.');
                        }

                        const data = await response.json();
                        alert('Estudante cadastrado com sucesso!');
                        atualizarTabela();
                    } catch (error) {
                        console.error('Erro:', error);
                    }
                }

                async function atualizarTabela() {
                    document.getElementById('loading').style.display = 'block';
                    try {
                        const response = await fetch('/students');
                        const students = await response.json();

                        const tableBody = document.getElementById('data-table').getElementsByTagName('tbody')[0];
                        tableBody.innerHTML = '';
                        students.forEach(student => {
                            const row = tableBody.insertRow();
                            const nameCell = row.insertCell(0);
                            const phoneCell = row.insertCell(1);
                            nameCell.textContent = student.name;
                            phoneCell.textContent = student.phone;
                        });
                    } catch (error) {
                        console.error('Erro ao carregar dados:', error);
                    } finally {
                        document.getElementById('loading').style.display = 'none';
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// Criar tabela no banco
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL
    )`, (err) => {
        if (err) {
            console.error("Erro ao criar tabela:", err);
        }
    });
});

// Rota para cadastrar estudante
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

// Rota para buscar estudantes
app.get('/students', (req, res) => {
    db.all('SELECT * FROM students', (err, rows) => {
        if (err) {
            return res.status(500).send('Erro ao buscar estudantes.');
        }
        res.json(rows);
    });
});

// Rota para buscar estudantes
app.path('/students', (req, res) => {
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
