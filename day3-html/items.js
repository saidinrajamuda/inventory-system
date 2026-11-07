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

// ===== PRINT ITEM LIST (Using Full Letterhead Image) =====
function printItemList() {
    const rows = document.querySelectorAll("#itemsTableBody tr");
    if (rows.length === 0 || rows[0].innerText.includes("No items")) {
        alert("⚠️ No data to print.");
        return;
    }

    const currentUser = getCurrentUser();
    const preparedBy = currentUser && currentUser.full_name ? currentUser.full_name : "Authorized Personnel";

    const printWindow = window.open('', '_blank');
    let tableHTML = "";
    
    rows.forEach((row, index) => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 6) {
            tableHTML += `
                <tr>
                    <td style="text-align: center;">${index + 1}</td>
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
                body { font-family: Arial, sans-serif; padding: 20px; color: #333; font-size: 12px; }
                
                /* Header Image Container */
                .header-image-container { 
                    text-align: center; 
                    margin-bottom: 20px; 
                }

                /* Letterhead Image */
                .letterhead {
                    width: 100%; 
                    max-width: 400px; /* Ito ang magko-control para hindi lumaki nang sobra */
                    height: auto;
                }
                
                .report-title { text-align: center; font-size: 18px; font-weight: bold; margin-top: 10px; margin-bottom: 5px; text-transform: uppercase; }
                .report-date { text-align: center; font-size: 12px; margin-bottom: 20px; color: #555; }
                
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
                th { background-color: #1e3a5f; color: white; padding: 8px; border: 1px solid #000; text-align: left; }
                td { padding: 6px 8px; border: 1px solid #000; }
                
                .signatures { display: flex; justify-content: space-between; margin-top: 40px; page-break-inside: avoid; }
                .signature-box { text-align: center; width: 250px; }
                .signature-title { font-size: 11px; margin-bottom: 30px; }
                .signature-line { border-bottom: 1px solid #000; margin-bottom: 5px; height: 20px; }
                .signature-name { font-weight: bold; font-size: 12px; margin: 0; text-transform: uppercase; }
                .signature-role { font-size: 11px; margin: 0; }
                
                @media print { 
                    body { padding: 0; }
                    .header-image-container { margin-bottom: 10px; }
                    @page { margin: 15mm; }
                }
            </style>
        </head>
        <body>
            <!-- Dito natin ilalagay yung Image ng Letterhead -->
            <div class="header-image-container">
                <img src="letterhead.png" class="letterhead" onerror="this.style.display='none'">
            </div>
            
            <div class="report-title">INVENTORY MASTER LIST</div>
            <div class="report-date">AS OF ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
            
            <table>
                <thead>
                    <tr>
                        <th style="width: 5%; text-align: center;">NO.</th>
                        <th style="width: 20%;">PRODUCT CODE</th>
                        <th style="width: 30%;">NAME / DESCRIPTION</th>
                        <th style="width: 20%;">CLASSIFICATION</th>
                        <th style="width: 10%; text-align: center;">QTY</th>
                        <th style="width: 15%; text-align: center;">UNIT</th>
                    </tr>
                </thead>
                <tbody>${tableHTML}</tbody>
            </table>
            
            <div class="signatures">
                <div class="signature-box">
                    <p class="signature-title">Prepared by:</p>
                    <div class="signature-line"></div>
                    <p class="signature-name">${preparedBy}</p>
                    <p class="signature-role">Inventory Staff</p>
                </div>
                <div class="signature-box">
                    <p class="signature-title">Noted by:</p>
                    <div class="signature-line"></div>
                    <p class="signature-name">RAUL S. LLANO</p>
                    <p class="signature-role">VP for Operations</p>
                </div>
            </div>

            <div class="signatures" style="margin-top: 30px;">
                <div class="signature-box">
                    <p class="signature-title">Checked by:</p>
                    <div class="signature-line"></div>
                    <p class="signature-name">JAIME O. BUENBRAZO</p>
                    <p class="signature-role">President</p>
                </div>
                <div class="signature-box">
                    <p class="signature-title">Noted by:</p>
                    <div class="signature-line"></div>
                    <p class="signature-name">JEFFREY O. NACIONAL</p>
                    <p class="signature-role">Treasurer</p>
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
// ===== EXPORT ITEMS TO CSV (EXCEL) =====
function exportItemsToCSV() {
    if (!allItems || allItems.length === 0) {
        alert("⚠️ No items to export.");
        return;
    }

    // Headers ng Excel file
    const headers = ["ID", "Unique Code", "Item Name", "Category", "Quantity", "Unit", "Condition", "Location", "Warehouse"];

    // Kunin yung data
    const rows = allItems.map(item => [
        item.id,
        item.code,
        item.name,
        item.category,
        item.quantity,
        item.unit || "pcs",
        item.condition,
        item.location || "",
        item.warehouse_name || ""
    ]);

    // I-convert sa CSV format
    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");

    // I-download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    const today = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `inventory-master-list-${today}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}