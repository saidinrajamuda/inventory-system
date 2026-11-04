// ===== ITEM LIST - DAY 28 =====
const API_URL = `${window.API_BASE_URL}/api/items`;

async function loadItems() {
    const tbody = document.getElementById("itemsTableBody");
    try {
        const response = await fetch(API_URL, { headers: authHeaders() });
        const result = await response.json();

        if (!result.success || result.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;">📭 No items found.</td></tr>`;
            return;
        }

        tbody.innerHTML = result.data.map(item => `
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
    } catch (error) {
        console.error("Error:", error);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:red;">⚠️ Cannot connect to server</td></tr>`;
    }
}

// ===== SHOW QR & BARCODE (Re-using the same logic from script.js) =====
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

document.addEventListener("DOMContentLoaded", () => {
    if (!isLoggedIn()) {
        window.location.href = "login.html";
        return;
    }
    loadItems();
});