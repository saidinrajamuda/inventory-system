// ===== MYSQL DATABASE CONNECTION =====

const mysql = require("mysql2");

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "admin123",  // ⚠️ PALITAN MO ITO kung iba yung MySQL password mo
    database: "inventory_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

async function testConnection() {
    try {
        const [rows] = await promisePool.query("SELECT 1 + 1 AS result");
        console.log("✅ MySQL connected successfully!");
        return true;
    } catch (error) {
        console.error("❌ MySQL connection failed:", error.message);
        return false;
    }
}

module.exports = { promisePool, testConnection };