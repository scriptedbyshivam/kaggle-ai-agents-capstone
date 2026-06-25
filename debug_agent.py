import asyncio
import sys
from google.adk.runners import InMemoryRunner
from app.agent import app
from google.genai import types



# Configure stdout to support UTF-8 characters (like emojis) on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

async def main():
    runner = InMemoryRunner(app=app)
    session = await runner.session_service.create_session(
        app_name="app", user_id="test_user"
    )
    
    print("--- Sending initial message ---")
    async for event in runner.run_async(
        user_id="test_user",
        session_id=session.id,
        new_message=types.Content(role="user", parts=[types.Part.from_text(text="Plan a 3-day trip to Paris")]),
    ):
        print(f"Event output: {event.output}")
        print(f"Event content: {event.content}")
        # If there are any actions (like routing/state updates)
        if event.actions:
            print(f"Event actions: {event.actions}")
            
    # Resume with yes
    print("\n--- Resuming with 'yes' ---")
    part_response = types.Part.from_function_response(
        name="adk_request_input",
        response={"response": "yes"}
    )
    part_response.function_response.id = "confirm"
    resume_msg = types.Content(
        role="user",
        parts=[part_response]
    )
    async for event in runner.run_async(
        user_id="test_user",
        session_id=session.id,
        new_message=resume_msg,
    ):
        print(f"Event output: {event.output}")
        print(f"Event content: {event.content}")

if __name__ == "__main__":
    asyncio.run(main())
