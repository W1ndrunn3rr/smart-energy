import pytest
from pydantic import ValidationError
from app.api_models.models import APIReading, APIMeter, APIFacility, APIUser, APIAssignment, APIUserLogin

def test_api_reading_model():
    """Test APIReading model validation."""
   
    reading = APIReading(
        reading_id=1,
        value=123.5,
        reading_date="2025-05-01",
        meter_serial_number="SN123",
        email="test@example.com"
    )
    assert reading.value == 123.5
    assert reading.reading_date == "2025-05-01"
    assert reading.meter_serial_number == "SN123"
    assert reading.email == "test@example.com"
    
    # Invalid value type
    with pytest.raises(ValidationError):
        APIReading(
            value="not-a-number",
            reading_date="2025-05-01",
            meter_serial_number="SN123",
            user_email="test@example.com"
        )
    
    with pytest.raises(ValidationError):
        APIReading(
            value=123.5,
            reading_date="2025-05-01"
        )

def test_api_meter_model():
    """Test APIMeter model validation."""
    meter = APIMeter(
        serial_number="SN123",
        meter_type="elektryczny",
        facility_name="Biuro",
        ppe=None,
        multiply_factor=1.0,
        description="Opis lokalizacji" 
    )
    assert meter.serial_number == "SN123"
    assert meter.meter_type == "elektryczny"
    assert meter.facility_name == "Biuro"
    
    meter = APIMeter(
        serial_number="SN123",
        meter_type="elektryczny",
        facility_name="Biuro",
        ppe=None,
        multiply_factor=1.0,
        description=""
    )
    
    with pytest.raises(ValidationError):
        APIMeter(
            serial_number="SN123" 
        )
        

def test_api_facility_model():
    """Test APIFacility model validation."""
    # Valid facility
    facility = APIFacility(
        name="Biuro",
        address="123 Main St",
        email="facility@example.com"
    )
    assert facility.name == "Biuro"
    assert facility.address == "123 Main St"
    assert facility.email == "facility@example.com"
    
    # Missing fields
    with pytest.raises(ValidationError):
        APIFacility(
            name="Biuro"
        )

def test_api_user_model():
    """Test APIUser model validation."""
    # Valid user
    user = APIUser(
        email="user@example.com",
        password="secret123",
        access_level=2
    )
    assert user.email == "user@example.com"
    assert user.password == "secret123"
    assert user.access_level == 2
    
    # Missing fields
    with pytest.raises(ValidationError):
        APIUser(
            email="user@example.com"
        )

def test_api_assignment_model():
    """Test APIAssignment model validation."""
    # Valid assignment
    assignment = APIAssignment(
        email="user@example.com",
        facility_name="Biuro"
    )
    assert assignment.email == "user@example.com"
    assert assignment.facility_name == "Biuro"
    
    # Missing fields
    with pytest.raises(ValidationError):
        APIAssignment(
            email="user@example.com"
        )

def test_api_user_login_model():
    """Test APIUserLogin model validation."""
    # Valid login
    login = APIUserLogin(
        email="user@example.com",
        password="secret123"
    )
    assert login.email == "user@example.com"
    assert login.password == "secret123"
    
    # Missing fields
    with pytest.raises(ValidationError):
        APIUserLogin(
            email="user@example.com"
        )