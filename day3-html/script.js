// ===== INVENTORY SYSTEM - DAY 6 =====

// Array para i-store yung mga items
let inventory = [
    { id: 1, code: "TOOL-0001", name: "Hammer", category: "Tools", quantity: 10, condition: "Available" },
    { id: 2, code: "MAT-0001", name: "Cement", category: "Materials", quantity: 50, condition: "Available" },
    { id: 3, code: "HEAVY-0001", name: "Excavator", category: "Heavy Equipment", quantity: 1, condition: "In Use" }
];

let nextId = 4;

// ===== FUNCTION: I-render yung table =====
function renderTable() {
    const tbody = document.querySelector("tbody");
    
    // Clear existing rows
    tbody.innerHTML = "";

    // Loop sa bawat item at gumawa ng row
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

// ===== FUNCTION: Mag-add ng bagong item =====
function addItem(event) {
    event.preventDefault();  // Pigilan yung page reload

    // Kunin yung values sa form
    const name = document.getElementById("itemName").value.trim();
    const code = document.getElementById("uniqueCode").value.trim();
    const category = document.getElementById("category").value;
    const quantity = parseInt(document.getElementById("quantity").value);
    const location = document.getElementById("location").value;
    const condition = document.getElementById("condition").value;

    // Validation
    if (!name || !code || !category || !quantity || !condition) {
        alert("⚠️ Please fill in all required fields!");
        return;
    }

    // Gumawa ng bagong item object
    const newItem = {
        id: nextId,
        code: code,
        name: name,
        category: category,
        quantity: quantity,
        location: location,
        condition: condition
    };

    // I-add sa inventory array
    inventory.push(newItem);
    nextId++;

    // I-render ulit yung table
    renderTable();

    // I-clear yung form
    document.querySelector("form").reset();

    // Mag-alert
    alert(`✅ "${name}" added successfully!`);
}

// ===== FUNCTION: Delete item =====
function deleteItem(id) {
    if (!confirm("Are you sure you want to delete this item?")) return;

    inventory = inventory.filter(item => item.id !== id);
    renderTable();
    alert("🗑️ Item deleted!");
}

// ===== FUNCTION: Edit item (placeholder muna) =====
function editItem(id) {
    alert("✏️ Edit feature coming soon! (Day 7)");
}

// ===== SETUP: I-connect ang form sa addItem function =====
document.addEventListener("DOMContentLoaded", () => {
    // Hanapin yung form at i-attach yung submit handler
    const form = document.querySelector("form");
    if (form) {
        form.addEventListener("submit", addItem);
    }

    // I-render yung initial items
    renderTable();

    console.log("✅ Inventory system loaded!");
    console.log("Total items:", inventory.length);
});