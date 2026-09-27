// ===== INVENTORY BACKEND - DAY 11 (with MySQL) =====

const express = require("express");
const QRCode = require("qrcode");
const cors = require("cors");
const { promisePool, testConnection } = require("./db");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ===== ROOT =====
app.get("/", (req, res) => {
    res.json({
        message: "📦 Inventory API with MySQL is running!",
        version: "2.0.0"
    });
});

// ===== GET ALL ITEMS =====
app.get("/api/items", async (req, res) => {
    try {
        const [rows] = await promisePool.query(
            "SELECT id, code, name, category, quantity, location, condition_status AS `condition` FROM items ORDER BY id ASC"
        );
        res.json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error("GET /api/items error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== GET SINGLE ITEM =====
app.get("/api/items/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const [rows] = await promisePool.query(
            "SELECT id, code, name, category, quantity, location, condition_status AS `condition` FROM items WHERE id = ?",
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Item with ID ${id} not found`
            });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("GET /api/items/:id error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== CREATE (POST) =====
app.post("/api/items", async (req, res) => {
    try {
        const { code, name, category, quantity, location, condition } = req.body;

        if (!code || !name || !category || quantity === undefined || !condition) {
            return res.status(400).json({
                success: false,
                message: "⚠️ Missing required fields"
            });
        }

        const [existing] = await promisePool.query(
            "SELECT id FROM items WHERE code = ?",
            [code.trim()]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: `❌ Unique Code "${code}" already exists!`
            });
        }

        const [result] = await promisePool.query(
            "INSERT INTO items (code, name, category, quantity, location, condition_status) VALUES (?, ?, ?, ?, ?, ?)",
            [code.trim(), name.trim(), category, parseInt(quantity), location || "", condition]
        );

        const [newItem] = await promisePool.query(
            "SELECT id, code, name, category, quantity, location, condition_status AS `condition` FROM items WHERE id = ?",
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: `✅ "${name}" added successfully!`,
            data: newItem[0]
        });
    } catch (error) {
        console.error("POST /api/items error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== UPDATE (PUT) =====
app.put("/api/items/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { code, name, category, quantity, location, condition } = req.body;

        if (!code || !name || !category || quantity === undefined || !condition) {
            return res.status(400).json({
                success: false,
                message: "⚠️ Missing required fields"
            });
        }

        const [existing] = await promisePool.query(
            "SELECT id FROM items WHERE id = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Item with ID ${id} not found`
            });
        }

        const [duplicate] = await promisePool.query(
            "SELECT id FROM items WHERE code = ? AND id != ?",
            [code.trim(), id]
        );

        if (duplicate.length > 0) {
            return res.status(409).json({
                success: false,
                message: `❌ Unique Code "${code}" already exists!`
            });
        }

        await promisePool.query(
            "UPDATE items SET code = ?, name = ?, category = ?, quantity = ?, location = ?, condition_status = ? WHERE id = ?",
            [code.trim(), name.trim(), category, parseInt(quantity), location || "", condition, id]
        );

        const [updated] = await promisePool.query(
            "SELECT id, code, name, category, quantity, location, condition_status AS `condition` FROM items WHERE id = ?",
            [id]
        );

        res.json({
            success: true,
            message: `✅ "${name}" updated successfully!`,
            data: updated[0]
        });
    } catch (error) {
        console.error("PUT /api/items/:id error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== DELETE =====
app.delete("/api/items/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const [rows] = await promisePool.query(
            "SELECT name FROM items WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Item with ID ${id} not found`
            });
        }

        const itemName = rows[0].name;

        await promisePool.query("DELETE FROM items WHERE id = ?", [id]);

        res.json({
            success: true,
            message: `🗑️ "${itemName}" deleted successfully!`
        });
    } catch (error) {
        console.error("DELETE /api/items/:id error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== QR CODE GENERATION =====
app.get("/api/items/:id/qrcode", async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        // Kunin yung item mula sa database
        const [rows] = await promisePool.query(
            "SELECT id, code, name FROM items WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Item with ID ${id} not found`
            });
        }

        const item = rows[0];

        // Gumawa ng QR code na naglalaman ng JSON data
        const qrData = JSON.stringify({
            id: item.id,
            code: item.code,
            name: item.name
        });

        // Generate QR code as Data URL (base64 image)
        const qrImage = await QRCode.toDataURL(qrData, {
            width: 300,
            margin: 2,
            color: {
                dark: "#1e3a5f",
                light: "#ffffff"
            }
        });

        res.json({
            success: true,
            data: {
                item: item,
                qrCode: qrImage
            }
        });
    } catch (error) {
        console.error("QR code generation error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ===== START SERVER =====
async function startServer() {
    const connected = await testConnection();

    if (!connected) {
        console.error("❌ Cannot start server without database connection.");
        process.exit(1);
    }

    app.listen(PORT, () => {
        console.log("=================================");
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📦 API: http://localhost:${PORT}/api/items`);
        console.log(`🗄️  Database: inventory_db`);
        console.log("=================================");
    });
}

startServer();