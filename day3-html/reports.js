// ===== REPORTS - DAY 16 =====

const API_VERIFICATIONS = "http://localhost:3000/api/verifications";
let allVerifications = [];
let filteredVerifications = [];

// ===== LOAD VERIFICATIONS =====
async function loadVerifications() {
    try {
        const response = await fetch(API_VERIFICATIONS);
        const result = await response.json();

        if (result.success) {
            allVerifications = result.data;
            filteredVerifications = [...allVerifications];
            renderTable();
            updateSummary();
        }
    } catch (error) {
        console.error("Error loading verifications:", error);
        document.getElementById("reportBody").innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 20px; color: #e74c3c;">
                    ⚠️ Cannot connect to server. Make sure backend is running.
                </td>
            </tr>
        `;
    }
}

// ===== RENDER TABLE =====
function renderTable() {
    const tbody = document.getElementById("reportBody");

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
                <td style="font-size: 13px; color: #666;">${v.verified_by || "N/A"}</td>
                <td style="font-size: 13px; color: #666;">${v.remarks || "—"}</td>
            </tr>
        `;
    }).join("");
}

// ===== UPDATE SUMMARY =====
function updateSummary() {
    const total = filteredVerifications.length;
    const matched = filteredVerifications.filter(v => v.status === "Matched").length;
    const discrepancies = filteredVerifications.filter(v => v.status === "Discrepancy").length;

    document.getElementById("totalRecords").textContent = total;
    document.getElementById("totalMatched").textContent = matched;
    document.getElementById("totalDiscrepancies").textContent = discrepancies;
}

// ===== APPLY FILTERS =====
function applyFilters() {
    const status = document.getElementById("filterStatus").value;
    const dateFrom = document.getElementById("filterDateFrom").value;
    const dateTo = document.getElementById("filterDateTo").value;

    filteredVerifications = allVerifications.filter(v => {
        // Status filter
        if (status !== "all" && v.status !== status) return false;

        // Date filter
        const recordDate = new Date(v.created_at);
        if (dateFrom && recordDate < new Date(dateFrom + "T00:00:00")) return false;
        if (dateTo && recordDate > new Date(dateTo + "T23:59:59")) return false;

        return true;
    });

    renderTable();
    updateSummary();
}

// ===== CLEAR FILTERS =====
function clearFilters() {
    document.getElementById("filterStatus").value = "all";
    document.getElementById("filterDateFrom").value = "";
    document.getElementById("filterDateTo").value = "";
    filteredVerifications = [...allVerifications];
    renderTable();
    updateSummary();
}

// ===== EXPORT CSV =====
function exportCSV() {
    if (filteredVerifications.length === 0) {
        alert("⚠️ No records to export.");
        return;
    }

    // CSV header
    const headers = ["Date & Time", "Item Code", "Item Name", "Expected", "Actual", "Status", "Verified By", "Remarks"];

    // CSV rows
    const rows = filteredVerifications.map(v => [
        new Date(v.created_at).toLocaleString(),
        v.code,
        v.name,
        v.expected_qty,
        v.actual_qty,
        v.status,
        v.verified_by || "",
        v.remarks || ""
    ]);

    // Combine
    const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    // Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().slice(0, 10);

    link.setAttribute("href", url);
    link.setAttribute("download", `inventory_verifications_${timestamp}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(`✅ Exported ${filteredVerifications.length} records to CSV!`);
}

// ===== PRINT REPORT =====
function printReport() {
    if (filteredVerifications.length === 0) {
        alert("⚠️ No records to print.");
        return;
    }

    const printWindow = window.open("", "_blank");

    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Inventory Verification Report</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #1e3a5f; border-bottom: 3px solid #1e3a5f; padding-bottom: 10px; }
                .header-info { margin-bottom: 20px; color: #666; font-size: 14px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
                th { background: #1e3a5f; color: white; padding: 10px; text-align: left; }
                td { padding: 8px 10px; border-bottom: 1px solid #ddd; }
                tr:nth-child(even) { background: #f9f9f9; }
                .matched { color: #2e7d32; font-weight: 600; }
                .discrepancy { color: #c62828; font-weight: 600; }
                .footer { margin-top: 30px; text-align: center; color: #999; font-size: 12px; }
                @media print {
                    body { padding: 0; }
                }
            </style>
        </head>
        <body>
            <h1>📦 Inventory Verification Report</h1>
            <div class="header-info">
                <p><strong>Company:</strong> Compact II Gencon Inc.</p>
                <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Total Records:</strong> ${filteredVerifications.length}</p>
                <p><strong>Matched:</strong> ${filteredVerifications.filter(v => v.status === "Matched").length} | 
                   <strong>Discrepancies:</strong> ${filteredVerifications.filter(v => v.status === "Discrepancy").length}</p>
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
                    ${filteredVerifications.map(v => `
                        <tr>
                            <td>${new Date(v.created_at).toLocaleString()}</td>
                            <td><strong>${v.code}</strong></td>
                            <td>${v.name}</td>
                            <td>${v.expected_qty}</td>
                            <td>${v.actual_qty}</td>
                            <td class="${v.status === 'Matched' ? 'matched' : 'discrepancy'}">
                                ${v.status === 'Matched' ? '✅' : '⚠️'} ${v.status}
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Compact II Gencon Inc. — Inventory Management System</p>
            </div>
            <script>
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
}

// ===== INITIALIZE =====
document.addEventListener("DOMContentLoaded", () => {
    loadVerifications();
    console.log("✅ Reports page loaded!");
});