import subprocess
import sys

# Чистый SQL для пересоздания схемы public
SQL_COMMAND = """
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
"""

def confirm_action():
    print("⚠️  WARNING: This action will completely delete all tables and data in the 'matchme' database!")
    choice = input("Are you sure? [yes/no]").strip().lower()

    if choice != 'yes':
        print("🛑 Aborted. The database was not modified.")
        sys.exit(0)

def drop_database():
    # Команда для вызова psql внутри твоего контейнера
    command = [
        "docker", "exec", "-i", "web-database-1",
        "psql", "-U", "postgres", "-d", "matchme"
    ]

    try:
        print("⏳ Clearing the database...")
        # Выполняем команду и передаем наш SQL текст прямо в psql
        subprocess.run(
            command,
            input=SQL_COMMAND.encode('utf-8'),
            check=True,
            capture_output=True # Перехватываем вывод, чтобы консоль была чистой
        )
        print("✅ Success! The database schema has been reset.")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error executing command.")
        # Если что-то пойдет не так (например, Docker не запущен), выведет причину
        if e.stderr:
            print(f"Details: {e.stderr.decode('utf-8').strip()}")
        sys.exit(1)

if __name__ == "__main__":
    confirm_action()
    drop_database()