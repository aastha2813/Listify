const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Connect to Neon PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// -----------------------------------------
// TEST DATABASE CONNECTION
// -----------------------------------------
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      message: "Listify Backend is running!",
      database: "Connected to Neon ✅",
      time: result.rows[0].now,
    });

  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      message: "Database connection failed",
    });
  }
});

// -----------------------------------------
// GET ALL ITEMS
// -----------------------------------------
app.get("/api/items", async (req, res) => {
  try {
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

    res.json(result.rows);

  } catch (error) {
    console.error("Error fetching items:", error);

    res.status(500).json({
      message: "Failed to fetch items",
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

    const result = await pool.query(
      `INSERT INTO items
       (category_id, item_name, quantity, priority, note)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        category_id,
        item_name,
        quantity || null,
        priority || "Normal",
        note || null,
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error("Error adding item:", error);

    res.status(500).json({
      message: "Failed to add item",
    });
  }
});

// -----------------------------------------
// TOGGLE TASK COMPLETED / UNCOMPLETED
// -----------------------------------------
app.patch("/api/items/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE items
       SET is_completed = NOT is_completed
       WHERE item_id = $1
       RETURNING *`,
      [id]
    );

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
    });
  }
});

// -----------------------------------------
// DELETE ONE TASK
// -----------------------------------------
app.delete("/api/items/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM items
       WHERE item_id = $1
       RETURNING *`,
      [id]
    );

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
    });
  }
});

// -----------------------------------------
// CLEAR ALL TASKS IN CURRENT CATEGORY
// -----------------------------------------
app.delete("/api/categories/:categoryId/items", async (req, res) => {
  try {
    const { categoryId } = req.params;

    const result = await pool.query(
      `DELETE FROM items
       WHERE category_id = $1
       RETURNING *`,
      [categoryId]
    );

    res.json({
      message: "All tasks cleared successfully",
      deletedCount: result.rowCount,
    });

  } catch (error) {
    console.error("Error clearing tasks:", error);

    res.status(500).json({
      message: "Failed to clear tasks",
    });
  }
});

// -----------------------------------------
// START SERVER
// -----------------------------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});