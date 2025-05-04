import pytest
import time
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.server import app

# ==================== Performance Test Fixtures ====================

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def performance_db():
    """Set up a database mock with delayed responses to simulate performance issues"""
    with patch("app.server.database") as mock_db:
        # Mock data for different endpoints
        mock_db.get_readings.side_effect = lambda *args, **kwargs: time.sleep(0.01) or [{"value": 123.45, "timestamp": "2025-05-01T12:30:00"}]
        mock_db.get_all_meters.side_effect = lambda *args, **kwargs: time.sleep(0.01) or [{"serial_number": "SN12345", "type": "electricity"}]
        mock_db.get_facility.side_effect = lambda *args, **kwargs: time.sleep(0.01) or {"name": "Office Building", "type": "commercial"}
        mock_db.get_user_by_email.side_effect = lambda *args, **kwargs: time.sleep(0.01) or {"email": "test@example.com", "name": "Test User"}
        mock_db.get_all_users.side_effect = lambda *args, **kwargs: time.sleep(0.01) or [{"email": "test@example.com", "name": "Test User"}]
        yield mock_db

# ==================== Performance Tests ====================

@pytest.mark.parametrize(
    "endpoint,method,payload",
    [
        # Reading endpoints
        ("/readings/Office%20Building", "get", None),
        ("/readings/Office%20Building/electricity", "get", None),
        ("/readings", "post", {"user_email": "test@example.com", "meter_serial_number": "SN12345", "value": 123.45, "unit": "kWh", "timestamp": "2025-05-01T12:30:00"}),
        
        # Meter endpoints
        ("/meters/Office%20Building", "get", None),
        ("/meters/Office%20Building/electricity", "get", None),
        ("/meters", "post", {"serial_number": "SN12345", "type": "electricity", "facility_name": "Office Building", "location": "Main Floor"}),
        
        # Facility endpoints
        ("/user_facilities/test@example.com", "get", None),
        ("/facilities/Office%20Building", "get", None),
        ("/create_facility", "post", {"name": "Office Building", "address": "123 Main St", "type": "commercial", "area": 1000.0}),
        
        # User endpoints
        ("/user/test@example.com", "get", None),
        ("/users", "post", None),
        ("/create_user", "post", {"email": "test@example.com", "name": "Test User", "role": "admin", "phone": "123-456-7890"}),
    ]
)
def test_endpoint_performance(client, performance_db, endpoint, method, payload):
    """Test that endpoints respond within acceptable time limits"""
    # Define acceptable response time (in seconds)
    MAX_RESPONSE_TIME = 0.1
    
    # Measure response time
    start_time = time.time()
    
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
    
    end_time = time.time()
    response_time = end_time - start_time
    
    # Assert response is successful
    assert response.status_code < 500
    
    # Assert response time is within acceptable limits
    assert response_time < MAX_RESPONSE_TIME, f"Endpoint {endpoint} exceeded maximum response time ({response_time:.3f}s > {MAX_RESPONSE_TIME}s)"

# Test for excessive database calls
@pytest.mark.parametrize(
    "endpoint,method,payload,max_db_calls",
    [
        # Reading endpoints - should only make necessary DB calls
        ("/readings/Office%20Building", "get", None, 2),  # Get facility + get readings
        ("/readings/Office%20Building/electricity", "get", None, 2),  # Get facility + get readings by type
        
        # Meter endpoints
        ("/meters/Office%20Building", "get", None, 2),  # Get facility + get meters
        ("/meters/Office%20Building/electricity", "get", None, 2),  # Get facility + get meters by type
        
        # Facility endpoints
        ("/user_facilities/test@example.com", "get", None, 2),  # Get user + get facilities
        ("/facilities/Office%20Building", "get", None, 1),  # Get facility only
        
        # User endpoints
        ("/user/test@example.com", "get", None, 1),  # Get user only
    ]
)
def test_efficient_database_calls(client, endpoint, method, payload, max_db_calls):
    """Test that endpoints don't make excessive database calls"""
    with patch("app.server.database") as mock_db:
        # Set up method returns to avoid errors
        mock_db.get_readings.return_value = [{"value": 123.45, "timestamp": "2025-05-01T12:30:00"}]
        mock_db.get_all_meters.return_value = [{"serial_number": "SN12345", "type": "electricity"}]
        mock_db.get_meters_by_type.return_value = [{"serial_number": "SN12345", "type": "electricity"}]
        mock_db.get_facility.return_value = {"name": "Office Building", "type": "commercial"}
        mock_db.get_all_user_facilities.return_value = [{"name": "Office Building", "type": "commercial"}]
        mock_db.get_user_by_email.return_value = {"email": "test@example.com", "name": "Test User"}
        
        # Create the request based on the HTTP method
        if method == "get":
            response = client.get(endpoint)
        elif method == "post":
            response = client.post(endpoint, json=payload)
        
        # Count the total number of calls to all database methods
        total_calls = 0
        for name, mock_method in [(name, getattr(mock_db, name)) for name in dir(mock_db) if callable(getattr(mock_db, name)) and not name.startswith('_')]:
            total_calls += mock_method.call_count
        
        # Assert that we don't exceed the maximum number of DB calls
        assert total_calls <= max_db_calls, f"Endpoint {endpoint} made excessive database calls ({total_calls} > {max_db_calls})"

# Test the behavior under high load with many database interactions
def test_bulk_operations():
    """Test the API can handle bulk operations efficiently"""
    with patch("app.server.database") as mock_db:
        client = TestClient(app)
        
        # Create many users in bulk
        users = [
            {"email": f"user{i}@example.com", "name": f"User {i}", "role": "user", "phone": f"555-555-{i:04d}"}
            for i in range(100)
        ]
        
        # Measure time to process all users
        start_time = time.time()
        
        for user in users:
            response = client.post("/create_user", json=user)
            assert response.status_code == 201
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Check that the average time per request is reasonable
        avg_time = total_time / len(users)
        assert avg_time < 0.01, f"Average time per user creation too high: {avg_time:.4f}s"
        
        # Verify database was called the expected number of times
        assert mock_db.add_user.call_count == 100