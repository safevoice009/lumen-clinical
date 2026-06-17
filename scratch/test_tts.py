import asyncio
import edge_tts
import os

async def main():
    os.makedirs("audio", exist_ok=True)
    text = "Hello, I am Dr. Baddam Sucharith Reddy. Welcome to the product demonstration of Lumen Odysseus, a state-of-the-art multi-agent clinical AI safety certification workstation."
    try:
        communicate = edge_tts.Communicate(text, "en-US-AndrewNeural")
        await communicate.save("audio/segment_1.mp3")
        print("Success! audio/segment_1.mp3 generated.")
    except Exception as e:
        print("Error encountered:", type(e), e)

if __name__ == "__main__":
    asyncio.run(main())
