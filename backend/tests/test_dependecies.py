import pytest
from fastapi.testclient import TestClient
from app.server import app
from app.api_models.models import APIReading, APIMeter, APIFacility, APIUser, APIAssignment

@pytest.fixture
def client():
    return TestClient(app)

@pytest.mark.parametrize("endpoint,method,payload,expected_status", [
    ("/readings", "post", APIReading(
        value=123.5,
        reading_date="2025-05-01",
        meter_serial_number="SN123",
        email="test@example.com"
    ).dict(), 500),
    ("/readings/Office", "get", None, 200),
    ("/meters", "post", APIMeter(
        serial_number="SN123",
        meter_type="elektryczny",
        facility_name="Biuro"
    ).dict(), 500),
    ("/facilities", "post", APIFacility(
        name="Biuro",
        address="123 Main St",
        email="test@example.com"
    ).dict(), 500),
    ("/users", "post", APIUser(
        email="test@example.com",
        password="haslo123",
        access_level=2
    ).dict(), 500),
])
def test_error_handling(client, endpoint, method, payload, expected_status, monkeypatch):
    # Monkeypatch database methods to raise errors
    def mock_error(*args, **kwargs):
        raise ValueError("Database error")
    
    monkeypatch.setattr("app.server.database.make_reading", mock_error)
    monkeypatch.setattr("app.server.database.add_meter", mock_error)
    monkeypatch.setattr("app.server.database.add_facility", mock_error)
    monkeypatch.setattr("app.server.database.add_user", mock_error)
    
    if method == "post":
        response = client.post(endpoint, json=payload)
    elif method == "get":
        response = client.get(endpoint)
    
    assert response.status_code == expected_status
    if expected_status >= 400:
        assert "detail" in response.json()