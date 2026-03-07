const { execSync } = require('child_process');
const readline = require('readline');

// TRUNCATE immediately clears the tables, leaving their structure intact.
// CASCADE will automatically clear related tables (profiles, bios) if they reference users.
const SQL_COMMAND = `TRUNCATE TABLE profiles, bios, users CASCADE;`;

function clearDatabase() {
    try {
        console.log("⏳ Clearing data from tables...");
        execSync(`docker exec -i web-database-1 psql -U postgres -d codemeet_db`, {
            input: SQL_COMMAND,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        console.log("✅ Success! All tables are now empty and ready for new data.");
    } catch (e) {
        console.error("❌ Error executing command.");
        if (e.stderr) {
            console.error(`Details: ${e.stderr.toString('utf-8').trim()}`);
        }
        process.exit(1);
    }
}

function confirmAction() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log("⚠️  WARNING: This will delete ALL data (users, profiles, bios) but keep the tables intact!");
    rl.question("Are you sure? [yes/no]: ", (answer) => {
        const choice = answer.trim().toLowerCase();
        
        if (choice !== 'yes') {
            console.log("🛑 Aborted. The database data was not modified.");
            process.exit(0);
        } else {
            clearDatabase();
        }
        
        rl.close();
    });
}

confirmAction();
