// ===== REPORTS - PROFESSIONAL VERSION =====

const API_VERIFICATIONS = `${window.API_BASE_URL}/api/verifications`;

let allVerifications = [];
let filteredVerifications = [];

// ===== LOAD VERIFICATIONS FROM BACKEND =====
async function loadVerifications() {
    const tbody = document.getElementById("reportsTableBody");

    try {
        const response = await fetch(API_VERIFICATIONS, {
            headers: authHeaders()
        });
        const result = await response.json();

        if (!result.success) throw new Error(result.message);

        allVerifications = result.data;
        filteredVerifications = [...allVerifications];

        renderTable();
        updateSummary();

    } catch (error) {
        console.error("Error loading verifications:", error);
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 20px; color: #c62828;">
                    ⚠️ Cannot connect to server
                </td>
            </tr>
        `;
    }
}

// ===== RENDER TABLE =====
function renderTable() {
    const tbody = document.getElementById("reportsTableBody");

    if (filteredVerifications.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 20px; color: #999;">
                    📭 No records found matching your filters.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredVerifications.map(v => {
        const date = new Date(v.created_at).toLocaleString();
        
        let statusClass = "status-matched";
        let statusIcon = "✅";
        if (v.status === "Discrepancy") {
            statusClass = "status-discrepancy";
            statusIcon = "⚠️";
        } else if (v.status === "Resolved") {
            statusClass = "status-matched"; // Or create a separate resolved color
            statusIcon = "🛠️";
        }

        const photoBtn = v.photo_data 
            ? `<button onclick="viewPhoto('${v.photo_data}')" style="background:#3498db; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">📸 View</button>` 
            : '<span style="color:#ccc;">None</span>';

        return `
            <tr>
                <td style="font-size: 13px; color: #666;">${date}</td>
                <td><strong>${v.code}</strong></td>
                <td>${v.name}</td>
                <td>${v.expected_qty}</td>
                <td style="font-weight: ${v.status !== 'Matched' ? 'bold' : 'normal'}; color: ${v.status !== 'Matched' ? '#c62828' : '#333'};">
                    ${v.actual_qty}
                </td>
                <td>
                    <span class="status-badge ${statusClass}">${statusIcon} ${v.status}</span>
                </td>
                <td style="font-size: 13px; color: #666;">${v.verified_by}</td>
                <td>${photoBtn}</td>
            </tr>
        `;
    }).join("");
}

// ===== UPDATE SUMMARY =====
function updateSummary() {
    const total = filteredVerifications.length;
    const matched = filteredVerifications.filter(v => v.status === "Matched").length;
    const discrepancies = filteredVerifications.filter(v => v.status === "Discrepancy").length;

    document.getElementById("reportSummary").textContent = 
        `Showing ${total} record(s) — ${matched} Matched, ${discrepancies} Discrepancy`;

    // I-save sa window para magamit ng Print at Export
    window.currentReportData = filteredVerifications;
}

// ===== APPLY FILTERS (Auto-run pag nag-type o nag-change) =====
function applyFilters() {
    const statusFilter = document.getElementById("filterStatus").value;
    const dateFrom = document.getElementById("filterDateFrom").value;
    const dateTo = document.getElementById("filterDateTo").value;
    const searchQuery = document.getElementById("filterSearch").value.toLowerCase();

    filteredVerifications = allVerifications.filter(v => {
        // 1. Search Filter
        if (searchQuery) {
            const matchName = v.name.toLowerCase().includes(searchQuery);
            const matchCode = v.code.toLowerCase().includes(searchQuery);
            if (!matchName && !matchCode) return false;
        }

        // 2. Status Filter
        if (statusFilter !== "All" && v.status !== statusFilter) return false;

        // 3. Date Filters
        const vDate = new Date(v.created_at);
        if (dateFrom) {
            const from = new Date(dateFrom);
            from.setHours(0, 0, 0, 0);
            if (vDate < from) return false;
        }
        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            if (vDate > to) return false;
        }

        return true;
    });

    renderTable();
    updateSummary();
}

// ===== RESET FILTERS =====
function resetFilters() {
    document.getElementById("filterStatus").value = "All";
    document.getElementById("filterDateFrom").value = "";
    document.getElementById("filterDateTo").value = "";
    document.getElementById("filterSearch").value = "";

    filteredVerifications = [...allVerifications];
    renderTable();
    updateSummary();
}

// ===== EXPORT TO CSV =====
function exportToCSV() {
    const data = window.currentReportData || [];

    if (data.length === 0) {
        alert("⚠️ No data to export.");
        return;
    }

    const headers = ["Date", "Item Code", "Item Name", "Expected Qty", "Actual Qty", "Status", "Remarks", "Verified By"];

    const rows = data.map(v => [
        new Date(v.created_at).toLocaleString(),
        v.code,
        v.name,
        v.expected_qty,
        v.actual_qty,
        v.status,
        v.remarks || "",
        v.verified_by
    ]);

    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    const today = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `inventory-verifications-${today}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ===== CUSTOM PRINT REPORT =====
function printReport() {
    const data = window.currentReportData || [];
    if (data.length === 0) {
        alert("⚠️ No data to print.");
        return;
    }

    const total = data.length;
    const matched = data.filter(v => v.status === "Matched").length;
    const discrepancies = data.filter(v => v.status === "Discrepancy").length;
    
    const currentUser = getCurrentUser();
    const printedBy = currentUser && currentUser.full_name ? currentUser.full_name : (currentUser ? currentUser.username : "Authorized Personnel");

    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <html>
        <head>
            <title>Inventory Verification Report</title>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
                .header-container { display: flex; align-items: center; border-bottom: 3px double #1e3a5f; padding-bottom: 15px; margin-bottom: 25px; }
                .logo { width: 80px; height: 80px; object-fit: contain; margin-right: 20px; }
                .company-info h1 { margin: 0; font-size: 24px; color: #1e3a5f; text-transform: uppercase; letter-spacing: 1px; }
                .company-info p { margin: 3px 0; font-size: 13px; color: #555; }
                .report-title { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; }
                .report-date { text-align: center; font-size: 13px; color: #666; margin-bottom: 25px; }
                .summary-box { background: #f8f9fa; border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin-bottom: 20px; font-size: 14px; display: flex; justify-content: space-around;}
                .summary-box span { font-weight: 600; color: #1e3a5f; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
                th { background-color: #1e3a5f; color: white; padding: 10px; text-align: left; }
                td { padding: 8px 10px; border-bottom: 1px solid #ddd; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .signatures { display: flex; justify-content: space-between; margin-top: 60px; page-break-inside: avoid; }
                .signature-box { text-align: center; width: 220px; }
                .signature-line { border-bottom: 1px solid #333; margin-bottom: 5px; height: 30px; }
                .signature-name { font-weight: bold; font-size: 14px; margin: 0; text-transform: uppercase; }
                .signature-title { font-size: 12px; margin: 0; color: #555; }
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

            <div class="report-title">Inventory Verification Report</div>
            <div class="report-date">Generated on: ${new Date().toLocaleString()}</div>

            <div class="summary-box">
                <div>Total Records: <span>${total}</span></div>
                <div>Matched: <span>${matched}</span></div>
                <div>Discrepancies: <span>${discrepancies}</span></div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Item Code</th>
                        <th>Item Name</th>
                        <th>Expected</th>
                        <th>Actual</th>
                        <th>Status</th>
                        <th>Verified By</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(v => `
                        <tr>
                            <td>${new Date(v.created_at).toLocaleDateString()}</td>
                            <td>${v.code}</td>
                            <td>${v.name}</td>
                            <td>${v.expected_qty}</td>
                            <td>${v.actual_qty}</td>
                            <td>${v.status}</td>
                            <td>${v.verified_by}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>

            <div class="signatures">
                <div class="signature-box">
                    <div class="signature-line"></div>
                    <p class="signature-name">${printedBy}</p>
                    <p class="signature-title">Prepared By</p>
                </div>
                <div class="signature-box">
                    <div class="signature-line"></div>
                    <p class="signature-name">RAUL S. LLANO</p>
                    <p class="signature-title">Noted By (VP for Operations)</p>
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

// ===== VIEW PHOTO MODAL =====
function viewPhoto(base64String) {
    const modal = document.getElementById("photoModal");
    const img = document.getElementById("modalImage");
    img.src = base64String;
    modal.style.display = "flex";
}

function closePhoto() {
    const modal = document.getElementById("photoModal");
    modal.style.display = "none";
}

// ===== INITIALIZE =====
document.addEventListener("DOMContentLoaded", () => {
    if (!isLoggedIn()) {
        window.location.href = "login.html";
        return;
    }

    loadVerifications();
    console.log("✅ Reports page loaded!");
});