// ===== REPORTS - DAY 16 =====

const API_VERIFICATIONS = "http://localhost:3000/api/verifications";

let allVerifications = [];
let filteredVerifications = [];

// ===== LOAD VERIFICATIONS FROM BACKEND =====
async function loadVerifications() {
    const tbody = document.getElementById("reportsTableBody");

    try {
        const response = await fetch(API_VERIFICATIONS);
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

    // I-save para sa export
    window.currentReportData = filteredVerifications;
}

// ===== APPLY FILTERS =====
function applyFilters() {
    const statusFilter = document.getElementById("filterStatus").value;
    const dateFrom = document.getElementById("filterDateFrom").value;
    const dateTo = document.getElementById("filterDateTo").value;

    filteredVerifications = allVerifications.filter(v => {
        // Status filter
        if (statusFilter !== "All" && v.status !== statusFilter) return false;

        // Date filter
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

    // Header row
    const headers = ["Date", "Item Code", "Item Name", "Expected Qty", "Actual Qty", "Status", "Remarks", "Verified By"];

    // Data rows
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

    // Combine headers at rows
    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");

    // Gumawa ng Blob at i-download
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

// ===== INITIALIZE =====
document.addEventListener("DOMContentLoaded", () => {
    loadVerifications();
    console.log("✅ Reports page loaded!");
});