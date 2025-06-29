import json

from google.adk.tools.base_tool import BaseTool
from google.adk.tools.tool_context import ToolContext
from typing import Any, Dict
from typing_extensions import override
from google.genai.types import FunctionDeclaration, Schema, Type, JSONSchema
from pulsar_rpc import PulsarRPCManager
from agent_context import FSFunctionToolContext


class FSFunctionTool(BaseTool):
    """A tool that is defined by a function module configuration."""
    
    def __init__(
        self,
        name: str,
        ctx: FSFunctionToolContext,
        rpc_manager: PulsarRPCManager,
    ):
        super().__init__(
            name=name,
            description=ctx.description
        )
        self.name = name
        self.ctx = ctx
        self._rpc_manager = rpc_manager
        
    def _get_declaration(self) -> FunctionDeclaration:
        """Get the function declaration for this tool."""
        kwargs :Dict[str, Any] = {
            "name": self.name,
            "description": self.ctx.description,
        }
        if getattr(self.ctx, "sourceSchema", None):
            kwargs["parameters"] = Schema.from_json_schema(
                json_schema=JSONSchema(**json.loads(self.ctx.sourceSchema))
            )
        if getattr(self.ctx, "sinkSchema", None):
            kwargs["response"] = Schema.from_json_schema(
                json_schema=JSONSchema(**json.loads(self.ctx.sinkSchema))
            )
        return FunctionDeclaration(**kwargs)

    @override
    async def run_async(self, *, args: dict[str, Any], tool_context: ToolContext) -> Any:
        """Run the tool asynchronously with the given arguments."""
        if self.ctx.mode == "streaming":
            return await self._rpc_manager.produce(topic=self.ctx.requestSource, data=args)
        return await self._rpc_manager.request(
            topic=self.ctx.requestSource,
            data=args
        )
