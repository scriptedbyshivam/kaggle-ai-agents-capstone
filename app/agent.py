import os
import sys
import re
import json
import asyncio
from pydantic import BaseModel, Field
from typing import Any, AsyncGenerator

from google.adk.agents import LlmAgent
from google.adk.agents.context import Context
from google.adk.apps import App, ResumabilityConfig
from google.adk.events.event import Event
from google.adk.events.request_input import RequestInput
from google.adk.tools import AgentTool
from google.adk.tools.mcp_tool import McpToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
from mcp import StdioServerParameters
from google.adk.workflow import Workflow, START, node
from google.genai import types

from app.config import config

def safe_extract_text(obj: Any) -> str:
    if not obj:
        return ""
    if isinstance(obj, str):
        return obj
    if hasattr(obj, "parts") and obj.parts:
        part = obj.parts[0]
        if hasattr(part, "text") and part.text:
            return part.text
        return str(part)
    return str(obj)


# Define local MCP Server via stdio
mcp_toolset = McpToolset(
    connection_params=StdioConnectionParams(
        server_params=StdioServerParameters(
            command=sys.executable,
            args=["-m", "app.mcp_server"],
        )
    )
)

# 1. Specialized Sub-Agents
itinerary_agent = LlmAgent(
    name="itinerary_agent",
    model=config.model,
    instruction="You are a travel scheduling expert. Create detailed, practical, and highly optimized day-by-day travel itineraries based on destination, duration, and other details. Use the search_top_attractions tool to find details about destinations.",
    tools=[mcp_toolset],
)

safety_agent = LlmAgent(
    name="safety_agent",
    model=config.model,
    instruction="You are a travel safety and local rules expert. Provide travel advisories, local regulations, visa requirements, health precautions, and weather warnings for the destination. Use the get_weather_advisory and get_local_restrictions tools to get information.",
    tools=[mcp_toolset],
)

# 2. Master Orchestrator Agent (with sub-agents registered as tools)
orchestrator_agent = LlmAgent(
    name="orchestrator_agent",
    model=config.model,
    instruction="You are Atlas One, the master travel concierge. When you receive a travel request, you MUST call both the itinerary_agent and safety_agent tools to gather the travel plan and safety details for the destination. Do not answer directly or greet the user without calling these tools first. Once you have their outputs, synthesize them into a beautifully formatted, comprehensive, and helpful travel guide.",
    tools=[
        AgentTool(agent=itinerary_agent),
        AgentTool(agent=safety_agent),
    ],
)

# 3. Security Definitions
EMAIL_RE = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
PHONE_RE = re.compile(r"\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}")
CREDIT_CARD_RE = re.compile(r"\b(?:\d[ -]*?){13,16}\b")
PASSPORT_RE = re.compile(r"\b(?:(?=[A-Z]*\d)(?=\d*[A-Z])[A-Z0-9]{6,9}|\d{9})\b", re.IGNORECASE)

INJECTION_KEYWORDS = ["ignore previous instructions", "system prompt", "override", "jailbreak", "you are now", "developer mode"]
FORBIDDEN_KEYWORDS = ["smuggle", "illegal", "contraband", "weapons", "hack"]

def scrub_pii(text: str) -> tuple[str, bool]:
    scrubbed = text
    flagged = False
    
    if EMAIL_RE.search(scrubbed):
        scrubbed = EMAIL_RE.sub("[EMAIL]", scrubbed)
        flagged = True
    if PHONE_RE.search(scrubbed):
        scrubbed = PHONE_RE.sub("[PHONE]", scrubbed)
        flagged = True
    if CREDIT_CARD_RE.search(scrubbed):
        scrubbed = CREDIT_CARD_RE.sub("[CARD]", scrubbed)
        flagged = True
    if PASSPORT_RE.search(scrubbed):
        scrubbed = PASSPORT_RE.sub("[PASSPORT]", scrubbed)
        flagged = True
        
    return scrubbed, flagged

