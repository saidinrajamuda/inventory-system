// ===== SCAN QR CODE - DAY 13 =====

const API_URL = "http://localhost:3000/api/items";
let html5QrCode = null;
let isScanning = false;

// ===== UPDATE STATUS MESSAGE =====
function updateStatus(message, type = "info") {
    const statusEl = document.getElementById("statusMsg");
    statusEl.textContent = message;
    statusEl.className = "status-msg status-" + type;
}

// ===== START SCANNING =====
async function startScanning() {
    if (isScanning) return;

    try {
        html5QrCode = new Html5Qrcode("reader");

        const config = {
            fps: 10,              // Frames per second
            qrbox: { width: 250, height: 250 },  // Scan area
            aspectRatio: 1.0
        };

        updateStatus("📷 Starting camera...", "info");

        await html5QrCode.start(
            { facingMode: "environment" },  // Gamitin yung back camera
            config,
            onScanSuccess,
            onScanError
        );

        isScanning = true;
        document.getElementById("startBtn").style.display = "none";
        document.getElementById("stopBtn").style.display = "block";
        updateStatus("🔍 Scanning... Point your camera at a QR code", "success");

    } catch (error) {
        console.error("Camera error:", error);
        updateStatus("❌ Cannot access camera. Please allow camera permission.", "error");
    }
}

// ===== STOP SCANNING =====
async function stopScanning() {
    if (!isScanning) return;

    try {
        await html5QrCode.stop();
        html5QrCode.clear();
        isScanning = false;

        document.getElementById("startBtn").style.display = "block";
        document.getElementById("stopBtn").style.display = "none";
        updateStatus("⏹️ Scanning stopped", "info");
    } catch (error) {
        console.error("Stop error:", error);
    }
}

// ===== ON SCAN SUCCESS =====
async function onScanSuccess(decodedText) {
    console.log("QR scanned:", decodedText);

    // I-stop muna yung scanning
    await stopScanning();

    updateStatus("✅ QR code detected! Loading item...", "success");

    try {
        // I-parse yung JSON data sa QR code
        let scannedData;
        try {
            scannedData = JSON.parse(decodedText);
        } catch (e) {
            // Baka plain code lang (e.g. "TOOL-0001")
            scannedData = { code: decodedText };
        }

        // Hanapin yung item sa backend
        const response = await fetch(API_URL);
        const result = await response.json();

        if (!result.success) {
            updateStatus("❌ Cannot load items from server", "error");
            return;
        }

        // Hanapin yung item na may matching code
        const item = result.data.find(i => 
            i.code.toLowerCase() === scannedData.code?.toLowerCase()
        );

        if (item) {
            displayItem(item);
        } else {
            updateStatus(`❌ Item "${scannedData.code}" not found in database`, "error");
            setTimeout(() => {
                document.getElementById("startBtn").style.display = "block";
            }, 2000);
        }
    } catch (error) {
        console.error("Error:", error);
        updateStatus("❌ Error loading item details", "error");
    }
}

// ===== ON SCAN ERROR (hindi ito laging error — normal lang kapag walang QR na nadetect) =====
function onScanError(errorMessage) {
    // Huwag i-display — sobrang ingay sa console
    // console.log("Scan error:", errorMessage);
}

// ===== DISPLAY ITEM DETAILS =====
function displayItem(item) {
    const resultEl = document.getElementById("scanResult");
    const detailsEl = document.getElementById("itemDetails");

    detailsEl.innerHTML = `
        <div class="item-detail">
            <span class="item-label">Unique Code:</span>
            <span class="item-value">${item.code}</span>
        </div>
        <div class="item-detail">
            <span class="item-label">Item Name:</span>
            <span class="item-value">${item.name}</span>
        </div>
        <div class="item-detail">
            <span class="item-label">Category:</span>
            <span class="item-value">${item.category}</span>
        </div>
        <div class="item-detail">
            <span class="item-label">Quantity:</span>
            <span class="item-value">${item.quantity}</span>
        </div>
        <div class="item-detail">
            <span class="item-label">Location:</span>
            <span class="item-value">${item.location || "N/A"}</span>
        </div>
        <div class="item-detail">
            <span class="item-label">Condition:</span>
            <span class="item-value">${item.condition}</span>
        </div>
    `;

    resultEl.classList.add("active");
    updateStatus("✅ Item found!", "success");

    // Scroll sa result
    resultEl.scrollIntoView({ behavior: "smooth" });
}

// ===== SCAN ANOTHER =====
function scanAnother() {
    document.getElementById("scanResult").classList.remove("active");
    document.getElementById("startBtn").style.display = "block";
    updateStatus("Click 'Start Scanning' to begin", "info");
}

// ===== CLEANUP PAG NA-LEAVE YUNG PAGE =====
window.addEventListener("beforeunload", () => {
    if (isScanning) {
        html5QrCode.stop().catch(() => {});
    }
});

console.log("✅ Scan page loaded!");