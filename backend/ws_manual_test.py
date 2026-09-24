import asyncio
import json
import sys

from websockets.asyncio.client import connect


async def main():
    token1 = sys.argv[1]
    token2 = sys.argv[2]
    conversation_id = sys.argv[3]

    uri1 = (
        f"ws://127.0.0.1:8000/ws/conversations/"
        f"{conversation_id}/?token={token1}"
    )

    uri2 = (
        f"ws://127.0.0.1:8000/ws/conversations/"
        f"{conversation_id}/?token={token2}"
    )

    async with connect(uri1) as user1, connect(uri2) as user2:
        print("USER 1:", await user1.recv())
        print("USER 2:", await user2.recv())

        await user1.send(
            json.dumps(
                {
                    "type": "message",
                    "message": "Hello from User 1",
                }
            )
        )

        user1_message = await user1.recv()
        user2_message = await user2.recv()

        print("USER 1 RECEIVED:", user1_message)
        print("USER 2 RECEIVED:", user2_message)

        await user2.send(
            json.dumps(
                {
                    "type": "message",
                    "message": "Hello back from User 2",
                }
            )
        )

        user2_message = await user2.recv()
        user1_message = await user1.recv()

        print("USER 2 RECEIVED:", user2_message)
        print("USER 1 RECEIVED:", user1_message)


asyncio.run(main())