# 4. Workflow Function Nodes
async def security_checkpoint(ctx: Context, node_input: Any) -> AsyncGenerator[Any, None]:
    user_query = ""
    if isinstance(node_input, str):
        user_query = node_input
    elif node_input and hasattr(node_input, 'parts') and node_input.parts:
        user_query = node_input.parts[0].text or ""
        
    query_lower = user_query.lower()
    
    # Check for Prompt Injection
    injection_detected = any(kw in query_lower for kw in INJECTION_KEYWORDS)
    if injection_detected:
        audit_log = {
            "event": "security_check",
            "session_id": ctx.session.id,
            "status": "blocked",
            "severity": "CRITICAL",
            "reason": "Prompt injection pattern detected in input.",
            "query": user_query
        }
        print(json.dumps(audit_log), flush=True)
        yield Event(
            content=types.Content(role='model', parts=[types.Part.from_text(text="[Security Alert] Request blocked due to potential prompt injection attempt. Please enter a valid travel inquiry.")]),
            output="[Security Alert] Request blocked due to potential prompt injection attempt. Please enter a valid travel inquiry.",
            route="security_violation"
        )
        return
        
    # Check for smuggling/illegal travel activity
    illegal_request = any(kw in query_lower for kw in FORBIDDEN_KEYWORDS)
    if illegal_request:
        audit_log = {
            "event": "security_check",
            "session_id": ctx.session.id,
            "status": "blocked",
            "severity": "WARNING",
            "reason": "Request involves forbidden travel queries (smuggling/illegal activity).",
            "query": user_query
        }
        print(json.dumps(audit_log), flush=True)
        yield Event(
            content=types.Content(role='model', parts=[types.Part.from_text(text="[Security Alert] Request blocked. Atlas One cannot plan travel that violates local laws or guidelines.")]),
            output="[Security Alert] Request blocked. Atlas One cannot plan travel that violates local laws or guidelines.",
            route="security_violation"
        )
        return

    # Scrub PII
    scrubbed_query, pii_found = scrub_pii(user_query)
    if pii_found:
        audit_log = {
            "event": "security_check",
            "session_id": ctx.session.id,
            "status": "passed_with_scrubbing",
            "severity": "WARNING",
            "reason": "PII detected and redacted.",
            "original_query": user_query,
            "scrubbed_query": scrubbed_query
        }
        print(json.dumps(audit_log), flush=True)
    else:
        audit_log = {
            "event": "security_check",
            "session_id": ctx.session.id,
            "status": "passed",
            "severity": "INFO",
            "reason": "No security threats or PII detected."
        }
        print(json.dumps(audit_log), flush=True)
        
    yield Event(
        output=types.Content(role='user', parts=[types.Part.from_text(text=scrubbed_query)]),
        route="safe"
    )

