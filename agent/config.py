from agent_context import AgentContext
from function_stream import PulsarConfig, SourceSpec
from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional

class ModelConfig(BaseModel):
    model: str = "gemini-2.0-flash"
    googleApiKey: Optional[str] = None

class SessionServiceConfig(BaseModel):
    database_url: str
    pool_size: int = 10
    max_overflow: int = 20
    ssl_mode: str = "prefer"
    
    @field_validator('database_url')
    @classmethod
    def validate_database_url(cls, v):
        if not v or not v.strip():
            raise ValueError("database_url cannot be empty or None")
        
        # Strip whitespace first
        v = v.strip()
        
        if not v.startswith(('postgresql://', 'postgresql+psycopg://', 'mysql://', 'sqlite://')):
            raise ValueError("database_url must be a valid database connection string")
        return v

class AgentConfig(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    agent: AgentContext
    pulsarRpc: PulsarConfig
    responseSource: SourceSpec
    model: ModelConfig = ModelConfig()
    sessionService: Optional[SessionServiceConfig] = None