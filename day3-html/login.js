// ===== LOGIN PAGE =====

redirectIfLoggedIn();

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    if (form) {
        form.addEventListener("submit", handleLogin);
    }
});

async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (!username || !password) {
        showError("Please enter username and password.");
        return;
    }

    try {
        const response = await fetch(`${API_AUTH}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (result.success) {
            localStorage.setItem("token", result.data.token);
            localStorage.setItem("user", JSON.stringify(result.data.user));
            window.location.href = "dashboard.html";
        } else {
            showError(result.message || "Invalid username or password.");
        }
    } catch (error) {
        console.error("Login error:", error);
        showError("Cannot connect to server. Please try again.");
    }
}

function showError(message) {
    const errorEl = document.getElementById("errorMsg");
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = "block";
    }
}