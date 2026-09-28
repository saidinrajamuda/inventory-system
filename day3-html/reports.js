// ===== REPORTS - DAY 18 (with RBAC) =====

const API_VERIFICATIONS = "http://localhost:3000/api/verifications";

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
                <td colspan="7" style="text-align: center; padding: 20px; color: #999;">
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
                <td colspan="7" style="text-align: center; padding: 20px; color: #999;">
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

    console.log(`✅ Exported ${data.length} records to CSV`);
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

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Inventory Verification Report</title>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
                h1 { color: #1e3a5f; font-size: 24px; margin-bottom: 5px; }
                .header { margin-bottom: 30px; border-bottom: 2px solid #1e3a5f; padding-bottom: 20px; }
                .meta { font-size: 14px; color: #666; margin: 5px 0; }
                .summary { display: flex; gap: 30px; margin: 20px 0; font-size: 16px; font-weight: 600; }
                .summary span { color: #1e3a5f; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background-color: #1e3a5f; color: white; padding: 10px; text-align: left; font-size: 13px; }
                td { padding: 10px; border-bottom: 1px solid #ddd; font-size: 13px; }
                .status-matched { color: #2e7d32; font-weight: 600; }
                .status-discrepancy { color: #c62828; font-weight: 600; }
                .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 20px; }
                @media print { body { padding: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📦 Inventory Verification Report</h1>
                <div class="meta">Company: Compact II Gencon Inc.</div>
                <div class="meta">Generated: ${new Date().toLocaleString()}</div>
                <div class="meta">Total Records: ${total}</div>
                <div class="summary">
                    <span>Matched: ${matched}</span>
                    <span>Discrepancies: ${discrepancies}</span>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Code</th>
                        <th>Item Name</th>
                        <th>Expected</th>
                        <th>Actual</th>
                        <th>Status</th>
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
                            <td class="${v.status === "Matched" ? "status-matched" : "status-discrepancy"}">${v.status === "Matched" ? "✅ Matched" : "⚠️ Discrepancy"}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>

            <div class="footer">
                © 2026 Compact II Gencon Inc. — Inventory Management System
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

// ===== INITIALIZE =====
document.addEventListener("DOMContentLoaded", () => {
    if (!isLoggedIn()) {
        window.location.href = "login.html";
        return;
    }

    loadVerifications();
    console.log("✅ Reports page loaded!");
});