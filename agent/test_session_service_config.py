#!/usr/bin/env python3
"""Test session service configuration validation and error handling"""

import pytest
from pydantic import ValidationError
from unittest.mock import Mock, patch
import sys
import os
from config import SessionServiceConfig

class TestSessionServiceConfig:
    """Test SessionServiceConfig validation"""
    
    def test_valid_database_url(self):
        """Test valid database URL formats"""
        valid_urls = [
            "postgresql://user:pass@localhost:5432/db",
            "postgresql+psycopg://user:pass@localhost:5432/db",
            "mysql://user:pass@localhost:3306/db",
            "sqlite:///path/to/database.db"
        ]
        
        for url in valid_urls:
            config = SessionServiceConfig(database_url=url)
            assert config.database_url == url.strip()
    
    def test_invalid_database_url(self):
        """Test invalid database URL formats"""
        invalid_urls = [
            "",  # Empty string
            None,  # None value
            "   ",  # Whitespace only
            "invalid://url",  # Invalid protocol
            "http://localhost:5432/db",  # Wrong protocol
            "ftp://localhost:5432/db",  # Wrong protocol
        ]
        
        for url in invalid_urls:
            with pytest.raises(ValidationError) as exc_info:
                SessionServiceConfig(database_url=url)
            assert "database_url" in str(exc_info.value)
    
    def test_session_service_config_defaults(self):
        """Test session service config default values"""
        config = SessionServiceConfig(database_url="postgresql://user:pass@localhost:5432/db")
        assert config.pool_size == 10
        assert config.max_overflow == 20
        assert config.ssl_mode == "prefer"
    
    def test_session_service_config_custom_values(self):
        """Test session service config with custom values"""
        config = SessionServiceConfig(
            database_url="postgresql://user:pass@localhost:5432/db",
            pool_size=20,
            max_overflow=30,
            ssl_mode="require"
        )
        assert config.pool_size == 20
        assert config.max_overflow == 30
        assert config.ssl_mode == "require"
    
    def test_database_url_whitespace_handling(self):
        """Test that whitespace is properly handled in database URLs"""
        # Test with leading/trailing whitespace
        config = SessionServiceConfig(database_url="  postgresql://user:pass@localhost:5432/db  ")
        assert config.database_url == "postgresql://user:pass@localhost:5432/db"
        
        # Test with only whitespace (should fail)
        with pytest.raises(ValidationError):
            SessionServiceConfig(database_url="   ")
    
    def test_database_url_protocol_validation(self):
        """Test that only valid database protocols are accepted"""
        valid_protocols = [
            "postgresql://",
            "postgresql+psycopg://",
            "mysql://",
            "sqlite://"
        ]
        
        invalid_protocols = [
            "http://",
            "https://",
            "ftp://",
            "file://",
            "invalid://"
        ]
        
        # Test valid protocols
        for protocol in valid_protocols:
            url = f"{protocol}localhost/db"
            config = SessionServiceConfig(database_url=url)
            assert config.database_url == url
        
        # Test invalid protocols
        for protocol in invalid_protocols:
            url = f"{protocol}localhost/db"
            with pytest.raises(ValidationError) as exc_info:
                SessionServiceConfig(database_url=url)
            assert "database_url" in str(exc_info.value) 