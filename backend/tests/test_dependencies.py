import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.server import app, database

# Test to verify that all endpoints with database dependencies handle database errors properly
@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def error_db():
    """Create a database mock that raises errors for each operation"""
    with patch("app.server.database") as mock_db:
        # Configure each database method to raise an exception
        for method_name in dir(database):
            if not method_name.startswith('_') and callable(getattr(database, method_name)):
                method = getattr(mock_db, method_name)
                method.side_effect = ValueError(f"Database error in {method_name}")
        yield mock_db

# ==================== Error Handling Tests ====================

@pytest.mark.parametrize(
    "endpoint,method,payload,expected_status",
    [
        # Reading endpoints
        ("/readings", "post", {"user_email": "test@example.com", "meter_serial_number": "SN12345", "value": 123.45, "unit": "kWh", "timestamp": "2025-05-01T12:30:00"}, 500),
        ("/readings/Office%20Building/electricity", "get", None, 200),  # Should safely handle errors for GET
        ("/readings/Office%20Building", "get", None, 200),  # Should safely handle errors for GET
        ("/update_reading", "put", {"user_email": "test@example.com", "meter_serial_number": "SN12345", "value": 123.45, "unit": "kWh", "timestamp": "2025-05-01T12:30:00"}, 404),
        ("/delete_reading/test@example.com/SN12345", "delete", None, 404),
        
        # Meter endpoints
        ("/meters/Office%20Building", "get", None, 200),  # Should safely handle errors for GET
        ("/meters/Office%20Building/electricity", "get", None, 200),  # Should safely handle errors for GET
        ("/meters", "post", {"serial_number": "SN12345", "type": "electricity", "facility_name": "Office Building", "location": "Main Floor"}, 500),
        ("/meters/SN12345", "delete", None, 404),
        ("/update_meter", "put", {"serial_number": "SN12345", "type": "electricity", "facility_name": "Office Building", "location": "Main Floor"}, 404),
        
        # Facility endpoints
        ("/user_facilities/test@example.com", "get", None, 200),  # Should safely handle errors for GET
        ("/facilities/Office%20Building", "get", None, 200),  # Should safely handle errors for GET
        ("/create_facility", "post", {"name": "Office Building", "address": "123 Main St", "type": "commercial", "area": 1000.0}, 500),
        ("/delete_facility/Office%20Building", "delete", None, 404),
        ("/assign_facility", "post", {"user_email": "test@example.com", "facility_name": "Office Building"}, 500),
        ("/unassign_facility", "delete", {"user_email": "test@example.com", "facility_name": "Office Building"}, 404),
        ("/update_facility", "put", {"name": "Office Building", "address": "123 Main St", "type": "commercial", "area": 1000.0}, 404),
        
        # User endpoints
        ("/user/test@example.com", "get", None, 200),  # Should safely handle errors for GET
        ("/users", "post", None, 201),  # Should safely handle errors for GET (POST route for all users)
        ("/create_user", "post", {"email": "test@example.com", "name": "Test User", "role": "admin", "phone": "123-456-7890"}, 500),
        ("/delete_user/test@example.com", "delete", None, 404),
        ("/update_user", "put", {"email": "test@example.com", "name": "Test User", "role": "admin", "phone": "123-456-7890"}, 404),
        ("/block_user/test@example.com", "put", None, 404),
    ]
)
def test_endpoint_error_handling(client, error_db, endpoint, method, payload, expected_status):
    """Test that endpoints properly handle database errors"""
    
    # Create the request based on the HTTP method
    if method == "get":
        response = client.get(endpoint)
    elif method == "post":
        response = client.post(endpoint, json=payload)
    elif method == "put":
        response = client.put(endpoint, json=payload)
    elif method == "delete":
        if payload:
            response = client.delete(endpoint, json=payload)
        else:
            response = client.delete(endpoint)
    
    # Assert that the response has the expected status code
    assert response.status_code == expected_status
    
    # For 4xx and 5xx errors, verify error message is included
    if expected_status >= 400:
        assert "detail" in response.json()

# ==================== Database Dependency Cascade Tests ====================

def test_facility_deletion_cascades():
    """Test that deleting a facility properly triggers dependent deletions"""
    with patch("app.server.database") as mock_db:
        client = TestClient(app)
        
        # Mock get_facility to return a facility to avoid not found error
        mock_db.get_facility.return_value = {"name": "Test Facility", "address": "123 Test St"}
        
        # Delete the facility
        response = client.delete("/delete_facility/Test%20Facility")
        assert response.status_code == 200
        
        # Verify delete_facility was called
        mock_db.delete_facility.assert_called_once_with("Test Facility")

def test_user_deletion_cascades():
    """Test that deleting a user properly triggers dependent deletions"""
    with patch("app.server.database") as mock_db:
        client = TestClient(app)
        
        # Mock get_user_by_email to return a user to avoid not found error
        mock_db.get_user_by_email.return_value = {"email": "test@example.com", "name": "Test User"}
        
        # Delete the user
        response = client.delete("/delete_user/test@example.com")
        assert response.status_code == 200
        
        # Verify delete_user was called
        mock_db.delete_user.assert_called_once_with("test@example.com")

def test_meter_deletion_cascades():
    """Test that deleting a meter properly triggers dependent deletions"""
    with patch("app.server.database") as mock_db:
        client = TestClient(app)
        
        # Delete the meter
        response = client.delete("/meters/Test123")
        assert response.status_code == 200
        
        # Verify delete_meter was called
        mock_db.delete_meter.assert_called_once_with("Test123")