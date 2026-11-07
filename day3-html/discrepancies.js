// ===== DISCREPANCIES PAGE - WITH MODAL =====

const API_URL = `${window.API_BASE_URL}/api/verifications`;

document.addEventListener("DOMContentLoaded", () => {
    if (!isLoggedIn()) {
        window.location.href = "login.html";
        return;
    }
    loadDiscrepancies();

    // Handle Resolve Form Submit
    const resolveForm = document.getElementById("resolveForm");
    if (resolveForm) {
        resolveForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const id = document.getElementById("resolveId").value;
            const remarks = document.getElementById("resolveRemarks").value.trim();
            const btn = document.getElementById("saveResolveBtn");
            const errorEl = document.getElementById("resolveError");

            if (!remarks) {
                errorEl.textContent = "⚠️ Remarks cannot be empty.";
                errorEl.style.display = "block";
                return;
            }

            btn.textContent = "Saving...";
            btn.disabled = true;
            errorEl.style.display = "none";

            try {
                const response = await fetch(`${API_URL}/${id}/resolve`, {
                    method: "PUT",
                    headers: authHeaders(),
                    body: JSON.stringify({ remarks })
                });
                const result = await response.json();

                if (result.success) {
                    alert("✅ Discrepancy resolved!");
                    closeResolveModal();
                    loadDiscrepancies(); // I-refresh yung table
                } else {
                    errorEl.textContent = result.message;
                    errorEl.style.display = "block";
                }
            } catch (error) {
                console.error("Resolve error:", error);
                errorEl.textContent = "⚠️ Cannot resolve at the moment.";
                errorEl.style.display = "block";
            } finally {
                btn.textContent = "Resolve Now";
                btn.disabled = false;
            }
        });
    }
});

async function loadDiscrepancies() {
    const tbody = document.getElementById("discrepanciesTableBody");
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:#666;">⏳ Loading data...</td></tr>`;

    try {
        const response = await fetch(API_URL, { headers: authHeaders() });
        const result = await response.json();

        if (!result.success) throw new Error(result.message);

        // Kukunin lang natin yung mga Discrepancy at hindi pa Resolved
        const discrepancies = result.data.filter(v => v.status === "Discrepancy");

        if (discrepancies.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:#2e7d32;font-weight:bold;">✅ No discrepancies found. All good!</td></tr>`;
            return;
        }

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
                        <button onclick="openResolveModal(${v.id}, '${v.name.replace(/'/g, "\\'")}')" style="background:#f39c12; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer;">Resolve</button>
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

// Modal Functions
function openResolveModal(id, itemName) {
    document.getElementById("resolveId").value = id;
    document.getElementById("resolveItemName").value = itemName;
    document.getElementById("resolveRemarks").value = "";
    document.getElementById("resolveError").style.display = "none";
    document.getElementById("resolveModal").style.display = "flex";
}

function closeResolveModal() {
    document.getElementById("resolveModal").style.display = "none";
}