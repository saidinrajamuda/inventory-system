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

// ===== RENDER TABLE WITH COLOR CODING =====
function renderTable(items) {
    const tbody = document.getElementById("itemsTableBody");

    if (!items || items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">📭 No items found.</td></tr>`;
        return;
    }

    tbody.innerHTML = items.map(item => {
        // Logic para sa kulay
        let qtyColor = "#333"; // Default black
        let qtyBg = "transparent";
        let statusLabel = "";

        if (item.quantity === 0) {
            qtyColor = "#c62828"; // Red
            qtyBg = "#ffebee";
            statusLabel = " (Out)";
        } else if (item.quantity <= item.reorder_level) {
            qtyColor = "#d35400"; // Orange
            qtyBg = "#fff3e0";
            statusLabel = " (Low)";
        }

        return `
        <tr>
            <td data-label="ID">${item.id}</td>
            <td data-label="Code">${item.code}</td>
            <td data-label="Name">${item.name}</td>
            <td data-label="Category">${item.category}</td>
            <td data-label="Qty" style="color: ${qtyColor}; font-weight: bold; background: ${qtyBg};">
                ${item.quantity} ${item.unit || ''} ${statusLabel}
            </td>
            <td data-label="Condition">${item.condition}</td>
            <td data-label="Actions">
                <button onclick="showQRCode('${item.id}')" style="background-color: #27ae60;">QR</button>
                <button onclick="showBarcode('${item.id}')" style="background-color: #8e44ad;">Barcode</button>
            </td>
        </tr>
    `}).join("");
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

// ===== PRINT ITEM LIST (Corporate Style) =====
function printItemList() {
    const rows = document.querySelectorAll("#itemsTableBody tr");
    if (rows.length === 0 || rows[0].innerText.includes("No items")) {
        alert("⚠️ No data to print.");
        return;
    }

    const printWindow = window.open('', '_blank');
    let tableHTML = "";
    
    rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 6) {
            tableHTML += `
                <tr>
                    <td>${cells[0].innerText}</td>
                    <td>${cells[1].innerText}</td>
                    <td>${cells[2].innerText}</td>
                    <td>${cells[3].innerText}</td>
                    <td style="text-align: center;">${cells[4].innerText}</td>
                    <td style="text-align: center;">${cells[5].innerText}</td>
                </tr>
            `;
        }
    });

    printWindow.document.write(`
        <html>
        <head>
            <title>Inventory Master List - Compact II</title>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #333; }
                .header-container { text-align: center; border-bottom: 3px double #1e3a5f; padding-bottom: 15px; margin-bottom: 20px; }
                .logo { width: 100px; height: auto; margin-bottom: 10px; }
                .company-info h1 { margin: 0; font-size: 22px; color: #1e3a5f; text-transform: uppercase; letter-spacing: 1px; }
                .company-info p { margin: 3px 0; font-size: 12px; color: #555; }
                .report-title { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; }
                .report-date { text-align: center; font-size: 12px; color: #666; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
                th { background-color: #1e3a5f; color: white; padding: 8px; text-align: left; border: 1px solid #1e3a5f; }
                td { padding: 6px 8px; border: 1px solid #ddd; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .signatures { display: flex; justify-content: space-between; margin-top: 50px; page-break-inside: avoid; }
                .signature-box { text-align: center; width: 250px; }
                .signature-line { border-bottom: 1px solid #333; margin-bottom: 5px; height: 30px; }
                .signature-name { font-weight: bold; font-size: 13px; margin: 0; text-transform: uppercase; }
                .signature-title { font-size: 11px; margin: 0; color: #555; }
                @media print { body { padding: 0; } .header-container { border-bottom: 3px double #1e3a5f; } }
            </style>
        </head>
        <body>
            <div class="header-container">
                <img src="logo.png" class="logo" onerror="this.style.display='none'">
                <div class="company-info">
                    <h1>COMPACT II GENCON INC.</h1>
                    <p>1st Street, Don E. Sero, Rosary Heights 5, Cotabato City</p>
                    <p>Web-Based Inventory Monitoring and Tracking System</p>
                </div>
            </div>
            <div class="report-title">Inventory Master List</div>
            <div class="report-date">Generated on: ${new Date().toLocaleString()}</div>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Unique Code</th>
                        <th>Item Name</th>
                        <th>Category</th>
                        <th>Qty</th>
                        <th>Condition</th>
                    </tr>
                </thead>
                <tbody>${tableHTML}</tbody>
            </table>
            <div class="signatures">
                <div class="signature-box">
                    <div class="signature-line"></div>
                    <p class="signature-name">Prepared By</p>
                    <p class="signature-title">Authorized Personnel</p>
                </div>
                <div class="signature-box">
                    <div class="signature-line"></div>
                    <p class="signature-name">RAUL S. LLANO</p>
                    <p class="signature-title">VP for Operations</p>
                </div>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}