import os
import shutil
import subprocess
import sys
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

ADMIN_EMAIL = "admin@test.com"
ADMIN_NAME = "Admin"
ADMIN_PASSWORD = "admin"

ADMIN_PASSWORD_HASH = (
    "$2a$12$5.cFcfT1hdyIvBMh9bVII.1/"
    "smzfvtd3BikfZel4G92WTzgZKdQSO"
)

ADMIN_ROLE = "ADMIN"


def generate_sql():
    return f"""
DO $$
DECLARE
    admin_id UUID;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM users
        WHERE email = '{ADMIN_EMAIL}'
    ) THEN

        admin_id := gen_random_uuid();

        INSERT INTO users (
            id,
            email,
            name,
            password,
            role,
            last_seen_at,
            profile_picture,
            hide_location,
            hide_age
        )
        VALUES (
            admin_id,
            '{ADMIN_EMAIL}',
            '{ADMIN_NAME}',
            '{ADMIN_PASSWORD_HASH}',
            '{ADMIN_ROLE}',
            NOW(),
            NULL,
            false,
            false
        );

        RAISE NOTICE 'Admin user created.';
    ELSE
        RAISE NOTICE 'Admin user already exists.';
    END IF;
END $$;
"""


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
    print("✔ Admin account ready")
    print("")
    print(f"📄 Email:    {ADMIN_EMAIL}")
    print(f"📄 Password: {ADMIN_PASSWORD}")
    print("")


def init_admin():
    print("⚙ Initializing admin account...")

    try:
        process = subprocess.run(
            build_command(),
            input=generate_sql().encode("utf-8"),
            capture_output=True,
        )

        errors = process.stderr.decode().strip()

        if process.returncode != 0:
            print("❗ Failed to initialize admin account.")

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
    init_admin()