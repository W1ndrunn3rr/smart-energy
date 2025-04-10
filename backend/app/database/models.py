from pydantic import BaseModel
from typing import Optional

class User(BaseModel):
    user_id : int
    email : str
    password : str
    role :str
    
class Facility(BaseModel):
    facility_id : int
    name : str
    adress : str
    email : str
