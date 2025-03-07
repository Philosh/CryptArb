import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import calculate_price_delta

app = FastAPI()

origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get(path="/arb")
async def get_price_delta():

    price_delta = await calculate_price_delta()
    return price_delta


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
