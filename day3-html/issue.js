// ===== ISSUE / RELEASE - DAY 23 =====
const API_ITEMS = `${window.API_BASE_URL}/api/items`;
const API_REQUESTS = `${window.API_BASE_URL}/api/requests`;

if (!isLoggedIn()) window.location.href = "login.html";

// ===== LOAD ITEMS DROPDOWN =====
async function loadItemsDropdown() {
    try {
        const res = await fetch(API_ITEMS, { headers: authHeaders() });
        const result = await res.json();
        if (!result.success) return;

        const select = document.getElementById("reqItem");
        select.innerHTML = '<option value="">-- Select Item --</option>';
        result.data.forEach(item => {
            const opt = document.createElement("option");
            opt.value = item.id;
            opt.textContent = `${item.code} — ${item.name} (${item.quantity} ${item.unit || 'pcs'} available)`;
            select.appendChild(opt);
        });
    } catch (error) {
        console.error("Error loading items:", error);
    }
}

// ===== LOAD REQUESTS =====
async function loadRequests() {
    const tbody = document.getElementById("requestsTableBody");
    try {
        const res = await fetch(API_REQUESTS, { headers: authHeaders() });
        const result = await res.json();

        if (!result.success || result.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:#999;">📭 No requests yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = result.data.map(r => {
            const date = new Date(r.created_at).toLocaleString();
            const statusColors = {
                "Pending": "#f39c12",
                "Approved": "#3498db",
                "Released": "#27ae60",
                "Rejected": "#e74c3c"
            };
            const color = statusColors[r.status] || "#666";

            let actions = "—";
            if (r.status === "Pending" && isAdmin()) {
                actions = `
                    <button onclick="approveRequest(${r.id})" style="background:#27ae60;">Approve</button>
                    <button onclick="rejectRequest(${r.id})" style="background:#e74c3c;">Reject</button>
                `;
            } else if (r.status === "Approved" && isAdmin()) {
                actions = `<button onclick="releaseRequest(${r.id})" style="background:#2980b9;">Release</button>`;
            }

            return `
                <tr>
                    <td style="font-size:13px;color:#666;">${date}</td>
                    <td><strong>${r.code}</strong><br><small>${r.item_name}</small></td>
                    <td>${r.quantity}</td>
                    <td>${r.requested_by}</td>
                    <td style="font-size:13px;">${r.purpose || "-"}<br><small>${r.project_site || ""}</small></td>
                    <td><span style="padding:4px 10px;border-radius:12px;font-size:12px;font-weight:600;background:${color}22;color:${color};">${r.status}</span></td>
                    <td>${actions}</td>
                </tr>
            `;
        }).join("");
    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:red;">⚠️ Cannot load requests</td></tr>`;
    }
}

// ===== SUBMIT REQUEST =====
document.addEventListener("DOMContentLoaded", () => {
    loadItemsDropdown();
    loadRequests();

    const form = document.getElementById("requestForm");
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const data = {
                item_id: parseInt(document.getElementById("reqItem").value),
                quantity: parseInt(document.getElementById("reqQty").value),
                purpose: document.getElementById("reqPurpose").value,
                project_site: document.getElementById("reqSite").value,
                requested_by: document.getElementById("reqBy").value,
                notes: document.getElementById("reqNotes").value
            };

            if (!data.item_id || !data.quantity || !data.requested_by) {
                alert("⚠️ Please fill all required fields");
                return;
            }

            try {
                const res = await fetch(API_REQUESTS, {
                    method: "POST",
                    headers: authHeaders(),
                    body: JSON.stringify(data)
                });
                const result = await res.json();
                alert(result.message);
                if (result.success) {
                    form.reset();
                    loadRequests();
                    loadItemsDropdown();
                }
            } catch (err) {
                alert("❌ Error submitting request");
            }
        });
    }
});

// ===== APPROVE =====
async function approveRequest(id) {
    if (!confirm("Approve this request?")) return;
    const res = await fetch(`${API_REQUESTS}/${id}/approve`, { method: "PUT", headers: authHeaders() });
    const result = await res.json();
    alert(result.message);
    loadRequests();
}

// ===== REJECT =====
async function rejectRequest(id) {
    if (!confirm("Reject this request?")) return;
    const res = await fetch(`${API_REQUESTS}/${id}/reject`, { method: "PUT", headers: authHeaders() });
    const result = await res.json();
    alert(result.message);
    loadRequests();
}

