// ===== INVENTORY BACKEND - FINAL =====

require("dotenv").config();
const bwipjs = require("bwip-js");
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
app.use(express.json({ limit: '50mb' })); // Limit para sa photo upload
app.use(express.urlencoded({ limit: '50mb', extended: true }));

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "⚠️ No token provided." });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: "❌ Invalid or expired token." });
        }
        req.user = user;
        next();
    });
}

function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "⚠️ Not authenticated." });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: `❌ Access denied.` });
        }
        next();
    };
}

// ===== ROOT =====
app.get("/", (req, res) => {
    res.json({ message: "📦 Inventory API with MySQL is running!", version: "2.2.0" });
});

// ===== ITEMS =====
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
        res.status(500).json({ success: false, message: error.message });
    }
});

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
        await promisePool.query(
            `INSERT INTO items (code, name, category, quantity, location, condition_status, unit, reorder_level, warehouse_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [code.trim(), name.trim(), category, parseInt(quantity), location || "", condition, unit || "pcs", reorder_level || 5, warehouse_id || null]
        );
        res.status(201).json({ success: true, message: `✅ "${name}" added successfully!` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put("/api/items/:id", authenticateToken, authorizeRoles("Admin"), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { code, name, category, quantity, location, condition, unit, reorder_level, warehouse_id } = req.body;
        await promisePool.query(
            `UPDATE items SET code = ?, name = ?, category = ?, quantity = ?, location = ?, condition_status = ?, unit = ?, reorder_level = ?, warehouse_id = ? WHERE id = ?`,
            [code.trim(), name.trim(), category, parseInt(quantity), location || "", condition, unit || "pcs", reorder_level || 5, warehouse_id || null, id]
        );
        res.json({ success: true, message: `✅ "${name}" updated successfully!` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete("/api/items/:id", authenticateToken, authorizeRoles("Admin"), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await promisePool.query("DELETE FROM items WHERE id = ?", [id]);
        res.json({ success: true, message: `🗑️ Item deleted successfully!` });
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
        await promisePool.query(
            "INSERT INTO warehouses (name, location, description) VALUES (?, ?, ?)",
            [name.trim(), location || "", description || ""]
        );
        res.status(201).json({ success: true, message: `✅ Warehouse "${name}" added!` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== QR CODE =====
app.get("/api/items/:id/qrcode", authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const [rows] = await promisePool.query("SELECT id, code, name FROM items WHERE id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: "Item not found" });

        const qrImage = await QRCode.toDataURL(JSON.stringify({ id: rows[0].id, code: rows[0].code, name: rows[0].name }), { width: 300 });
        res.json({ success: true, data: { item: rows[0], qrCode: qrImage } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== BARCODE GENERATION =====
app.get("/api/items/:id/barcode", authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const [rows] = await promisePool.query("SELECT id, code, name FROM items WHERE id = ?", [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: `Item with ID ${id} not found` });
        }

        const item = rows[0];

        // Generate Barcode (Code 128 format)
        const png = await bwipjs.toBuffer({
            bcid: 'code128',       // Barcode type
            text: item.code,       // Text to encode
            scale: 3,              // 3x scaling factor
            height: 10,            // Bar height, in millimeters
            includetext: true,     // Show human-readable text
            textxalign: 'center',  // Always good to set this
        });

        const barcodeImage = `data:image/png;base64,${png.toString('base64')}`;

        res.json({
            success: true,
            data: {
                item: item,
                barcode: barcodeImage
            }
        });
    } catch (error) {
        console.error("Barcode generation error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== VERIFICATIONS (ITO YUNG KULANG KANINA) =====
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

app.post("/api/verifications", authenticateToken, authorizeRoles("Admin", "Personnel"), async (req, res) => {
    try {
        const { item_id, expected_qty, actual_qty, remarks, verified_by, photo_data } = req.body;
        const status = (parseInt(expected_qty) === parseInt(actual_qty)) ? "Matched" : "Discrepancy";

        await promisePool.query(
            `INSERT INTO verifications (item_id, expected_qty, actual_qty, status, remarks, verified_by, photo_data) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [item_id, parseInt(expected_qty), parseInt(actual_qty), status, remarks || "", verified_by || "Personnel", photo_data || null]
        );
        res.status(201).json({ success: true, message: `✅ Record saved!`, data: { status } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== REQUESTS (ISSUE/RELEASE) =====
app.get("/api/requests", authenticateToken, async (req, res) => {
    try {
        const [rows] = await promisePool.query(
            `SELECT r.*, i.code, i.name AS item_name, i.quantity AS current_stock, i.unit FROM requests r JOIN items i ON r.item_id = i.id ORDER BY r.created_at DESC`
        );
        res.json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post("/api/requests", authenticateToken, authorizeRoles("Admin", "Personnel"), async (req, res) => {
    try {
        const { item_id, quantity, purpose, project_site, requested_by, notes } = req.body;
        await promisePool.query(
            `INSERT INTO requests (item_id, quantity, purpose, project_site, requested_by, notes) VALUES (?, ?, ?, ?, ?, ?)`,
            [item_id, parseInt(quantity), purpose || "", project_site || "", requested_by, notes || ""]
        );
        res.status(201).json({ success: true, message: `✅ Request submitted!` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put("/api/requests/:id/approve", authenticateToken, authorizeRoles("Admin"), async (req, res) => {
    try {
        await promisePool.query("UPDATE requests SET status = 'Approved', approved_by = ? WHERE id = ?", [req.user.username, req.params.id]);
        res.json({ success: true, message: "✅ Request approved!" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put("/api/requests/:id/reject", authenticateToken, authorizeRoles("Admin"), async (req, res) => {
    try {
        await promisePool.query("UPDATE requests SET status = 'Rejected', approved_by = ? WHERE id = ?", [req.user.username, req.params.id]);
        res.json({ success: true, message: "Request rejected." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put("/api/requests/:id/release", authenticateToken, authorizeRoles("Admin"), async (req, res) => {
    try {
        const { released_to } = req.body;
        const [rows] = await promisePool.query("SELECT * FROM requests WHERE id = ?", [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: "Request not found" });
        
        const reqData = rows[0];
        const [items] = await promisePool.query("SELECT quantity FROM items WHERE id = ?", [reqData.item_id]);
        const newQty = items[0].quantity - reqData.quantity;
        const newCondition = newQty === 0 ? "Out of Stock" : (newQty < 10 ? "Low Stock" : "Available");

        await promisePool.query("UPDATE items SET quantity = ?, condition_status = ? WHERE id = ?", [newQty, newCondition, reqData.item_id]);
        await promisePool.query("UPDATE requests SET status = 'Released', released_by = ?, released_to = ? WHERE id = ?", [req.user.username, released_to || "N/A", req.params.id]);
        res.json({ success: true, message: `✅ Released! New stock: ${newQty}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== AUTH & USERS =====
app.post("/api/auth/register", async (req, res) => {
    try {
        const { username, email, password, full_name, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await promisePool.query(
            "INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)",
            [username, email, hashedPassword, full_name, role || "Personnel"]
        );
        res.status(201).json({ success: true, message: "✅ User registered!" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const [users] = await promisePool.query("SELECT * FROM users WHERE username = ? OR email = ?", [username, username]);
        if (users.length === 0) return res.status(401).json({ success: false, message: "❌ Invalid credentials" });

        const isMatch = await bcrypt.compare(password, users[0].password);
        if (!isMatch) return res.status(401).json({ success: false, message: "❌ Invalid credentials" });

        const token = jwt.sign({ id: users[0].id, username: users[0].username, role: users[0].role }, JWT_SECRET, { expiresIn: "8h" });
        res.json({ success: true, data: { token, user: users[0] } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get("/api/users", authenticateToken, authorizeRoles("Admin"), async (req, res) => {
    try {
        const [users] = await promisePool.query("SELECT id, username, email, full_name, role, created_at FROM users ORDER BY id");
        res.json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete("/api/users/:id", authenticateToken, authorizeRoles("Admin"), async (req, res) => {
    try {
        if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ success: false, message: "Cannot delete yourself" });
        await promisePool.query("DELETE FROM users WHERE id = ?", [req.params.id]);
        res.json({ success: true, message: "User deleted." });
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
        console.log(`🗄️  Database: connected`);
        console.log("=================================");
    });
}

startServer();