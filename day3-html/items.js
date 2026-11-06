// ===== ITEM LIST WITH SITE FILTER =====
const API_URL = `${window.API_BASE_URL}/api/items`;
const API_WAREHOUSES = `${window.API_BASE_URL}/api/warehouses`;

let allItems = []; 

// ===== LOAD ITEMS =====
async function loadItems() {
    const tbody = document.getElementById("itemsTableBody");
    try {
        const response = await fetch(API_URL, { headers: authHeaders() });
        const result = await response.json();

        if (result.success) {
            allItems = result.data;
            renderTable(allItems);
        }
    } catch (error) {
        console.error("Error:", error);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:red;">⚠️ Cannot connect to server</td></tr>`;
    }
}

// ===== LOAD WAREHOUSES (Para sa Filter Dropdown) =====
async function loadWarehousesForFilter() {
    try {
        const response = await fetch(API_WAREHOUSES, { headers: authHeaders() });
        const result = await response.json();

        if (result.success) {
            const select = document.getElementById("filterSite");
            result.data.forEach(w => {
                const opt = document.createElement("option");
                opt.value = w.id; 
                opt.textContent = w.name; 
                select.appendChild(opt);
            });
        }
    } catch (error) {
        console.error("Error loading warehouses:", error);
    }
}

// ===== RENDER TABLE =====
function renderTable(items) {
    const tbody = document.getElementById("itemsTableBody");
    
    if (!items || items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;">📭 No items found.</td></tr>`;
        return;
    }

    tbody.innerHTML = items.map(item => `
        <tr>
            <td>${item.id}</td>
            <td><strong>${item.code}</strong></td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.quantity} ${item.unit || ''}</td>
            <td>
                <span style="padding: 4px 8px; border-radius: 4px; background: #e9ecef; font-size: 12px;">
                    ${item.condition}
                </span>
            </td>
            <td>
                <button onclick="showQRCode('${item.id}')" style="background-color: #27ae60; padding: 5px 10px; font-size: 12px;">QR</button>
                <button onclick="showBarcode('${item.id}')" style="background-color: #8e44ad; padding: 5px 10px; font-size: 12px;">Barcode</button>
            </td>
        </tr>
    `).join("");
}

// ===== FILTER LOGIC (Search + Site) =====
function filterItems() {
    const searchQuery = document.getElementById("searchItem").value.toLowerCase();
    const selectedSiteId = document.getElementById("filterSite").value;
    
    let filteredItems = allItems;

    // 1. Site Filter
    if (selectedSiteId !== "All") {
        filteredItems = filteredItems.filter(item => item.warehouse_id == selectedSiteId);
    }

    // 2. Search Filter
    if (searchQuery.trim() !== "") {
        filteredItems = filteredItems.filter(item => 
            item.name.toLowerCase().includes(searchQuery) || 
            item.code.toLowerCase().includes(searchQuery)
        );
    }

    renderTable(filteredItems);
}

// ===== SHOW QR =====
async function showQRCode(id) {
    const response = await fetch(`${API_URL}/${id}/qrcode`, { headers: authHeaders() });
    const result = await response.json();
    if (result.success) {
        const { item, qrCode } = result.data;
        let modal = document.createElement("div");
        modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 9999;`;
        modal.innerHTML = `<div style="background: white; padding: 30px; border-radius: 12px; text-align: center; max-width: 400px;"><h2>${item.name}</h2><img src="${qrCode}" style="width: 300px; height: 300px;" /><br><button onclick="this.closest('div[style*=fixed]').remove()" style="margin-top: 20px; padding: 10px 30px; background: #1e3a5f; color: white; border: none; border-radius: 6px; cursor: pointer;">Close</button></div>`;
        document.body.appendChild(modal);
    }
}

// ===== SHOW BARCODE =====
async function showBarcode(id) {
    const response = await fetch(`${API_URL}/${id}/barcode`, { headers: authHeaders() });
    const result = await response.json();
    if (result.success) {
        const { item, barcode } = result.data;
        let modal = document.createElement("div");
        modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 9999;`;
        modal.innerHTML = `<div style="background: white; padding: 30px; border-radius: 12px; text-align: center; max-width: 500px;"><h2>${item.name}</h2><img src="${barcode}" style="max-width: 100%; height: auto;" /><br><button onclick="this.closest('div[style*=fixed]').remove()" style="margin-top: 20px; padding: 10px 30px; background: #8e44ad; color: white; border: none; border-radius: 6px; cursor: pointer;">Close</button></div>`;
        document.body.appendChild(modal);
    }
}

// ===== INITIALIZE =====
document.addEventListener("DOMContentLoaded", () => {
    if (!isLoggedIn()) {
        window.location.href = "login.html";
        return;
    }
    loadItems();
    loadWarehousesForFilter(); 
});