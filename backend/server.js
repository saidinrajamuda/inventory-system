// ===== INVENTORY BACKEND - DAY 10 =====

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ===== SAMPLE DATA =====
let inventory = [
    { id: 1, code: "TOOL-0001", name: "Hammer", category: "Tools", quantity: 10, location: "", condition: "Available" },
    { id: 2, code: "MAT-0001", name: "Cement", category: "Materials", quantity: 50, location: "", condition: "Available" },
    { id: 3, code: "HEAVY-0001", name: "Excavator", category: "Heavy Equipment", quantity: 1, location: "", condition: "In Use" }
];

let nextId = 4;

// ===== ROUTES =====

// Root
app.get("/", (req, res) => {
    res.json({
        message: "📦 Inventory API is running!",
        version: "1.0.0",
        endpoints: [
            "GET    /api/items",
            "GET    /api/items/:id",
            "POST   /api/items",
            "PUT    /api/items/:id",
            "DELETE /api/items/:id"
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

// GET single item
app.get("/api/items/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const item = inventory.find(i => i.id === id);

    if (!item) {
        return res.status(404).json({
            success: false,
            message: `Item with ID ${id} not found`
        });
    }

    res.json({ success: true, data: item });
});

// POST - Create new item
app.post("/api/items", (req, res) => {
    const { code, name, category, quantity, location, condition } = req.body;

    // Validation
    if (!code || !name || !category || quantity === undefined || !condition) {
        return res.status(400).json({
            success: false,
            message: "⚠️ Please provide all required fields: code, name, category, quantity, condition"
        });
    }

    // Check duplicate code
    const isDuplicate = inventory.some(item =>
        item.code.toLowerCase() === code.toLowerCase()
    );

    if (isDuplicate) {
        return res.status(409).json({
            success: false,
            message: `❌ Unique Code "${code}" already exists!`
        });
    }

    // Create new item
    const newItem = {
        id: nextId++,
        code,
        name,
        category,
        quantity,
        location: location || "",
        condition
    };

    inventory.push(newItem);

    res.status(201).json({
        success: true,
        message: `✅ "${name}" added successfully!`,
        data: newItem
    });
});

// PUT - Update item
app.put("/api/items/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const { code, name, category, quantity, location, condition } = req.body;

    const itemIndex = inventory.findIndex(i => i.id === id);

    if (itemIndex === -1) {
        return res.status(404).json({
            success: false,
            message: `Item with ID ${id} not found`
        });
    }

    // Check duplicate code (maliban sa sarili)
    const isDuplicate = inventory.some(item =>
        item.id !== id &&
        item.code.toLowerCase() === code.toLowerCase()
    );

    if (isDuplicate) {
        return res.status(409).json({
            success: false,
            message: `❌ Unique Code "${code}" already exists!`
        });
    }

    // Update
    inventory[itemIndex] = {
        id,
        code,
        name,
        category,
        quantity,
        location: location || "",
        condition
    };

    res.json({
        success: true,
        message: `✅ "${name}" updated successfully!`,
        data: inventory[itemIndex]
    });
});

// DELETE - Remove item
app.delete("/api/items/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const itemIndex = inventory.findIndex(i => i.id === id);

    if (itemIndex === -1) {
        return res.status(404).json({
            success: false,
            message: `Item with ID ${id} not found`
        });
    }

    const deletedItem = inventory[itemIndex];
    inventory.splice(itemIndex, 1);

    res.json({
        success: true,
        message: `🗑️ "${deletedItem.name}" deleted!`,
        data: deletedItem
    });
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log("=================================");
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📦 API endpoint: http://localhost:${PORT}/api/items`);
    console.log("=================================");
});