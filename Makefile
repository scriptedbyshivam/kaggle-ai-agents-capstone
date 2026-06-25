.PHONY: install playground run test website

install:
	uv sync

playground:
	uv run adk web app --host 127.0.0.1 --port 18081 --reload_agents --allow_origins="*"

run:
	uv run uvicorn app.agent_runtime_app:agent_runtime --host 127.0.0.1 --port 8090

test:
	uv run pytest tests/unit

website:
	uv run python -m http.server 8080 --directory website
