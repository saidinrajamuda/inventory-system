// ===== DASHBOARD - DAY 18 (with RBAC) =====

const API_ITEMS = `${window.API_BASE_URL}/api/items`;
const API_VERIFICATIONS = `${window.API_BASE_URL}/api/verifications`;
let alertsDismissed = false; // Flag para malaman kung na-close na ng user
// ===== LOAD STATS =====
async function loadStats() {
    try {
        const response = await fetch(API_ITEMS, {
            headers: authHeaders()
        });
        const result = await response.json();

        if (!result.success) return;

        const items = result.data;

                // ===== ALERTS LOGIC =====
        const alertsContainer = document.getElementById("alertsContainer");
        if (alertsContainer) {
            if (alertsDismissed) {
                // Kung na-dismiss na, wag nang ipakita ulit
                alertsContainer.innerHTML = ""; 
            } else {
                let alertHTML = "";
                
                // 1. Out of Stock
                const outOfStock = items.filter(i => i.quantity === 0);
                if (outOfStock.length > 0) {
                    alertHTML += `
                        <div style="position: relative; background: #ffebee; border-left: 5px solid #e74c3c; padding: 15px; margin-bottom: 10px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <span onclick="dismissAlerts()" style="position: absolute; top: 10px; right: 15px; cursor: pointer; color: #c62828; font-size: 20px; font-weight: bold;" title="Dismiss">&times;</span>
                            <h4 style="color: #c62828; margin: 0 0 10px 0;">🚨 Out of Stock Alert (${outOfStock.length})</h4>
                            <ul style="margin: 0; padding-left: 20px; color: #c62828; font-size: 14px;">
                                ${outOfStock.map(i => `<li><strong>${i.name}</strong> (${i.code}) is completely out of stock!</li>`).join('')}
                            </ul>
                        </div>
                    `;
                }

                // 2. Low Stock
                const lowStock = items.filter(i => i.quantity > 0 && i.quantity <= i.reorder_level);
                if (lowStock.length > 0) {
                    alertHTML += `
                        <div style="position: relative; background: #fff3e0; border-left: 5px solid #f39c12; padding: 15px; margin-bottom: 10px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <span onclick="dismissAlerts()" style="position: absolute; top: 10px; right: 15px; cursor: pointer; color: #d35400; font-size: 20px; font-weight: bold;" title="Dismiss">&times;</span>
                            <h4 style="color: #d35400; margin: 0 0 10px 0;">⚠️ Low Stock Warning (${lowStock.length})</h4>
                            <ul style="margin: 0; padding-left: 20px; color: #d35400; font-size: 14px;">
                                ${lowStock.map(i => `<li><strong>${i.name}</strong> (${i.code}) is running low: <b>${i.quantity} left</b> (Reorder level: ${i.reorder_level})</li>`).join('')}
                            </ul>
                        </div>
                    `;
                }

                alertsContainer.innerHTML = alertHTML;
            }
        }

            // I-display ang alerts
            alertsContainer.innerHTML = alertHTML;
        }

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

    // ===== DISMISS ALERTS =====
function dismissAlerts() {
    alertsDismissed = true;
    const alertsContainer = document.getElementById("alertsContainer");
    if (alertsContainer) alertsContainer.innerHTML = "";
}

    refreshDashboard();
    setInterval(refreshDashboard, 5000);

    console.log("✅ Dashboard loaded with real-time monitoring!");
});