from pydantic import BaseModel
import datetime
from typing import Optional

class User(BaseModel):
    user_id : int
    email : str
    password : str
    access_level :int
    
class Facility(BaseModel):
    facility_id : int
    name : str
    adress : str
    email : str

class Assignment(BaseModel):
    assignment_id : int
    user_id : int
    facility_id : int

class Meters(BaseModel):
    meter_id : int
    serial_number : str
    meter_type : str
    facility_id : int

class Readings(BaseModel):
    reading_id : int
    value : float
    reading_date : str
    meter_id : int
    user_id : int