// ===== MY PROFILE PAGE =====

document.addEventListener("DOMContentLoaded", () => {
    // 1. I-check kung naka-login
    if (!isLoggedIn()) {
        window.location.href = "login.html";
        return;
    }

    // 2. I-display ang user info galing sa localStorage
    const user = getCurrentUser();
    if (user) {
        document.getElementById("profFullName").textContent = user.full_name || "-";
        document.getElementById("profUsername").textContent = user.username;
        document.getElementById("profEmail").textContent = user.email || "-";
        document.getElementById("profRole").textContent = user.role;
    }

    // 3. Handle Change Password Form
    const form = document.getElementById("changePasswordForm");
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const currentPassword = document.getElementById("currentPassword").value;
            const newPassword = document.getElementById("newPassword").value;
            const confirmPassword = document.getElementById("confirmPassword").value;

            const errorEl = document.getElementById("passError");
            const successEl = document.getElementById("passSuccess");
            const btn = document.getElementById("btnChangePass");

            // Reset alerts
            errorEl.style.display = "none";
            successEl.style.display = "none";

            // Validation
            if (newPassword !== confirmPassword) {
                errorEl.textContent = "⚠️ New passwords do not match.";
                errorEl.style.display = "block";
                return;
            }

            if (newPassword.length < 6) {
                errorEl.textContent = "⚠️ New password must be at least 6 characters.";
                errorEl.style.display = "block";
                return;
            }

            btn.textContent = "Updating...";
            btn.disabled = true;

            try {
                const response = await fetch(`${window.API_BASE_URL}/api/auth/change-password`, {
                    method: "PUT",
                    headers: authHeaders(),
                    body: JSON.stringify({ currentPassword, newPassword })
                });

                const result = await response.json();

                if (result.success) {
                    successEl.textContent = result.message;
                    successEl.style.display = "block";
                    form.reset(); // Clear inputs
                    
                    setTimeout(() => {
                        successEl.style.display = "none";
                    }, 5000);
                } else {
                    errorEl.textContent = result.message;
                    errorEl.style.display = "block";
                }
            } catch (error) {
                console.error("Change password error:", error);
                errorEl.textContent = "⚠️ Cannot connect to server.";
                errorEl.style.display = "block";
            } finally {
                btn.textContent = "Update Password";
                btn.disabled = false;
            }
        });
    }
});