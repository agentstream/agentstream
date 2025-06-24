from typing import Dict, Optional
from pydantic import BaseModel, Field

class FSFunctionToolContext(BaseModel):
    description: str
    sourceSchema: Optional[str] = None
    sinkSchema: Optional[str] = None
    requestSource: str
    mode: str = "RPC"

class ProcessCallback(BaseModel):
    jsonnet: str


class AgentContext(BaseModel):
    name: str
    description: str
    instruction: str
    tools: Optional[Dict[str, FSFunctionToolContext]] = Field(default_factory=dict)
    postProcess: Optional[ProcessCallback] = None
