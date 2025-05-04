import pytest
from pydantic import ValidationError
from app.api_models.models import APIReading, APIMeter, APIFacility, APIUser, APIAssignment

def test_reading_model():

    reading = APIReading(
        value=123.5,
        reading_date="2025-05-01",
        meter_serial_number="SN123",
        email="test@example.com"
    )
    assert reading.value == 123.5
    
    with pytest.raises(ValidationError):
        APIReading(
            value=123.5,
            reading_date="2025-05-01",
            meter_serial_number="SN123",
            email="invalid"
        )

def test_meter_model():
    meter = APIMeter(
        serial_number="SN123",
        meter_type="elektryczny",
        facility_name="Biuro"
    )
    assert meter.meter_type == "elektryczny"
    

    with pytest.raises(ValidationError):
        APIMeter(
            serial_number="",
            meter_type="elektryczny",
            facility_name="Biuro"
        )

def test_facility_model():

    facility = APIFacility(
        name="Biuro",
        address="123 Main St",
        email="test@example.com"
    )
    assert facility.name == "Biuro"
    
    with pytest.raises(ValidationError):
        APIFacility(
            name="Biuro",
            address="123 Main St",
            email="invalid"
        )

def test_user_model():

    user = APIUser(
        email="test@example.com",
        password="haslo123",
        access_level=2
    )
    assert user.access_level == 2
    
    # Invalid access level
    with pytest.raises(ValidationError):
        APIUser(
            email="test@example.com",
            password="haslo123",
            access_level=-1
        )

def test_assignment_model():
    # Valid assignment
    assignment = APIAssignment(
        email="test@example.com",
        facility_name="Biuro"
    )
    assert assignment.facility_name == "Biuro"
    
    # Missing facility name
    with pytest.raises(ValidationError):
        APIAssignment(
            email="test@example.com",
            facility_name=""
        )