from pydantic import BaseModel
from typing import Optional

class APIReading(BaseModel):
    value: float
    reading_date: str
    meter_serial_number: str
    email: str

class APIMeter(BaseModel):
    serial_number: str
    meter_type: str
    facility_name: str
    ppe: Optional[str]
    multiply_factor: float

class APIFacility(BaseModel):
    name: str
    address: str
    email: str

class APIAssignment(BaseModel):
    email: str
    facility_name: str

class APIUser(BaseModel):
    email: str
    password: str
    access_level: int

class APIUserLogin(BaseModel):
    email: str
    password: str