// ===== RELEASE =====
async function releaseRequest(id) {
    const released_to = prompt("Released to (person/name):");
    if (!released_to) return;
    const res = await fetch(`${API_REQUESTS}/${id}/release`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ released_to })
    });
    const result = await res.json();
    alert(result.message);
    loadRequests();
    loadItemsDropdown();
}
// ===== EXPORT TO EXCEL (BY AREA / WAREHOUSE) =====
async function exportToAreaExcel() {
    if (!allItems || allItems.length === 0) {
        alert("⚠️ No items to export.");
        return;
    }

    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Inventory by Area');

        worksheet.pageSetup = { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1 };

        // 1. I-load ang Logo
        let logoId = null;
        try {
            const logoResponse = await fetch('sidebar-logo.png');
            if (logoResponse.ok) {
                const logoBuffer = await logoResponse.arrayBuffer();
                logoId = workbook.addImage({ buffer: logoBuffer, extension: 'png' });
            }
        } catch (e) {
            console.warn("Logo not found.");
        }

        if (logoId) {
            worksheet.addImage(logoId, {
                tl: { col: 2, row: 0 },
                ext: { width: 300, height: 90 }
            });
        }

        // Space para sa logo
        for (let i = 0; i < 6; i++) { worksheet.addRow([]); }

        // Title
        const titleRow = worksheet.addRow(["INVENTORY REPORT"]);
        titleRow.font = { name: 'Arial', size: 16, bold: true };
        titleRow.alignment = { horizontal: 'center' };
        worksheet.mergeCells(`A${titleRow.number}:H${titleRow.number}`);

        // Date
        const dateRow = worksheet.addRow([`AS OF ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`]);
        dateRow.font = { name: 'Arial', size: 12, italic: true };
        dateRow.alignment = { horizontal: 'center' };
        worksheet.mergeCells(`A${dateRow.number}:H${dateRow.number}`);
        worksheet.addRow([]); 

        // I-group base sa Warehouse/Area
        const groupedItems = {};
        allItems.forEach(item => {
            const areaName = item.warehouse_name || item.location || "Unassigned Area"; 
            if (!groupedItems[areaName]) groupedItems[areaName] = [];
            groupedItems[areaName].push(item);
        });

        // I-loop bawat Area
        for (const [areaName, items] of Object.entries(groupedItems)) {
            
            const areaRow = worksheet.addRow([areaName.toUpperCase()]);
            areaRow.font = { name: 'Arial', size: 12, bold: true };
            worksheet.mergeCells(`A${areaRow.number}:H${areaRow.number}`);
            
            const locRow = worksheet.addRow([`Location: ${areaName}`]);
            locRow.font = { name: 'Arial', size: 10, italic: true };
            worksheet.mergeCells(`A${locRow.number}:H${locRow.number}`);
            
            worksheet.addRow([]); // Space

            // Table Headers
            const headerRow = worksheet.addRow([
                "NO.", "PRODUCT CODE", "NAME / DESCRIPTION", "CLASSIFICATION", "QTY", "UNIT", "CONDITION", "LOCATION"
            ]);

            headerRow.eachCell((cell) => {
                cell.font = { name: 'Arial', size: 10, bold: true };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });

            // Data Rows
            items.forEach((item, index) => {
                const row = worksheet.addRow([
                    index + 1, item.code, item.name, item.category, item.quantity, item.unit || 'pcs', item.condition, item.location || areaName
                ]);

                row.eachCell((cell) => {
                    cell.font = { name: 'Arial', size: 10 };
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    if ([1, 5, 6].includes(cell.col)) cell.alignment = { horizontal: 'center' };
                });
            });

            worksheet.addRow([]); 
            worksheet.addRow([]); 
        }

        // Auto-fit Columns
        worksheet.columns.forEach((column, i) => {
            if (i === 0) column.width = 5;
            else if (i === 1) column.width = 18;
            else if (i === 2) column.width = 30;
            else if (i === 3) column.width = 22;
            else if (i === 4) column.width = 8;
            else if (i === 5) column.width = 8;
            else if (i === 6) column.width = 15;
            else if (i === 7) column.width = 20;
        });

        // I-download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `CompactII_Inventory_ByArea_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();

    } catch (error) {
        console.error("Excel Export Error:", error);
        alert("⚠️ Cannot generate Excel file. Please check console.");
    }
}