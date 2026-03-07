const { execSync } = require('child_process');

// --- CONFIGURATION ---
const CONTAINER_NAME = "web-database-1";
const DB_NAME = "codemeet_db";
const DB_USER = "postgres";

// --- ADMIN CREDENTIALS ---
// Change these before running!
const ADMIN_EMAIL = "admin@test.com";
const ADMIN_NAME = "Admin";
// BCrypt hash of "admin123" — change the password and regenerate the hash for production
const ADMIN_PASSWORD_HASH = "$2a$12$5.cFcfT1hdyIvBMh9bVII.1/smzfvtd3BikfZel4G92WTzgZKdQSO";
const ADMIN_ROLE = "ADMIN";

function generateSQL() {
    // Use DO $$ block so we can conditionally insert only if admin doesn't exist yet
    return `
DO $$
DECLARE
    admin_id UUID;
BEGIN
    -- Only insert if this email doesn't already exist
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = '${ADMIN_EMAIL}') THEN

        admin_id := gen_random_uuid();

        INSERT INTO users (id, email, name, password, role, last_seen_at, profile_picture)
        VALUES (
            admin_id,
            '${ADMIN_EMAIL}',
            '${ADMIN_NAME}',
            '${ADMIN_PASSWORD_HASH}',
            '${ADMIN_ROLE}',
            NOW(),
            NULL
        );

        RAISE NOTICE '>>> Admin user created: ${ADMIN_EMAIL}';
    ELSE
        RAISE NOTICE '>>> Admin user already exists, skipping.';
    END IF;
END $$;
`;
}

function initAdmin() {
    console.log(`🚀 Initializing admin user in '${DB_NAME}'...`);
    const sql = generateSQL();

    try {
        const result = execSync(`docker exec -i ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME}`, {
            input: sql,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        const output = result.toString('utf-8').trim();
        if (output) console.log(output);

        console.log("✅ Done.");
    } catch (e) {
        console.error("❌ Error details:");
        if (e.stderr) {
            console.error(e.stderr.toString('utf-8').trim());
        } else {
            console.error(e.message);
        }
    }
}

initAdmin();
