import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.server import app
from app.api_models.models import APIReading, APIMeter, APIFacility, APIUser, APIAssignment

client = TestClient(app)

# ==================== Fixtures ====================

@pytest.fixture
def mock_db():
    """Create a mock database client"""
    with patch("app.server.database") as mock:
        yield mock

@pytest.fixture
def sample_reading():
    """Sample reading data"""
    return {
        "user_email": "test@example.com",
        "meter_serial_number": "SN12345",
        "value": 123.45,
        "unit": "kWh",
        "timestamp": "2025-05-01T12:30:00"
    }

@pytest.fixture
def sample_meter():
    """Sample meter data"""
    return {
        "serial_number": "SN12345",
        "type": "electricity",
        "facility_name": "Office Building",
        "location": "Main Floor"
    }

@pytest.fixture
def sample_facility():
    """Sample facility data"""
    return {
        "name": "Office Building",
        "address": "123 Main St",
        "type": "commercial",
        "area": 1000.0
    }

@pytest.fixture
def sample_user():
    """Sample user data"""
    return {
        "email": "test@example.com",
        "name": "Test User",
        "role": "admin",
        "phone": "123-456-7890"
    }

@pytest.fixture
def sample_assignment():
    """Sample facility assignment data"""
    return {
        "user_email": "test@example.com",
        "facility_name": "Office Building"
    }

# ==================== Root Endpoint Tests ====================

