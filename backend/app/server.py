from fastapi import FastAPI, HTTPException, status
import uvicorn
from typing import Dict, List, Any, Optional

from app.database import db_client
from app.api_models.models import *

app = FastAPI(
    title="Smart Energy API",
    description="API for managing energy readings and meters",
    version="1.0.0"
)

database = db_client.DataBase()

# ==================== Root Endpoint ====================

@app.get("/", tags=["Root"])
def root() -> Dict[str, str]:
    """Root endpoint to check API availability."""
    return {"status": "Smart Energy API is running"}

# ==================== Reading Endpoints ====================

@app.get("/readings/{facility_name}", tags=["Readings"])
def get_all_readings(facility_name: str) -> Dict[str, Any]:
    """Get all readings for a facility."""
    readings = database.get_readings(facility_name)
    if readings:
        return {"readings": readings}
    return {"message": "No readings found"}

@app.get("/readings/{facility_name}/{meter_type}", tags=["Readings"])
def get_readings_by_type(facility_name: str, meter_type: str) -> Dict[str, Any]:
    """Get readings for a specific facility and meter type."""
    readings = database.get_readings(facility_name, meter_type)
    if readings:
        return {"readings": readings}
    return {"message": "No readings found"}

@app.post("/create_reading", tags=["Readings"], status_code=status.HTTP_201_CREATED)
def create_reading(reading: APIReading) -> Dict[str, Any]:
    """Create a new meter reading."""
    try:
        database.make_reading(reading)
        return {"message": "Reading created successfully", "reading": reading}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@app.delete("/delete_reading/{user_email}/{meter_serial_number}", tags=["Readings"], status_code=status.HTTP_200_OK)
