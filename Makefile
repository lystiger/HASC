.PHONY: seed-admin seed-products migrate test-backend docker-up docker-down

seed-admin:
	@bash backend/scripts/admin_seed.sh $(EMAIL) $(PASSWORD) "$(FULL_NAME)" $(ROLE)

seed-products:
	@cd backend && python3 -m scripts.product_seed --api-base-url $(API_BASE_URL) --email $(EMAIL) --password $(PASSWORD)

migrate:
	@docker compose exec -T backend alembic upgrade head

test-backend:
	@docker compose exec -T backend bash -lc "cd /app && PYTHONPATH=/app/backend pytest -q backend/tests --confcutdir=/app/backend/tests"

docker-up:
	@docker compose up -d

docker-down:
	@docker compose down
