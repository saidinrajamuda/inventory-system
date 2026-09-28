// ===== INVENTORY SYSTEM - DAY 18 (with RBAC) =====

const API_URL = `${window.API_BASE_URL}/api/items`;

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
                <button onclick="editItem(${item.id})" data-role="admin">Edit</button>
                <button onclick="deleteItem(${item.id})" data-role="admin">Delete</button>
                <button onclick="showQRCode(${item.id})" style="background-color: #27ae60;">QR</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // I-apply yung role-based UI pagkatapos i-render
    if (typeof applyRoleBasedUI === "function") {
        applyRoleBasedUI();
    }
}

// ===== LOAD ITEMS FROM BACKEND =====
async function loadItems() {
    try {
        const response = await fetch(API_URL, {
            headers: authHeaders()
        });
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

    if (!name || !code || !category || isNaN(quantity) || !condition) {
        alert("⚠️ Please fill in all required fields!");
        return;
    }

    const itemData = { code, name, category, quantity, location, condition };

    try {
        let response;

        if (editingId !== null) {
            response = await fetch(`${API_URL}/${editingId}`, {
                method: "PUT",
                headers: authHeaders(),
                body: JSON.stringify(itemData)
            });
        } else {
            response = await fetch(API_URL, {
                method: "POST",
                headers: authHeaders(),
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
        const response = await fetch(`${API_URL}/${id}`, {
            headers: authHeaders()
        });
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
            method: "DELETE",
            headers: authHeaders()
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

// ===== SHOW QR CODE =====
async function showQRCode(id) {
    try {
        const response = await fetch(`${API_URL}/${id}/qrcode`, {
            headers: authHeaders()
        });
        const result = await response.json();

        if (!result.success) {
            alert(result.message);
            return;
        }

        const { item, qrCode } = result.data;

        const modal = document.createElement("div");
        modal.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 12px;
                text-align: center;
                max-width: 400px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            ">
                <h2 style="color: #1e3a5f; margin-bottom: 8px;">${item.name}</h2>
                <p style="color: #666; margin-bottom: 20px; font-size: 14px;">${item.code}</p>
                <img src="${qrCode}" alt="QR Code" style="width: 300px; height: 300px;" />
                <p style="color: #999; font-size: 12px; margin-top: 15px;">📱 Scan this QR code</p>
                <button id="closeQRBtn" style="
                    margin-top: 20px;
                    padding: 10px 30px;
                    background: #1e3a5f;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                ">Close</button>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById("closeQRBtn").addEventListener("click", () => {
            modal.remove();
        });

        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.remove();
        });
    } catch (error) {
        console.error("❌ QR error:", error);
        alert("⚠️ Cannot load QR code.");
    }
}

// ===== SETUP =====
document.addEventListener("DOMContentLoaded", () => {
    if (!isLoggedIn()) {
        window.location.href = "login.html";
        return;
    }

    const form = document.querySelector("form");
    if (form) {
        form.addEventListener("submit", addItem);
    }

    loadItems();
    console.log("✅ Frontend connected to backend API!");
});