import uuid
import random
from datetime import datetime, timedelta
import subprocess
import sys

# --- Mock Data Pools ---
FIRST_NAMES = ["Alex", "Jordan", "Taylor", "Casey", "Morgan", "Riley", "Jamie", "Chris", "Sam", "Drew", "Avery", "Parker", "Logan", "Hunter", "Blake"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White"]
LANGUAGES = ["Java", "Python", "TypeScript", "Go", "Rust", "C#", "C++", "JavaScript", "Ruby", "Kotlin", "Swift"]
EXPERIENCE = ["Junior", "Mid", "Senior", "Lead", "Principal"]
LOOK_FOR = ["Mentor", "Mentee", "Coding Buddy", "Networking", "Startup Co-founder", "Code Review"]
OS = ["Linux", "macOS", "Windows", "WSL"]
CODING_STYLES = ["Night Owl", "Early Bird", "Weekend Warrior", "9-to-5", "Pomodoro Enthusiast"]
CITIES = ["New York", "London", "Tokyo", "Berlin", "San Francisco", "Austin", "Toronto", "Stockholm", "Amsterdam", "Singapore"]

# A dummy bcrypt hash for the password "password123"
DUMMY_PASSWORD_HASH = "$2a$10$vI8aWBnW3fID.021/sOWcow1Jv/C3Q/WvS22XW.Xw/8G6P4Xm.O2y"

def generate_sql(num_users=100):
    users_sql = []
    profiles_sql = []
    bios_sql = []

    print(f"⚙️ Generating data for {num_users} developers...")

    for _ in range(num_users):
        # 1. Generate User Data
        user_id = str(uuid.uuid4())
        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)
        name = f"{first_name} {last_name}"
        email = f"{first_name.lower()}.{last_name.lower()}{random.randint(10, 9999)}@example.com"

        # Random time within the last 30 days
        days_ago = random.randint(0, 30)
        last_seen = (datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(0, 23))).strftime('%Y-%m-%d %H:%M:%S')
        avatar = f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_id}"

        users_sql.append(
            f"('{user_id}', '{email}', '{DUMMY_PASSWORD_HASH}', '{name}', '{avatar}', '{last_seen}')"
        )

        # 2. Generate Profile Data
        profile_id = str(uuid.uuid4())
        is_online = random.choice(['true', 'false'])
        about_me = f"Hi, I am {first_name}. I love coding and drinking coffee. Currently learning new things."

        profiles_sql.append(
            f"('{profile_id}', '{user_id}', '{about_me}', {is_online})"
        )

        # 3. Generate Bio Data
        bio_id = str(uuid.uuid4())
        lang = random.choice(LANGUAGES)
        exp = random.choice(EXPERIENCE)
        look = random.choice(LOOK_FOR)
        os_pref = random.choice(OS)
        style = random.choice(CODING_STYLES)
        city = random.choice(CITIES)

        bios_sql.append(
            f"('{bio_id}', '{user_id}', '{lang}', '{exp}', '{look}', '{os_pref}', '{style}', '{city}')"
        )

    # Wrap everything in a transaction for blazing fast insertion
    sql_script = "BEGIN;\n\n"

    sql_script += "INSERT INTO users (id, email, password, name, profile_picture, last_seen_at) VALUES\n"
    sql_script += ",\n".join(users_sql) + ";\n\n"

    sql_script += "INSERT INTO profiles (id, user_id, about_me, is_online) VALUES\n"
    sql_script += ",\n".join(profiles_sql) + ";\n\n"

    sql_script += "INSERT INTO bios (id, user_id, primary_language, experience_level, look_for, preferred_os, coding_style, city) VALUES\n"
    sql_script += ",\n".join(bios_sql) + ";\n\n"

    sql_script += "COMMIT;\n"

    return sql_script

def seed_database():
    sql = generate_sql(100)

    # Using the same container and DB names as your previous scripts
    command = [
        "docker", "exec", "-i", "web-database-1",
        "psql", "-U", "postgres", "-d", "matchme"
    ]

    try:
        print("⏳ Seeding the database in Docker...")
        subprocess.run(
            command,
            input=sql.encode('utf-8'),
            check=True,
            capture_output=True
        )
        print("✅ Success! The database is now populated with 100 users, profiles, and bios.")
        print("🔑 Note: Everyone's password is 'password123'")
    except subprocess.CalledProcessError as e:
        print("❌ Error executing command.")
        if e.stderr:
            print(f"Details: {e.stderr.decode('utf-8').strip()}")
        sys.exit(1)

if __name__ == "__main__":
    seed_database()