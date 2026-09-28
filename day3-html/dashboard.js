// ===== DASHBOARD - DAY 18 (with RBAC) =====

const API_ITEMS = "http://localhost:3000/api/items";
const API_VERIFICATIONS = "http://localhost:3000/api/verifications";

// ===== LOAD STATS =====
async function loadStats() {
    try {
        const response = await fetch(API_ITEMS, {
            headers: authHeaders()
        });
        const result = await response.json();

        if (!result.success) return;

        const items = result.data;

        document.getElementById("totalItems").textContent = items.length;

        const available = items.filter(i => i.condition === "Available").length;
        document.getElementById("availableItems").textContent = available;

        const lowStock = items.filter(i => i.quantity < 10).length;
        document.getElementById("lowStock").textContent = lowStock;

        const vResponse = await fetch(API_VERIFICATIONS, {
            headers: authHeaders()
        });
        const vResult = await vResponse.json();

        if (vResult.success) {
            const discrepancies = vResult.data.filter(v => v.status === "Discrepancy").length;
            document.getElementById("discrepancies").textContent = discrepancies;
        }

        const now = new Date();
        document.getElementById("lastUpdated").textContent = 
            `Updated: ${now.toLocaleTimeString()}`;

    } catch (error) {
        console.error("Error loading stats:", error);
    }
}

// ===== LOAD VERIFICATIONS =====
async function loadVerifications() {
    const tbody = document.getElementById("verificationsTable");

    try {
        const response = await fetch(API_VERIFICATIONS, {
            headers: authHeaders()
        });
        const result = await response.json();

        if (!result.success || result.data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px; color: #999;">
                        📭 No verifications yet. Scan a QR code to start.
                    </td>
                </tr>
            `;
            return;
        }

        const recent = result.data.slice(0, 10);

        tbody.innerHTML = recent.map(v => {
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
                </tr>
            `;
        }).join("");

    } catch (error) {
        console.error("Error loading verifications:", error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px; color: #999;">
                    ⚠️ Cannot connect to server
                </td>
            </tr>
        `;
    }
}

// ===== REFRESH ALL =====
function refreshDashboard() {
    loadStats();
    loadVerifications();
}

// ===== INITIALIZE =====
document.addEventListener("DOMContentLoaded", () => {
    if (!isLoggedIn()) {
        window.location.href = "login.html";
        return;
    }

    refreshDashboard();
    setInterval(refreshDashboard, 5000);

    console.log("✅ Dashboard loaded with real-time monitoring!");
});