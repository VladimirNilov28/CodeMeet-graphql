import os
import random
import shutil
import subprocess
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

# --- LOAD ENV ---
env_path = Path(__file__).resolve().parent / "backend" / ".env"

if not env_path.exists():
    env_path = Path(__file__).resolve().parent.parent / "backend" / ".env"

try:
    from dotenv import load_dotenv

    load_dotenv(dotenv_path=env_path)

except ImportError:
    pass

# --- CONFIG ---
CONTAINER_NAME = os.getenv("DB_CONTAINER_NAME", "graphql-database-1")
NETWORK_HOST = os.getenv("DB_NETWORK_HOST", "database")

DB_NAME = "codemeet_db"
DB_USER = os.getenv("POSTGRES_USER", "postgres")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "12345")

TEST_PASSWORD = "dummy"

# --- MOCK DATA ---
LANGUAGES = [
    "Java",
    "Python",
    "TypeScript",
    "Go",
    "Rust",
    "C#",
    "C++",
    "JavaScript",
    "Kotlin",
]

EXPERIENCE = ["Junior", "Mid", "Senior", "Lead"]

LOOK_FOR = [
    "Mentor",
    "Mentee",
    "Coding Buddy",
    "Networking",
]

OS = ["Linux", "macOS", "Windows"]

GEO_POINTS = [
    (40.7128, -74.0060, "New York"),
    (51.5072, -0.1276, "London"),
    (35.6762, 139.6503, "Tokyo"),
    (52.5200, 13.4050, "Berlin"),
    (37.7749, -122.4194, "San Francisco"),
    (30.2672, -97.7431, "Austin"),
    (43.6532, -79.3832, "Toronto"),
    (58.3806, 26.7250, "Tartu"),
    (59.4369, 24.7535, "Tallinn"),
    (59.3772, 28.1900, "Narva"),
]

FIRST_NAMES = [
    "Alex",
    "Jordan",
    "Taylor",
    "Casey",
    "Morgan",
    "Riley",
    "Jamie",
    "Chris",
    "Sam",
    "Drew",
]

LAST_NAMES = [
    "Smith",
    "Johnson",
    "Williams",
    "Jones",
    "Brown",
    "Davis",
    "Miller",
    "Wilson",
]

MESSAGE_CONTENTS = [
    "Hey! Want to collaborate?",
    "Hi, nice profile!",
    "Are you open to mentoring?",
    "Hello!",
    "What projects are you working on?",
    "Lets build something!",
]

DUMMY_PASSWORD_HASH = (
    "$2a$12$eIVKvWz5NO3FkU8ZcUfVaeyQzWrDpKBhRX./KLUCqwKrBfB9Izdke"
)

DEFAULT_ROLE = "USER"


