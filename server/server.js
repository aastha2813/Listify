const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());


// ============================================
// DATABASE CONNECTION
// ============================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  min: 1,
  idleTimeoutMillis: 30 * 60 * 1000,
  connectionTimeoutMillis: 5000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on("error", (error) => {
  console.error("Unexpected Neon pool error:", error);
});


// ============================================
// ROOT / DATABASE TEST
// ============================================

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


// ============================================
// GET MAIN CATEGORIES
// ============================================

app.get("/api/categories", async (req, res) => {
  try {
    const start = Date.now();

    const result = await pool.query(`
      SELECT
        c.category_id,
        c.category_name,
        c.category_type,
        COUNT(i.item_id)::INTEGER AS task_count
      FROM categories c
      LEFT JOIN items i
        ON i.category_id = c.category_id
      GROUP BY
        c.category_id,
        c.category_name,
        c.category_type
      ORDER BY c.category_id
    `);

    const duration = Date.now() - start;

    console.log(`GET /api/categories → ${duration} ms`);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching categories:", error);

    res.status(500).json({
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
});


// ============================================
// GET SUB-LISTS FOR A CATEGORY
// ============================================

app.get("/api/categories/:categoryId/sub-lists", async (req, res) => {
  try {
    const { categoryId } = req.params;

    const start = Date.now();

    const result = await pool.query(
      `
      SELECT
        s.sub_list_id,
        s.category_id,
        s.sub_list_name,
        s.created_at,
        COUNT(i.item_id)::INTEGER AS task_count
      FROM sub_lists s
      LEFT JOIN items i
        ON i.sub_list_id = s.sub_list_id
      WHERE s.category_id = $1
      GROUP BY
        s.sub_list_id,
        s.category_id,
        s.sub_list_name,
        s.created_at
      ORDER BY s.created_at ASC, s.sub_list_id ASC
      `,
      [categoryId]
    );

    const duration = Date.now() - start;

    console.log(
      `GET /api/categories/${categoryId}/sub-lists → ${duration} ms`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching sub-lists:", error);

    res.status(500).json({
      message: "Failed to fetch sub-lists",
      error: error.message,
    });
  }
});


// ============================================
// CREATE NEW SUB-LIST
// ============================================

app.post("/api/categories/:categoryId/sub-lists", async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { sub_list_name } = req.body;

    if (!sub_list_name || sub_list_name.trim() === "") {
      return res.status(400).json({
        message: "Sub-list name is required",
      });
    }

    // Check that the main category exists
    const categoryResult = await pool.query(
      `
      SELECT category_id, category_name
      FROM categories
      WHERE category_id = $1
      `,
      [categoryId]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    const start = Date.now();

    const result = await pool.query(
      `
      INSERT INTO sub_lists
      (category_id, sub_list_name)
      VALUES ($1, $2)
      RETURNING *
      `,
      [categoryId, sub_list_name.trim()]
    );

    const duration = Date.now() - start;

    console.log(
      `POST /api/categories/${categoryId}/sub-lists → ${duration} ms`
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating sub-list:", error);

    res.status(500).json({
      message: "Failed to create sub-list",
      error: error.message,
    });
  }
});


// ============================================
// UPDATE SUB-LIST NAME
// ============================================

app.patch("/api/sub-lists/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { sub_list_name } = req.body;

    if (!sub_list_name || sub_list_name.trim() === "") {
      return res.status(400).json({
        message: "Sub-list name is required",
      });
    }

    const start = Date.now();

    const result = await pool.query(
      `
      UPDATE sub_lists
      SET sub_list_name = $1
      WHERE sub_list_id = $2
      RETURNING *
      `,
      [sub_list_name.trim(), id]
    );

    const duration = Date.now() - start;

    console.log(`PATCH /api/sub-lists/${id} → ${duration} ms`);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Sub-list not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating sub-list:", error);

    res.status(500).json({
      message: "Failed to update sub-list",
      error: error.message,
    });
  }
});


// ============================================
// DELETE SUB-LIST
// ============================================

app.delete("/api/sub-lists/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const start = Date.now();

    const result = await pool.query(
      `
      DELETE FROM sub_lists
      WHERE sub_list_id = $1
      RETURNING *
      `,
      [id]
    );

    const duration = Date.now() - start;

    console.log(`DELETE /api/sub-lists/${id} → ${duration} ms`);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Sub-list not found",
      });
    }

    res.json({
      message: "Sub-list deleted successfully",
      deletedSubList: result.rows[0],
    });
  } catch (error) {
    console.error("Error deleting sub-list:", error);

    res.status(500).json({
      message: "Failed to delete sub-list",
      error: error.message,
    });
  }
});


