import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.server import app
from app.api_models.models import APIUser, APIFacility, APIMeter, APIReading

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def mock_db():
    with patch("app.server.database") as mock_db:
        # Configure mock returns
        mock_db.login_user.return_value = APIUser(
            email="technician@example.com", 
            password="hashed_pw", 
            access_level=3
        )
        mock_db.get_all_user_facilities.return_value = [
            APIFacility(
                name="Office Building",
                address="123 Work St",
                email="office@example.com"
            )
        ]
        mock_db.get_all_meters.return_value = [
            APIMeter(
                serial_number="E12345",
                meter_type="electric",
                facility_name="Office Building"
            )
        ]
        yield mock_db

def test_complete_workflow(client, mock_db):
    """Test a complete workflow from login to making a reading."""
    # 1. Login
    login_response = client.post("/login", json={
        "email": "technician@example.com",
        "password": "password123"
    })
    assert login_response.status_code == 200
    access_level = login_response.json()["access_level"]
    
    # 2. Get user's facilities
    facilities_response = client.get(f"/facilities/user/technician@example.com")
    assert facilities_response.status_code == 200
    facilities = facilities_response.json()["facilities"]
    facility_name = facilities[0]["name"]
    
    # 3. Get facility's meters
    meters_response = client.get(f"/meters/{facility_name}")
    assert meters_response.status_code == 200
    meters = meters_response.json()["meters"]
    meter_serial = meters[0]["serial_number"]
    
    # 4. Submit a reading
    reading_data = {
        "value": 123.5,
        "reading_date": "2025-05-01",
        "meter_serial_number": meter_serial,
        "email": "technician@example.com"
    }
    
    reading_response = client.post("/create_reading", json=reading_data)
    assert reading_response.status_code == 201
    
    # 5. Get readings for the facility
    readings_response = client.get(f"/readings/{facility_name}")
    assert readings_response.status_code == 200
    
    # 6. Verify calls to database
    mock_db.login_user.assert_called_once()
    mock_db.get_all_user_facilities.assert_called_once()
    mock_db.get_all_meters.assert_called_once()
    mock_db.make_reading.assert_called_once()
    mock_db.get_readings.assert_called_once()