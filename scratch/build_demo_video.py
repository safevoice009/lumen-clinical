import asyncio
import os
import subprocess
import json
import time
from playwright.async_api import async_playwright

# Define voiceover text segments
VOICEOVERS = {
    "intro_1": "Welcome to Lumen Odysseus, the first multi-agent clinical AI safety certification workstation.",
    "intro_2": "Today, we are safety auditing clinical agentic workflows before they touch real patients in hospital environments. Let's explore how Lumen provides pre-deployment stress testing and safety gates.",
    "step_1": "Let's begin in the Clinical Workspace. We select the Appendicitis consultation scenario for Sarah Jenkins, where the AI must recognize localized peritoneal signs and order diagnostic imaging. We step forward to trigger the Doctor Agent, which initiates a structured consultation dialogue, asking critical clinical questions and documenting the patient intake under safety protocols.",
    "multimodal": "Next, we navigate to the Multimodal Board. Clinicians can upload and review visual medical findings. We select an E.C.G. strip showing an acute anterior S.T.E.M.I., click the S.T.-elevation coordinates to flag them, and document our clinician notes. We then attach this visual finding to the active E.H.R. case sheet.",
    "step_2": "We now attach this visual finding and trigger Step 2. Behind the scenes, the Adversarial Red-Team Simulator runs a patient strategy to try and bypass clinical guidelines. Our safety auditor monitors the agent-to-agent communication via the Band network, detects emergency violations, and flags them in the telemetry console in real time.",
    "drift": "We also integrate advanced clinician tools. We can run a Drift Test to evaluate clinical L.L.M. reasoning drift across medical knowledge bases. This lets us verify prior authorization compliance and ensure standard guidelines like L.O.I.N.C. and RxNorm codes are mapped correctly.",
    "leaderboard": "Lumen features a comprehensive Safety Leaderboard and Benchmark Mode. Here, hospitals can compare safety audit scores across local and cloud L.L.M.s, including BioMistral, clinical fine-tunes, and Gemini, ensuring only safety-certified models are routed to production environments.",
    "fhir": "Finally, we return to the Clinical Workspace to compile our safety audit. Every simulation failure compiles into a standards-compliant F.H.I.R. R 4 audit bundle containing full interoperability logs. We validate this bundle against the H.I.P.I. F.H.I.R. server.",
    "outro": "Lumen Odysseus provides the pre-deployment safety gate clinical A.I. deserves, protecting patient lives from model errors. Open source, clinician-led, and powered by Band. Thank you for watching."
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
    
    # Simple retry logic with linear backoff to handle transient Edge-TTS network/SSL issues
    for attempt in range(5):
        try:
            proc = await asyncio.create_subprocess_exec(*cmd)
            await proc.communicate()
            if proc.returncode == 0:
                if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                    return
            print(f"Attempt {attempt+1} returned code {proc.returncode}. Retrying...")
        except Exception as e:
            print(f"Attempt {attempt+1} generated error: {e}. Retrying...")
        await asyncio.sleep(2.0 * (attempt + 1))
    
    raise RuntimeError(f"Failed to generate speech after 5 attempts for: {text}")

async def zoom_to_element(page, selector, scale=1.5):
    print(f"Zooming to {selector} at scale {scale}...")
    await page.evaluate("""([selector, scale]) => {
        const el = document.querySelector(selector);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
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
    srt_content += add_srt_entry(2, current_time, durations["user_voice"], "I am Dr. Baddam Sucharith Reddy")
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
    
    # Drift
    srt_content += add_srt_entry(7, current_time, durations["drift"], VOICEOVERS["drift"])
    current_time += durations["drift"]
    
    # Leaderboard
    srt_content += add_srt_entry(8, current_time, durations["leaderboard"], VOICEOVERS["leaderboard"])
    current_time += durations["leaderboard"]
    
    # FHIR Validation
    srt_content += add_srt_entry(9, current_time, durations["fhir"], VOICEOVERS["fhir"])
    current_time += durations["fhir"]
    
    # Outro
    srt_content += add_srt_entry(10, current_time, durations["outro"], VOICEOVERS["outro"])
    
    srt_path = "demo_assets/subtitles.srt"
    with open(srt_path, "w") as f:
        f.write(srt_content)
    print(f"Subtitles saved to {srt_path}")
    
    # 3. Concatenate Audio Tracks
    concat_cmd = [
        "ffmpeg", "-y",
        "-i", audio_paths["intro_1"],
        "-i", user_voice_path,
        "-i", audio_paths["intro_2"],
        "-i", audio_paths["step_1"],
        "-i", audio_paths["multimodal"],
        "-i", audio_paths["step_2"],
        "-i", audio_paths["drift"],
        "-i", audio_paths["leaderboard"],
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
        "[8:a]aresample=44100[a8];"
        "[9:a]aresample=44100[a9];"
        "[a0][a1][a2][a3][a4][a5][a6][a7][a8][a9]concat=n=10:v=0:a=1[outa]",
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
        page.on("console", lambda msg: print(f"[BROWSER CONSOLE] {msg.type}: {msg.text}"))
        
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
            
        # Segment 1: Switch to Light Mode immediately
        print("Segment 1: Switching to Light Mode...")
        is_dark = await page.evaluate("() => document.documentElement.getAttribute('data-theme') !== 'light'")
        if is_dark:
            theme_btn = page.locator('button[title="Switch to light mode"]')
            if await theme_btn.count() > 0:
                await theme_btn.click()
                print("Clicked light mode button")
            else:
                await page.evaluate("() => { document.documentElement.setAttribute('data-theme', 'light'); localStorage.setItem('lumen-theme', 'light'); }")
                print("Applied light mode via DOM")
            await page.wait_for_timeout(1000)
            
        print("Segment 1: Unlocked dashboard presentation...")
        await asyncio.sleep(max(1.0, intro_total - (time.time() - recording_start_time)))
        
        # Segment 2: Select Sarah Jenkins & Step 1 (Clinical Intake)
        print("Segment 2: Selecting Sarah Jenkins scenario...")
        await page.click('button.patient-card:has-text("Sarah Jenkins")')
        await page.wait_for_timeout(1000)
        
        print("Segment 2: Triggering Step 1...")
        await zoom_to_element(page, ".panel-chat", scale=1.4)
        step_1_start_time = time.time()
        await page.click('button:has-text("Step →")')
        await page.wait_for_selector('button:has-text("Step →"):not([disabled])', timeout=30000)
        step_1_inference_time = time.time() - step_1_start_time
        print(f"Step 1 inference took {step_1_inference_time:.2f}s")
        await asyncio.sleep(max(1.0, durations["step_1"] - step_1_inference_time - 1.2))
        
        # Segment 3: Multimodal Board & Annotations
        print("Segment 3: Opening Multimodal Board...")
        await zoom_out(page)
        multimodal_start_time = time.time()
        
        await page.click('button:has-text("Multimodal Board")')
        await asyncio.sleep(1.0)
        await page.click('button:has-text("ECG Strip")')
        await asyncio.sleep(1.0)
        
        img_locator = page.locator('img[alt="ECG Strip: Anterior STEMI (ST-Elevation)"]')
        box = await img_locator.bounding_box()
        if box:
            await img_locator.click(position={"x": box["width"] * 0.6, "y": box["height"] * 0.4})
        await asyncio.sleep(1.0)
        
        await zoom_to_element(page, ".multimodal-grid", scale=1.3)
        await page.fill('textarea[id="clinician-notes"]', "Dr. Baddam Sucharith Reddy notes significant ST-elevation in leads V2-V4 indicating acute anterior myocardial infarction.")
        await asyncio.sleep(1.5)
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
        
        await zoom_to_element(page, ".panel-chat", scale=1.4)
        await asyncio.sleep(max(1.0, durations["step_2"] - step_2_inference_time - 1.2))
        
        # Segment 5: Drift Test Tab Walkthrough
        print("Segment 5: Opening Drift Test Tab...")
        await zoom_out(page)
        drift_start_time = time.time()
        
        await page.click('button:has-text("Drift Test")')
        await page.wait_for_timeout(1000)
        await page.click('button:has-text("Execute Drift Test")')
        await zoom_to_element(page, ".panel-drift", scale=1.3)
        
        drift_elapsed = time.time() - drift_start_time
        await asyncio.sleep(max(1.0, durations["drift"] - drift_elapsed - 1.2))
        
        # Segment 6: Safety Leaderboard Walkthrough
        print("Segment 6: Opening Safety Leaderboard...")
        await zoom_out(page)
        leaderboard_start_time = time.time()
        
        await page.click('button:has-text("Standards")')
        await page.wait_for_timeout(1000)
        await page.click('button:has-text("Safety Leaderboard")')
        await page.wait_for_timeout(1500)
        
        await page.evaluate("window.scrollTo(0, 400)")
        await page.wait_for_timeout(2000)
        await page.evaluate("window.scrollTo(0, 100)")
        
        leaderboard_elapsed = time.time() - leaderboard_start_time
        await asyncio.sleep(max(1.0, durations["leaderboard"] - leaderboard_elapsed - 1.2))
        
        # Segment 7: Return to Simulation & Progress Steps
        print("Segment 7: Returning to Simulation...")
        await page.evaluate("window.scrollTo(0, 0)")
        await page.click('button:has-text("Sandbox")')
        await page.wait_for_timeout(1000)
        await page.click('button:has-text("Clinical Simulation")')
        await page.wait_for_timeout(2000)
        
        fhir_start_time = time.time()
        
        # Progress Steps to completion using a robust tool-execution aware loop
        for i in range(8):
            # Check if Compile Audit & FHIR is visible
            compile_btn = page.locator('button:has-text("Compile Audit & FHIR")')
            if await compile_btn.count() > 0:
                print("Compile Audit & FHIR button is visible!")
                break
                
            # Proactively click any Execute Lab button that is blocking the simulation
            execute_btn = page.locator('button:has-text("Execute Lab")')
            if await execute_btn.count() > 0:
                print("Clicking Execute Lab to unblock tool call...")
                await execute_btn.first.click()
                await asyncio.sleep(2.0)
                continue
                
            # Click Step ->
            step_btn = page.locator('button:has-text("Step →")')
            if await step_btn.count() > 0:
                is_disabled = await step_btn.get_attribute("disabled") is not None
                if not is_disabled:
                    print(f"Clicking Step → button...")
                    await step_btn.click()
                    await asyncio.sleep(2.5)
                else:
                    print("Step → is disabled. Waiting for page state to settle...")
                    await asyncio.sleep(2.0)
            else:
                await asyncio.sleep(1.0)
                
        # Proactively check and click any remaining Execute Lab button (like CPT 44970 on Step 5) before compiling
        execute_btn = page.locator('button:has-text("Execute Lab")')
        if await execute_btn.count() > 0:
            print("Clicking final Execute Lab to unblock compile button...")
            await execute_btn.first.click()
            await asyncio.sleep(2.5)
            
        # Click Compile Audit & FHIR to generate final reports
        print("Clicking Compile Audit & FHIR...")
        await page.click('button:has-text("Compile Audit & FHIR")')
        await page.wait_for_selector('button:has-text("Step →")[disabled]', timeout=30000)
        await asyncio.sleep(1.5)
        
        await page.click('button:has-text("FHIR R4")')
        await page.wait_for_timeout(1000)
        await page.click('button:has-text("Validate Bundle")')
        await zoom_to_element(page, ".fhir-panel", scale=1.3)
        
        fhir_elapsed = time.time() - fhir_start_time
        await asyncio.sleep(max(1.0, durations["fhir"] - fhir_elapsed - 1.2))
        
        # Segment 8: Outro
        print("Segment 8: Outro sequence...")
        await zoom_out(page)
        await page.click('button:has-text("Safety Audit")')
        await asyncio.sleep(max(1.0, durations["outro"] - 1.2))
        
        elapsed_video_time = time.time() - recording_start_time
        print(f"Elapsed recording time: {elapsed_video_time:.2f}s (Target audio: {total_audio_duration:.2f}s)")
        if elapsed_video_time < total_audio_duration:
            alignment_sleep = total_audio_duration - elapsed_video_time
            print(f"Padding video recording with {alignment_sleep:.2f}s of static end-frame...")
            await asyncio.sleep(alignment_sleep)
            
        await context.close()
        video_path = await page.video.path()
        print(f"Raw video saved at: {video_path}")
        run_cmd(["cp", video_path, "recordings/raw_video.webm"])
        await browser.close()

    # 5. Final Compilation (Combine Video, Audio, NO burned subtitles)
    print("Compiling final video with audio (and no burned-in subtitles)...")
    final_output_path = "demo_assets/product_demo.mp4"
    compile_cmd = [
        "ffmpeg", "-y",
        "-i", "recordings/raw_video.webm",
        "-i", "recordings/full_audio.mp3",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-profile:v", "high",
        "-level", "4.1",
        "-fps_mode", "cfr",
        "-r", "25",
        "-movflags", "+faststart",
        "-c:a", "aac",
        "-b:a", "128k",
        "-ac", "2",
        "-ar", "44100",
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
