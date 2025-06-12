import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.server import app
from app.api_models.models import APIReading, APIMeter, APIFacility, APIUser, APIAssignment

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def mock_db():
    with patch("app.server.database") as mock_db:
        yield mock_db

# Root endpoint tests
def test_root_endpoint(client):
    """Test the root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "Smart Energy API is running"}

# Reading endpoint tests
def test_get_all_readings(client, mock_db):
    """Test getting all readings for a facility."""
    mock_db.get_readings.return_value = [
    APIReading(
        reading_id=1,
        value=123.5,
        reading_date="2025-05-01",
        meter_serial_number="SN123",
        email="test@example.com"
    )
]
    
    response = client.get("/readings/TestFacility")
    assert response.status_code == 200
    assert "readings" in response.json()
    assert len(response.json()["readings"]) == 1

def test_get_readings_by_type(client, mock_db):
    """Test getting readings filtered by meter type."""
    mock_db.get_readings.return_value = [
    APIReading(
        reading_id=1,
        value=123.5,
        reading_date="2025-05-01",
        meter_serial_number="SN123",
        email="test@example.com"
    )
]
    
    response = client.get("/readings/TestFacility/electric")
    assert response.status_code == 200
    assert "readings" in response.json()
    mock_db.get_readings.assert_called_with("TestFacility", "electric")

def test_create_reading(client, mock_db):
    """Test creating a new reading."""
    reading_data = {
        "reading_id": 1,
        "value": 123.5,
        "reading_date": "2025-05-01",
        "meter_serial_number": "SN123",
        "email": "test@example.com"
    }
    
    response = client.post("/create_reading", json=reading_data)
    assert response.status_code == 201
    assert response.json()["message"] == "Reading created successfully"
    mock_db.make_reading.assert_called_once()

def test_create_reading_error(client, mock_db):
    """Test error handling for creating readings."""
    reading_data = {
        "value": 123.5,
        "reading_date": "2025-05-01",
        "meter_serial_number": "INVALID",
        "email": "test@example.com"
    }
    
    mock_db.make_reading.side_effect = ValueError("Meter not found")
    
    response = client.post("/readings", json=reading_data)
    assert response.status_code == 404
    assert "detail" in response.json()

# Meter endpoint tests
def test_get_meters(client, mock_db):
    """Test getting all meters for a facility."""
    mock_db.get_all_meters.return_value = [
        APIMeter(
            serial_number="SN123",
            meter_type="electric",
            facility_name="TestFacility",
            ppe=None,
            multiply_factor=1.0,
            description="Main hallway" 
        )
    ]
    
    response = client.get("/meters/TestFacility")
    assert response.status_code == 200
    assert "meters" in response.json()
    assert len(response.json()["meters"]) == 1

def test_create_meter(client, mock_db):
    """Test creating a new meter."""
    meter_data = {
        "serial_number": "SN123",
        "meter_type": "electric",
        "facility_name": "TestFacility",
        "ppe": None,
        "multiply_factor": 1.0,
        "description": "Near entrance"  
    }
    
    response = client.post("/create_meter", json=meter_data)
    assert response.status_code == 201
    assert response.json()["message"] == "Meter created successfully"
    mock_db.add_meter.assert_called_once()

def test_get_all_facilities(client, mock_db):
    """Test getting all facilities."""
    mock_db.get_all_facilities.return_value = [
        APIFacility(
            name="TestFacility",
            address="123 Test St",
            email="facility@example.com"
        )
    ]
    
    response = client.get("/facilities")
    assert response.status_code == 200
    assert "facilities" in response.json()
    assert len(response.json()["facilities"]) == 1


def test_create_facility(client, mock_db):
    """Test creating a new facility."""
    facility_data = {
        "name": "TestFacility",
        "address": "123 Test St",
        "email": "facility@example.com"
    }
    
    response = client.post("/create_facility", json=facility_data)
    assert response.status_code == 201
    assert response.json()["message"] == "Facility created successfully"
    mock_db.add_facility.assert_called_once()

# User endpoint tests
def test_get_user(client, mock_db):
    """Test getting a user by email."""
    mock_db.get_user_by_email.return_value = APIUser(
        email="user@example.com",
        password="hashed_password",
        access_level=2
    )
    
    response = client.get("/users/user@example.com")
    assert response.status_code == 200
    assert "user" in response.json()
    assert response.json()["user"]["email"] == "user@example.com"
    assert "password" not in response.json()["user"]  # Password should not be returned

def test_login(client, mock_db):
    """Test user authentication."""
    mock_db.login_user.return_value = APIUser(
        email="user@example.com",
        password="hashed_password",
        access_level=2
    )
    
    login_data = {
        "email": "user@example.com",
        "password": "password123"
    }
    
    response = client.post("/login", json=login_data)
    assert response.status_code == 200
    assert response.json()["message"] == "Login successful"
    mock_db.login_user.assert_called_with("user@example.com", "password123")