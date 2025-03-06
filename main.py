import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List


class Interval(BaseModel):
    interval: int


app = FastAPI()

origins = ["http://localhost:3000"]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

interval = {"interval": 3}


@app.get(path="/arb", response_model=Interval)
def get_interval():
    return Interval(interval=-1)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
