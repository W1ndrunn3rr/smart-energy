import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.server import app
from app.api_models.models import APIReading, APIMeter, APIFacility, APIUser, APIAssignment

client = TestClient(app)

# ==================== Fixtures ====================

@pytest.fixture
def mock_db():
    with patch("app.server.database") as mock:
        yield mock

@pytest.fixture
def sample_reading():
    return APIReading(
        value=134.5,
        reading_date="2025-04-04",
        meter_serial_number="E32137821",
        email="test@gmail.com"
    )

@pytest.fixture
def sample_meter():
    return APIMeter(
        serial_number="SN12345",
        meter_type="elektryczny",
        facility_name="Biuro"
    )

@pytest.fixture
def sample_facility():
    return APIFacility(
        name="Biuro",
        address="123 Głowna Ulica",
        email="zarzad@gmail.com"
    )

@pytest.fixture
def sample_user():
    return APIUser(
        email="uzytkownik@gmail.com",
        password="haslo123",
        access_level=4
    )

@pytest.fixture
def sample_assignment():
    return APIAssignment(
        email="test@example.com",
        facility_name="Office Building"
    )

# ==================== Reading Tests ====================

def test_create_reading(mock_db, sample_reading):
    response = client.post("/readings", json=sample_reading.dict())
    assert response.status_code == 201
    mock_db.make_reading.assert_called_once_with(sample_reading)

def test_get_readings(mock_db):
    mock_db.get_readings.return_value = [APIReading(
        value=123.5,
        reading_date="2025-05-01",
        meter_serial_number="SN123",
        email="test@example.com"
    )]
    response = client.get("/readings/Office")
    assert response.status_code == 200
    assert len(response.json()["readings"]) == 1

def test_delete_reading(mock_db):
    response = client.delete("/readings/test@example.com/SN123")
    assert response.status_code == 200
    mock_db.delete_reading.assert_called_once_with("test@example.com", "SN123")

# ==================== Meter Tests ====================

def test_add_meter(mock_db, sample_meter):
    response = client.post("/meters", json=sample_meter.dict())
    assert response.status_code == 201
    mock_db.add_meter.assert_called_once_with(sample_meter)

def test_get_meters(mock_db, sample_meter):
    mock_db.get_all_meters.return_value = [sample_meter]
    response = client.get("/meters/Biuro")
    assert response.status_code == 200
    assert len(response.json()["meters"]) == 1

# ==================== Facility Tests ====================

def test_add_facility(mock_db, sample_facility):
    response = client.post("/facilities", json=sample_facility.dict())
    assert response.status_code == 201
    mock_db.add_facility.assert_called_once_with(sample_facility)

def test_assign_facility(mock_db, sample_assignment):
    response = client.post("/facilities/assignments", json=sample_assignment.dict())
    assert response.status_code == 201
    mock_db.assign_user_to_facility.assert_called_once_with(
        sample_assignment.email, sample_assignment.facility_name
    )

# ==================== User Tests ====================

def test_add_user(mock_db, sample_user):
    response = client.post("/users", json=sample_user.dict())
    assert response.status_code == 201
    mock_db.add_user.assert_called_once_with(sample_user)

def test_block_user(mock_db):
    response = client.put("/users/test@example.com/block")
    assert response.status_code == 200
    mock_db.block_user.assert_called_once_with("test@example.com")