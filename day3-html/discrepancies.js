// ===== DISCREPANCIES PAGE - FULL WORKING CODE =====

const API_URL = `${window.API_BASE_URL}/api/verifications`;

// I-load ang data pagka-open ng page
document.addEventListener("DOMContentLoaded", () => {
    if (!isLoggedIn()) {
        window.location.href = "login.html";
        return;
    }
    loadDiscrepancies();
});

async function loadDiscrepancies() {
    const tbody = document.getElementById("discrepanciesTableBody");
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:#666;">⏳ Loading data...</td></tr>`;

    try {
        // Kunin lahat ng verifications (kasama na dito ang Matched at Discrepancy)
        const response = await fetch(API_URL, {
            headers: authHeaders()
        });
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        // I-filter lang natin yung mga "Discrepancy"
        const discrepancies = result.data.filter(v => v.status === "Discrepancy");

        if (discrepancies.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:#2e7d32;font-weight:bold;">✅ No discrepancies found. All good!</td></tr>`;
            return;
        }

        // I-render sa table
        tbody.innerHTML = discrepancies.map(v => {
            const date = new Date(v.created_at).toLocaleString();
            const difference = v.actual_qty - v.expected_qty;
            
            return `
                <tr>
                    <td style="font-size: 13px; color: #666;">${date}</td>
                    <td>
                        <strong>${v.code}</strong><br>
                        <span style="font-size:12px; color:#555;">${v.name}</span>
                    </td>
                    <td>${v.expected_qty}</td>
                    <td style="color: #c62828; font-weight: bold;">${v.actual_qty}</td>
                    <td style="color: #c62828; font-weight: bold;">${difference}</td>
                    <td>
                        <span style="padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; color: #c62828; background: #ffebee;">
                            ⚠️ Discrepancy
                        </span>
                    </td>
                    <td>
                        <button onclick="showResolvePrompt(${v.id}, '${v.name}')" style="background:#f39c12; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer;">Resolve</button>
                    </td>
                </tr>
            `;
        }).join("");

    } catch (error) {
        console.error("Error:", error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:20px;color:#c62828;">
                    ❌ Cannot load discrepancies. Please check if the backend is awake and try refreshing.
                </td>
            </tr>
        `;
    }
}

// Function para sa Resolve button
async function showResolvePrompt(id, itemName) {
    const remarks = prompt(`Enter resolution remarks for ${itemName}:\n(e.g., "Item was found", "Reported missing")`);
    
    if (remarks === null) return; // I-cancel ni user
    if (remarks.trim() === "") {
        alert("⚠️ Remarks cannot be empty.");
        return;
    }

    try {
        const response = await fetch(`${window.API_BASE_URL}/api/verifications/${id}/resolve`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ remarks })
        });
        const result = await response.json();

        if (result.success) {
            alert("✅ Discrepancy resolved!");
            loadDiscrepancies(); // I-refresh yung table
        } else {
            alert("❌ " + result.message);
        }
    } catch (error) {
        console.error("Resolve error:", error);
        alert("⚠️ Cannot resolve at the moment.");
    }
}