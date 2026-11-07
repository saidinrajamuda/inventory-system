// ===== USER MANAGEMENT - WITH ADD USER MODAL =====
const API_USERS = `${window.API_BASE_URL}/api/users`;
const API_REGISTER = `${window.API_BASE_URL}/api/auth/register`;

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

        tbody.innerHTML = result.data.map(u => {
            // Kulay ng role badge base sa role
            let badgeColor = "#1976d2"; // Default blue (Personnel)
            if (u.role === "Admin") badgeColor = "#e74c3c"; // Red
            if (u.role === "Management") badgeColor = "#8e44ad"; // Purple

            return `
                <tr>
                    <td>${u.id}</td>
                    <td><strong>${u.username}</strong></td>
                    <td>${u.full_name || "-"}</td>
                    <td>${u.email || "-"}</td>
                    <td><span style="padding:4px 10px; background:${badgeColor}22; color:${badgeColor}; border-radius:12px; font-size:12px; font-weight:600;">${u.role}</span></td>
                    <td>
                        <button onclick="deleteUser(${u.id})" style="background-color:#e74c3c;">Delete</button>
                    </td>
                </tr>
            `;
        }).join("");

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

// ===== MODAL LOGIC =====
function openAddUserModal() {
    document.getElementById("addUserForm").reset();
    document.getElementById("modalError").style.display = "none";
    document.getElementById("addUserModal").style.display = "flex";
}

function closeAddUserModal() {
    document.getElementById("addUserModal").style.display = "none";
}

// ===== SUBMIT NEW USER =====
document.addEventListener("DOMContentLoaded", () => {
    loadUsers();
    console.log("✅ Users page loaded!");

    const addUserForm = document.getElementById("addUserForm");
    if (addUserForm) {
        addUserForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const btn = document.getElementById("saveUserBtn");
            const errorEl = document.getElementById("modalError");
            errorEl.style.display = "none";
            btn.textContent = "Creating...";
            btn.disabled = true;

            const payload = {
                full_name: document.getElementById("newFullName").value.trim(),
                email: document.getElementById("newEmail").value.trim(),
                username: document.getElementById("newUsername").value.trim(),
                password: document.getElementById("newPassword").value,
                role: document.getElementById("newRole").value
            };

            try {
                // Kailangan nating i-attach ang Admin Token para payagan tayo ng backend
                const response = await fetch(API_REGISTER, {
                    method: "POST",
                    headers: authHeaders(), // Dito natin isinasama ang token
                    body: JSON.stringify(payload)
                });
                
                const result = await response.json();

                if (result.success) {
                    alert("✅ User created successfully!");
                    closeAddUserModal();
                    loadUsers(); // I-refresh ang table
                } else {
                    errorEl.textContent = result.message;
                    errorEl.style.display = "block";
                }
            } catch (error) {
                errorEl.textContent = "⚠️ Cannot connect to server.";
                errorEl.style.display = "block";
            } finally {
                btn.textContent = "Create User";
                btn.disabled = false;
            }
        });
    }
});