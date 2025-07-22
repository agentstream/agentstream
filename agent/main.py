import asyncio
import json
import re
from typing import Dict, Any
from function_stream import FSFunction, FSContext, FSModule, SourceSpec, PulsarSourceConfig
from google.adk import Agent, Runner
from google.adk.sessions import DatabaseSessionService
from google.genai import types
from google.adk.tools.tool_context import ToolContext
from fs_function_tool import FSFunctionTool
from pulsar_rpc import PulsarRPCManager
import uuid
import _jsonnet
import os
from config import AgentConfig
from json_repair import repair_json


def repair_json_output(text: str) -> str:
    """
    Repair JSON output using the jsonrepair library.
    
    Args:
        text (str): The text that should contain JSON
        
    Returns:
        str: Repaired JSON string
    """
    if not text or not text.strip():
        return "{}"
    
    # Remove markdown code blocks if present
    text = re.sub(r'```json\s*\n?', '', text)
    text = re.sub(r'```\s*$', '', text)
    text = text.strip()
    
    try:
        # Use jsonrepair library to fix the JSON
        repaired = repair_json(text)
        # If repair_json returns empty string, return empty object as fallback
        if not repaired:
            return "{}"
        return repaired
    except Exception as e:
        # If jsonrepair fails, return empty object as fallback
        return "{}"


class AgentFunction(FSModule):
    def __init__(self):
        self.rpc_manager = None
        self.config = None
        self.session_service = None
        self.agent_ctx = None
        self.runner = None
        self.outputMap: Dict[str, str] = {}

    def output_tool(self, message: dict, tool_context: ToolContext) -> dict:
        """A tool for output message. If users ask you to output messages, you SHOULD use this tool. The message MUST be a json format.

        Args:
            message (dict): The message to output
            tool_context (ToolContext): The tool context to use
        """
        session_id = tool_context._invocation_context.session.id
        self.outputMap[session_id] = json.dumps(message)
        return {"result": "success"}

    def init(self, context: FSContext):
        self.config = AgentConfig.model_validate(context.get_configs())
        
        # Extract auth parameters from PulsarConfig if available
        auth_plugin = self.config.pulsarRpc.authPlugin
        auth_params = self.config.pulsarRpc.authParams
        
        self.rpc_manager = PulsarRPCManager(
            service_url=self.config.pulsarRpc.serviceUrl,
            response_topic=self.config.responseSource.pulsar.topic,
            auth_plugin=auth_plugin,
            auth_params=auth_params,
        )
        # Configure database session service if session service config is provided
        if self.config.sessionService:
            try:
                self.session_service = DatabaseSessionService(
                    database_url=self.config.sessionService.database_url,
                    pool_size=self.config.sessionService.pool_size,
                    max_overflow=self.config.sessionService.max_overflow,
                    ssl_mode=self.config.sessionService.ssl_mode
                )
            except Exception as e:
                raise Exception(f"Failed to initialize database session service: {e}")
        else:
            # Fallback to in-memory session service if no database config
            from google.adk.sessions import InMemorySessionService
            self.session_service = InMemorySessionService()
        
        self.runner = None

        if self.config.model.googleApiKey:
            os.environ["GOOGLE_API_KEY"] = self.config.model.googleApiKey

        tools = []
        self.agent_ctx = self.config.agent
        for n, f in self.agent_ctx.tools.items():
            tools.append(FSFunctionTool(name=n, ctx=f, rpc_manager=self.rpc_manager))
        tools.append(self.output_tool)
        root_agent = Agent(
            name=self.agent_ctx.name,
            model=self.config.model.model,
            description=self.agent_ctx.description,
            instruction=self.agent_ctx.instruction + "\nYou MUST use the output_tool to output any messages/output",
            tools=tools,
        )
        self.runner = Runner(agent=root_agent, app_name=self.config.app_name, session_service=self.session_service)

    async def process(self, context: FSContext, data: Dict[str, Any]) -> Dict[str, Any] | None:
        input = json.dumps(data, ensure_ascii=False)
        content = types.Content(role='user',
                                parts=[types.Part(text=input)])
        session_id = str(uuid.uuid4())
        
        # Get user_id from data, fallback to uuid if not present
        user_id = data.get('__user_id', str(uuid.uuid4()))
        
        await self.session_service.create_session(app_name=self.config.app_name, user_id=user_id, session_id=session_id)
        final_response = None
        agent_event_generator = self.runner.run_async(user_id=user_id, session_id=session_id, new_message=content)
        async for event in agent_event_generator:
            if event.is_final_response():
                final_response = event.content.parts[0].text
                break
        if final_response:
            # Apply post-processing if configured
            output = self.outputMap.pop(session_id, final_response).lstrip("```json\n").rstrip("```")
            
            # Repair JSON to ensure it's valid
            repaired_output = repair_json_output(output)
            
            if self.agent_ctx.postProcess and self.agent_ctx.postProcess.jsonnet:
                try:
                    code = f'''
local input = {input};
local agent_output = {repaired_output};
{self.agent_ctx.postProcess.jsonnet}
                    '''
                    # Evaluate the jsonnet script with the response data
                    processed_response = _jsonnet.evaluate_snippet(
                        "post_process",  # filename for stack traces
                        code
                    )
                    return json.loads(processed_response)
                except Exception as e:
                    raise Exception(f"Error in post-processing: {e}")
            else:
                return json.loads(repaired_output)

        return None

    async def close(self):
        """Close the resources used by the agent function."""
        if self.runner:
            await self.runner.close()
        if self.session_service:
            await self.session_service.close()
        if self.rpc_manager:
            await self.rpc_manager.close()


async def main():
    agent_function = AgentFunction()

    # Initialize the FunctionStream function
    function = FSFunction(
        process_funcs={
            'agent': agent_function,
        },
    )

    try:
        print("Starting agent function service...")
        await function.start()
    except Exception as e:
        print(f"\nAn error occurred: {e}")
    finally:
        await function.close()
        await agent_function.close()


if __name__ == "__main__":
    try:
        # Run the main function in an asyncio event loop
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nService stopped")
