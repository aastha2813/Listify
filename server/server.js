const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// -----------------------------------------
// NEON POSTGRESQL CONNECTION
// -----------------------------------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // Keep connections alive so every request
  // does not need to establish a new connection.
  max: 10,
  min: 1,

  idleTimeoutMillis: 30 * 60 * 1000,
  connectionTimeoutMillis: 5000,

  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// -----------------------------------------
// POOL ERROR HANDLER
// -----------------------------------------
pool.on("error", (error) => {
  console.error("Unexpected Neon pool error:", error);
});

// -----------------------------------------
// TEST DATABASE CONNECTION
// -----------------------------------------
app.get("/", async (req, res) => {
  try {
    const start = Date.now();

    const result = await pool.query("SELECT NOW()");

    const duration = Date.now() - start;

    res.json({
      message: "Listify Backend is running!",
      database: "Connected to Neon ✅",
      queryTime: `${duration} ms`,
      time: result.rows[0].now,
    });

  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// -----------------------------------------
// GET ALL ITEMS
// -----------------------------------------
app.get("/api/items", async (req, res) => {
  try {
    const start = Date.now();

    const result = await pool.query(`
      SELECT 
        i.item_id,
        i.category_id,
        c.category_name,
        i.item_name,
        i.quantity,
        i.priority,
        i.note,
        i.is_completed,
        i.created_at
      FROM items i
      JOIN categories c
        ON i.category_id = c.category_id
      ORDER BY i.created_at DESC
    `);

    const duration = Date.now() - start;

    console.log(`GET /api/items → ${duration} ms`);

    res.json(result.rows);

  } catch (error) {
    console.error("Error fetching items:", error);

    res.status(500).json({
      message: "Failed to fetch items",
      error: error.message,
    });
  }
});

// -----------------------------------------
// ADD NEW ITEM
// -----------------------------------------
app.post("/api/items", async (req, res) => {
  try {
    const {
      category_id,
      item_name,
      quantity,
      priority,
      note,
    } = req.body;

    if (!category_id || !item_name) {
      return res.status(400).json({
        message: "Category and item name are required",
      });
    }

    const start = Date.now();

    const result = await pool.query(
      `INSERT INTO items
       (category_id, item_name, quantity, priority, note)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        category_id,
        item_name.trim(),
        quantity || null,
        priority || "Normal",
        note || null,
      ]
    );

    const duration = Date.now() - start;

    console.log(`POST /api/items → ${duration} ms`);

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error("Error adding item:", error);

    res.status(500).json({
      message: "Failed to add item",
      error: error.message,
    });
  }
});

// -----------------------------------------
// TOGGLE TASK COMPLETED / UNCOMPLETED
// -----------------------------------------
app.patch("/api/items/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;

    const start = Date.now();

    const result = await pool.query(
      `UPDATE items
       SET is_completed = NOT is_completed
       WHERE item_id = $1
       RETURNING *`,
      [id]
    );

    const duration = Date.now() - start;

    console.log(`PATCH /api/items/${id}/toggle → ${duration} ms`);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error("Error toggling task:", error);

    res.status(500).json({
      message: "Failed to update task",
      error: error.message,
    });
  }
});

// -----------------------------------------
// DELETE ONE TASK
// -----------------------------------------
app.delete("/api/items/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const start = Date.now();

    const result = await pool.query(
      `DELETE FROM items
       WHERE item_id = $1
       RETURNING *`,
      [id]
    );

    const duration = Date.now() - start;

    console.log(`DELETE /api/items/${id} → ${duration} ms`);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    res.json({
      message: "Task deleted successfully",
      deletedTask: result.rows[0],
    });

  } catch (error) {
    console.error("Error deleting task:", error);

    res.status(500).json({
      message: "Failed to delete task",
      error: error.message,
    });
  }
});

// -----------------------------------------
// CLEAR ALL TASKS IN CURRENT CATEGORY
// -----------------------------------------
app.delete("/api/categories/:categoryId/items", async (req, res) => {
  try {
    const { categoryId } = req.params;

    const start = Date.now();

    const result = await pool.query(
      `DELETE FROM items
       WHERE category_id = $1
       RETURNING *`,
      [categoryId]
    );

    const duration = Date.now() - start;

    console.log(
      `DELETE /api/categories/${categoryId}/items → ${duration} ms`
    );

    res.json({
      message: "All tasks cleared successfully",
      deletedCount: result.rowCount,
    });

  } catch (error) {
    console.error("Error clearing tasks:", error);

    res.status(500).json({
      message: "Failed to clear tasks",
      error: error.message,
    });
  }
});

// -----------------------------------------
// START SERVER + WARM NEON CONNECTION
// -----------------------------------------
const PORT = process.env.PORT || 5000;

// 0.0.0.0 allows Render to access the server
app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Server running on port ${PORT}`);

  try {
    const start = Date.now();

    await pool.query("SELECT 1");

    const duration = Date.now() - start;

    console.log(`Neon connection warmed up in ${duration} ms`);
    console.log("Database connection ready ✅");

  } catch (error) {
    console.error("Could not warm Neon connection:");
    console.error(error.message);
  }
});

// -----------------------------------------
// GRACEFUL SHUTDOWN
// -----------------------------------------
process.on("SIGINT", async () => {
  console.log("\nClosing database connection...");

  await pool.end();

  console.log("Database connection closed.");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await pool.end();
  process.exit(0);
});