// ============================================
// GET ALL ITEMS
// ============================================

app.get("/api/items", async (req, res) => {
  try {
    const start = Date.now();

    const result = await pool.query(`
      SELECT
        i.item_id,
        i.category_id,
        c.category_name,
        i.sub_list_id,
        s.sub_list_name,
        i.item_name,
        i.quantity,
        i.priority,
        i.note,
        i.is_completed,
        i.created_at
      FROM items i
      JOIN categories c
        ON i.category_id = c.category_id
      LEFT JOIN sub_lists s
        ON i.sub_list_id = s.sub_list_id
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


// ============================================
// GET ITEMS FOR A SUB-LIST
// ============================================

app.get("/api/sub-lists/:subListId/items", async (req, res) => {
  try {
    const { subListId } = req.params;

    const start = Date.now();

    const result = await pool.query(
      `
      SELECT
        i.item_id,
        i.category_id,
        c.category_name,
        i.sub_list_id,
        s.sub_list_name,
        i.item_name,
        i.quantity,
        i.priority,
        i.note,
        i.is_completed,
        i.created_at
      FROM items i
      JOIN categories c
        ON i.category_id = c.category_id
      JOIN sub_lists s
        ON i.sub_list_id = s.sub_list_id
      WHERE i.sub_list_id = $1
      ORDER BY i.created_at DESC
      `,
      [subListId]
    );

    const duration = Date.now() - start;

    console.log(
      `GET /api/sub-lists/${subListId}/items → ${duration} ms`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching sub-list items:", error);

    res.status(500).json({
      message: "Failed to fetch sub-list tasks",
      error: error.message,
    });
  }
});


// ============================================
// GET DIRECT ITEMS FOR RAJU
// ============================================

app.get("/api/categories/:categoryId/items", async (req, res) => {
  try {
    const { categoryId } = req.params;

    const categoryResult = await pool.query(
      `
      SELECT category_name
      FROM categories
      WHERE category_id = $1
      `,
      [categoryId]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    const categoryName = categoryResult.rows[0].category_name;

    // Direct task access is only intended for Raju
    if (categoryName !== "Raju") {
      return res.status(400).json({
        message: "This category uses sub-lists.",
      });
    }

    const start = Date.now();

    const result = await pool.query(
      `
      SELECT
        i.item_id,
        i.category_id,
        c.category_name,
        i.sub_list_id,
        i.item_name,
        i.quantity,
        i.priority,
        i.note,
        i.is_completed,
        i.created_at
      FROM items i
      JOIN categories c
        ON i.category_id = c.category_id
      WHERE i.category_id = $1
        AND i.sub_list_id IS NULL
      ORDER BY i.created_at DESC
      `,
      [categoryId]
    );

    const duration = Date.now() - start;

    console.log(
      `GET /api/categories/${categoryId}/items → ${duration} ms`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching category items:", error);

    res.status(500).json({
      message: "Failed to fetch category tasks",
      error: error.message,
    });
  }
});


// ============================================
// ADD NEW ITEM / TASK
// ============================================

app.post("/api/items", async (req, res) => {
  try {
    const {
      category_id,
      sub_list_id,
      item_name,
      quantity,
      priority,
      note,
    } = req.body;

    // ----------------------------------------
    // REQUIRED FIELDS
    // ----------------------------------------

    if (!category_id) {
      return res.status(400).json({
        message: "Category is required",
      });
    }

    if (!item_name || item_name.trim() === "") {
      return res.status(400).json({
        message: "Task name is required",
      });
    }

    // QUANTITY IS REQUIRED
    if (
      quantity === undefined ||
      quantity === null ||
      String(quantity).trim() === ""
    ) {
      return res.status(400).json({
        message: "Quantity is required",
      });
    }


    // ----------------------------------------
    // CHECK CATEGORY
    // ----------------------------------------

    const categoryResult = await pool.query(
      `
      SELECT category_id, category_name
      FROM categories
      WHERE category_id = $1
      `,
      [category_id]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    const category = categoryResult.rows[0];


    // ----------------------------------------
    // RAJU
    // ----------------------------------------

    if (category.category_name === "Raju") {
      // Raju should NOT have a sub-list

      if (sub_list_id) {
        return res.status(400).json({
          message: "Raju does not use sub-lists",
        });
      }
    }


    // ----------------------------------------
    // OTHER CATEGORIES
    // ----------------------------------------

    if (category.category_name !== "Raju") {
      // All other categories must use a sub-list

      if (!sub_list_id) {
        return res.status(400).json({
          message: "Sub-list is required for this category",
        });
      }

      const subListResult = await pool.query(
        `
        SELECT sub_list_id
        FROM sub_lists
        WHERE sub_list_id = $1
          AND category_id = $2
        `,
        [sub_list_id, category_id]
      );

      if (subListResult.rows.length === 0) {
        return res.status(400).json({
          message: "Invalid sub-list for this category",
        });
      }
    }


    // ----------------------------------------
    // INSERT TASK
    // ----------------------------------------

    const start = Date.now();

    const result = await pool.query(
      `
      INSERT INTO items
      (
        category_id,
        sub_list_id,
        item_name,
        quantity,
        priority,
        note
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        category_id,
        sub_list_id || null,
        item_name.trim(),
        String(quantity).trim(),
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
      message: "Failed to add task",
      error: error.message,
    });
  }
});


