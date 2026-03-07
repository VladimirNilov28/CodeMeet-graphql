const { execSync } = require('child_process');
const crypto = require('crypto');

// --- CONFIGURATION ---
const CONTAINER_NAME = "web-database-1";
const DB_NAME = "codemeet_db";
const DB_USER = "postgres";

// --- MOCK DATA POOLS ---
const LANGUAGES = ["Java", "Python", "TypeScript", "Go", "Rust", "C#", "C++", "JavaScript", "Kotlin"];
const EXPERIENCE = ["Junior", "Mid", "Senior", "Lead"];
const LOOK_FOR = ["Mentor", "Mentee", "Coding Buddy", "Networking"];
const OS = ["Linux", "macOS", "Windows"];
const GEO_POINTS = [
    { lat: 40.7128, lng: -74.0060 },
    { lat: 51.5072, lng: -0.1276 },
    { lat: 35.6762, lng: 139.6503 },
    { lat: 52.5200, lng: 13.4050 },
    { lat: 37.7749, lng: -122.4194 },
    { lat: 30.2672, lng: -97.7431 },
    { lat: 43.6532, lng: -79.3832 },
];
const FIRST_NAMES = ["Alex", "Jordan", "Taylor", "Casey", "Morgan", "Riley", "Jamie", "Chris", "Sam", "Drew"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson"];

// pswd: dummy
const DUMMY_PASSWORD_HASH = "$2a$12$eIVKvWz5NO3FkU8ZcUfVaeyQzWrDpKBhRX./KLUCqwKrBfB9Izdke";
const DEFAULT_ROLE = "USER";

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSQL(numUsers = 100) {
    const users_sql = [];
    const profiles_sql = [];
    const bios_sql = [];

    const now = new Date();

    for (let i = 0; i < numUsers; i++) {
        const u_id = crypto.randomUUID();
        const f_name = getRandomElement(FIRST_NAMES);
        const l_name = getRandomElement(LAST_NAMES);

        // Ensure uniqueness for constraints
        const suffix = `${i.toString().padStart(3, '0')}${getRandomInt(10, 99)}`;
        const email = `${f_name.toLowerCase()}.${l_name.toLowerCase()}${suffix}@example.com`;
        const name = `${f_name} ${l_name} ${suffix}`;
        
        const lastSeen = new Date(now.getTime() - getRandomInt(0, 5) * 24 * 60 * 60 * 1000);
        // Postgres expects standard timestamp format. e.g. 2026-03-06 17:00:00+00
        const lastSeenStr = lastSeen.toISOString().replace('T', ' ').replace('Z', '+0000');

        // 1. users table
        users_sql.push(`('${u_id}', '${email}', '${lastSeenStr}', '${name}', '${DUMMY_PASSWORD_HASH}', NULL, '${DEFAULT_ROLE}')`);

        // 2. profiles table
        const p_id = crypto.randomUUID();
        const about = `Hi! I'm ${f_name}, a developer who enjoys building projects and meeting new collaborators.`.replace(/'/g, "''");
        profiles_sql.push(`('${p_id}', '${about}', '${u_id}')`);

        // 3. bios table
        const b_id = crypto.randomUUID();
        const age = getRandomInt(18, 60);
        const location = getRandomElement(GEO_POINTS);
        const latitude = (location.lat + ((Math.random() - 0.5) * 0.35)).toFixed(6);
        const longitude = (location.lng + ((Math.random() - 0.5) * 0.35)).toFixed(6);
        const maxDistanceKm = getRandomInt(10, 120);
        bios_sql.push(
            `('${b_id}', 'Night Owl', '${getRandomElement(EXPERIENCE)}', ` +
            `'${getRandomElement(LOOK_FOR)}', '${getRandomElement(OS)}', '${getRandomElement(LANGUAGES)}', ${latitude}, ${longitude}, ${maxDistanceKm}, ${age}, '${u_id}')`
        );
    }

    let sql = "BEGIN;\n";
    sql += "INSERT INTO users (id, email, last_seen_at, name, password, profile_picture, role) VALUES\n" + users_sql.join(",\n") + ";\n";
    sql += "INSERT INTO profiles (id, about_me, user_id) VALUES\n" + profiles_sql.join(",\n") + ";\n";
    sql += "INSERT INTO bios (id, coding_style, experience_level, look_for, preferred_os, primary_language, latitude, longitude, max_distance_km, age, user_id) VALUES\n" + bios_sql.join(",\n") + ";\n";
    sql += "COMMIT;";
    return sql;
}

function seed() {
    console.log(`🚀 Starting seed process for ${DB_NAME}...`);
    const sqlContent = generateSQL(100);

    try {
        execSync(`docker exec -i ${CONTAINER_NAME} psql -v ON_ERROR_STOP=1 -U ${DB_USER} -d ${DB_NAME}`, {
            input: sqlContent,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        console.log(`✅ Successfully seeded 100 users into '${DB_NAME}'.`);
    } catch (e) {
        console.error("❌ Error details:");
        if (e.stderr) {
            console.error(e.stderr.toString('utf-8').trim());
        } else {
            console.error(e.message);
        }
    }
}

seed();
