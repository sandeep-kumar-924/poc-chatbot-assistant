require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.connect((err) => {
  if (err) {
    console.error("Failed to connect to PostgreSQL:", err.message);
  } else {
    console.log("Connected to PostgreSQL");
  }
});

// OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Schema context sent to the model as the system prompt
const SYSTEM_PROMPT = `
You are a PostgreSQL expert. The database schema is:
Schema name: cts

1. cts.customers
   - customer_id  UUID PRIMARY KEY
   - first_name   VARCHAR(50)
   - last_name    VARCHAR(50)
   - email        VARCHAR(100) UNIQUE
   - phone        VARCHAR(20)
   - created_at   TIMESTAMP

2. cts.products
   - product_id     UUID PRIMARY KEY
   - sku            VARCHAR(20) UNIQUE
   - product_name   VARCHAR(100)
   - category       VARCHAR(50)
   - unit_price     DECIMAL(10,2)
   - stock_quantity INTEGER

3. cts.invoices
   - invoice_id     UUID PRIMARY KEY
   - customer_id    UUID -> cts.customers
   - invoice_date   TIMESTAMP
   - total_amount   DECIMAL(12,2)
   - tax_amount     DECIMAL(12,2)
   - payment_method VARCHAR(20)
   - metadata       JSONB

4. cts.invoice_items
   - item_id    UUID PRIMARY KEY
   - invoice_id UUID -> cts.invoices (ON DELETE CASCADE)
   - product_id UUID -> cts.products
   - quantity   INTEGER
   - line_total DECIMAL(12,2)

Rules:
- Always prefix table names with "cts."
- Write safe read-only SELECT queries only.
- Never write INSERT, UPDATE, DELETE, DROP, TRUNCATE, or DDL.
- Return ONLY a raw JSON object — no markdown fences, no extra text.
- always hide personally identifiable information (PII) like email and phone by replacing them with 'REDACTED'.
- do not show uuid values

Response format:
{
  "answer": "Plain-English explanation of what the query does.",
  "sql": "SELECT ... FROM cts. ...",
  "is_safe": true
}
`;

// POST /api/chat
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array is required" });
  }

  try {
    // 1. Ask OpenAI to generate SQL
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
      temperature: 0,
    });

    const raw = completion.choices[0].message.content || "";

    let parsed;
    try {
      const clean = raw.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      return res.json({
        answer: "Could not parse a structured response. Please rephrase.",
        sql: null, rows: [], columns: [],
      });
    }

    // 2. Run the SQL if it is safe
    let rows = [], columns = [], dbError = null;
    if (parsed.sql && parsed.is_safe) {
      try {
        const result = await pool.query(parsed.sql);
        rows = result.rows;
        columns = result.fields.map((f) => f.name);
      } catch (err) {
        dbError = err.message;
      }
    }

    return res.json({
      answer: parsed.answer,
      sql: parsed.sql || null,
      columns,
      rows,
      dbError: dbError || null,
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/health
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch {
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

console.log("Server initialization complete");
process.on("exit", (code) => console.log(`Process exiting with code ${code}`));