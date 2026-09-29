// ===== INVENTORY BACKEND - DAY 22 (with Warehouses) =====

require("dotenv").config();

const express = require("express");
const QRCode = require("qrcode");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { promisePool, testConnection } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_change_me";

// ===== MIDDLEWARE =====
const corsOptions = {
    origin: process.env.CORS_ORIGIN 
        ? [process.env.CORS_ORIGIN, "http://localhost:5500", "http://127.0.0.1:5500"]
        : "*",
    credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// ===== AUTH MIDDLEWARE =====
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "⚠️ No token provided. Please login." });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: "❌ Invalid or expired token." });
        }
        req.user = user;
        next();
    });
}

// ===== ROLE MIDDLEWARE =====
function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "⚠️ Not authenticated." });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: `❌ Access denied. Required role: ${allowedRoles.join(" or ")}` });
        }
        next();
    };
}

// ===== ROOT =====
app.get("/", (req, res) => {
    res.json({ message: "📦 Inventory API with MySQL is running!", version: "2.1.0" });
});

// ===== GET ALL ITEMS (with warehouse info) =====
app.get("/api/items", authenticateToken, async (req, res) => {
    try {
        const [rows] = await promisePool.query(
            `SELECT i.id, i.code, i.name, i.category, i.quantity, 
                    i.location, i.condition_status AS \`condition\`,
                    i.unit, i.reorder_level, i.warehouse_id,
                    w.name AS warehouse_name
             FROM items i
             LEFT JOIN warehouses w ON i.warehouse_id = w.id
             ORDER BY i.id ASC`
        );
        res.json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error("GET /api/items error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== GET SINGLE ITEM =====
app.get("/api/items/:id", authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const [rows] = await promisePool.query(
            `SELECT i.*, i.condition_status AS \`condition\`, w.name AS warehouse_name
             FROM items i
             LEFT JOIN warehouses w ON i.warehouse_id = w.id
             WHERE i.id = ?`,
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: `Item with ID ${id} not found` });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== CREATE ITEM =====
app.post("/api/items", authenticateToken, authorizeRoles("Admin"), async (req, res) => {
    try {
        const { code, name, category, quantity, location, condition, unit, reorder_level, warehouse_id } = req.body;

        if (!code || !name || !category || quantity === undefined || !condition) {
            return res.status(400).json({ success: false, message: "⚠️ Missing required fields" });
        }

        const [existing] = await promisePool.query("SELECT id FROM items WHERE code = ?", [code.trim()]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: `❌ Unique Code "${code}" already exists!` });
        }

        const [result] = await promisePool.query(
            `INSERT INTO items 
            (code, name, category, quantity, location, condition_status, unit, reorder_level, warehouse_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                code.trim(), name.trim(), category, parseInt(quantity),
                location || "", condition, unit || "pcs",
                reorder_level || 5, warehouse_id || null
            ]
        );

        const [newItem] = await promisePool.query("SELECT * FROM items WHERE id = ?", [result.insertId]);

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

// ===== UPDATE ITEM =====
app.put("/api/items/:id", authenticateToken, authorizeRoles("Admin"), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { code, name, category, quantity, location, condition, unit, reorder_level, warehouse_id } = req.body;

        if (!code || !name || !category || quantity === undefined || !condition) {
            return res.status(400).json({ success: false, message: "⚠️ Missing required fields" });
        }

        const [existing] = await promisePool.query("SELECT id FROM items WHERE id = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: `Item with ID ${id} not found` });
        }

        const [duplicate] = await promisePool.query("SELECT id FROM items WHERE code = ? AND id != ?", [code.trim(), id]);
        if (duplicate.length > 0) {
            return res.status(409).json({ success: false, message: `❌ Unique Code "${code}" already exists!` });
        }

        await promisePool.query(
            `UPDATE items SET 
                code = ?, name = ?, category = ?, quantity = ?, 
                location = ?, condition_status = ?, unit = ?, 
                reorder_level = ?, warehouse_id = ?
             WHERE id = ?`,
            [
                code.trim(), name.trim(), category, parseInt(quantity),
                location || "", condition, unit || "pcs",
                reorder_level || 5, warehouse_id || null, id
            ]
        );

        const [updated] = await promisePool.query("SELECT * FROM items WHERE id = ?", [id]);

        res.json({
            success: true,
            message: `✅ "${name}" updated successfully!`,
            data: updated[0]
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== DELETE ITEM =====
app.delete("/api/items/:id", authenticateToken, authorizeRoles("Admin"), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const [rows] = await promisePool.query("SELECT name FROM items WHERE id = ?", [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: `Item with ID ${id} not found` });
        }

        await promisePool.query("DELETE FROM items WHERE id = ?", [id]);
        res.json({ success: true, message: `🗑️ "${rows[0].name}" deleted successfully!` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== QR CODE GENERATION =====
app.get("/api/items/:id/qrcode", authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const [rows] = await promisePool.query("SELECT id, code, name FROM items WHERE id = ?", [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: `Item with ID ${id} not found` });
        }

        const item = rows[0];
        const qrData = JSON.stringify({ id: item.id, code: item.code, name: item.name });

        const qrImage = await QRCode.toDataURL(qrData, {
            width: 300,
            margin: 2,
            color: { dark: "#1e3a5f", light: "#ffffff" }
        });

        res.json({ success: true, data: { item, qrCode: qrImage } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== WAREHOUSES =====
app.get("/api/warehouses", authenticateToken, async (req, res) => {
    try {
        const [rows] = await promisePool.query("SELECT * FROM warehouses ORDER BY name ASC");
        res.json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post("/api/warehouses", authenticateToken, authorizeRoles("Admin"), async (req, res) => {
    try {
        const { name, location, description } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: "⚠️ Warehouse name is required" });
        }

        const [result] = await promisePool.query(
            "INSERT INTO warehouses (name, location, description) VALUES (?, ?, ?)",
            [name.trim(), location || "", description || ""]
        );

        res.status(201).json({
            success: true,
            message: `✅ Warehouse "${name}" added!`,
            data: { id: result.insertId, name, location, description }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete("/api/warehouses/:id", authenticateToken, authorizeRoles("Admin"), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const [rows] = await promisePool.query("SELECT name FROM warehouses WHERE id = ?", [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Warehouse not found" });
        }

        await promisePool.query("DELETE FROM warehouses WHERE id = ?", [id]);
        res.json({ success: true, message: `🗑️ Warehouse "${rows[0].name}" deleted!` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== VERIFICATIONS =====
app.post("/api/verifications", authenticateToken, authorizeRoles("Admin", "Personnel"), async (req, res) => {
    try {
        const { item_id, expected_qty, actual_qty, remarks, verified_by } = req.body;

        if (!item_id || expected_qty === undefined || actual_qty === undefined) {
            return res.status(400).json({ success: false, message: "⚠️ Missing required fields" });
        }

        const status = (parseInt(expected_qty) === parseInt(actual_qty)) ? "Matched" : "Discrepancy";

        const [result] = await promisePool.query(
            `INSERT INTO verifications 
            (item_id, expected_qty, actual_qty, status, remarks, verified_by) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [item_id, parseInt(expected_qty), parseInt(actual_qty), status, remarks || "", verified_by || "Warehouse Personnel"]
        );

        res.status(201).json({
            success: true,
            message: status === "Matched" ? "✅ Quantities match! Record saved." : "⚠️ Discrepancy detected! Record saved.",
            data: { id: result.insertId, item_id, expected_qty, actual_qty, status, remarks, verified_by }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get("/api/verifications", authenticateToken, async (req, res) => {
    try {
        const [rows] = await promisePool.query(
            `SELECT v.*, i.code, i.name 
             FROM verifications v
             JOIN items i ON v.item_id = i.id
             ORDER BY v.created_at DESC`
        );
        res.json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== AUTHENTICATION =====
app.post("/api/auth/register", async (req, res) => {
    try {
        const { username, email, password, full_name, role } = req.body;

        if (!username || !email || !password || !full_name) {
            return res.status(400).json({ success: false, message: "⚠️ All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: "⚠️ Password must be at least 6 characters" });
        }

        const [existing] = await promisePool.query(
            "SELECT id FROM users WHERE username = ? OR email = ?",
            [username, email]
        );

        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: "❌ Username or email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await promisePool.query(
            "INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)",
            [username, email, hashedPassword, full_name, role || "Personnel"]
        );

        res.status(201).json({
            success: true,
            message: "✅ User registered successfully!",
            data: { id: result.insertId, username, email, full_name, role: role || "Personnel" }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: "⚠️ Username and password are required" });
        }

        const [users] = await promisePool.query(
            "SELECT * FROM users WHERE username = ? OR email = ?",
            [username, username]
        );

        if (users.length === 0) {
            return res.status(401).json({ success: false, message: "❌ Invalid credentials" });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: "❌ Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: "8h" }
        );

        res.json({
            success: true,
            message: "✅ Login successful!",
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== USERS (Admin only) =====
app.get("/api/users", authenticateToken, authorizeRoles("Admin"), async (req, res) => {
    try {
        const [users] = await promisePool.query(
            "SELECT id, username, email, full_name, role, created_at FROM users ORDER BY id"
        );
        res.json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete("/api/users/:id", authenticateToken, authorizeRoles("Admin"), async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (id === req.user.id) {
            return res.status(400).json({ success: false, message: "⚠️ You cannot delete your own account." });
        }

        const [rows] = await promisePool.query("SELECT username FROM users WHERE id = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        await promisePool.query("DELETE FROM users WHERE id = ?", [id]);
        res.json({ success: true, message: `🗑️ User "${rows[0].username}" deleted successfully!` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
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