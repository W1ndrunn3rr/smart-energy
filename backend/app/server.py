from fastapi import FastAPI
import uvicorn
import os
from app.database import db_client

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

app = FastAPI()
database = db_client.DataBase(url,key)

@app.get("/")
def root():
    return {"root": "root"}

@app.get("/get_user/{user_id}")
def get_user(user_id : int):
    return {"user" : database.get_user(user_id)}


def start():
    uvicorn.run("app.server:app", host="0.0.0.0", port=8000, reload=True)
