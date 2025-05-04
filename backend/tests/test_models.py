import pytest
from pydantic import ValidationError
from app.api_models.models import APIReading, APIMeter, APIFacility, APIUser, APIAssignment

# ==================== API Reading Model Tests ====================

def test_api_reading_valid():
    """Test creating a valid APIReading object"""
    reading = APIReading(
        user_email="test@example.com",
        meter_serial_number="SN12345",
        value=123.45,
        unit="kWh",
        timestamp="2025-05-01T12:30:00"
    )
    assert reading.user_email == "test@example.com"
    assert reading.meter_serial_number == "SN12345"
    assert reading.value == 123.45
    assert reading.unit == "kWh"
    assert reading.timestamp == "2025-05-01T12:30:00"

def test_api_reading_invalid_email():
    """Test APIReading with invalid email format"""
    with pytest.raises(ValidationError):
        APIReading(
            user_email="invalid-email",
            meter_serial_number="SN12345",
            value=123.45,
            unit="kWh",
            timestamp="2025-05-01T12:30:00"
        )

def test_api_reading_negative_value():
    """Test APIReading with negative value"""
    with pytest.raises(ValidationError):
        APIReading(
            user_email="test@example.com",
            meter_serial_number="SN12345",
            value=-123.45,
            unit="kWh",
            timestamp="2025-05-01T12:30:00"
        )

def test_api_reading_invalid_timestamp():
    """Test APIReading with invalid timestamp format"""
    with pytest.raises(ValidationError):
        APIReading(
            user_email="test@example.com",
            meter_serial_number="SN12345",
            value=123.45,
            unit="kWh",
            timestamp="invalid-timestamp"
        )

# ==================== API Meter Model Tests ====================

def test_api_meter_valid():
    """Test creating a valid APIMeter object"""
    meter = APIMeter(
        serial_number="SN12345",
        type="electricity",
        facility_name="Office Building",
        location="Main Floor"
    )
    assert meter.serial_number == "SN12345"
    assert meter.type == "electricity"
    assert meter.facility_name == "Office Building"
    assert meter.location == "Main Floor"

def test_api_meter_empty_serial():
    """Test APIMeter with empty serial number"""
    with pytest.raises(ValidationError):
        APIMeter(
            serial_number="",
            type="electricity",
            facility_name="Office Building",
            location="Main Floor"
        )

def test_api_meter_empty_facility():
    """Test APIMeter with empty facility name"""
    with pytest.raises(ValidationError):
        APIMeter(
            serial_number="SN12345",
            type="electricity",
            facility_name="",
            location="Main Floor"
        )

# ==================== API Facility Model Tests ====================

def test_api_facility_valid():
    """Test creating a valid APIFacility object"""
    facility = APIFacility(
        name="Office Building",
        address="123 Main St",
        type="commercial",
        area=1000.0
    )
    assert facility.name == "Office Building"
    assert facility.address == "123 Main St"
    assert facility.type == "commercial"
    assert facility.area == 1000.0

def test_api_facility_empty_name():
    """Test APIFacility with empty name"""
    with pytest.raises(ValidationError):
        APIFacility(
            name="",
            address="123 Main St",
            type="commercial",
            area=1000.0
        )

def test_api_facility_negative_area():
    """Test APIFacility with negative area"""
    with pytest.raises(ValidationError):
        APIFacility(
            name="Office Building",
            address="123 Main St",
            type="commercial",
            area=-1000.0
        )

# ==================== API User Model Tests ====================

def test_api_user_valid():
    """Test creating a valid APIUser object"""
    user = APIUser(
        email="test@example.com",
        name="Test User",
        role="admin",
        phone="123-456-7890"
    )
    assert user.email == "test@example.com"
    assert user.name == "Test User"
    assert user.role == "admin"
    assert user.phone == "123-456-7890"

def test_api_user_invalid_email():
    """Test APIUser with invalid email format"""
    with pytest.raises(ValidationError):
        APIUser(
            email="invalid-email",
            name="Test User",
            role="admin",
            phone="123-456-7890"
        )

def test_api_user_empty_name():
    """Test APIUser with empty name"""
    with pytest.raises(ValidationError):
        APIUser(
            email="test@example.com",
            name="",
            role="admin",
            phone="123-456-7890"
        )

# ==================== API Assignment Model Tests ====================

def test_api_assignment_valid():
    """Test creating a valid APIAssignment object"""
    assignment = APIAssignment(
        user_email="test@example.com",
        facility_name="Office Building"
    )
    assert assignment.user_email == "test@example.com"
    assert assignment.facility_name == "Office Building"

def test_api_assignment_invalid_email():
    """Test APIAssignment with invalid email format"""
    with pytest.raises(ValidationError):
        APIAssignment(
            user_email="invalid-email",
            facility_name="Office Building"
        )

def test_api_assignment_empty_facility():
    """Test APIAssignment with empty facility name"""
    with pytest.raises(ValidationError):
        APIAssignment(
            user_email="test@example.com",
            facility_name=""
        )