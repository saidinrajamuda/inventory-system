// ===== USER MANAGEMENT - DAY 18 =====
const API_USERS = `${window.API_BASE_URL}/api/users`;

// ===== REQUIRE ADMIN =====
if (!isLoggedIn() || !isAdmin()) {
    alert("❌ Access Denied. Admins only.");
    window.location.href = "dashboard.html";
}

// ===== LOAD USERS =====
async function loadUsers() {
    const tbody = document.getElementById("usersTableBody");

    try {
        const response = await fetch(API_USERS, {
            headers: authHeaders()
        });
        const result = await response.json();

        if (!result.success) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:red;">${result.message}</td></tr>`;
            return;
        }

        if (result.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;">No users found.</td></tr>`;
            return;
        }

        tbody.innerHTML = result.data.map(u => `
            <tr>
                <td>${u.id}</td>
                <td><strong>${u.username}</strong></td>
                <td>${u.full_name || "-"}</td>
                <td>${u.email || "-"}</td>
                <td><span style="padding:4px 10px;background:#e3f2fd;color:#1976d2;border-radius:12px;font-size:12px;font-weight:600;">${u.role}</span></td>
                <td>
                    <button onclick="deleteUser(${u.id})" style="background-color:#e74c3c;">Delete</button>
                </td>
            </tr>
        `).join("");

    } catch (error) {
        console.error("Error loading users:", error);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:red;">⚠️ Cannot connect to server</td></tr>`;
    }
}

// ===== DELETE USER =====
async function deleteUser(id) {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
        const response = await fetch(`${API_USERS}/${id}`, {
            method: "DELETE",
            headers: authHeaders()
        });
        const result = await response.json();

        if (result.success) {
            alert(result.message);
            loadUsers();
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error("Delete error:", error);
        alert("❌ Cannot delete user.");
    }
}

// ===== INITIALIZE =====
document.addEventListener("DOMContentLoaded", () => {
    loadUsers();
    console.log("✅ Users page loaded!");
});