// ============================================
// TOGGLE TASK COMPLETION
// ============================================

app.patch("/api/items/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;

    const start = Date.now();

    const result = await pool.query(
      `
      UPDATE items
      SET is_completed = NOT COALESCE(is_completed, false)
      WHERE item_id = $1
      RETURNING *
      `,
      [id]
    );

    const duration = Date.now() - start;

    console.log(
      `PATCH /api/items/${id}/toggle → ${duration} ms`
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
      error: error.message,
    });
  }
});


// ============================================
// DELETE ONE TASK
// ============================================

app.delete("/api/items/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const start = Date.now();

    const result = await pool.query(
      `
      DELETE FROM items
      WHERE item_id = $1
      RETURNING *
      `,
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


// ============================================
// CLEAR ALL TASKS FROM A SUB-LIST
// ============================================

app.delete("/api/sub-lists/:subListId/items", async (req, res) => {
  try {
    const { subListId } = req.params;

    const start = Date.now();

    const result = await pool.query(
      `
      DELETE FROM items
      WHERE sub_list_id = $1
      RETURNING *
      `,
      [subListId]
    );

    const duration = Date.now() - start;

    console.log(
      `DELETE /api/sub-lists/${subListId}/items → ${duration} ms`
    );

    res.json({
      message: "All tasks cleared successfully",
      deletedCount: result.rowCount,
    });
  } catch (error) {
    console.error("Error clearing sub-list tasks:", error);

    res.status(500).json({
      message: "Failed to clear sub-list tasks",
      error: error.message,
    });
  }
});


// ============================================
// CLEAR ALL RAJU TASKS
// ============================================

app.delete("/api/categories/:categoryId/items", async (req, res) => {
  try {
    const { categoryId } = req.params;

    const categoryResult = await pool.query(
      `
      SELECT category_name
      FROM categories
      WHERE category_id = $1
      `,
      [categoryId]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    if (categoryResult.rows[0].category_name !== "Raju") {
      return res.status(400).json({
        message: "Use the sub-list endpoint for this category.",
      });
    }

    const start = Date.now();

    const result = await pool.query(
      `
      DELETE FROM items
      WHERE category_id = $1
        AND sub_list_id IS NULL
      RETURNING *
      `,
      [categoryId]
    );

    const duration = Date.now() - start;

    console.log(
      `DELETE /api/categories/${categoryId}/items → ${duration} ms`
    );

    res.json({
      message: "All Raju tasks cleared successfully",
      deletedCount: result.rowCount,
    });
  } catch (error) {
    console.error("Error clearing category tasks:", error);

    res.status(500).json({
      message: "Failed to clear category tasks",
      error: error.message,
    });
  }
});


// ============================================
// SERVER START
// ============================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Server running on port ${PORT}`);

  try {
    const start = Date.now();

    await pool.query("SELECT 1");

    const duration = Date.now() - start;

    console.log(
      `Neon connection warmed up in ${duration} ms`
    );

    console.log("Database connection ready ✅");
  } catch (error) {
    console.error("Could not warm Neon connection:");
    console.error(error.message);
  }
});


// ============================================
// GRACEFUL SHUTDOWN
// ============================================

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