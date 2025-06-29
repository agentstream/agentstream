from agent_context import AgentContext
from function_stream import PulsarConfig, SourceSpec
from pydantic import BaseModel
from typing import Optional

class ModelConfig(BaseModel):
    model: str = "gemini-2.0-flash"
    googleApiKey: Optional[str] = None

class AgentConfig(BaseModel):
    agent: AgentContext
    pulsarRpc: PulsarConfig
    responseSource: SourceSpec
    model: ModelConfig = ModelConfig()