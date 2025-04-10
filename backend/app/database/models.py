from pydantic import BaseModel
from typing import Optional

class User(BaseModel):
    user_id : int
    email : str
    password : str
    role :str