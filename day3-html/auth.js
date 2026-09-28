// ===== SHARED AUTHENTICATION LOGIC =====

const API_AUTH = "http://localhost:3000/api/auth";

// ===== GET CURRENT USER =====
function getCurrentUser() {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch (e) {
        return null;
    }
}

// ===== GET TOKEN =====
function getToken() {
    return localStorage.getItem("token");
}

// ===== IS LOGGED IN? =====
function isLoggedIn() {
    return !!getToken() && !!getCurrentUser();
}

// ===== REQUIRE LOGIN =====
function requireLogin() {
    if (!isLoggedIn()) {
        window.location.href = "login.html";
        return false;
    }
    return true;
}

// ===== REDIRECT IF LOGGED IN =====
function redirectIfLoggedIn() {
    if (isLoggedIn()) {
        window.location.href = "dashboard.html";
    }
}

// ===== LOGOUT =====
function logout() {
    if (!confirm("Are you sure you want to logout?")) return;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
}

// ===== UPDATE USER INFO SA UI =====
function updateUserInfo() {
    const user = getCurrentUser();
    if (!user) return;
    document.querySelectorAll(".user-name").forEach(el => {
        el.textContent = `👤 ${user.full_name || user.username} (${user.role})`;
    });
}

// ===== ROLE CHECKING =====
function hasRole(...roles) {
    const user = getCurrentUser();
    if (!user) return false;
    return roles.includes(user.role);
}

function isAdmin() {
    return hasRole("Admin");
}

function isPersonnel() {
    return hasRole("Personnel");
}

function isManagement() {
    return hasRole("Management");
}

// ===== APPLY ROLE-BASED UI =====
function applyRoleBasedUI() {
    const user = getCurrentUser();
    if (!user) return;

    document.querySelectorAll("[data-role='admin']").forEach(el => {
        el.style.display = isAdmin() ? "" : "none";
    });

    document.querySelectorAll("[data-role='admin-personnel']").forEach(el => {
        el.style.display = (isAdmin() || isPersonnel()) ? "" : "none";
    });

    document.querySelectorAll("[data-role='not-management']").forEach(el => {
        el.style.display = isManagement() ? "none" : "";
    });

    console.log(`✅ Role-based UI applied for: ${user.role}`);
}

// ===== AUTH HEADERS =====
function authHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`
    };
}

// ===== AUTO-SETUP SA BAWAT PAGE =====
document.addEventListener("DOMContentLoaded", () => {
    updateUserInfo();
    applyRoleBasedUI();
});