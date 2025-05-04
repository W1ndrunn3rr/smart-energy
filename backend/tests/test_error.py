import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.server import app

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def mock_db():
    with patch("app.server.database") as mock_db:
        # Set up error scenarios
        mock_db.get_readings.side_effect = ValueError("Facility not found")
        mock_db.get_all_meters.side_effect = ValueError("Facility not found")
        mock_db.add_meter.side_effect = ValueError("Invalid facility")
        mock_db.delete_meter.side_effect = ValueError("Meter not found")
        mock_db.get_user_by_email.side_effect = ValueError("User not found")
        mock_db.login_user.return_value = None  # Failed login
        
        yield mock_db


def test_bad_request_errors(client, mock_db):
    """Test API error responses for bad requests."""
    # Test invalid meter data
    response = client.post("/meters", json={
        "serial_number": "SN123",
        "meter_type": "electric",
        "facility_name": "InvalidFacility"
    })
    assert response.status_code == 404
    assert "detail" in response.json()
    
    # Test authentication failure
    response = client.post("/login", json={
        "email": "user@example.com",
        "password": "wrongpassword"
    })
    assert response.json()["message"] == "Invalid credentials"
    assert response.json()["user"] is None

def test_validation_errors(client):
    """Test API validation errors for invalid input data."""
    # Missing required fields
    response = client.post("/create_reading", json={
        "value": 123.5,
        "reading_date": "2025-05-01"
        # Missing meter_serial_number and user_email
    })
    assert response.status_code == 422  # Unprocessable Entity
    assert "detail" in response.json()
    
    # Invalid data type
    response = client.post("/create_reading", json={
        "value": "not-a-number",  # Should be a float
        "reading_date": "2025-05-01",
        "meter_serial_number": "SN123",
        "user_email": "user@example.com"
    })
    assert response.status_code == 422  # Unprocessable Entity
    assert "detail" in response.json()