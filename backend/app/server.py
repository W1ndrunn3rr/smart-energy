from fastapi import FastAPI
import uvicorn
from app.database import db_client

app = FastAPI()
database = db_client.DataBase()

@app.get("/")
def root():
    return {"root": "root"}

@app.get("/users/{user_id}")
def get_user(user_id: int):
    database.execute_query(f"SELECT * FROM Users WHERE user_id = {user_id}")
    return {"user_id": user_id}
def start():
    uvicorn.run("app.server:app", host="0.0.0.0", port=8080, reload=True)
