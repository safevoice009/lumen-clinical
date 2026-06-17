import asyncio
import os
import subprocess
import json
import time
from playwright.async_api import async_playwright

# Define voiceover text segments
VOICEOVERS = {
    "intro_1": "Welcome to the safety audit sandbox for medical A.I. I am...",
    "intro_2": "...and today we are safety auditing clinical agentic workflows before they touch real patients.",
    "step_1": "Let's begin by simulating the patient intake. We step forward to trigger the Doctor Agent, which initiates a structured dialogue with the patient, asking clinical questions and documenting history under safety protocols.",
    "multimodal": "Next, we navigate to the Multimodal Board. Here, we select a visual finding—in this case, an ECG strip showing an anterior STEMI. We tap the ST-elevation coordinates and write our clinical annotation notes.",
    "step_2": "We now attach this visual finding and trigger Step 2. Behind the scenes, the Patient Simulator runs an adversarial red-team strategy to try and bypass clinical guidelines. Our Consensus Safety Auditor detects the violation in real time and intercepts the response.",
    "fhir": "Finally, we switch to the FHIR R 4 tab. Here, Lumen compiles a fully compliant clinical FHIR bundle containing the patient data, lab orders, and clinical logs, and validates it against the H.I.P.I. FHIR server.",
    "outro": "Lumen ensures clinical safety, alignment, and interoperability for next-generation medical AI. Thank you for watching."
}

def run_cmd(cmd):
    print(f"Running: {' '.join(cmd)}")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Error executing command: {res.stderr}")
        raise RuntimeError(res.stderr)
    return res.stdout

def get_duration(file_path):
    cmd = ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", file_path]
    out = run_cmd(cmd)
    data = json.loads(out)
    return float(data["format"]["duration"])

async def generate_speech(text, output_path, voice="en-US-AndrewMultilingualNeural"):
    print(f"Generating TTS for: '{text}' -> {output_path}")
    cmd = ["edge-tts", "--voice", voice, "--text", text, "--write-media", output_path]
    # Run using asyncio for edge-tts
    proc = await asyncio.create_subprocess_exec(*cmd)
    await proc.communicate()

async def zoom_to_element(page, selector, scale=1.5):
    print(f"Zooming to {selector} at scale {scale}...")
    await page.evaluate("""([selector, scale]) => {
        const el = document.querySelector(selector);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        // Add a nice transition style if not present
        if (!document.getElementById('zoom-style')) {
            const style = document.createElement('style');
            style.id = 'zoom-style';
            style.innerHTML = `
                body {
                    transition: transform 1.2s cubic-bezier(0.25, 1, 0.5, 1) !important;
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.style.transformOrigin = `${x}px ${y}px`;
        document.body.style.transform = `scale(${scale})`;
    }""", [selector, scale])
    await asyncio.sleep(1.2)

async def zoom_out(page):
    print("Zooming out to full screen...")
    await page.evaluate("""() => {
        document.body.style.transform = 'scale(1)';
    }""")
    await asyncio.sleep(1.2)