def test_root():
    """Test the root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "Smart Energy API is running"}

# ==================== Reading Tests ====================

def test_create_reading(mock_db, sample_reading):
    """Test creating a new reading"""
    response = client.post("/readings", json=sample_reading)
    assert response.status_code == 201
    mock_db.make_reading.assert_called_once()
    assert "message" in response.json()
    assert "reading" in response.json()

def test_get_readings_by_type(mock_db):
    """Test getting readings by facility and meter type"""
    mock_db.get_readings.return_value = [{"value": 123.45, "timestamp": "2025-05-01T12:30:00"}]
    
    response = client.get("/readings/Office%20Building/electricity")
    assert response.status_code == 200
    assert "readings" in response.json()
    mock_db.get_readings.assert_called_once_with("Office Building", "electricity")

def test_get_readings_by_type_empty(mock_db):
    """Test getting readings when none exist"""
    mock_db.get_readings.return_value = []
    
    response = client.get("/readings/Office%20Building/electricity")
    assert response.status_code == 200
    assert response.json() == {"message": "No readings found"}

def test_get_all_readings(mock_db):
    """Test getting all readings for a facility"""
    mock_db.get_readings.return_value = [{"value": 123.45, "timestamp": "2025-05-01T12:30:00"}]
    
    response = client.get("/readings/Office%20Building")
    assert response.status_code == 200
    assert "readings" in response.json()
    mock_db.get_readings.assert_called_once_with("Office Building")

def test_update_reading(mock_db, sample_reading):
    """Test updating a reading"""
    response = client.put("/update_reading", json=sample_reading)
    assert response.status_code == 200
    mock_db.update_reading.assert_called_once()
    assert response.json() == {"message": "Reading updated successfully"}

def test_update_reading_not_found(mock_db, sample_reading):
    """Test updating a non-existent reading"""
    mock_db.update_reading.side_effect = ValueError("Reading not found")
    
    response = client.put("/update_reading", json=sample_reading)
    assert response.status_code == 404
    assert "detail" in response.json()

def test_delete_reading(mock_db):
    """Test deleting a reading"""
    response = client.delete("/delete_reading/test@example.com/SN12345")
    assert response.status_code == 200
    mock_db.delete_reading.assert_called_once_with("test@example.com", "SN12345")
    assert response.json() == {"message": "Reading deleted successfully"}

def test_delete_reading_not_found(mock_db):
    """Test deleting a non-existent reading"""
    mock_db.delete_reading.side_effect = ValueError("Reading not found")
    
    response = client.delete("/delete_reading/test@example.com/SN12345")
    assert response.status_code == 404
    assert "detail" in response.json()

# ==================== Meter Tests ====================

def test_get_meters(mock_db):
    """Test getting all meters for a facility"""
    mock_db.get_all_meters.return_value = [{"serial_number": "SN12345", "type": "electricity"}]
    
    response = client.get("/meters/Office%20Building")
    assert response.status_code == 200
    assert "meters" in response.json()
    mock_db.get_all_meters.assert_called_once_with("Office Building")

def test_get_meters_empty(mock_db):
    """Test getting meters when none exist"""
    mock_db.get_all_meters.return_value = []
    
    response = client.get("/meters/Office%20Building")
    assert response.status_code == 200
    assert response.json() == {"message": "No meters found"}

def test_get_meters_by_type(mock_db):
    """Test getting meters by type"""
    mock_db.get_meters_by_type.return_value = [{"serial_number": "SN12345", "type": "electricity"}]
    
    response = client.get("/meters/Office%20Building/electricity")
    assert response.status_code == 200
    assert "meters" in response.json()
    mock_db.get_meters_by_type.assert_called_once_with("Office Building", "electricity")

def test_create_meter(mock_db, sample_meter):
    """Test creating a new meter"""
    response = client.post("/meters", json=sample_meter)
    assert response.status_code == 201
    mock_db.add_meter.assert_called_once()
    assert "message" in response.json()
    assert "meter" in response.json()

def test_delete_meter(mock_db):
    """Test deleting a meter"""
    response = client.delete("/meters/SN12345")
    assert response.status_code == 200
    mock_db.delete_meter.assert_called_once_with("SN12345")
    assert response.json() == {"message": "Meter deleted successfully"}

def test_delete_meter_not_found(mock_db):
    """Test deleting a non-existent meter"""
    mock_db.delete_meter.side_effect = ValueError("Meter not found")
    
    response = client.delete("/meters/SN12345")
    assert response.status_code == 404
    assert "detail" in response.json()

def test_update_meter(mock_db, sample_meter):
    """Test updating a meter"""
    response = client.put("/update_meter", json=sample_meter)
    assert response.status_code == 200
    mock_db.update_meter.assert_called_once()
    assert response.json() == {"message": "Meter updated successfully"}

def test_update_meter_not_found(mock_db, sample_meter):
    """Test updating a non-existent meter"""
    mock_db.update_meter.side_effect = ValueError("Meter not found")
    
    response = client.put("/update_meter", json=sample_meter)
    assert response.status_code == 404
    assert "detail" in response.json()

# ==================== Facility Tests ====================

def test_get_user_facilities(mock_db):
    """Test getting all facilities for a user"""
    mock_db.get_all_user_facilities.return_value = [{"name": "Office Building", "type": "commercial"}]
    
    response = client.get("/user_facilities/test@example.com")
    assert response.status_code == 200
    assert "facilities" in response.json()
    mock_db.get_all_user_facilities.assert_called_once_with("test@example.com")

def test_get_user_facilities_empty(mock_db):
    """Test getting user facilities when none exist"""
    mock_db.get_all_user_facilities.return_value = []
    
    response = client.get("/user_facilities/test@example.com")
    assert response.status_code == 200
    assert response.json() == {"message": "No facilities found"}

def test_get_facility(mock_db):
    """Test getting a facility by name"""
    mock_db.get_facility.return_value = {"name": "Office Building", "type": "commercial"}
    
    response = client.get("/facilities/Office%20Building")
    assert response.status_code == 200
    assert "facility" in response.json()
    mock_db.get_facility.assert_called_once_with("Office Building")

def test_get_facility_not_found(mock_db):
    """Test getting a non-existent facility"""
    mock_db.get_facility.return_value = None
    
    response = client.get("/facilities/Office%20Building")
    assert response.status_code == 200
    assert response.json() == {"message": "Facility not found"}

def test_create_facility(mock_db, sample_facility):
    """Test creating a new facility"""
    response = client.post("/create_facility", json=sample_facility)
    assert response.status_code == 201
    mock_db.add_facility.assert_called_once()
    assert "message" in response.json()
    assert "facility" in response.json()

def test_delete_facility(mock_db):
    """Test deleting a facility"""
    response = client.delete("/delete_facility/Office%20Building")
    assert response.status_code == 200
    mock_db.delete_facility.assert_called_once_with("Office Building")
    assert response.json() == {"message": "Facility deleted successfully"}

def test_delete_facility_not_found(mock_db):
    """Test deleting a non-existent facility"""
    mock_db.delete_facility.side_effect = ValueError("Facility not found")
    
    response = client.delete("/delete_facility/Office%20Building")
    assert response.status_code == 404
    assert "detail" in response.json()

def test_assign_facility(mock_db, sample_assignment):
    """Test assigning a facility to a user"""
    response = client.post("/assign_facility", json=sample_assignment)
    assert response.status_code == 201
    # Check that the assignment was passed correctly to the database client
    # The *assignment spread in the code suggests it expects multiple arguments
    mock_db.assign_user_to_facility.assert_called_once()
    assert "message" in response.json()
    assert "assignment" in response.json()

def test_unassign_facility(mock_db, sample_assignment):
    """Test unassigning a facility from a user"""
    response = client.delete("/unassign_facility", json=sample_assignment)
    assert response.status_code == 200
    mock_db.remove_user_from_facility.assert_called_once()
    assert response.json() == {"message": "Facility unassigned successfully"}

def test_unassign_facility_not_found(mock_db, sample_assignment):
    """Test unassigning a non-existent facility assignment"""
    mock_db.remove_user_from_facility.side_effect = ValueError("Assignment not found")
    
    response = client.delete("/unassign_facility", json=sample_assignment)
    assert response.status_code == 404
    assert "detail" in response.json()

def test_update_facility(mock_db, sample_facility):
    """Test updating a facility"""
    response = client.put("/update_facility", json=sample_facility)
    assert response.status_code == 200
    mock_db.update_facility.assert_called_once()
    assert response.json() == {"message": "Facility updated successfully"}

def test_update_facility_not_found(mock_db, sample_facility):
    """Test updating a non-existent facility"""
    mock_db.update_facility.side_effect = ValueError("Facility not found")
    
    response = client.put("/update_facility", json=sample_facility)
    assert response.status_code == 404
    assert "detail" in response.json()

# ==================== User Tests ====================

def test_get_user(mock_db):
    """Test getting a user by email"""
    mock_db.get_user_by_email.return_value = {"email": "test@example.com", "name": "Test User"}
    
    response = client.get("/user/test@example.com")
    assert response.status_code == 200
    assert "user" in response.json()
    mock_db.get_user_by_email.assert_called_once_with("test@example.com")

def test_get_user_not_found(mock_db):
    """Test getting a non-existent user"""
    mock_db.get_user_by_email.return_value = None
    
    response = client.get("/user/test@example.com")
    assert response.status_code == 200
    assert response.json() == {"message": "User not found"}

def test_get_all_users(mock_db):
    """Test getting all users"""
    mock_db.get_all_users.return_value = [{"email": "test@example.com", "name": "Test User"}]
    
    # Note: In the original code this was a POST endpoint which is unusual
    response = client.post("/users")
    assert response.status_code == 201
    assert "users" in response.json()
    mock_db.get_all_users.assert_called_once()

def test_get_all_users_empty(mock_db):
    """Test getting all users when none exist"""
    mock_db.get_all_users.return_value = []
    
    response = client.post("/users")
    assert response.status_code == 201
    assert response.json() == {"message": "No users found"}

def test_create_user(mock_db, sample_user):
    """Test creating a new user"""
    response = client.post("/create_user", json=sample_user)
    assert response.status_code == 201
    mock_db.add_user.assert_called_once()
    assert "message" in response.json()
    assert "user" in response.json()

def test_delete_user(mock_db):
    """Test deleting a user"""
    response = client.delete("/delete_user/test@example.com")
    assert response.status_code == 200
    mock_db.delete_user.assert_called_once_with("test@example.com")
    assert response.json() == {"message": "User deleted successfully"}

def test_delete_user_not_found(mock_db):
    """Test deleting a non-existent user"""
    mock_db.delete_user.side_effect = ValueError("User not found")
    
    response = client.delete("/delete_user/test@example.com")
    assert response.status_code == 404
    assert "detail" in response.json()

def test_update_user(mock_db, sample_user):
    """Test updating a user"""
    response = client.put("/update_user", json=sample_user)
    assert response.status_code == 200
    mock_db.update_user.assert_called_once()
    assert response.json() == {"message": "User updated successfully"}

def test_update_user_not_found(mock_db, sample_user):
    """Test updating a non-existent user"""
    mock_db.update_user.side_effect = ValueError("User not found")
    
    response = client.put("/update_user", json=sample_user)
    assert response.status_code == 404
    assert "detail" in response.json()

def test_block_user(mock_db):
    """Test blocking a user"""
    response = client.put("/block_user/test@example.com")
    assert response.status_code == 200
    mock_db.block_user.assert_called_once_with("test@example.com")
    assert response.json() == {"message": "User blocked successfully"}

def test_block_user_not_found(mock_db):
    """Test blocking a non-existent user"""
    mock_db.block_user.side_effect = ValueError("User not found")
    
    response = client.put("/block_user/test@example.com")
    assert response.status_code == 404
    assert "detail" in response.json()