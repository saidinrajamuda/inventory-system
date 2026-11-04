// ===== REPORTS - DAY 26 (with Photo) =====

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

        if (!result.success) {
            throw new Error(result.message);
        }

        allVerifications = result.data;
        filteredVerifications = [...allVerifications];

        renderTable();
        updateSummary();

    } catch (error) {
        console.error("Error loading verifications:", error);
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 20px; color: #999;">
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
                    📭 No records found.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredVerifications.map(v => {
        const date = new Date(v.created_at).toLocaleString();
        const statusColor = v.status === "Matched" ? "#2e7d32" : "#c62828";
        const statusBg = v.status === "Matched" ? "#e8f5e9" : "#ffebee";
        const statusIcon = v.status === "Matched" ? "✅" : "⚠️";

        // Check kung may photo_data
        const photoBtn = v.photo_data 
            ? `<button onclick="viewPhoto('${v.photo_data}')" style="background:#3498db; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">📸 View</button>` 
            : '—';

        return `
            <tr>
                <td style="font-size: 13px; color: #666;">${date}</td>
                <td><strong>${v.code}</strong></td>
                <td>${v.name}</td>
                <td>${v.expected_qty}</td>
                <td>${v.actual_qty}</td>
                <td>
                    <span style="
                        padding: 4px 10px;
                        border-radius: 12px;
                        font-size: 12px;
                        font-weight: 600;
                        color: ${statusColor};
                        background: ${statusBg};
                    ">${statusIcon} ${v.status}</span>
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

    window.currentReportData = filteredVerifications;
}

// ===== APPLY FILTERS =====
function applyFilters() {
    const statusFilter = document.getElementById("filterStatus").value;
    const dateFrom = document.getElementById("filterDateFrom").value;
    const dateTo = document.getElementById("filterDateTo").value;

    filteredVerifications = allVerifications.filter(v => {
        if (statusFilter !== "All" && v.status !== statusFilter) return false;

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

// ===== CUSTOM PRINT REPORT (Corporate Style) =====
function printReport() {
    const data = window.currentReportData || [];
    if (data.length === 0) {
        alert("⚠️ No data to print.");
        return;
    }

    const total = data.length;
    const matched = data.filter(v => v.status === "Matched").length;
    const discrepancies = data.filter(v => v.status === "Discrepancy").length;
    const printedBy = getCurrentUser().full_name || getCurrentUser().username;

    const printWindow = window.open('', '_blank');
    
    // Idinagdag natin ang styling para maging corporate report
    printWindow.document.write(`
        <html>
        <head>
            <title>Inventory Verification Report</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 40px; color: #000; }
                
                /* Header Layout */
                .header-container { display: flex; align-items: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
                .logo { width: 80px; height: 80px; object-fit: contain; margin-right: 20px; }
                .company-info h1 { margin: 0; font-size: 22px; text-transform: uppercase; }
                .company-info p { margin: 2px 0; font-size: 14px; }
                
                /* Report Title */
                .report-title { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 5px; }
                .report-date { text-align: center; font-size: 14px; margin-bottom: 20px; }

                /* Summary */
                .summary { margin-bottom: 20px; font-size: 14px; }
                .summary span { margin-right: 30px; }

                /* Table */
                table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
                th { background-color: #f0f0f0; border: 1px solid #000; padding: 8px; text-align: left; }
                td { border: 1px solid #000; padding: 8px; }
                
                /* Signatures */
                .signatures { display: flex; justify-content: space-between; margin-top: 60px; page-break-inside: avoid; }
                .signature-box { text-align: center; width: 200px; }
                .signature-line { border-bottom: 1px solid #000; margin-bottom: 5px; height: 30px; }
                .signature-name { font-weight: bold; font-size: 14px; margin: 0; }
                .signature-title { font-size: 12px; margin: 0; }
                
                @media print { 
                    body { padding: 0; } 
                    .header-container { border-bottom: 2px solid #000; }
                }
            </style>
        </head>
        <body>
            <div class="header-container">
                <!-- Palitan mo ito ng path ng logo kung meron -->
                <div style="width:80px; height:80px; background:#eee; display:flex; align-items:center; justify-content:center; margin-right:20px; border-radius:50%; font-weight:bold; font-size:12px; text-align:center;">LOGO<br>HERE</div>
                <div class="company-info">
                    <h1>COMPACT II GENCON INC.</h1>
                    <p>1st Street, Don E. Sero, Rosary Heights 5, Cotabato City</p>
                    <p>Web-Based Inventory Monitoring and Tracking System</p>
                </div>
            </div>

            <div class="report-title">INVENTORY VERIFICATION REPORT</div>
            <div class="report-date">As of ${new Date().toLocaleString()}</div>

            <div class="summary">
                <span><strong>Total Records:</strong> ${total}</span>
                <span><strong>Matched:</strong> ${matched}</span>
                <span><strong>Discrepancies:</strong> ${discrepancies}</span>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Item Code</th>
                        <th>Item Name</th>
                        <th>Expected Qty</th>
                        <th>Actual Qty</th>
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
                    <p class="signature-name">${printedBy.toUpperCase()}</p>
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

// ===== VIEW PHOTO MODAL (BAGONG DAGDAG) =====
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