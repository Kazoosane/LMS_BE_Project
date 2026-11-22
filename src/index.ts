import "dotenv/config";
import express from "express";
import bcrypt from "bcrypt";
import cors from "cors";
import { Pool } from "pg";
import  { validateRegister} from './validators/register'

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1
});

app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use(express.json());

// Ambil semua produk dari database
app.get("/api/posts", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, title, description, created_at FROM post"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Gagal mengambil data kursus:", error);
    res.status(500).json({
        message: "gagal mengambil data kursus"
    });
  }
});

app.post("/api/login", async(_req, res) => {
    try {
        const { username, email, password } = _req.body;
        let errors: string[] = [];

        if(typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
            errors.push('input wajib berupa teks/string');
            res.status(400).json({
                message: 'login gagal',
                errors: errors
            })
        }

        if(username === '') {
            errors.push('nama pengguna wajib diisi')
            res.status(400).json({
                message: 'login gagal',
                errors: errors
            })
        } else if(email === '') {
            errors.push('email wajib diisi')
            res.status(400).json({
                message: 'login gagal',
                errors: errors
            })
        }

        if(username !== "Hadi" || email !== 'hadisumanjaya282@gmail.com' || password !== 'hadi123') {
            return res.status(401).json({
                message: 'login gagal',
                error: 'nama pengguna tidak sesuai'
            })
        }

        return res.json({
            message: 'berhasil login',
            data: {
                username,
                email
            }
        })
    } catch(error) {
        console.error('Gagal login: ', error);
        res.status(500).json({
            message: "gagal login"
        })
    }
})

app.post("/api/register", async(_req, res) => {
    try {
        const { errors, values } = validateRegister(_req.body)

        if(errors.length > 0) {
            return res.status(400).json({
                message: 'register gagal',
                error: errors[0],
                errors
            })
        }

        const existing = await pool.query(
            "SELECT username, email FROM users WHERE username=$1 AND email=$2 LIMIT 1",
            [values.username, values.email]
        )

        if(existing.rows.length > 0) {
            const row = existing.rows[0]

            let error = ''
            if(row.username === values.username) {
                error = 'nama pengguna sudah digunakan'
            }
            return res.status(409).json({
                message: 'register gagal',
                error: error
            })
        }

        const passwordHash = await bcrypt.hash(values.password, 10)

        const result = await pool.query('INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email', [values.username, values.email, passwordHash]
        )

        return res.status(201).json({
            message: 'berhasil register',
            data: result.rows[0]
        })
    } catch(error) {
        console.error('gagal register: ', error)
        return res.status(500).json({
            message: 'gagal register',
            error: error
        })
    }
})

app.post("/api/posts", async(_req, res) => {
    try {
        const { title, description } = _req.body;

        if(!title || typeof title !== "string") {
            res.status(400).json({
                message: "title wajib diisi"
            });
        }

        const result = await pool.query(
            "INSERT INTO post (title, description) VALUES($1, $2) RETURNING id, title, description", [title, description ?? null]
        )

        res.status(201).json({
            message: "berhasil menambahkan kursus",
            data: result.rows[0]
        });
    } catch(error) {
        console.error('Gagal menambah post: ', error);
        res.status(500).json({
            message: "gagal menambah data posts"
        });
    }
})

app.get('/api/posts/:id', async(_req, res) => {
    try {
        const id: number = Number(_req.params.id);

        const result = await pool.query(
            "SELECT title, description, created_at FROM post WHERE id=$1",
            [id]
        )

        if(!id || typeof id !== 'number' || id < 1) {
            res.status(400).json({
                message: "id tidak valid."
            })
        }

        if(!result || result.rowCount === 0) {
            res.status(404).json({
                message: "kursus tidak ditemukan."
            })
        }
        
        res.json({
            message: "berhasil melihat detail kursus.",
            data: result.rows[0]
        })
    } catch(error) {
        console.error("Gagal melihat detail kursus.");
        res.status(500).json({
            message: "gagal melihat detail kursus"
        })

    }
})

app.put('/api/posts/:id', async(_req, res) => {
    try {
        const id = Number(_req.params.id);
        const { title, description } = _req.body;
        
        if(!id || typeof id !== 'number' || id < 1) {
            res.status(400).json({
                message: "id tidak valid."
            });
        }
        
        const result = await pool.query(
            "SELECT id, title, description FROM post WHERE id=$1",
            [id]
        )

        if(!result || result.rowCount === 0) {
            res.status(404).json({
                message: "kursus tidak ditemukan."
            })
        }

        const insert = await pool.query(
            "UPDATE post SET title=$1, description=$2 WHERE id=$3",
            [title, description, id]
        )

        res.json({
            message: "berhasil mengubah data kursus",
            data: result.rows[0]
        })
    } catch(error) {
        console.error('Gagal melihat detail kursus');
        res.status(500).json({
            message: "gagal mengubah kursus"
        })
    }
})

if(!process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`[development] Server berjalan di http://localhost:${PORT}`)
    });
}

export default app;