def delete_reading(user_email: str, meter_serial_number: str) -> Dict[str, str]:
    """Delete a reading by user email and meter serial number."""
    try:
        database.delete_reading(user_email, meter_serial_number)
        return {"message": "Reading deleted successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@app.put("/update_reading", tags=["Readings"], status_code=status.HTTP_200_OK)
def update_reading(reading: APIReading) -> Dict[str, str]:
    """Update a reading's information."""
    try:
        database.update_reading(reading)
        return {"message": "Reading updated successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

# ==================== Meter Endpoints ====================

@app.get("/meters/{facility_name}", tags=["Meters"])
def get_meters(facility_name: str) -> Dict[str, Any]:
    """Get all meters for a facility."""
    try:
        meters = database.get_all_meters(facility_name)
        if meters:
            return {"meters": meters}
        return {"message": "No meters found"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@app.get("/meters/{facility_name}/{meter_type}", tags=["Meters"], )
def get_meters_by_type(facility_name: str, meter_type: str) -> Dict[str, Any]:
    """Get meters of a specific type for a facility."""
    try:
        meters = database.get_meters_by_type(facility_name, meter_type)
        if meters:
            return {"meters": meters}
        return {"message": "No meters found"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@app.post("/create_meter", tags=["Meters"], status_code=status.HTTP_201_CREATED)
def create_meter(meter: APIMeter) -> Dict[str, Any]:
    """Add a new meter."""
    try:
        database.add_meter(meter)
        return {"message": "Meter created successfully", "meter": meter}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@app.delete("/delete_meter/{serial_number}", tags=["Meters"], status_code=status.HTTP_200_OK)
def delete_meter(serial_number: str) -> Dict[str, str]:
    """Delete a meter by serial number."""
    try:
        database.delete_meter(serial_number)
        return {"message": "Meter deleted successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@app.put("/update_meter", tags=["Meters"], status_code=status.HTTP_200_OK)
def update_meter(meter: APIMeter) -> Dict[str, str]:
    """Update a meter's information."""
    try:
        database.update_meter(meter)
        return {"message": "Meter updated successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

# ==================== Facilities Endpoints ====================

@app.get("/facility/{name}", tags=["Facilities"])
def get_facility(name: str) -> Dict[str, Any]:
    """Get a facility by name."""
    try:
        facility = database.get_facility(name)
        return {"facility": facility}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@app.get("/facilities", tags=["Facilities"])
def get_all_facilities() -> Dict[str, Any]:
    """Get all facilities."""
    facilities = database.get_all_facilities()
    if facilities:
        return {"facilities": facilities}
    return {"message": "No facilities found"}

@app.get("/facilities/user/{email}", tags=["Facilities"])
def get_user_facilities(email: str) -> Dict[str, Any]:
    """Get all facilities for a user."""
    try:
        facilities = database.get_all_user_facilities(email)
        if facilities:
            return {"facilities": facilities}
        return {"message": "No facilities found"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@app.post("/create_facility", tags=["Facilities"], status_code=status.HTTP_201_CREATED)
def create_facility(facility: APIFacility) -> Dict[str, Any]:
    """Create a new facility."""
    try:
        database.add_facility(facility)
        return {"message": "Facility created successfully", "facility": facility}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@app.post("/facilities/assignments", tags=["Facilities"], status_code=status.HTTP_201_CREATED)
def assign_facility(assignment: APIAssignment) -> Dict[str, Any]:
    """Assign a facility to a user."""
    try:
        database.assign_user_to_facility(assignment.user_email, assignment.facility_name)
        return {"message": "Facility assigned successfully", "assignment": assignment}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@app.delete("/facilities/{facility_name}", tags=["Facilities"], status_code=status.HTTP_200_OK)
def delete_facility(facility_name: str) -> Dict[str, str]:
    """Delete a facility by name."""
    try:
        database.delete_facility(facility_name)
        return {"message": "Facility deleted successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@app.delete("/facilities/unassignments", tags=["Facilities"], status_code=status.HTTP_200_OK)
def unassign_facility(assignment: APIAssignment) -> Dict[str, str]:
    """Unassign a facility from a user."""
    try:
        database.remove_user_from_facility(assignment.user_email, assignment.facility_name)
        return {"message": "Facility unassigned successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@app.put("/update_facility", tags=["Facilities"], status_code=status.HTTP_200_OK)
def update_facility(facility: APIFacility) -> Dict[str, str]:
    """Update a facility's information."""
    try:
        database.update_facility(facility)
        return {"message": "Facility updated successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

# ==================== User Endpoints ====================

@app.get("/users/{email}", tags=["Users"])
def get_user(email: str) -> Dict[str, Any]:
    """Get a user by email."""
    try:
        user = database.get_user_by_email(email)
        return {"user": {
            "email": user.email,
            "access_level": user.access_level,
        }}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@app.get("/users", tags=["Users"])
def get_all_users() -> Dict[str, Any]:
    """Get all users."""
    users = database.get_all_users()
    if users:
        return {"users": [
            {
                "email": user.email,
                "access_level": user.access_level,
            }
                    for user in users
        ]}
    return {"message": "No users found"}

@app.post("/create_user", tags=["Users"], status_code=status.HTTP_201_CREATED)
def create_user(user: APIUser) -> Dict[str, Any]:
    """Create a new user."""
    try:
        database.add_user(user)
        return {"message": "User created successfully", "user": user}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@app.delete("/users/{email}", tags=["Users"], status_code=status.HTTP_200_OK)
def delete_user(email: str) -> Dict[str, str]:
    """Delete a user by email."""
    try:
        database.delete_user(email)
        return {"message": "User deleted successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@app.put("/update_user", tags=["Users"], status_code=status.HTTP_200_OK)
def update_user(user: APIUser) -> Dict[str, str]:
    """Update a user's information."""
    try:
        database.update_user(user)
        return {"message": "User updated successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@app.put("/users/{email}/block", tags=["Users"], status_code=status.HTTP_200_OK)
def block_user(email: str) -> Dict[str, str]:
    """Block a user by email."""
    try:
        database.block_user(email)
        return {"message": "User blocked successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

# ==================== Authentication Endpoints ====================
@app.post("/login", tags=["Authentication"], status_code=status.HTTP_200_OK)
def login(user_data: APIUserLogin) -> Dict[str, Any]:
    """Authenticate a user."""
    try:
        user = database.login_user(user_data.email, user_data.password)
        if not user:
            return {"message": "Invalid credentials", "user": None}
        return {"message": "Login successful", "user": user}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )

# ==================== Server Startup ====================

def start() -> None:
    """Start the FastAPI server."""
    uvicorn.run("app.server:app", host="0.0.0.0", port=8080, reload=True)

if __name__ == "__main__":
    start()