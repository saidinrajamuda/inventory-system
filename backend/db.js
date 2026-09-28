// ===== MYSQL DATABASE CONNECTION =====

const mysql = require("mysql2");
require("dotenv").config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "inventory_db",
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