async def main():
    os.makedirs("recordings", exist_ok=True)
    os.makedirs("demo_assets", exist_ok=True)
    
    # 1. Generate Voiceover Audio Files
    audio_paths = {}
    for key, text in VOICEOVERS.items():
        path = f"recordings/{key}.mp3"
        await generate_speech(text, path)
        audio_paths[key] = path
        
    user_voice_path = "/home/sucharithpop/Downloads/new hackathon project/name.m4a"
    if not os.path.exists(user_voice_path):
        raise FileNotFoundError(f"User voice file not found at: {user_voice_path}")
        
    # Get durations
    durations = {}
    for key, path in audio_paths.items():
        durations[key] = get_duration(path)
    durations["user_voice"] = get_duration(user_voice_path)
    
    print("\n--- Audio Durations ---")
    for k, d in durations.items():
        print(f"{k}: {d:.2f}s")
        
    # Calculate segment bounds
    intro_total = durations["intro_1"] + durations["user_voice"] + durations["intro_2"]
    print(f"Total Intro Duration: {intro_total:.2f}s")
    
    # 2. Compile SRT Subtitles
    srt_content = ""
    current_time = 0.0
    
    def add_srt_entry(index, start, duration, text):
        def format_time(t):
            h = int(t // 3600)
            m = int((t % 3600) // 60)
            s = int(t % 60)
            ms = int((t % 1) * 1000)
            return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
        
        return f"{index}\n{format_time(start)} --> {format_time(start + duration)}\n{text}\n\n"
        
    # Intro Part 1
    srt_content += add_srt_entry(1, current_time, durations["intro_1"], VOICEOVERS["intro_1"])
    current_time += durations["intro_1"]
    
    # User Voice
    srt_content += add_srt_entry(2, current_time, durations["user_voice"], "Dr. Baddam Sucharith Reddy")
    current_time += durations["user_voice"]
    
    # Intro Part 2
    srt_content += add_srt_entry(3, current_time, durations["intro_2"], VOICEOVERS["intro_2"])
    current_time += durations["intro_2"]
    
    # Step 1
    srt_content += add_srt_entry(4, current_time, durations["step_1"], VOICEOVERS["step_1"])
    current_time += durations["step_1"]
    
    # Multimodal Board
    srt_content += add_srt_entry(5, current_time, durations["multimodal"], VOICEOVERS["multimodal"])
    current_time += durations["multimodal"]
    
    # Step 2
    srt_content += add_srt_entry(6, current_time, durations["step_2"], VOICEOVERS["step_2"])
    current_time += durations["step_2"]
    
    # FHIR Validation
    srt_content += add_srt_entry(7, current_time, durations["fhir"], VOICEOVERS["fhir"])
    current_time += durations["fhir"]
    
    # Outro
    srt_content += add_srt_entry(8, current_time, durations["outro"], VOICEOVERS["outro"])
    
    srt_path = "demo_assets/subtitles.srt"
    with open(srt_path, "w") as f:
        f.write(srt_content)
    print(f"Subtitles saved to {srt_path}")
    
    # 3. Concatenate Audio Tracks
    # Filter complex to resample and merge mono/stereo files correctly
    concat_cmd = [
        "ffmpeg", "-y",
        "-i", audio_paths["intro_1"],
        "-i", user_voice_path,
        "-i", audio_paths["intro_2"],
        "-i", audio_paths["step_1"],
        "-i", audio_paths["multimodal"],
        "-i", audio_paths["step_2"],
        "-i", audio_paths["fhir"],
        "-i", audio_paths["outro"],
        "-filter_complex",
        "[0:a]aresample=44100[a0];"
        "[1:a]aresample=44100[a1];"
        "[2:a]aresample=44100[a2];"
        "[3:a]aresample=44100[a3];"
        "[4:a]aresample=44100[a4];"
        "[5:a]aresample=44100[a5];"
        "[6:a]aresample=44100[a6];"
        "[7:a]aresample=44100[a7];"
        "[a0][a1][a2][a3][a4][a5][a6][a7]concat=n=8:v=0:a=1[outa]",
        "-map", "[outa]", "recordings/full_audio.mp3"
    ]
    run_cmd(concat_cmd)
    total_audio_duration = get_duration("recordings/full_audio.mp3")
    print(f"Combined audio duration: {total_audio_duration:.2f}s")
    
    # 4. Automate Walkthrough using Playwright
    async with async_playwright() as p:
        print("Launching browser for recording...")
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            record_video_dir="recordings/",
            record_video_size={"width": 1920, "height": 1080}
        )
        page = await context.new_page()
        
        # Start timer for video duration alignment
        recording_start_time = time.time()
        
        # Open URL and login
        print("Navigating to Vercel deployment...")
        await page.goto("https://lumen-clinical.vercel.app")
        await page.wait_for_load_state("load")
        await page.wait_for_timeout(1000)
        
        if await page.locator('input[type="password"]').count() > 0:
            await page.fill('input[type="password"]', "LUMEN2026")
            await page.click('button:has-text("Unlock Workstation")')
            await page.wait_for_timeout(2000)
            
        # Segment 1: Intro sequence (~10 seconds)
        print("Segment 1: Unlocked dashboard presentation...")
        await asyncio.sleep(max(1.0, intro_total - (time.time() - recording_start_time)))
        
        # Segment 2: Step 1 (Clinical Intake)
        print("Segment 2: Triggering Step 1...")
        await zoom_to_element(page, ".panel-chat", scale=1.4)
        step_1_start_time = time.time()
        await page.click('button:has-text("Step →")')
        # Wait for Step 1 completion
        await page.wait_for_selector('button:has-text("Step →"):not([disabled])', timeout=30000)
        step_1_inference_time = time.time() - step_1_start_time
        print(f"Step 1 inference took {step_1_inference_time:.2f}s")
        # Keep showing dialogue for remaining duration of step_1 audio
        await asyncio.sleep(max(1.0, durations["step_1"] - step_1_inference_time - 1.2))
        
        # Segment 3: Multimodal Board & Annotations
        print("Segment 3: Opening Multimodal Board...")
        await zoom_out(page)
        multimodal_start_time = time.time()
        
        # Open Board
        await page.click('button:has-text("Multimodal Board")')
        await asyncio.sleep(1.0)
        # Click ECG Strip
        await page.click('button:has-text("ECG Strip")')
        await asyncio.sleep(1.0)
        # Click coordinates
        img_locator = page.locator('img[alt="ECG Strip: Anterior STEMI (ST-Elevation)"]')
        box = await img_locator.bounding_box()
        if box:
            await img_locator.click(position={"x": box["width"] * 0.6, "y": box["height"] * 0.4})
        await asyncio.sleep(1.0)
        
        # Zoom in on the board coordinates and annotations
        await zoom_to_element(page, ".multimodal-grid", scale=1.3)
        
        # Write notes
        await page.fill('textarea[id="clinician-notes"]', "Dr. Baddam Sucharith Reddy notes significant ST-elevation in leads V2-V4 indicating acute anterior myocardial infarction.")
        await asyncio.sleep(1.5)
        # Attach finding
        await page.click('button:has-text("Attach Visual Finding")')
        await asyncio.sleep(1.0)
        
        multimodal_elapsed = time.time() - multimodal_start_time
        await asyncio.sleep(max(1.0, durations["multimodal"] - multimodal_elapsed - 1.2))
        
        # Segment 4: Step 2 (Adversarial Check)
        print("Segment 4: Triggering Step 2 Safety Audit...")
        await zoom_out(page)
        step_2_start_time = time.time()
        await page.click('button:has-text("Step →")')
        await page.wait_for_selector('button:has-text("Step →"):not([disabled])', timeout=30000)
        step_2_inference_time = time.time() - step_2_start_time
        print(f"Step 2 safety audit inference took {step_2_inference_time:.2f}s")
        
        # Zoom in to chat agent dialogue and telemetry logs
        await zoom_to_element(page, ".panel-chat", scale=1.4)
        await asyncio.sleep(max(1.0, durations["step_2"] - step_2_inference_time - 1.2))
        
        # Intermediate step sequences to get to completed FHIR bundle
        print("Progressing simulation to completion to generate FHIR Bundle...")
        await zoom_out(page)
        
        # Step 3
        print("Triggering Step 3 (Doctor tool dispatch)...")
        await page.click('button:has-text("Step →")')
        await page.wait_for_selector('button:has-text("Step →"):not([disabled])', timeout=30000)
        await asyncio.sleep(1.0)
        
        # Execute Lab tool if dispatched
        execute_btn = page.locator('button:has-text("Execute Lab")')
        if await execute_btn.count() > 0:
            print("Clicking 'Execute Lab' to complete tool call...")
            await execute_btn.first.click()
            await asyncio.sleep(2.0)
            
        # Step 4
        print("Triggering Step 4...")
        await page.click('button:has-text("Step →")')
        await page.wait_for_selector('button:has-text("Step →"):not([disabled])', timeout=30000)
        await asyncio.sleep(1.5)
        
        # Step 5 (Simulation completion)
        print("Triggering Step 5 (Final recommendation)...")
        await page.click('button:has-text("Step →")')
        await page.wait_for_selector('button:has-text("Compile Audit & FHIR")', timeout=30000)
        await asyncio.sleep(2.0)
        
        # Click Compile Audit & FHIR to generate final reports
        print("Clicking Compile Audit & FHIR...")
        await page.click('button:has-text("Compile Audit & FHIR")')
        # Wait for compilation to complete (button becomes disabled)
        await page.wait_for_selector('button:has-text("Compile Audit & FHIR")[disabled]', timeout=60000)
        await asyncio.sleep(2.0)
        
        # Segment 5: FHIR Validation (Simulation has finished, already switched to FHIR tab)
        print("Segment 5: FHIR Validation...")
        await zoom_to_element(page, ".fhir-panel", scale=1.3)
        await page.click('button:has-text("Validate Bundle")')
        
        # Wait for validation response (8s)
        await asyncio.sleep(8.0)
        
        # Segment 6: Outro
        print("Segment 6: Outro sequence...")
        await zoom_out(page)
        await page.click('button:has-text("Safety Audit")')
        await asyncio.sleep(2.0)
        
        # Align video length to match the audio exactly
        elapsed_video_time = time.time() - recording_start_time
        print(f"Elapsed recording time: {elapsed_video_time:.2f}s (Target audio: {total_audio_duration:.2f}s)")
        if elapsed_video_time < total_audio_duration:
            alignment_sleep = total_audio_duration - elapsed_video_time
            print(f"Padding video recording with {alignment_sleep:.2f}s of static end-frame...")
            await asyncio.sleep(alignment_sleep)
            
        # Close browser to save raw video
        await context.close()
        video_path = await page.video.path()
        print(f"Raw video saved at: {video_path}")
        
        # Copy raw video for post processing
        run_cmd(["cp", video_path, "recordings/raw_video.webm"])
        await browser.close()

    # 5. Final Compilation (Combine Video, Audio, and burn Subtitles)
    # Burn subtitles with style using libass subtitles filter
    print("Compiling final video with audio and subtitles...")
    final_output_path = "demo_assets/product_demo.mp4"
    compile_cmd = [
        "ffmpeg", "-y",
        "-i", "recordings/raw_video.webm",
        "-i", "recordings/full_audio.mp3",
        "-vf", "subtitles=demo_assets/subtitles.srt:force_style='Fontname=Inter,Fontsize=18,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=45'",
        "-c:v", "libx264",
        "-c:a", "aac",
        "-map", "0:v",
        "-map", "1:a",
        "-shortest",
        final_output_path
    ]
    run_cmd(compile_cmd)
    
    print("\n=============================================")
    print(f"🎉 SUCCESS! Final product demo compiled at: {final_output_path}")
    print("Subtitles file and final audio copied to demo_assets/ folder.")
    print("=============================================")

if __name__ == "__main__":
    asyncio.run(main())
