// ===== INVENTORY BACKEND - DAY 9 =====

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ===== SAMPLE DATA (temporary) =====
let inventory = [
    { id: 1, code: "TOOL-0001", name: "Hammer", category: "Tools", quantity: 10, condition: "Available" },
    { id: 2, code: "MAT-0001", name: "Cement", category: "Materials", quantity: 50, condition: "Available" },
    { id: 3, code: "HEAVY-0001", name: "Excavator", category: "Heavy Equipment", quantity: 1, condition: "In Use" }
];

// ===== ENDPOINTS =====

// Root endpoint
app.get("/", (req, res) => {
    res.json({
        message: "📦 Inventory API is running!",
        version: "1.0.0",
        endpoints: [
            "GET /api/items",
            "GET /api/items/:id"
        ]
    });
});

// GET all items
app.get("/api/items", (req, res) => {
    res.json({
        success: true,
        count: inventory.length,
        data: inventory
    });
});

// GET single item by ID
app.get("/api/items/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const item = inventory.find(i => i.id === id);

    if (!item) {
        return res.status(404).json({
            success: false,
            message: `Item with ID ${id} not found`
        });
    }

    res.json({
        success: true,
        data: item
    });
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log("=================================");
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📦 API endpoint: http://localhost:${PORT}/api/items`);
    console.log("=================================");
});