def generate_sql(num_users=100):
    users_sql = []
    profiles_sql = []
    bios_sql = []
    connections_sql = []
    messages_sql = []

    user_ids = []

    for index in range(num_users):
        user_id = str(uuid.uuid4())
        user_ids.append(user_id)

        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)

        suffix = f"{index:03d}{random.randint(10, 99)}"

        email = (
            f"{first_name.lower()}."
            f"{last_name.lower()}"
            f"{suffix}@example.com"
        )

        name = f"{first_name} {last_name} {suffix}"

        last_seen = (
                datetime.now(timezone.utc)
                - timedelta(days=random.randint(0, 5))
        ).strftime("%Y-%m-%d %H:%M:%S%z")

        hide_location = random.choice(["true", "false"])
        hide_age = random.choice(["true", "false"])

        users_sql.append(
            f"('{user_id}', '{email}', '{last_seen}', "
            f"'{name}', '{DUMMY_PASSWORD_HASH}', NULL, "
            f"'{DEFAULT_ROLE}', {hide_location}, {hide_age})"
        )

        profile_id = str(uuid.uuid4())

        about = (
            f"Hi! I'm {first_name}, a developer who enjoys "
            f"building projects and meeting new collaborators."
        ).replace("'", "''")

        profiles_sql.append(
            f"('{profile_id}', '{about}', '{user_id}')"
        )

        bio_id = str(uuid.uuid4())

        age = random.randint(18, 60)

        base_lat, base_lng, city = random.choice(GEO_POINTS)

        latitude = round(
            base_lat + ((random.random() - 0.5) * 0.35),
            6,
            )

        longitude = round(
            base_lng + ((random.random() - 0.5) * 0.35),
            6,
            )

        max_distance_km = random.randint(10, 120)

        bios_sql.append(
            f"('{bio_id}', 'Night Owl', "
            f"'{random.choice(EXPERIENCE)}', "
            f"'{random.choice(LOOK_FOR)}', "
            f"'{random.choice(OS)}', "
            f"'{random.choice(LANGUAGES)}', "
            f"'{city}', {latitude}, {longitude}, "
            f"{max_distance_km}, {age}, '{user_id}')"
        )

    accepted_pairs = set()

    for index in range(num_users):
        connection_count = random.randint(2, 5)

        targets = random.sample(
            [target for target in range(num_users) if target != index],
            connection_count,
        )

        for target_index in targets:
            user_one = user_ids[index]
            user_two = user_ids[target_index]

            pair = tuple(sorted([user_one, user_two]))

            if pair in accepted_pairs:
                continue

            connection_id = str(uuid.uuid4())

            status = random.choices(
                ["PENDING", "ACCEPTED", "SKIPPED", "REJECTED", "BLOCKED"],
                weights=[20, 50, 15, 10, 5],
            )[0]

            created_at = (
                    datetime.now(timezone.utc)
                    - timedelta(days=random.randint(1, 30))
            ).strftime("%Y-%m-%d %H:%M:%S%z")

            connections_sql.append(
                f"('{connection_id}', '{user_one}', "
                f"'{user_two}', '{status}', '{created_at}')"
            )

            if status == "ACCEPTED":
                accepted_pairs.add(pair)

    for user_one, user_two in accepted_pairs:
        message_count = random.randint(1, 8)

        for _ in range(message_count):
            message_id = str(uuid.uuid4())

            sender, recipient = (
                (user_one, user_two)
                if random.choice([True, False])
                else (user_two, user_one)
            )

            content = random.choice(MESSAGE_CONTENTS)

            timestamp = (
                    datetime.now(timezone.utc)
                    - timedelta(hours=random.randint(1, 100))
            ).strftime("%Y-%m-%d %H:%M:%S%z")

            is_read = random.choice(["true", "false"])

            messages_sql.append(
                f"('{message_id}', '{sender}', '{recipient}', "
                f"'{content}', '{timestamp}', {is_read})"
            )

    sql = "BEGIN;\n"

    sql += (
            "INSERT INTO users "
            "(id, email, last_seen_at, name, password, "
            "profile_picture, role, hide_location, hide_age) VALUES\n"
            + ",\n".join(users_sql)
            + ";\n\n"
    )

    sql += (
            "INSERT INTO profiles "
            "(id, about_me, user_id) VALUES\n"
            + ",\n".join(profiles_sql)
            + ";\n\n"
    )

    sql += (
            "INSERT INTO bios "
            "(id, coding_style, experience_level, look_for, "
            "preferred_os, primary_language, city, latitude, "
            "longitude, max_distance_km, age, user_id) VALUES\n"
            + ",\n".join(bios_sql)
            + ";\n\n"
    )

    if connections_sql:
        sql += (
                "INSERT INTO connections "
                "(id, requester_id, recipient_id, status, created_at) VALUES\n"
                + ",\n".join(connections_sql)
                + ";\n\n"
        )

    if messages_sql:
        sql += (
                "INSERT INTO messages "
                "(id, sender_id, recipient_id, content, "
                "timestamp, is_read) VALUES\n"
                + ",\n".join(messages_sql)
                + ";\n\n"
        )

    sql += "COMMIT;"

    return sql


def build_command():
    if shutil.which("docker"):
        print("📦 Mode: docker exec")

        return [
            "docker",
            "exec",
            "-i",
            CONTAINER_NAME,
            "psql",
            "-v",
            "ON_ERROR_STOP=1",
            "-U",
            DB_USER,
            "-d",
            DB_NAME,
        ]

    print("📦 Mode: network psql")

    os.environ["PGPASSWORD"] = DB_PASSWORD

    return [
        "psql",
        "-h",
        NETWORK_HOST,
        "-U",
        DB_USER,
        "-d",
        DB_NAME,
        "-v",
        "ON_ERROR_STOP=1",
    ]


def print_credentials():
    print("")
    print("✔ Test accounts created")
    print("")
    print(f"📄 Any test user password is: {TEST_PASSWORD}")
    print("")


def seed():
    print("⚙ Seeding database...")

    try:
        process = subprocess.run(
            build_command(),
            input=generate_sql(100).encode("utf-8"),
            capture_output=True,
        )

        if process.returncode != 0:
            print("❗ Failed to seed database.")

            errors = process.stderr.decode().strip()

            if errors:
                print(f"📄 {errors}")

            sys.exit(1)

        print_credentials()

    except FileNotFoundError:
        print("❗ Missing 'docker' or 'psql'.")
        sys.exit(1)

    except Exception as error:
        print(f"❗ Runtime error: {error}")
        sys.exit(1)


if __name__ == "__main__":
    seed()