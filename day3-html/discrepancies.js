// ===== DISCREPANCY HANDLING - DAY 24 =====
const API_DISCREPANCIES = `${window.API_BASE_URL}/api/discrepancies`;

if (!isLoggedIn()) window.location.href = "login.html";

// ===== LOAD DISCREPANCIES =====
async function loadDiscrepancies() {
    const tbody = document.getElementById("discrepanciesTableBody");
    try {
        const res = await fetch(API_DISCREPANCIES, { headers: authHeaders() });
        const result = await res.json();

        if (!result.success || result.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:#999;">✅ No discrepancies found. All good!</td></tr>`;
            return;
        }

        tbody.innerHTML = result.data.map(d => {
            const date = new Date(d.created_at).toLocaleString();
            const statusColors = {
                "Pending Review": "#f39c12",
                "Reviewed": "#3498db",
                "Resolved": "#27ae60",
                "Rejected": "#e74c3c"
            };
            const color = statusColors[d.status] || "#666";
            const diffColor = d.difference < 0 ? "#e74c3c" : "#27ae60";

            let actions = "—";
            if (isAdmin()) {
                if (d.status === "Pending Review") {
                    actions = `
                        <button onclick="reviewDiscrepancy(${d.id}, ${d.expected_qty}, ${d.actual_qty})" style="background:#3498db;">Review</button>
                    `;
                } else if (d.status === "Reviewed") {
                    actions = `
                        <button onclick="resolveDiscrepancy(${d.id})" style="background:#27ae60;">Resolve</button>
                        <button onclick="rejectDiscrepancy(${d.id})" style="background:#e74c3c;">Reject</button>
                    `;
                }
            }

            return `
                <tr>
                    <td style="font-size:13px;color:#666;">${date}</td>
                    <td><strong>${d.code}</strong><br><small>${d.item_name}</small></td>
                    <td>${d.expected_qty} ${d.unit || 'pcs'}</td>
                    <td>${d.actual_qty} ${d.unit || 'pcs'}</td>
                    <td><span style="color:${diffColor};font-weight:700;">${d.difference > 0 ? '+' : ''}${d.difference}</span></td>
                    <td><span style="padding:4px 10px;border-radius:12px;font-size:12px;font-weight:600;background:${color}22;color:${color};">${d.status}</span></td>
                    <td>${actions}</td>
                </tr>
            `;
        }).join("");
    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:red;">⚠️ Cannot load discrepancies</td></tr>`;
    }
}

// ===== REVIEW DISCREPANCY =====
async function reviewDiscrepancy(id, expected, actual) {
    const diff = actual - expected;
    const message = diff < 0 
        ? `⚠️ Kulang ng ${Math.abs(diff)} items. Ano ang action?`
        : `⚠️ Sobra ng ${diff} items. Ano ang action?`;
    
    const action = prompt(
        `${message}\n\nOptions:\n- Adjust Quantity (i-update ang stock)\n- Report Missing (i-record as missing)\n- Report Damaged (i-record as damaged)\n- Other\n\nI-type yung action:`,
        "Adjust Quantity"
    );
    
    if (!action) return;

    const remarks = prompt("Remarks (optional):") || "";

    try {
        const res = await fetch(`${API_DISCREPANCIES}/${id}/review`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ action, remarks })
        });
        const result = await res.json();
        alert(result.message);
        loadDiscrepancies();
    } catch (error) {
        alert("❌ Error reviewing discrepancy");
    }
}

// ===== RESOLVE DISCREPANCY =====
async function resolveDiscrepancy(id) {
    if (!confirm("⚠️ I-adjust yung item stock base sa actual count? Hindi na 'to ma-undo.")) return;

    try {
        const res = await fetch(`${API_DISCREPANCIES}/${id}/resolve`, {
            method: "PUT",
            headers: authHeaders()
        });
        const result = await res.json();
        alert(result.message);
        loadDiscrepancies();
    } catch (error) {
        alert("❌ Error resolving discrepancy");
    }
}

// ===== REJECT DISCREPANCY =====
async function rejectDiscrepancy(id) {
    if (!confirm("Reject this discrepancy? Hindi mababago yung stock.")) return;

    try {
        const res = await fetch(`${API_DISCREPANCIES}/${id}/reject`, {
            method: "PUT",
            headers: authHeaders()
        });
        const result = await res.json();
        alert(result.message);
        loadDiscrepancies();
    } catch (error) {
        alert("❌ Error rejecting discrepancy");
    }
}

// ===== INITIALIZE =====
document.addEventListener("DOMContentLoaded", () => {
    loadDiscrepancies();
});