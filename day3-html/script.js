// ===== INVENTORY SYSTEM - DAY 7 =====

// Storage key
const STORAGE_KEY = "inventory_data";
const NEXT_ID_KEY = "inventory_next_id";

// ===== LOAD DATA FROM LOCALSTORAGE =====
function loadInventory() {
    const saved = localStorage.getItem(STORAGE_KEY);
    
    if (saved) {
        // May naka-save na data — i-load
        return JSON.parse(saved);
    } else {
        // Walang naka-save — gamitin ang default items
        return [
            { id: 1, code: "TOOL-0001", name: "Hammer", category: "Tools", quantity: 10, location: "", condition: "Available" },
            { id: 2, code: "MAT-0001", name: "Cement", category: "Materials", quantity: 50, location: "", condition: "Available" },
            { id: 3, code: "HEAVY-0001", name: "Excavator", category: "Heavy Equipment", quantity: 1, location: "", condition: "In Use" }
        ];
    }
}

// ===== SAVE DATA TO LOCALSTORAGE =====
function saveInventory() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
    localStorage.setItem(NEXT_ID_KEY, nextId.toString());
}

// ===== GET NEXT ID =====
function getNextId() {
    const saved = localStorage.getItem(NEXT_ID_KEY);
    if (saved) {
        return parseInt(saved);
    }
    // Kung wala pa, kunin yung highest ID + 1
    if (inventory.length === 0) return 1;
    return Math.max(...inventory.map(item => item.id)) + 1;
}

// ===== INITIALIZE =====
let inventory = loadInventory();
let nextId = getNextId();

// ===== RENDER TABLE =====
function renderTable() {
    const tbody = document.querySelector("tbody");
    tbody.innerHTML = "";

    if (inventory.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 20px; color: #999;">
                    📭 No items yet. Add your first item above!
                </td>
            </tr>
        `;
        return;
    }

    inventory.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.code}</td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.quantity}</td>
            <td>${item.condition}</td>
            <td>
                <button onclick="editItem(${item.id})">Edit</button>
                <button onclick="deleteItem(${item.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ===== ADD ITEM (with duplicate check!) =====
function addItem(event) {
    event.preventDefault();

    // Kunin yung values
    const name = document.getElementById("itemName").value.trim();
    const code = document.getElementById("uniqueCode").value.trim();
    const category = document.getElementById("category").value;
    const quantity = parseInt(document.getElementById("quantity").value);
    const location = document.getElementById("location").value.trim();
    const condition = document.getElementById("condition").value;

    // Basic validation
    if (!name || !code || !category || !quantity || !condition) {
        alert("⚠️ Please fill in all required fields!");
        return;
    }

    if (quantity < 0) {
        alert("⚠️ Quantity cannot be negative!");
        return;
    }

    // ===== DUPLICATE CHECK =====
    const isDuplicate = inventory.some(item => 
        item.code.toLowerCase() === code.toLowerCase()
    );

    if (isDuplicate) {
        alert(`❌ Unique Code "${code}" already exists! Please use a different code.`);
        return;
    }

    // Gumawa ng bagong item
    const newItem = {
        id: nextId,
        code: code,
        name: name,
        category: category,
        quantity: quantity,
        location: location,
        condition: condition
    };

    // I-add sa inventory
    inventory.push(newItem);
    nextId++;

    // I-save sa localStorage
    saveInventory();

    // I-render ulit
    renderTable();

    // I-clear yung form
    document.querySelector("form").reset();

    // Alert
    alert(`✅ "${name}" added successfully!`);
}

// ===== DELETE ITEM =====
function deleteItem(id) {
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    inventory = inventory.filter(i => i.id !== id);
    saveInventory();
    renderTable();
    alert(`🗑️ "${item.name}" deleted!`);
}

// ===== EDIT ITEM (placeholder) =====
function editItem(id) {
    alert("✏️ Edit feature coming soon! (Day 8)");
}

// ===== RESET DATA (for testing) =====
function resetData() {
    if (!confirm("⚠️ This will DELETE all items and reset to default. Continue?")) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(NEXT_ID_KEY);
    inventory = loadInventory();
    nextId = getNextId();
    renderTable();
    alert("🔄 Data reset to default!");
}

// ===== SETUP =====
document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
    if (form) {
        form.addEventListener("submit", addItem);
    }

    renderTable();

    console.log("✅ Inventory system loaded!");
    console.log("📦 Total items:", inventory.length);
    console.log("💾 Data stored in localStorage");
});