import pytest
import json
import uuid
from unittest.mock import Mock, AsyncMock, patch
from main import AgentFunction
from config import AgentConfig
from agent_context import AgentContext, FSFunctionToolContext
from function_stream import PulsarConfig, SourceSpec, PulsarSourceConfig


class TestConfigurableAppNameAndUserId:
    
    def create_mock_config(self, app_name="test_app"):
        """Create a mock AgentConfig for testing"""
        agent_context = AgentContext(
            name="test_agent",
            description="Test agent",
            instruction="Test instruction",
            tools={}
        )
        
        pulsar_config = PulsarConfig(
            serviceUrl="pulsar://localhost:6650",
            authPlugin="",
            authParams=""
        )
        
        response_source = SourceSpec(
            pulsar=PulsarSourceConfig(
                topic="response_topic"
            )
        )
        
        return AgentConfig(
            agent=agent_context,
            pulsarRpc=pulsar_config,
            responseSource=response_source,
            app_name=app_name
        )
    
    def create_mock_context(self, config):
        """Create a mock FSContext"""
        mock_context = Mock()
        mock_context.get_configs.return_value = config.model_dump()
        return mock_context
    
    @pytest.mark.asyncio
    async def test_app_name_from_config(self):
        """Test that app_name is correctly read from config"""
        agent_function = AgentFunction()
        config = self.create_mock_config(app_name="custom_app_name")
        mock_context = self.create_mock_context(config)
        
        # Mock the dependencies
        with patch('main.PulsarRPCManager') as mock_rpc_manager, \
             patch('main.DatabaseSessionService') as mock_session_service, \
             patch('main.Agent') as mock_agent, \
             patch('main.Runner') as mock_runner:
            
            mock_rpc_manager.return_value = AsyncMock()
            mock_session_service.return_value = AsyncMock()
            mock_agent.return_value = Mock()
            mock_runner.return_value = AsyncMock()
            
            # Initialize the agent function
            agent_function.init(mock_context)
            
            # Verify that the runner was created with the correct app_name
            mock_runner.assert_called_once()
            call_args = mock_runner.call_args
            assert call_args[1]['app_name'] == "custom_app_name"
    
    @pytest.mark.asyncio
    async def test_user_id_from_data(self):
        """Test that user_id is correctly extracted from data"""
        agent_function = AgentFunction()
        config = self.create_mock_config()
        mock_context = self.create_mock_context(config)
        
        # Mock the dependencies
        with patch('main.PulsarRPCManager') as mock_rpc_manager, \
             patch('main.DatabaseSessionService') as mock_session_service, \
             patch('main.Agent') as mock_agent, \
             patch('main.Runner') as mock_runner:
            
            mock_rpc_manager.return_value = AsyncMock()
            mock_session_service.return_value = AsyncMock()
            mock_agent.return_value = Mock()
            mock_runner_instance = Mock()
            mock_runner.return_value = mock_runner_instance
            
            # Initialize the agent function
            agent_function.init(mock_context)
            
            # Test data with __user_id
            test_data = {
                "message": "Hello",
                "__user_id": "test_user_123"
            }
            
            # Mock the session service create_session method
            agent_function.session_service.create_session = AsyncMock()
            
            # Create a mock event with is_final_response method
            mock_event = Mock()
            mock_event.is_final_response.return_value = True
            mock_event.content.parts = [Mock()]
            mock_event.content.parts[0].text = '{"result": "test"}'
            
            # Mock the runner's run_async method to return an async generator
            async def mock_event_generator():
                yield mock_event
            
            # Set the return value to the generator directly
            mock_runner_instance.run_async.return_value = mock_event_generator()
            
            # Call process method
            result = await agent_function.process(mock_context, test_data)
            
            # Verify that create_session was called with the correct user_id
            agent_function.session_service.create_session.assert_called_once()
            call_args = agent_function.session_service.create_session.call_args
            assert call_args[1]['user_id'] == "test_user_123"
            
            # Verify the result
            assert result == {"result": "test"}
    
    @pytest.mark.asyncio
    async def test_user_id_fallback_to_uuid(self):
        """Test that user_id falls back to uuid when __user_id is not in data"""
        agent_function = AgentFunction()
        config = self.create_mock_config()
        mock_context = self.create_mock_context(config)
        
        # Mock the dependencies
        with patch('main.PulsarRPCManager') as mock_rpc_manager, \
             patch('main.DatabaseSessionService') as mock_session_service, \
             patch('main.Agent') as mock_agent, \
             patch('main.Runner') as mock_runner, \
             patch('uuid.uuid4') as mock_uuid:
            
            mock_rpc_manager.return_value = AsyncMock()
            mock_session_service.return_value = AsyncMock()
            mock_agent.return_value = Mock()
            mock_runner_instance = Mock()
            mock_runner.return_value = mock_runner_instance
            
            # Set up mock uuid
            mock_uuid.return_value = "mock-uuid-123"
            
            # Initialize the agent function
            agent_function.init(mock_context)
            
            # Test data without __user_id
            test_data = {
                "message": "Hello"
            }
            
            # Mock the session service create_session method
            agent_function.session_service.create_session = AsyncMock()
            
            # Create a mock event with is_final_response method
            mock_event = Mock()
            mock_event.is_final_response.return_value = True
            mock_event.content.parts = [Mock()]
            mock_event.content.parts[0].text = '{"result": "test"}'
            
            # Mock the runner's run_async method to return an async generator
            async def mock_event_generator():
                yield mock_event
            
            # Set the return value to the generator directly
            mock_runner_instance.run_async.return_value = mock_event_generator()
            
            # Call process method
            result = await agent_function.process(mock_context, test_data)
            
            # Verify that create_session was called with the generated uuid
            agent_function.session_service.create_session.assert_called_once()
            call_args = agent_function.session_service.create_session.call_args
            assert call_args[1]['user_id'] == "mock-uuid-123"
            
            # Verify the result
            assert result == {"result": "test"}
    
    @pytest.mark.asyncio
    async def test_default_app_name(self):
        """Test that default app_name is used when not specified in config"""
        agent_function = AgentFunction()
        # Create config without specifying app_name to test default
        agent_context = AgentContext(
            name="test_agent",
            description="Test agent",
            instruction="Test instruction",
            tools={}
        )
        
        pulsar_config = PulsarConfig(
            serviceUrl="pulsar://localhost:6650",
            authPlugin="",
            authParams=""
        )
        
        response_source = SourceSpec(
            pulsar=PulsarSourceConfig(
                topic="response_topic"
            )
        )
        
        config = AgentConfig(
            agent=agent_context,
            pulsarRpc=pulsar_config,
            responseSource=response_source
            # No app_name specified, should use default
        )
        
        mock_context = self.create_mock_context(config)
        
        # Mock the dependencies
        with patch('main.PulsarRPCManager') as mock_rpc_manager, \
             patch('main.DatabaseSessionService') as mock_session_service, \
             patch('main.Agent') as mock_agent, \
             patch('main.Runner') as mock_runner:
            
            mock_rpc_manager.return_value = AsyncMock()
            mock_session_service.return_value = AsyncMock()
            mock_agent.return_value = Mock()
            mock_runner.return_value = AsyncMock()
            
            # Initialize the agent function
            agent_function.init(mock_context)
            
            # Verify that the runner was created with the default app_name
            mock_runner.assert_called_once()
            call_args = mock_runner.call_args
            assert call_args[1]['app_name'] == "summary_agent"  # Default value
    
    def test_config_model_validation(self):
        """Test that AgentConfig properly validates app_name field"""
        # Test with valid app_name
        config = self.create_mock_config(app_name="valid_app_name")
        assert config.app_name == "valid_app_name"
        
        # Test with empty app_name (should be allowed as it's a string)
        config = self.create_mock_config(app_name="")
        assert config.app_name == ""
        
        # Test with special characters in app_name
        config = self.create_mock_config(app_name="app-name_with_underscores")
        assert config.app_name == "app-name_with_underscores"


if __name__ == "__main__":
    pytest.main([__file__]) 