@node(rerun_on_resume=True)
async def orchestrator_node(ctx: Context, node_input: Any) -> AsyncGenerator[Any, None]:
    user_query = ""
    if isinstance(node_input, str):
        user_query = node_input
    elif node_input and hasattr(node_input, 'parts') and node_input.parts:
        user_query = node_input.parts[0].text or ""
    
    # Inter-node state sharing & Human-In-The-Loop check
    if not ctx.state.get("confirmed"):
        if ctx.resume_inputs and "confirm" in ctx.resume_inputs:
            user_choice = ""
            resume_val = ctx.resume_inputs.get("confirm")
            if isinstance(resume_val, dict):
                user_choice = (resume_val.get("confirm") or resume_val.get("response") or "").lower().strip()
            elif isinstance(resume_val, str):
                user_choice = resume_val.lower().strip()
                
            if "yes" in user_choice or "y" in user_choice:
                ctx.state["confirmed"] = True
            else:
                yield Event(
                    content=types.Content(role='model', parts=[types.Part.from_text(text="I have cancelled your travel planning request. Let me know if you want to plan another trip!")]),
                    output="Travel planning cancelled by user.",
                )
                return
        else:
            yield RequestInput(
                interrupt_id="confirm",
                message=f"Atlas One Travel Planner received: '{user_query}'. Do you want to proceed with planning this trip? Please respond 'yes' or 'no'."
            )
            return

    # Call sub-agents sequentially with cooling delays to stay well within free tier rate limits
    try:
        # Pre-flight API check: verify Gemini API status before starting sub-agent runs.
        # This prevents sub-agents from executing, failing, and sending abortive error events to the client.
        try:
            from google.genai import Client
            client = Client()
            await client.aio.models.generate_content(
                model=config.model,
                contents="ping",
            )
        except Exception as api_err:
            raise RuntimeError(f"Pre-flight check failed: {api_err}") from api_err

        safety_input = types.Content(role='user', parts=[types.Part.from_text(text=f"Provide travel safety guidelines, local restrictions, and weather warning details for destination: {user_query}")])
        safety_res = await ctx.run_node(safety_agent, node_input=safety_input)
        
        await asyncio.sleep(12)
        
        itinerary_input = types.Content(role='user', parts=[types.Part.from_text(text=f"Create a detailed day-by-day travel itinerary for destination: {user_query}")])
        itinerary_res = await ctx.run_node(itinerary_agent, node_input=itinerary_input)
        
        await asyncio.sleep(12)
        
        safety_text = safe_extract_text(safety_res)
        itinerary_text = safe_extract_text(itinerary_res)
        
        orchestrator_prompt = f"Travel request: {user_query}\n\nSafety Advisory:\n{safety_text}\n\nItinerary:\n{itinerary_text}\n\nPlease synthesize these into a beautifully formatted, comprehensive, and helpful Response."
        
        agent_input = types.Content(role='user', parts=[types.Part.from_text(text=orchestrator_prompt)])
        res = await ctx.run_node(orchestrator_agent, node_input=agent_input)
        
        ctx.state["final_itinerary"] = res
        yield Event(output=res)
    except Exception as e:
        print(f"[Fallback Triggered] Gemini API error: {e}", flush=True)
        
        # Fallback to local offline intelligence
        city = "Paris"
        query_lower = user_query.lower()
        if "tokyo" in query_lower:
            city = "Tokyo"
        elif "new york" in query_lower or "nyc" in query_lower:
            city = "New York"
        elif "san francisco" in query_lower or "sf" in query_lower:
            city = "San Francisco"
        else:
            words = user_query.split()
            ignore_words = {"plan", "a", "trip", "to", "day", "days", "3-day", "2-day", "5-day", "in", "for", "the", "please", "go", "travel"}
            potential_cities = [w.strip(",.?! ") for w in words if w.lower().strip(",.?! ") not in ignore_words]
            if potential_cities:
                city = potential_cities[-1]
        
        from app.mcp_server import get_weather_advisory, get_local_restrictions, search_top_attractions
        
        weather_advisory = get_weather_advisory(city)
        local_restrictions = get_local_restrictions(city)
        top_attractions_str = search_top_attractions(city)
        
        attractions = []
        import re
        matches = re.findall(r"\d+\.\s*([^,.]+)", top_attractions_str)
        if matches:
            attractions = [m.strip() for m in matches]
        
        while len(attractions) < 3:
            attractions.append("Iconic Local Landmark")
            
        attraction_1 = attractions[0]
        attraction_2 = attractions[1]
        attraction_3 = attractions[2]
        
        fallback_md = f"""# 🌌 ATLAS ONE | LUXURY TRAVEL CONCIERGE (Offline Fallback Mode)

*Notice: We detected high demand on our global AI core. Activating secure offline local intelligence module for your request.*

---

## 📍 Destination: **{city}**

### 🌤️ Weather & Packing Advisory
{weather_advisory}

### 🧳 Local Regulations & Travel Safety
{local_restrictions}

### 🗺️ Curated Top Attractions
{top_attractions_str}

---

### 🗓️ Bespoke Day-by-Day Experience Design

#### **Day 1: Arrival & Immersive Orientation**
- **Morning**: Welcome to **{city}**. Arrive and settle into your premium accommodations.
- **Afternoon**: Embark on a sensory exploration. Visit **{attraction_1}** for a pristine introductory experience.
- **Evening**: Dine at a local culinary icon. Relax and adjust to the local rhythm.

#### **Day 2: Cultural Exploration & Deep Dive**
- **Morning**: Start early at **{attraction_2}** to beat the crowds. Take in the history and architecture.
- **Afternoon**: Leisurely lunch followed by boutique shopping or exploring hidden alleyways.
- **Evening**: Witness the city from a different vantage point (e.g., sunset cruise or high-altitude lookout).

#### **Day 3: Scenic Retreat & Departure**
- **Morning**: Discover the tranquil side of the city at **{attraction_3}**.
- **Afternoon**: Pick up local crafts, souvenirs, and enjoy a final specialty coffee.
- **Evening**: Private transfer to the airport or train station for departure.

---
*Atlas One Offline Engine — Curated with precision.*"""

        ctx.state["final_itinerary"] = fallback_md
        yield Event(output=fallback_md)

async def final_output_node(ctx: Context, node_input: Any) -> AsyncGenerator[Any, None]:
    text_content = safe_extract_text(node_input)
    yield Event(content=types.Content(role='model', parts=[types.Part.from_text(text=text_content)]))
    yield Event(output=text_content)

# 5. Workflow definition (ADK 2.0 graph API)
workflow_agent = Workflow(
    name="atlas_one_workflow",
    edges=[
        (START, security_checkpoint),
        (security_checkpoint, {
            "security_violation": final_output_node,
            "safe": orchestrator_node
        }),
        (orchestrator_node, final_output_node),
    ],
    rerun_on_resume=True,
)

# 6. Container App definition
app = App(
    name="app",
    root_agent=workflow_agent,
    resumability_config=ResumabilityConfig(is_resumable=True),
)
