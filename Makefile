.PHONY: seed-admin migrate test-backend docker-up docker-down

seed-admin:
	@bash backend/scripts/admin_seed.sh $(EMAIL) $(PASSWORD) "$(FULL_NAME)" $(ROLE)

migrate:
	@docker compose exec -T backend alembic upgrade head

test-backend:
	@docker compose exec -T backend bash -lc "cd /app && PYTHONPATH=/app/backend pytest -q backend/tests --confcutdir=/app/backend/tests"

docker-up:
	@docker compose up -d

docker-down:
	@docker compose down
