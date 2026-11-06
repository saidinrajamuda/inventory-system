// ===== REGISTER PAGE =====

// ⚠️ IMPORTANT: 
// - Kung WALANG naka-login: pwede pa rin (para sa first admin setup)
// - Kung may naka-login: pwede rin (para sa admin adding new user)
// Hindi na natin i-redirect automatic.

document.addEventListener("DOMContentLoaded", () => {
    // Kung naka-login ang user, ipakita ang "Back to Dashboard" button
    if (isLoggedIn()) {
        const backLink = document.createElement("div");
        backLink.className = "auth-link";
        backLink.style.marginTop = "10px";
        backLink.innerHTML = `← <a href="dashboard.html">Back to Dashboard</a>`;
        document.querySelector(".auth-card").appendChild(backLink);
    }

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
        // ✅ Kung may naka-login, i-attach ang token (kailangan ng admin)
        const headers = { "Content-Type": "application/json" };
        if (getToken()) {
            headers["Authorization"] = `Bearer ${getToken()}`;
        }

        const response = await fetch(`${API_AUTH}/register`, {
            method: "POST",
            headers,
            body: JSON.stringify({ full_name: fullName, email, username, password, role })
        });

        const result = await response.json();

        if (result.success) {
            showSuccess(result.message || "Account created successfully!");

            // Kung naka-login (admin adding user), i-refresh lang ang form
            if (isLoggedIn()) {
                document.getElementById("registerForm").reset();
                setTimeout(() => {
                    document.getElementById("successMsg").style.display = "none";
                }, 3000);
            } else {
                // First admin setup → redirect to login
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 2000);
            }
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