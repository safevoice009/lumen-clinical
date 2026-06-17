import asyncio
import edge_tts
import os

VOICE = "en-US-AndrewNeural"  # Premium natural male voice

segments = [
    (1, "Hello, I am Dr. Baddam Sucharith Reddy. Welcome to the product demonstration of Lumen Odysseus, a state-of-the-art multi-agent clinical AI safety certification workstation."),
    (2, "Here, we are accessing our live Vercel deployed website. First, let's enter the secure clinician passcode to access the workspace sandbox."),
    (3, "Now, let's open the model settings and select our local Intel OpenVINO preset. This routes all clinical evaluations to our on-device model server running MedGemma and Qwen."),
    (4, "Let's turn the live LLM engine on and trigger our first simulation step. In real-time, the Red-Team Adversary Agent, Doctor Agent, and Patient Agent collaborate via the Band SDK coordination layer, tracking telemetry logs."),
    (5, "Next, we will test visual clinical safety. Let's open the Multimodal tab, load a STEMI E C G scan, and flag the exact ST-elevation pathology."),
    (6, "The Safety Auditor evaluates the entire dialogue and visual findings. It issues a clinical verdict, highlights failure propagation traces, and generates counterfactual corrections to improve future safety."),
    (7, "Finally, we can validate the generated F H I R R4 Bundle against the public H A P I F H I R server, ensuring clinical standards compliance. This is Lumen Odysseus.")
]

async def amain():
    os.makedirs("audio", exist_ok=True)
    for idx, text in segments:
        output_file = f"audio/segment_{idx}.mp3"
        print(f"Synthesizing segment {idx}: {text}...")
        communicate = edge_tts.Communicate(text, VOICE)
        await communicate.save(output_file)
    print("All audio segments synthesized successfully!")

if __name__ == "__main__":
    asyncio.run(amain())
