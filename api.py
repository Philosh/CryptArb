import aiohttp
import asyncio


async def fetch(url):
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=2) as response:  # Set a timeout
                if response.status == 200:
                    return await response.json()
                else:
                    return {"error": f"HTTP Error {response.status}: {response.reason}"}

    except aiohttp.ClientError as e:  # Handles connection issues
        return {"error": f"Client error: {str(e)}"}
    except asyncio.TimeoutError:
        return {"error": "Request timed out"}
    except Exception as e:  # Catches any other unexpected errors
        return {"error": f"An unexpected error occurred: {str(e)}"}
