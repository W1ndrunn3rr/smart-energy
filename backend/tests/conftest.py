import pytest
from unittest.mock import MagicMock
from app.database.db_client import DataBase

@pytest.fixture(scope="function")
def mock_database():
    """
    Create a mock database instance that can be used across test modules.
    This fixture provides a consistent mock for database operations.
    """
    mock_db = MagicMock(spec=DataBase)
    
    # Configure default return values for common methods
    mock_db.get_readings.return_value = []
    mock_db.get_all_meters.return_value = []
    mock_db.get_meters_by_type.return_value = []
    mock_db.get_facility.return_value = None
    mock_db.get_all_user_facilities.return_value = []
    mock_db.get_user_by_email.return_value = None
    mock_db.get_all_users.return_value = []
    
    return mock_db