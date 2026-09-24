import asyncio
import sys

from websockets.asyncio.client import connect
from websockets.exceptions import ConnectionClosed


async def main():
    token = sys.argv[1]
    conversation_id = sys.argv[2]

    uri = (
        f"ws://127.0.0.1:8000/ws/conversations/"
        f"{conversation_id}/?token={token}"
    )

    try:
        async with connect(uri) as websocket:
            print("CONNECTED")
            print("RESPONSE:", await websocket.recv())

    except ConnectionClosed as exc:
        print("CONNECTION CLOSED")
        print("CLOSE CODE:", exc.code)
        print("CLOSE REASON:", exc.reason)


asyncio.run(main())