import asyncio
import json

from websockets.asyncio.client import connect


async def main():
    async with connect("ws://127.0.0.1:8000/ws/") as ws:
        print(await ws.recv())

        await ws.send(json.dumps({"type": "ping"}))

        print(await ws.recv())


asyncio.run(main())
