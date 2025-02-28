from fastapi import FastAPI
import uvicorn

app = FastAPI()


@app.get("/")
def root():
    return {"root": "root"}


def start():
    uvicorn.run("app.server:app", host="0.0.0.0", port=8000, reload=True)
