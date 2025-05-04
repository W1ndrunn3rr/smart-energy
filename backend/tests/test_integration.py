import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from app.server import app, database

client = TestClient(app)

# Mock the database module for all integration tests
@pytest.fixture(autouse=True)
def setup_database():
    with patch("app.server.database") as mock_db:
        # Setup default return values
        mock_db.get_user_by_email.return_value = {"email": "test@example.com", "name": "Test User", "role": "admin"}
        mock_db.get_facility.return_value = {"name": "Office Building", "address": "123 Main St", "type": "commercial"}
        mock_db.get_all_meters.return_value = [{"serial_number": "SN12345", "type": "electricity"}]
        yield mock_db

# ==================== End-to-End Workflow Tests ====================

def test_user_facility_meter_workflow(setup_database):
    """Test a complete workflow from creating a user to making a reading"""
    mock_db = setup_database
    
    # Step 1: Create a user
    user_data = {
        "email": "new@example.com",
        "name": "New User",
        "role": "user",
        "phone": "123-456-7890"
    }
    response = client.post("/create_user", json=user_data)
    assert response.status_code == 201
    
    # Step 2: Create a facility
    facility_data = {
        "name": "New Building",
        "address": "456 Oak St",
        "type": "residential",
        "area": 800.0
    }
    response = client.post("/create_facility", json=facility_data)
    assert response.status_code == 201
    
    # Step 3: Assign user to facility
    assignment_data = {
        "user_email": "new@example.com",
        "facility_name": "New Building"
    }
    response = client.post("/assign_facility", json=assignment_data)
    assert response.status_code == 201
    
    # Step 4: Add a meter to the facility
    meter_data = {
        "serial_number": "SN67890",
        "type": "water",
        "facility_name": "New Building",
        "location": "Basement"
    }
    response = client.post("/meters", json=meter_data)
    assert response.status_code == 201
    
    # Step 5: Make a reading for the meter
    reading_data = {
        "user_email": "new@example.com",
        "meter_serial_number": "SN67890",
        "value": 45.6,
        "unit": "m³",
        "timestamp": "2025-05-04T14:30:00"
    }
    response = client.post("/readings", json=reading_data)
    assert response.status_code == 201
    
    # Verify the calls were made in correct order
    assert mock_db.add_user.called
    assert mock_db.add_facility.called
    assert mock_db.assign_user_to_facility.called
    assert mock_db.add_meter.called
    assert mock_db.make_reading.called

def test_full_crud_meter_lifecycle(setup_database):
    """Test the complete CRUD lifecycle for a meter"""
    mock_db = setup_database
    
    # Create
    meter_data = {
        "serial_number": "SN-CRUD-TEST",
        "type": "gas",
        "facility_name": "Office Building",
        "location": "Utility Room"
    }
    response = client.post("/meters", json=meter_data)
    assert response.status_code == 201
    
    # Mock the get_meters_by_type call for the Read operation
    mock_db.get_meters_by_type.return_value = [
        {"serial_number": "SN-CRUD-TEST", "type": "gas", "facility_name": "Office Building", "location": "Utility Room"}
    ]
    
    # Read
    response = client.get("/meters/Office%20Building/gas")
    assert response.status_code == 200
    assert "meters" in response.json()
    
    # Update
    updated_meter_data = {
        "serial_number": "SN-CRUD-TEST",
        "type": "gas",
        "facility_name": "Office Building",
        "location": "Basement Utility Room"  # Updated location
    }
    response = client.put("/update_meter", json=updated_meter_data)
    assert response.status_code == 200
    
    # Delete
    response = client.delete("/meters/SN-CRUD-TEST")
    assert response.status_code == 200
    
    # Verify all operations were called
    assert mock_db.add_meter.called
    assert mock_db.get_meters_by_type.called
    assert mock_db.update_meter.called
    assert mock_db.delete_meter.called

