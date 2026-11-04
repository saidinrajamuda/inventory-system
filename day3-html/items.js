// ===== ITEM LIST WITH SITE FILTER =====
const API_URL = `${window.API_BASE_URL}/api/items`;
const API_WAREHOUSES = `${window.API_BASE_URL}/api/warehouses`;

let allItems = []; // Dito natin itatabi lahat ng items

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
                opt.value = w.id; // Warehouse ID
                opt.textContent = w.name; // E.g., "NDU- Cotabato", "CDO"
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
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;">📭 No items found for this site.</td></tr>`;
        return;
    }

    tbody.innerHTML = items.map(item => `
        <tr>
            <td>${item.id}</td>
            <td>${item.code}</td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.quantity} ${item.unit || ''}</td>
            <td>${item.condition}</td>
            <td>
                <button onclick="showQRCode('${item.id}')" style="background-color: #27ae60;">QR</button>
                <button onclick="showBarcode('${item.id}')" style="background-color: #8e44ad;">Barcode</button>
            </td>
        </tr>
    `).join("");
}

// ===== FILTER LOGIC =====
function filterItemsBySite() {
    const selectedSiteId = document.getElementById("filterSite").value;
    
    if (selectedSiteId === "All") {
        renderTable(allItems); // Ipakita lahat
    } else {
        // I-filter base sa warehouse_id
        const filtered = allItems.filter(item => item.warehouse_id == selectedSiteId);
        renderTable(filtered);
    }
}

// ===== SHOW QR & BARCODE (Existing code) =====
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
    loadWarehousesForFilter(); // I-load yung mga sites sa dropdown
});