import pytest
import json
import uuid
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from main import AgentFunction, repair_json_output
from config import AgentConfig
from agent_context import AgentContext
from function_stream import PulsarConfig, SourceSpec, PulsarSourceConfig
from google.genai import types


class TestJsonRepair:
    
    def create_mock_context(self, config):
        """Create a mock FSContext"""
        mock_context = Mock()
        mock_context.get_configs.return_value = config.model_dump()
        return mock_context

    def test_repair_json_output_empty_string(self):
        """Test repair_json_output with empty string"""
        result = repair_json_output("")
        assert result == "{}"
        
        result = repair_json_output("   ")
        assert result == "{}"
        
        result = repair_json_output(None)
        assert result == "{}"

    def test_repair_json_output_valid_json(self):
        """Test repair_json_output with already valid JSON"""
        valid_json = '{"key": "value", "number": 123}'
        result = repair_json_output(valid_json)
        assert result == valid_json

    def test_repair_json_output_with_markdown_blocks(self):
        """Test repair_json_output with markdown code blocks"""
        
        # Test with ```json block
        json_with_markdown = '```json\n{"key": "value"}\n```'
        result = repair_json_output(json_with_markdown)
        assert result == '{"key": "value"}'
        
        # Test with ``` block
        json_with_markdown = '```\n{"key": "value"}\n```'
        result = repair_json_output(json_with_markdown)
        assert result == '{"key": "value"}'
        
        # Test with trailing whitespace
        json_with_markdown = '```json\n{"key": "value"}\n```   '
        result = repair_json_output(json_with_markdown)
        assert result == '{"key": "value"}'

    def test_repair_json_output_malformed_json(self):
        """Test repair_json_output with malformed JSON"""
        
        # Test with missing quotes
        malformed_json = '{key: "value"}'
        result = repair_json_output(malformed_json)
        # Should return repaired JSON or fallback to {}
        assert result == '{"key": "value"}'
        
        # Test with trailing comma
        malformed_json = '{"key": "value",}'
        result = repair_json_output(malformed_json)
        # Should return repaired JSON or fallback to {}
        assert result == '{"key": "value"}'

    def test_repair_json_output_exception_fallback(self):
        """Test repair_json_output when jsonrepair fails"""
        
        # Test with completely invalid JSON that should cause an exception
        invalid_json = 'this is not json at all'
        result = repair_json_output(invalid_json)
        # json_repair returns empty string for invalid JSON, our function should return "{}"
        assert result == "{}"

    def test_repair_json_output_integration(self):
        """Integration test for repair_json_output with various edge cases"""
        
        test_cases = [
            # (input, expected_output_description)
            ("", "empty object"),
            ("   ", "empty object"),
            (None, "empty object"),
            ('{"valid": "json"}', "same as input"),
            ('```json\n{"valid": "json"}\n```', "cleaned json"),
            ('```\n{"valid": "json"}\n```', "cleaned json"),
            ('{invalid: json}', "repaired or fallback"),
            ('{"trailing": "comma",}', "repaired or fallback"),
            ('{"nested": {"object": "value"}}', "same as input"),
            ('[1, 2, 3]', "same as input"),
            ('{"quotes": "missing}', "repaired or fallback"),
        ]
        
        for input_text, expected_desc in test_cases:
            result = repair_json_output(input_text)
            
            # Basic validation
            assert isinstance(result, str)
            
            if expected_desc == "empty object":
                assert result == "{}"
            elif expected_desc == "same as input":
                assert result == input_text
            elif expected_desc == "cleaned json":
                # Should be valid JSON without markdown
                assert result.startswith('{') or result.startswith('[')
                assert result.endswith('}') or result.endswith(']')
            elif expected_desc == "repaired or fallback":
                # Should be valid JSON or fallback to {}
                assert result == "{}" or (result.startswith('{') and result.endswith('}'))
                # Note: json_repair can actually repair some malformed JSON, so we accept valid JSON or {} 