import pytest
from unittest.mock import MagicMock
from app.api_models.models import APIReading, APIMeter, APIFacility, APIUser
from app.database.db_client import DataBase

@pytest.fixture(scope="function")
def mock_database():
    mock_db = MagicMock(spec=DataBase)
    
    # Configure return values using actual model instances
    mock_db.get_readings.return_value = [
        APIReading(
            value=123.5,
            reading_date="2025-05-01",
            meter_serial_number="SN123",
            email="test@example.com"
        )
    ]
    
    mock_db.get_all_meters.return_value = [
        APIMeter(
            serial_number="SN123",
            meter_type="elektryczny",
            facility_name="Biuro"
        )
    ]
    
    mock_db.get_facility.return_value = APIFacility(
        name="Biuro",
        address="123 Main St",
        email="test@example.com"
    )
    
    mock_db.get_user_by_email.return_value = APIUser(
        email="test@example.com",
        password="hashed",
        access_level=2
    )
    
    return mock_db