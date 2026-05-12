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

SQL_COMMAND = """
              TRUNCATE TABLE profiles, bios, users CASCADE; \
              """


def confirm_action():
    print("❗ Warning: This will delete all database data.")

    choice = input("👉 Continue [yes/no]: ")
    choice = choice.strip().lower()

    if choice not in ["yes", "y"]:
        print("✔ Cancelled.")
        sys.exit(1)


def build_command():
    if shutil.which("docker"):
        print("📦 Mode: docker exec")

        return [
            "docker",
            "exec",
            "-i",
            CONTAINER_NAME,
            "psql",
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
    ]


def clear_database():
    print("🧹 Status: clearing database...")

    try:
        subprocess.run(
            build_command(),
            input=SQL_COMMAND.encode("utf-8"),
            check=True,
            capture_output=True,
        )

        print("✔ Success: database cleared.")

    except FileNotFoundError:
        print("❗ Error: missing 'docker' or 'psql'.")
        sys.exit(1)

    except subprocess.CalledProcessError as error:
        print("❗ Error: failed to clear database.")

        if error.stderr:
            print(f"📄 Details: {error.stderr.decode().strip()}")

        sys.exit(1)


if __name__ == "__main__":
    confirm_action()
    clear_database()