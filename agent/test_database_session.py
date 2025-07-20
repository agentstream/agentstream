#!/usr/bin/env python3
"""Test DatabaseSessionService directly"""

import pytest
import uuid
from google.adk.sessions import DatabaseSessionService, InMemorySessionService


class TestDatabaseSessionService:
    """Test DatabaseSessionService with PostgreSQL"""
    
    @pytest.fixture
    def session_service(self):
        """Create DatabaseSessionService for testing"""
        # Hardcoded database URL for testing
        db_url = "postgresql+psycopg://test_user:test_password@localhost:5433/test_agentstream"
        service = DatabaseSessionService(db_url=db_url)
        yield service
    
    @pytest.mark.asyncio
    async def test_create_and_retrieve_session(self, session_service):
        """Test creating and retrieving a session from database"""
        app_name = "test_app"
        user_id = "test_user_123"
        session_id = f"test_session_{uuid.uuid4().hex[:8]}"
        
        # Create session
        await session_service.create_session(
            app_name=app_name,
            user_id=user_id,
            session_id=session_id
        )
        
        # Retrieve session
        session = await session_service.get_session(
            app_name=app_name,
            user_id=user_id,
            session_id=session_id
        )
        
        assert session is not None
        assert session.id == session_id
        assert session.app_name == app_name
        assert session.user_id == user_id
    
    @pytest.mark.asyncio
    async def test_multiple_sessions(self, session_service):
        """Test handling multiple sessions for the same user"""
        app_name = "test_app"
        user_id = "test_user_multi"
        session_id_1 = f"test_session_{uuid.uuid4().hex[:8]}"
        session_id_2 = f"test_session_{uuid.uuid4().hex[:8]}"
        
        # Create first session
        await session_service.create_session(
            app_name=app_name,
            user_id=user_id,
            session_id=session_id_1
        )
        
        # Create second session
        await session_service.create_session(
            app_name=app_name,
            user_id=user_id,
            session_id=session_id_2
        )
        
        # Retrieve both sessions
        session_1 = await session_service.get_session(
            app_name=app_name,
            user_id=user_id,
            session_id=session_id_1
        )
        
        session_2 = await session_service.get_session(
            app_name=app_name,
            user_id=user_id,
            session_id=session_id_2
        )
        
        assert session_1.id == session_id_1
        assert session_2.id == session_id_2
        assert session_1.app_name == app_name
        assert session_2.app_name == app_name
        assert session_1.user_id == user_id
        assert session_2.user_id == user_id


class TestInMemorySessionService:
    """Test InMemorySessionService as comparison"""
    
    @pytest.fixture
    def session_service(self):
        """Create InMemorySessionService for testing"""
        return InMemorySessionService()
    
    @pytest.mark.asyncio
    async def test_create_and_retrieve_session(self, session_service):
        """Test creating and retrieving a session from memory"""
        app_name = "test_app"
        user_id = "test_user_456"
        session_id = f"test_session_{uuid.uuid4().hex[:8]}"
        
        # Create session
        await session_service.create_session(
            app_name=app_name,
            user_id=user_id,
            session_id=session_id
        )
        
        # Retrieve session
        session = await session_service.get_session(
            app_name=app_name,
            user_id=user_id,
            session_id=session_id
        )
        
        assert session is not None
        assert session.id == session_id
        assert session.app_name == app_name
        assert session.user_id == user_id
    
    @pytest.mark.asyncio
    async def test_multiple_sessions(self, session_service):
        """Test handling multiple sessions for the same user in memory"""
        app_name = "test_app"
        user_id = "test_user_multi_memory"
        session_id_1 = f"test_session_{uuid.uuid4().hex[:8]}"
        session_id_2 = f"test_session_{uuid.uuid4().hex[:8]}"
        
        # Create first session
        await session_service.create_session(
            app_name=app_name,
            user_id=user_id,
            session_id=session_id_1
        )
        
        # Create second session
        await session_service.create_session(
            app_name=app_name,
            user_id=user_id,
            session_id=session_id_2
        )
        
        # Retrieve both sessions
        session_1 = await session_service.get_session(
            app_name=app_name,
            user_id=user_id,
            session_id=session_id_1
        )
        
        session_2 = await session_service.get_session(
            app_name=app_name,
            user_id=user_id,
            session_id=session_id_2
        )
        
        assert session_1.id == session_id_1
        assert session_2.id == session_id_2
        assert session_1.app_name == app_name
        assert session_2.app_name == app_name
        assert session_1.user_id == user_id
        assert session_2.user_id == user_id 