// ===== INVENTORY SYSTEM - DAY 10 =====
// Frontend connected to Backend API

// API URL
const API_URL = "http://localhost:3000/api/items";

// ===== EDIT MODE TRACKER =====
let editingId = null;
let inventory = [];  // Magiging laman nito ay galing sa backend

// ===== FETCH ALL ITEMS (READ) =====
async function fetchItems() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (data.success) {
            inventory = data.data;
            renderTable();
        }
    } catch (error) {
        console.error("❌ Error fetching items:", error);
        alert("⚠️ Cannot connect to server. Make sure backend is running!");
    }
}

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
async function addItem(event) {
    event.preventDefault();

    const name = document.getElementById("itemName").value.trim();
    const code = document.getElementById("uniqueCode").value.trim();
    const category = document.getElementById("category").value;
    const quantity = parseInt(document.getElementById("quantity").value);
    const location = document.getElementById("location").value.trim();
    const condition = document.getElementById("condition").value;

    if (!name || !code || !category || !quantity || !condition) {
        alert("⚠️ Please fill in all required fields!");
        return;
    }

    if (quantity < 0) {
        alert("⚠️ Quantity cannot be negative!");
        return;
    }

    const itemData = { code, name, category, quantity, location, condition };

    try {
        let response;

        if (editingId !== null) {
            // UPDATE
            response = await fetch(`${API_URL}/${editingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(itemData)
            });
        } else {
            // CREATE
            response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(itemData)
            });
        }

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "❌ Something went wrong!");
            return;
        }

        alert(data.message);
        await fetchItems();
        resetForm();

    } catch (error) {
        console.error("❌ Error:", error);
        alert("⚠️ Cannot connect to server.");
    }
}

// ===== EDIT ITEM =====
function editItem(id) {
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    document.getElementById("itemName").value = item.name;
    document.getElementById("uniqueCode").value = item.code;
    document.getElementById("category").value = item.category;
    document.getElementById("quantity").value = item.quantity;
    document.getElementById("location").value = item.location || "";
    document.getElementById("condition").value = item.condition;

    editingId = id;

    const submitBtn = document.getElementById("submitBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const formTitle = document.getElementById("formTitle");

    if (submitBtn) submitBtn.textContent = "💾 Update Item";
    if (cancelBtn) cancelBtn.style.display = "inline-block";
    if (formTitle) formTitle.textContent = `✏️ Editing: ${item.name}`;

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
async function deleteItem(id) {
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "❌ Failed to delete!");
            return;
        }

        alert(data.message);
        await fetchItems();

        if (editingId === id) resetForm();

    } catch (error) {
        console.error("❌ Error:", error);
        alert("⚠️ Cannot connect to server.");
    }
}

// ===== SETUP =====
document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
    if (form) form.addEventListener("submit", addItem);

    // Load items from backend
    fetchItems();

    console.log("✅ Frontend connected to backend!");
});