// ===== INVENTORY SYSTEM - DAY 8 =====

// Storage keys
const STORAGE_KEY = "inventory_data";
const NEXT_ID_KEY = "inventory_next_id";

// ===== EDIT MODE TRACKER =====
let editingId = null;  // null = Add mode, number = Edit mode

// ===== LOAD DATA =====
function loadInventory() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        return JSON.parse(saved);
    } else {
        return [
            { id: 1, code: "TOOL-0001", name: "Hammer", category: "Tools", quantity: 10, location: "", condition: "Available" },
            { id: 2, code: "MAT-0001", name: "Cement", category: "Materials", quantity: 50, location: "", condition: "Available" },
            { id: 3, code: "HEAVY-0001", name: "Excavator", category: "Heavy Equipment", quantity: 1, location: "", condition: "In Use" }
        ];
    }
}

// ===== SAVE DATA =====
function saveInventory() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
    localStorage.setItem(NEXT_ID_KEY, nextId.toString());
}

// ===== GET NEXT ID =====
function getNextId() {
    const saved = localStorage.getItem(NEXT_ID_KEY);
    if (saved) return parseInt(saved);
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

// ===== ADD OR UPDATE ITEM =====
function addItem(event) {
    event.preventDefault();

    const name = document.getElementById("itemName").value.trim();
    const code = document.getElementById("uniqueCode").value.trim();
    const category = document.getElementById("category").value;
    const quantity = parseInt(document.getElementById("quantity").value);
    const location = document.getElementById("location").value.trim();
    const condition = document.getElementById("condition").value;

    // Validation
    if (!name || !code || !category || !quantity || !condition) {
        alert("⚠️ Please fill in all required fields!");
        return;
    }

    if (quantity < 0) {
        alert("⚠️ Quantity cannot be negative!");
        return;
    }

    // ===== EDIT MODE: UPDATE existing item =====
    if (editingId !== null) {
        // Check kung may duplicate code (maliban sa item na i-edit natin)
        const isDuplicate = inventory.some(item => 
            item.id !== editingId && 
            item.code.toLowerCase() === code.toLowerCase()
        );

        if (isDuplicate) {
            alert(`❌ Unique Code "${code}" already exists! Please use a different code.`);
            return;
        }

        // I-update yung item
        const itemIndex = inventory.findIndex(item => item.id === editingId);
        if (itemIndex !== -1) {
            inventory[itemIndex] = {
                id: editingId,
                code: code,
                name: name,
                category: category,
                quantity: quantity,
                location: location,
                condition: condition
            };
        }

        saveInventory();
        renderTable();
        resetForm();
        alert(`✅ "${name}" updated successfully!`);
        return;
    }

    // ===== ADD MODE: CREATE new item =====
    const isDuplicate = inventory.some(item => 
        item.code.toLowerCase() === code.toLowerCase()
    );

    if (isDuplicate) {
        alert(`❌ Unique Code "${code}" already exists! Please use a different code.`);
        return;
    }

    const newItem = {
        id: nextId,
        code: code,
        name: name,
        category: category,
        quantity: quantity,
        location: location,
        condition: condition
    };

    inventory.push(newItem);
    nextId++;

    saveInventory();
    renderTable();
    document.querySelector("form").reset();
    alert(`✅ "${name}" added successfully!`);
}

// ===== EDIT ITEM (now functional!) =====
function editItem(id) {
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    // Populate the form
    document.getElementById("itemName").value = item.name;
    document.getElementById("uniqueCode").value = item.code;
    document.getElementById("category").value = item.category;
    document.getElementById("quantity").value = item.quantity;
    document.getElementById("location").value = item.location || "";
    document.getElementById("condition").value = item.condition;

    // Set edit mode
    editingId = id;

    // Update UI: change button text and show cancel button
    const submitBtn = document.getElementById("submitBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const formTitle = document.getElementById("formTitle");

    if (submitBtn) submitBtn.textContent = "💾 Update Item";
    if (cancelBtn) cancelBtn.style.display = "inline-block";
    if (formTitle) formTitle.textContent = `✏️ Editing: ${item.name}`;

    // Scroll to form
    document.querySelector("form").scrollIntoView({ behavior: "smooth" });
}

// ===== CANCEL EDIT =====
function cancelEdit() {
    resetForm();
}

// ===== RESET FORM =====
function resetForm() {
    document.querySelector("form").reset();
    editingId = null;

    const submitBtn = document.getElementById("submitBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const formTitle = document.getElementById("formTitle");

    if (submitBtn) submitBtn.textContent = "Add Item";
    if (cancelBtn) cancelBtn.style.display = "none";
    if (formTitle) formTitle.textContent = "Add New Item";
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

    // Kung yung dine-delete ay yung currently naka-edit, i-reset
    if (editingId === id) {
        resetForm();
    }
}

// ===== RESET DATA =====
function resetData() {
    if (!confirm("⚠️ This will DELETE all items and reset to default. Continue?")) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(NEXT_ID_KEY);
    inventory = loadInventory();
    nextId = getNextId();
    renderTable();
    resetForm();
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
});