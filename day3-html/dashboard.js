// ===== DASHBOARD - ULTIMATE STABLE VERSION =====

const API_ITEMS = `${window.API_BASE_URL}/api/items`;
const API_VERIFICATIONS = `${window.API_BASE_URL}/api/verifications`;

let alertsDismissed = false;

function dismissAlerts() {
    alertsDismissed = true;
    const alertsContainer = document.getElementById("alertsContainer");
    if (alertsContainer) alertsContainer.innerHTML = "";
}

// ===== LOAD STATS =====
async function loadStats() {
    try {
        const response = await fetch(API_ITEMS, { headers: authHeaders() });
        const result = await response.json();

        if (!result.success) return;

        const items = result.data;

        // === STAT CARDS ===
        // Tinanggal natin yung "-" at "Loading" para siguradong may number
        document.getElementById("totalItems").textContent = items.length;
        const available = items.filter(i => i.condition === "Available").length;
        document.getElementById("availableItems").textContent = available;
        const lowStockCount = items.filter(i => i.quantity > 0 && i.quantity <= i.reorder_level).length;
        document.getElementById("lowStock").textContent = lowStockCount;

        // === ALERTS LOGIC ===
        const alertsContainer = document.getElementById("alertsContainer");
        if (alertsContainer && !alertsDismissed) {
            let alertHTML = "";
            
            const outOfStock = items.filter(i => i.quantity === 0);
            if (outOfStock.length > 0) {
                alertHTML += `
                    <div class="alert-card alert-danger">
                        <div class="alert-icon">🚨</div>
                        <div class="alert-content">
                            <h4>Out of Stock Alert (${outOfStock.length})</h4>
                            <p>${outOfStock.slice(0, 2).map(i => `${i.name} (${i.code})`).join(', ')} ${outOfStock.length > 2 ? 'and others...' : 'is out of stock.'}</p>
                        </div>
                        <button class="alert-close" onclick="dismissAlerts()">&times;</button>
                    </div>
                `;
            }

            const lowStockList = items.filter(i => i.quantity > 0 && i.quantity <= i.reorder_level);
            if (lowStockList.length > 0) {
                alertHTML += `
                    <div class="alert-card alert-warning">
                        <div class="alert-icon">⚠️</div>
                        <div class="alert-content">
                            <h4>Low Stock Warning (${lowStockList.length})</h4>
                            <p>${lowStockList.slice(0, 2).map(i => `${i.name} (${i.quantity} left)`).join(', ')} ${lowStockList.length > 2 ? 'and others are running low.' : 'is running low.'}</p>
                        </div>
                        <button class="alert-close" onclick="dismissAlerts()">&times;</button>
                    </div>
                `;
            }
            alertsContainer.innerHTML = alertHTML;
        }

        // === VERIFICATIONS (I-check kung may Discrepancy) ===
        const vResponse = await fetch(API_VERIFICATIONS, { headers: authHeaders() });
        const vResult = await vResponse.json();
        if (vResult.success) {
            const discrepancies = vResult.data.filter(v => v.status === "Discrepancy").length;
            document.getElementById("discrepancies").textContent = discrepancies;
        }

        document.getElementById("lastUpdated").textContent = `Updated: ${new Date().toLocaleTimeString()}`;

    } catch (error) {
        console.error("Error loading stats:", error);
        // Kapag nag-error, gawing "0" imbes na "Loading" para hindi mag-stuck
        document.getElementById("totalItems").textContent = "0";
        document.getElementById("availableItems").textContent = "0";
        document.getElementById("lowStock").textContent = "0";
        document.getElementById("discrepancies").textContent = "0";
    }
}

// ===== LOAD VERIFICATIONS =====
async function loadVerifications() {
    const tbody = document.getElementById("verificationsTable");

    try {
        const response = await fetch(API_VERIFICATIONS, { headers: authHeaders() });
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

        const recent = result.data.slice(0, 5);

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
                        <span style="padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; color: ${statusColor}; background: ${statusBg};">
                            ${statusIcon} ${v.status}
                        </span>
                    </td>
                </tr>
            `;
        }).join("");

    } catch (error) {
        console.error("Error loading verifications:", error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px; color: #999;">
                    ⚠️ Cannot connect to server. Refresh the page.
                </td>
            </tr>
        `;
    }
}

// ===== INITIALIZE =====
document.addEventListener("DOMContentLoaded", () => {
    // I-check agad kung naka-login
    if (!isLoggedIn()) {
        window.location.href = "login.html";
        return;
    }

    // I-update agad yung pangalan ng user sa topbar
    if (typeof updateUserInfo === "function") updateUserInfo();

    // Simulan mag-load ng data
    loadStats();
    loadVerifications();

    console.log("✅ Dashboard loaded successfully!");
});