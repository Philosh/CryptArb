import asyncio
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app import PollService

pollService = PollService()


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(pollService.poll_data())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        print("Polling task stopped gracefully.")


app = FastAPI(lifespan=lifespan)

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
    return pollService.price_delta


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
