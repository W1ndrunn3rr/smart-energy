import pytest
import os
from unittest.mock import patch, MagicMock
from sqlalchemy import text
from app.database.db_client import DataBase, DatabaseError

@pytest.fixture
def mock_connector():
    with patch("app.database.db_client.Connector") as mock:
        connector_instance = MagicMock()
        mock.return_value = connector_instance
        yield mock

@pytest.fixture
def mock_sqlalchemy_engine():
    with patch("app.database.db_client.sqlalchemy.create_engine") as mock:
        engine_instance = MagicMock()
        mock.return_value = engine_instance
        yield mock

@pytest.fixture
def mock_environment_variables():
    original_env = os.environ.copy()
    os.environ.update({
        "INSTANCE_CONNECTION_NAME": "test-instance",
        "DB_USER": "test-user",
        "DB_PASSWORD": "test-password",
        "DB_NAME": "test-db"
    })
    yield
    os.environ.clear()
    os.environ.update(original_env)

def test_database_initialization(mock_connector, mock_sqlalchemy_engine, mock_environment_variables):
    """Test database client initialization."""
    db = DataBase()
    assert db.connector == mock_connector.return_value
    mock_sqlalchemy_engine.assert_called_once()

def test_execute_query(mock_connector, mock_sqlalchemy_engine):
    """Test query execution method."""
    db = DataBase()
    
    # Create a mock connection
    conn = MagicMock()
    db.pool.connect.return_value.__enter__.return_value = conn
    
    # Test with params
    db._execute_query("SELECT * FROM test", {"param": "value"})
    conn.execute.assert_called_once()
    conn.commit.assert_called_once()
    
    # Test exception handling
    conn.execute.side_effect = Exception("Database error")
    with pytest.raises(DatabaseError):
        db._execute_query("SELECT * FROM test")

def test_fetch_query_results(mock_connector, mock_sqlalchemy_engine):
    """Test query fetching method."""
    db = DataBase()
    
    # Create a mock connection
    conn = MagicMock()
    db.pool.connect.return_value.__enter__.return_value = conn
    conn.execute.return_value.fetchall.return_value = [("value1",), ("value2",)]
    
    # Test with params
    results = db._fetch_query_results("SELECT * FROM test", {"param": "value"})
    conn.execute.assert_called_once()
    assert len(results) == 2
    assert results[0][0] == "value1"
    
    # Test exception handling
    conn.execute.side_effect = Exception("Database error")
    with pytest.raises(DatabaseError):
        db._fetch_query_results("SELECT * FROM test")