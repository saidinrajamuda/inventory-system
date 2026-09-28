// ===== REGISTER PAGE =====

redirectIfLoggedIn();

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registerForm");
    if (form) {
        form.addEventListener("submit", handleRegister);
    }
});

async function handleRegister(event) {
    event.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    if (!fullName || !email || !username || !password || !role) {
        showError("Please fill in all fields.");
        return;
    }

    if (password.length < 6) {
        showError("Password must be at least 6 characters.");
        return;
    }

    try {
        const response = await fetch(`${API_AUTH}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ full_name: fullName, email, username, password, role })
        });

        const result = await response.json();

        if (result.success) {
            showSuccess("Account created successfully! Redirecting to login...");
            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000);
        } else {
            showError(result.message || "Registration failed.");
        }
    } catch (error) {
        console.error("Register error:", error);
        showError("Cannot connect to server. Please try again.");
    }
}

function showError(message) {
    const errorEl = document.getElementById("errorMsg");
    const successEl = document.getElementById("successMsg");
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = "block";
    }
    if (successEl) successEl.style.display = "none";
}

function showSuccess(message) {
    const errorEl = document.getElementById("errorMsg");
    const successEl = document.getElementById("successMsg");
    if (successEl) {
        successEl.textContent = message;
        successEl.style.display = "block";
    }
    if (errorEl) errorEl.style.display = "none";
}