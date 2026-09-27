// ===== INVENTORY SYSTEM - DAY 10 =====
// Frontend connecting to backend API

const API_URL = "http://localhost:3000/api/items";

// ===== EDIT MODE TRACKER =====
let editingId = null;

// ===== RENDER TABLE =====
function renderTable(items) {
    const tbody = document.querySelector("tbody");
    tbody.innerHTML = "";

    if (!items || items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 20px; color: #999;">
                    📭 No items yet. Add your first item above!
                </td>
            </tr>
        `;
        return;
    }

    items.forEach(item => {
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

// ===== LOAD ITEMS FROM BACKEND =====
async function loadItems() {
    try {
        const response = await fetch(API_URL);
        const result = await response.json();

        if (result.success) {
            renderTable(result.data);
            console.log(`✅ Loaded ${result.count} items from backend`);
        }
    } catch (error) {
        console.error("❌ Error loading items:", error);
        alert("⚠️ Cannot connect to server. Make sure backend is running!");
    }
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

    // Validation
    if (!name || !code || !category || isNaN(quantity) || !condition) {
        alert("⚠️ Please fill in all required fields!");
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

        const result = await response.json();

        if (result.success) {
            alert(result.message);
            resetForm();
            loadItems();
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error("❌ Error:", error);
        alert("⚠️ Server error. Please try again.");
    }
}

// ===== EDIT ITEM =====
async function editItem(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        const result = await response.json();

        if (!result.success) {
            alert(result.message);
            return;
        }

        const item = result.data;

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
    } catch (error) {
        console.error("❌ Error:", error);
        alert("⚠️ Cannot load item details.");
    }
}

// ===== DELETE ITEM =====
async function deleteItem(id) {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });
        const result = await response.json();

        alert(result.message);
        loadItems();

        if (editingId === id) resetForm();
    } catch (error) {
        console.error("❌ Error:", error);
        alert("⚠️ Cannot delete item.");
    }
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

// ===== SETUP =====
document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
    if (form) {
        form.addEventListener("submit", addItem);
    }

    loadItems();
    console.log("✅ Frontend connected to backend API!");
});