# Atlas One: Multi-Agent Travel Concierge

Atlas One is a secure, multi-agent travel concierge application built using the Agent Development Kit (ADK) 2.0 framework and Model Context Protocol (MCP). It features a robust multi-agent orchestration architecture, a local MCP server for real-time travel intelligence, a security checkpoint with PII scrubbing and threat blocking, and Human-in-the-Loop (HITL) execution.

---

## 🛠️ Project Structure

```
atlas-one/
├── app/
│   ├── agent.py               # Workflow graph, security checkpoint, and agent definitions
│   ├── config.py              # Application settings and model configurations
│   └── mcp_server.py          # FastMCP server exposing travel advisory tools
├── assets/                    # Generated project assets (architecture diagram, banner)
├── debug_agent.py             # Offline test runner harness
├── pyproject.toml             # Project dependencies and tool settings
├── README.md                  # Main documentation
└── SUBMISSION_WRITEUP.md      # Detailed architecture, security design, and verification writeup
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Python**: 3.12 or higher
- **uv**: Package manager (Install from [astral.sh/uv](https://astral.sh/uv))
- **agents-cli**: Install via `uv tool install google-agents-cli`

### 2. Environment Setup
Configure your API keys in the `.env` file in the project root:
```env
GOOGLE_API_KEY=YOUR_GEMINI_API_KEY
GOOGLE_GENAI_USE_VERTEXAI=False
GEMINI_MODEL=gemini-2.5-flash-lite
```

### 3. Install Dependencies
Run the install command to set up the virtual environment and sync dependencies:
```bash
uv sync
```

### 4. Run the Playground UI
Start the local development playground:
```bash
uv run adk web app --host 127.0.0.1 --port 18081
```
Open your browser and navigate to: **[http://localhost:18081](http://localhost:18081)**

---

## 🧩 Architectural Workflow

Atlas One implements a directed workflow graph:
- **`START`** → **`security_checkpoint`**
- **`security_checkpoint`** → Checks if input is safe.
  - If unsafe: routes to `final_output_node` with a security warning.
  - If safe: routes to `orchestrator_node`.
- **`orchestrator_node`** → Interrupts to ask the user if they want to proceed (HITL).
  - If user replies `"yes"`: coordinates planning by running the `orchestrator_agent`.
  - The `orchestrator_agent` delegates itinerary planning to `itinerary_agent` and safety checks to `safety_agent`.
  - Once information is retrieved, it synthesizes the final itinerary.
- **`final_output_node`** → Extracts and formats the text output as markdown for the user.

---

## 🛡️ Security Checkpoint
The security checkpoint runs on every user input:
1. **PII Redaction**: Email, Phone Number, Credit Card, and Passport number detection and masking. (Uses a smart passport regex to avoid redacting destination names like "Jaipur").
2. **Jailbreak / Prompt Injection Blocking**: Blocks keywords such as `ignore previous instructions` or `jailbreak`.
3. **Forbidden Activities**: Blocks illegal travel queries (e.g. `smuggle`, `contraband`).
4. **Audit Logging**: Outputs structured JSON audit logs to standard output.

---

## 🧪 Verification & Offline Testing
You can run the offline test script to trace the entire workflow (initial message → confirmation prompt → resume → final itinerary):
```bash
uv run debug_agent.py
```
