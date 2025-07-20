.PHONY: build-image test

build-image:
	docker build -t agentstream/agent .

start-docker-compose:
	docker compose -f docker-compose.test.yml up postgres -d && sleep 5

stop-docker-compose:
	docker compose -f docker-compose.test.yml down

test:
	python -m pytest -v

