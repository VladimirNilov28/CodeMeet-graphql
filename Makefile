# =========================
# Utils
# =========================

.PHONY: _check-python _check-tmux backend client database hive-router containers-down dev attach-backend attach-client

GREEN=\033[0;32m
BLUE=\033[0;34m
YELLOW=\033[1;33m
CYAN=\033[0;36m
RED=\033[0;31m
NC=\033[0m

_check-tmux:
	@command -v tmux >/dev/null 2>&1 || { \
		printf "$(RED)❗ tmux is required but not installed.$(NC)\n"; \
		printf "$(YELLOW)👉 Install tmux now? [y/N] $(NC)"; \
		read answer; \
		if [ "$$answer" = "y" ] || [ "$$answer" = "Y" ]; then \
			if command -v apt >/dev/null 2>&1; then \
				sudo apt update && sudo apt install -y tmux; \
			elif command -v brew >/dev/null 2>&1; then \
				brew install tmux; \
			else \
				printf "$(RED)❗ Unsupported package manager.$(NC)\n"; \
				exit 1; \
			fi; \
		else \
			printf "$(RED)❗ tmux installation skipped.$(NC)\n"; \
			exit 1; \
		fi; \
	}

# =========================
# DEV
# =========================





database:
	@printf "$(YELLOW)📦 Starting PostgreSQL container...$(NC)\n"
	@docker compose up database adminer -d
	@printf "$(GREEN) ✔ PostgreSQL adminer available at:$(NC) $(CYAN)http://localhost:7777$(NC)\n"

backend: _check-tmux
	@printf "$(YELLOW)⚙ Starting Spring Boot backend...$(NC)\n"

	@tmux has-session -t backend 2>/dev/null || \
		tmux new-session -d -s backend "cd backend && ./mvnw spring-boot:run"

	@printf "$(YELLOW)⏳ Waiting for backend...$(NC)\n"

	@until curl -s http://localhost:8080/actuator/health >/dev/null; do \
		sleep 2; \
	done

	@printf "$(GREEN)✔ Backend available at:$(NC) $(CYAN)http://localhost:8080$(NC)\n"
	@printf "$(BLUE)👉 Inspect:$(NC) tmux attach -t backend\n"

client: _check-tmux
	@printf "$(YELLOW)📦 Installing frontend dependencies...$(NC)\n"
	@cd frontend && npm install

	@printf "$(YELLOW)🚀 Starting frontend development server...$(NC)\n"
	@tmux has-session -t frontend 2>/dev/null || \
		tmux new-session -d -s frontend "cd frontend && npm run dev"

	@printf "$(GREEN) ✔ Frontend available at:$(NC) $(CYAN)http://localhost:5173$(NC)\n"
	@printf "$(BLUE)👉 Inspect:$(NC) tmux attach -t frontend\n"

hive-router:
	@printf "$(YELLOW)✨ Building GraphQL supergraph...$(NC)\n"
	@cd graphql && npm run compose

	@printf "$(YELLOW)🚀 Starting Hive Router...$(NC)\n"
	@LABORATORY_ENABLED=true docker compose up hive-router -d --no-deps

	@printf "$(GREEN) ✔ GraphQL Router available at:$(NC) $(CYAN)http://localhost:4000$(NC)\n"
	@printf "$(GREEN) ✔ GraphQL playground is available at:$(NC) $(CYAN)http://localhost:4000/graphql$(NC)\n"

containers-down: _check-tmux
	@printf "$(RED)⚓ Stopping containers and tmux sessions...$(NC)\n"

	@docker compose down

	@tmux kill-session -t backend 2>/dev/null || true
	@tmux kill-session -t frontend 2>/dev/null || true

	@printf "$(GREEN) ✔ Everything stopped$(NC)\n"

attach-backend: _check-tmux
	@tmux attach -t backend

attach-client: _check-tmux
	@tmux attach -t frontend

dev: _check-tmux database backend client hive-router

	@printf "\n"
	@printf "$(GREEN)🎉 Development environment is ready!$(NC)\n"
	@printf "\n"

	@printf "$(BLUE)Frontend:$(NC)                $(CYAN)http://localhost:5173$(NC)\n"
	@printf "$(BLUE)Backend REST:$(NC)            $(CYAN)http://localhost:8080$(NC)\n"
	@printf "$(BLUE)GraphQL Router:$(NC)          $(CYAN)http://localhost:4000$(NC)\n"
	@printf "$(BLUE)GraphQL playground:$(NC)      $(CYAN)http://localhost:4000/graphql$(NC)\n"
	@printf "$(BLUE)PostgreSQL adminer::$(NC)     $(CYAN)http://localhost:7777$(NC)\n"

	@printf "\n"

	@printf "$(YELLOW)👉 To inspect tmux sessions use:$(NC)\n"
	@printf "tmux attach -t backend\n"
	@printf "tmux attach -t frontend\n"

	@printf "\n"

# =========================
# PROD
# =========================
_check-supergraph:
	@if [ ! -f graphql/supergraph.graphql ]; then \
		printf "$(RED)❗ supergraph.graphql not found. ❗$(NC)\n"; \
		printf "$(YELLOW)👉 Generate supergraph now? [y/N] $(NC)"; \
		read answer; \
		if [ "$$answer" = "y" ] || [ "$$answer" = "Y" ]; then \
			$(MAKE) bootstrap-supergraph; \
		else \
			printf "$(RED)❌ Production startup cancelled. ❌$(NC)\n"; \
			exit 1; \
		fi; \
	fi

bootstrap-supergraph: _check-tmux
	@printf "$(YELLOW)✨ Building GraphQL supergraph...$(NC)\n"
	@docker compose up database -d >/dev/null
	@tmux new-session -d -s backend \
    	"cd backend && DATASOURCE_URL=jdbc:postgresql://localhost:5432/codemeet_db ./mvnw spring-boot:run"

	@printf "$(YELLOW)⏳ Generating...$(NC)\n"

	@until curl -s http://localhost:8080/actuator/health >/dev/null; do \
		sleep 2; \
	done
	@cd graphql && npm run compose
	@tmux kill-session -t backend 2>/dev/null || true
	@docker compose down >/dev/null 2>&1 || true

prod: _check-supergraph
	@printf "$(YELLOW)🚀 Starting production environment...$(NC)\n"
	@docker compose up -d --build

	@printf "\n"
	@printf "$(GREEN)🎉 Production environment is running$(NC)\n"
	@printf "$(BLUE)Available on:$(NC) $(CYAN)http://localhost:8080$(NC)\n"
	@printf "\n"

prod-down:
	@printf "$(RED)⚓ Stopping production environment...$(NC)\n"
	@docker compose down
	@printf "$(GREEN) ✔ Production environment stopped$(NC)\n"

# =========================
# Scripts
# =========================

_check-python:
	@command -v python3 >/dev/null 2>&1 || { \
    	printf "$(RED)❗ python3 is required but not installed.$(NC)\n"; \
    	exit 1; \
    }

drop-db: _check-python
	@cd scripts && PYTHONUTF8=1  python3 drop-db.py

init-admin: _check-python
	@cd scripts && PYTHONUTF8=1 python3 init-admin.py

seed-db: _check-python
	@cd scripts && PYTHONUTF8=1 python3 seed-db.py