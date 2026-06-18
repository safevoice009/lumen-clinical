import asyncio
import os
import subprocess
import json
import time
from playwright.async_api import async_playwright

# Define voiceover text segments
VOICEOVERS = {
    "intro_1": "Welcome to Lumen, the first multi-agent clinical AI safety certification workstation.",
    "intro_2": "As a clinician, I developed Lumen using AI-assisted development through the Antigravity IDE. Today, we are safety auditing clinical agentic workflows before they touch real patients. Lumen fulfills the hackathon's multi-agent eligibility criteria using the Band SDK to coordinate three active agents: the Doctor Agent, the Patient Agent, and the Adversarial Red-Team Simulator, validating safety in the healthcare domain.",
    "step_1": "Let's begin in the Clinical Workspace. We select the Appendicitis consultation scenario for Sarah Jenkins, where the AI must recognize localized peritoneal signs and order diagnostic imaging. The Doctor Agent initiates a structured consultation dialogue, asking critical clinical questions and documenting the patient intake under strict safety protocols.",
    "multimodal": "Next, we navigate to the Multimodal Board. Clinicians can upload visual medical findings like this E.C.G. scan. We select the S.T.-elevation coordinates to flag the pathology, document our clinician findings, and attach it to the E.H.R. case sheet for complete diagnostic context.",
    "step_2": "We now trigger Step 2. Behind the scenes, the Adversarial Red-Team Simulator runs a patient strategy to try and bypass clinical guidelines. Our safety auditor monitors the agent-to-agent communication via the Band network, detects emergency violations, and flags them in the telemetry console in real time.",
    "drift": "We also integrate advanced clinician tools. We run a Drift Test to evaluate clinical L.L.M. reasoning drift across medical knowledge bases. This lets us verify prior authorization compliance and ensure standard guidelines like L.O.I.N.C. and RxNorm codes are mapped correctly.",
    "leaderboard": "Lumen features a comprehensive Safety Leaderboard and Benchmark Mode. Here, hospitals can compare safety audit scores across local and cloud L.L.M.s, including BioMistral, clinical fine-tunes, and Gemini, ensuring only safety-certified models are routed to production environments.",
    "fhir": "Finally, we return to the Clinical Workspace to compile our safety audit. Every simulation failure compiles into a standards-compliant F.H.I.R. R 4 audit bundle containing full interoperability logs. We validate this bundle against the H.A.P.I. F.H.I.R. server.",
    "outro": "Lumen provides the pre-deployment safety gate clinical A.I. deserves, protecting patient lives from model errors. We credit the open-source community, including the Band SDK, H.A.P.I. FHIR, medSpacy, PyHealth, and OMOP. Thank you for watching."
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

current_mouse = {"x": 960, "y": 540}

async def move_mouse_to(page, target_x, target_y, steps=20):
    global current_mouse
    await page.mouse.move(target_x, target_y, steps=steps)
    current_mouse = {"x": target_x, "y": target_y}

async def move_mouse_to_element(page, selector_or_locator, steps=20):
    if isinstance(selector_or_locator, str):
        await page.wait_for_selector(selector_or_locator, state="visible")
        locator = page.locator(selector_or_locator).first
    else:
        locator = selector_or_locator.first
        
    # Skip scrollIntoView if the element is part of the sticky navigation bar
    is_in_nav = await locator.evaluate("el => !!el.closest('.app-nav')")
    if not is_in_nav:
        # Scroll to center to prevent floating header or telemetry panel overlap
        await locator.evaluate("el => el.scrollIntoView({ block: 'center' })")
        await page.wait_for_timeout(300)
    else:
        print("Element is in navigation bar. Skipping scrollIntoView.")
    
    box = await locator.bounding_box()
    if box:
        x = box["x"] + box["width"] / 2
        y = box["y"] + box["height"] / 2
        await move_mouse_to(page, x, y, steps=steps)
        return x, y
    return None

async def click_with_mouse(page, selector_or_locator, steps=20):
    await page.evaluate("""() => {
        if (window.__playwright_cursor_setup) window.__playwright_cursor_setup();
    }""")
    coord = await move_mouse_to_element(page, selector_or_locator, steps=steps)
    if coord:
        await page.mouse.down()
        await asyncio.sleep(0.15)
        await page.mouse.up()
        await asyncio.sleep(0.15)
    else:
        print(f"Warning: Could not move mouse to {selector_or_locator}, clicking normally...")
        if isinstance(selector_or_locator, str):
            await page.click(selector_or_locator)
        else:
            await selector_or_locator.click()

async def fill_with_mouse(page, selector, value, steps=20):
    coord = await move_mouse_to_element(page, selector, steps=steps)
    if coord:
        await page.mouse.down()
        await page.mouse.up()
        await asyncio.sleep(0.15)
    await page.fill(selector, value)

async def inject_cursor(page):
    await page.evaluate("""() => {
        if (document.getElementById('playwright-cursor')) return;
        const cursor = document.createElement('div');
        cursor.id = 'playwright-cursor';
        cursor.style.position = 'fixed';
        cursor.style.width = '20px';
        cursor.style.height = '20px';
        cursor.style.borderRadius = '50%';
        cursor.style.backgroundColor = 'rgba(255, 75, 75, 0.8)';
        cursor.style.border = '2px solid white';
        cursor.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
        cursor.style.pointerEvents = 'none';
        cursor.style.zIndex = '999999';
        cursor.style.left = '960px';
        cursor.style.top = '540px';
        cursor.style.transform = 'translate(-50%, -50%)';
        cursor.style.transition = 'transform 0.1s, background-color 0.1s';
        document.documentElement.appendChild(cursor);

        window.__playwright_cursor_setup = () => {
            if (!document.getElementById('playwright-cursor')) {
                document.documentElement.appendChild(cursor);
            }
        };

        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });

        document.addEventListener('mousedown', () => {
            cursor.style.transform = 'translate(-50%, -50%) scale(0.75)';
            cursor.style.backgroundColor = 'rgba(255, 30, 30, 0.9)';
        });

        document.addEventListener('mouseup', () => {
            cursor.style.transform = 'translate(-50%, -50%) scale(1)';
            cursor.style.backgroundColor = 'rgba(255, 75, 75, 0.8)';
        });
    }""")

async def show_splash_screen(page):
    await page.evaluate("""() => {
        if (document.getElementById('demo-splash-screen')) return;
        const introDiv = document.createElement('div');
        introDiv.id = 'demo-splash-screen';
        introDiv.style.position = 'fixed';
        introDiv.style.inset = '0';
        introDiv.style.background = '#f5f4ef'; // Light Mode warm off-white cream
        introDiv.style.zIndex = '9999999';
        introDiv.style.display = 'flex';
        introDiv.style.flexDirection = 'column';
        introDiv.style.alignItems = 'center';
        introDiv.style.justifyContent = 'center';
        introDiv.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
        introDiv.style.transition = 'opacity 1s ease-out';

        introDiv.innerHTML = `
            <div style="text-align: center; animation: logoFadeIn 1.5s ease-out both;">
                <div style="display: inline-flex; justify-content: center; margin-bottom: 24px;">
                    <svg width="120" height="120" viewBox="0 0 36 36" style="filter: drop-shadow(0 8px 24px rgba(241,139,98,0.25)); animation: logoPulse 2.5s infinite ease-in-out;">
                        <defs>
                            <linearGradient id="lumenLogoGradientBig" x1="7" y1="5" x2="29" y2="31" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#65E4FF" />
                                <stop offset="0.5" stopColor="#F18B62" />
                                <stop offset="1" stopColor="#8B5CF6" />
                            </linearGradient>
                        </defs>
                        <path d="M18 5.5c-5.1 0-9.25 4.15-9.25 9.25 0 6.2 8.3 15.1 8.66 15.48a.82.82 0 0 0 1.18 0c.36-.38 8.66-9.28 8.66-15.48C27.25 9.65 23.1 5.5 18 5.5Z" fill="none" stroke="url(#lumenLogoGradientBig)" strokeWidth="2.2" />
                        <path d="M14.6 14.2c0-1.88 1.52-3.4 3.4-3.4s3.4 1.52 3.4 3.4-1.52 3.4-3.4 3.4-3.4-1.52-3.4-3.4Z" fill="url(#lumenLogoGradientBig)" opacity=".22" />
                        <path d="M12.9 22.6h10.2M18 17.6v8.9" stroke="url(#lumenLogoGradientBig)" strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                </div>
                <h1 style="font-size: 54px; font-weight: 800; letter-spacing: -0.04em; color: #262421; margin: 0 0 12px; background: linear-gradient(135deg, #F18B62 30%, #8B5CF6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Lumen</h1>
                <p style="font-size: 16px; font-weight: 600; color: #4c4840; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 4px;">Clinical AI Safety Workstation</p>
                <p style="font-size: 13px; color: #8a8579; font-weight: 500;">Pre-Deployment Safety Certification & Auditing</p>
            </div>
            <style>
                @keyframes logoFadeIn {
                    from { opacity: 0; transform: translateY(30px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes logoPulse {
                    0%, 100% { transform: scale(1); filter: drop-shadow(0 8px 24px rgba(241,139,98,0.25)); }
                    50% { transform: scale(1.03); filter: drop-shadow(0 12px 36px rgba(139,92,246,0.35)); }
                }
            </style>
        `;
        document.documentElement.appendChild(introDiv);
    }""")

async def hide_splash_screen(page):
    await page.evaluate("""() => {
        const el = document.getElementById('demo-splash-screen');
        if (el) {
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 1000);
        }
    }""")

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
                .body-zoomed .app-nav {
                    position: absolute !important;
                    width: 100% !important;
                    top: 0 !important;
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.classList.add('body-zoomed');
        document.body.style.transformOrigin = `${x}px ${y}px`;
        document.body.style.transform = `scale(${scale})`;
    }""", [selector, scale])
    await asyncio.sleep(1.2)

async def zoom_out(page):
    print("Zooming out to full screen...")
    await page.evaluate("""() => {
        document.body.classList.remove('body-zoomed');
        document.body.style.transform = 'scale(1)';
    }""")
    await asyncio.sleep(2.0)

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
        
        # Show animated splash screen
        await show_splash_screen(page)
        
        # Wait for intro_1 + user_voice duration (approx 16 seconds)
        print("Showing splash screen during intro voiceover...")
        await asyncio.sleep(durations["intro_1"] + durations["user_voice"])
        
        # Fade out splash screen
        await hide_splash_screen(page)
        await asyncio.sleep(1.0) # wait for fade-out transition
        
        # Inject cursor overlay
        await inject_cursor(page)
        
        if await page.locator('input[type="password"]').count() > 0:
            print("Entering passcode with mouse...")
            await fill_with_mouse(page, 'input[type="password"]', "LUMEN2026")
            await page.wait_for_timeout(500)
            await click_with_mouse(page, 'button:has-text("Unlock Workstation")')
            await page.wait_for_timeout(2000)
            
        # Segment 1: Switch to Light Mode immediately
        print("Segment 1: Switching to Light Mode...")
        is_dark = await page.evaluate("() => document.documentElement.getAttribute('data-theme') !== 'light'")
        if is_dark:
            theme_btn = page.locator('button[title="Switch to light mode"]')
            if await theme_btn.count() > 0:
                await click_with_mouse(page, theme_btn)
                print("Clicked light mode button")
            else:
                await page.evaluate("() => { document.documentElement.setAttribute('data-theme', 'light'); localStorage.setItem('lumen-theme', 'light'); }")
                print("Applied light mode via DOM")
            await page.wait_for_timeout(1000)
            
        print("Segment 1: Unlocked dashboard presentation...")
        elapsed_so_far = time.time() - recording_start_time
        remaining_intro = intro_total - elapsed_so_far
        if remaining_intro > 0:
            print(f"Waiting {remaining_intro:.2f}s for intro voiceover to finish...")
            await asyncio.sleep(remaining_intro)
            
        # Segment 2: Select Sarah Jenkins & Step 1 (Clinical Intake)
        print("Segment 2: Selecting Sarah Jenkins scenario...")
        await click_with_mouse(page, 'button.patient-card:has-text("Sarah Jenkins")')
        await page.wait_for_timeout(1000)
        
        print("Segment 2: Triggering Step 1...")
        await zoom_to_element(page, ".panel-chat", scale=1.4)
        step_1_start_time = time.time()
        await click_with_mouse(page, 'button:has-text("Step →")')
        await page.wait_for_selector('button:has-text("Step →"):not([disabled])', timeout=30000)
        step_1_inference_time = time.time() - step_1_start_time
        print(f"Step 1 inference took {step_1_inference_time:.2f}s")
        await asyncio.sleep(max(1.0, durations["step_1"] - step_1_inference_time - 1.2))
        
        # Segment 3: Multimodal Board & Annotations
        print("Segment 3: Opening Multimodal Board...")
        await zoom_out(page)
        multimodal_start_time = time.time()
        
        for attempt in range(3):
            print(f"Clicking Multimodal Board tab (attempt {attempt+1})...")
            await click_with_mouse(page, 'button:has-text("Multimodal Board")')
            await page.wait_for_timeout(1500)
            if await page.locator('.multimodal-board').count() > 0:
                print("Successfully switched to Multimodal Board!")
                break
            print("Tab switch did not register. Retrying...")
            
        await click_with_mouse(page, 'button:has-text("ECG Strip")')
        await page.wait_for_timeout(1000)
        
        img_locator = page.locator('img[alt="ECG Strip: Anterior STEMI (ST-Elevation)"]')
        await img_locator.evaluate("el => el.scrollIntoView({ block: 'center' })")
        await page.wait_for_timeout(300)
        box = await img_locator.bounding_box()
        if box:
            x = box["x"] + box["width"] * 0.6
            y = box["y"] + box["height"] * 0.4
            print(f"Clicking ST-elevation pathology on ECG with mouse at ({x}, {y})...")
            await move_mouse_to(page, x, y, steps=20)
            await page.mouse.down()
            await asyncio.sleep(0.15)
            await page.mouse.up()
        await page.wait_for_timeout(1000)
        
        await zoom_to_element(page, ".multimodal-grid", scale=1.3)
        await fill_with_mouse(page, 'textarea[id="clinician-notes"]', "Dr. Baddam Sucharith Reddy notes significant ST-elevation in leads V2-V4 indicating acute anterior myocardial infarction.")
        await page.wait_for_timeout(1500)
        await click_with_mouse(page, 'button:has-text("Attach Visual Finding")')
        await page.wait_for_timeout(1000)
        
        multimodal_elapsed = time.time() - multimodal_start_time
        await asyncio.sleep(max(1.0, durations["multimodal"] - multimodal_elapsed - 1.2))
        
        # Segment 4: Step 2 (Adversarial Check)
        print("Segment 4: Triggering Step 2 Safety Audit...")
        await zoom_out(page)
        step_2_start_time = time.time()
        await click_with_mouse(page, 'button:has-text("Step →")')
        await page.wait_for_selector('button:has-text("Step →"):not([disabled])', timeout=30000)
        step_2_inference_time = time.time() - step_2_start_time
        print(f"Step 2 safety audit inference took {step_2_inference_time:.2f}s")
        
        await zoom_to_element(page, ".panel-chat", scale=1.4)
        await asyncio.sleep(max(1.0, durations["step_2"] - step_2_inference_time - 1.2))
        
        # Segment 5: Drift Test Tab Walkthrough
        print("Segment 5: Opening Drift Test Tab...")
        await zoom_out(page)
        drift_start_time = time.time()
        
        for attempt in range(3):
            print(f"Clicking Drift Test tab (attempt {attempt+1})...")
            await click_with_mouse(page, 'button:has-text("Drift Test")')
            await page.wait_for_timeout(1500)
            if await page.locator('.panel-drift').count() > 0:
                print("Successfully switched to Drift Test panel!")
                break
            print("Drift Test tab switch did not register. Retrying...")
            
        await click_with_mouse(page, 'button:has-text("Execute Drift Test")')
        await zoom_to_element(page, ".panel-drift", scale=1.3)
        
        drift_elapsed = time.time() - drift_start_time
        await asyncio.sleep(max(1.0, durations["drift"] - drift_elapsed - 1.2))
        
        # Segment 6: Safety Leaderboard Walkthrough
        print("Segment 6: Opening Safety Leaderboard...")
        await zoom_out(page)
        leaderboard_start_time = time.time()
        
        await click_with_mouse(page, 'button:has-text("Standards")')
        await page.wait_for_timeout(1000)
        
        for attempt in range(3):
            if attempt > 0:
                print("Reopening Standards dropdown...")
                await click_with_mouse(page, 'button:has-text("Standards")')
                await page.wait_for_timeout(1000)
                
            print(f"Clicking Safety Leaderboard (attempt {attempt+1})...")
            await click_with_mouse(page, 'button:has-text("Safety Leaderboard")')
            await page.wait_for_timeout(1500)
            if await page.locator('.lb-subpanel-tabs').count() > 0:
                print("Successfully switched to Safety Leaderboard!")
                break
            print("Leaderboard click did not register. Retrying...")
        
        await page.evaluate("window.scrollTo(0, 400)")
        await page.wait_for_timeout(2000)
        await page.evaluate("window.scrollTo(0, 100)")
        
        leaderboard_elapsed = time.time() - leaderboard_start_time
        await asyncio.sleep(max(1.0, durations["leaderboard"] - leaderboard_elapsed - 1.2))
        
        # Segment 7: Return to Simulation & Progress Steps
        print("Segment 7: Returning to Simulation...")
        await page.evaluate("window.scrollTo(0, 0)")
        await click_with_mouse(page, 'button:has-text("Sandbox")')
        await page.wait_for_timeout(1000)
        
        for attempt in range(3):
            if attempt > 0:
                print("Reopening Sandbox dropdown...")
                await click_with_mouse(page, 'button:has-text("Sandbox")')
                await page.wait_for_timeout(1000)
                
            print(f"Clicking Clinical Simulation (attempt {attempt+1})...")
            await click_with_mouse(page, 'button:has-text("Clinical Simulation")')
            await page.wait_for_timeout(2000)
            if await page.locator('button:has-text("Step →")').count() > 0:
                print("Successfully returned to Clinical Simulation!")
                break
            print("Clinical Simulation click did not register. Retrying...")
        
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
                await click_with_mouse(page, execute_btn.first)
                await asyncio.sleep(2.0)
                continue
                
            # Click Step ->
            step_btn = page.locator('button:has-text("Step →")')
            if await step_btn.count() > 0:
                is_disabled = await step_btn.get_attribute("disabled") is not None
                if not is_disabled:
                    print(f"Clicking Step → button...")
                    await click_with_mouse(page, step_btn)
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
            await click_with_mouse(page, execute_btn.first)
            await asyncio.sleep(2.5)
            
        # Click Compile Audit & FHIR to generate final reports
        print("Clicking Compile Audit & FHIR...")
        await click_with_mouse(page, 'button:has-text("Compile Audit & FHIR")')
        await page.wait_for_selector('button:has-text("Step →")[disabled]', timeout=30000)
        await asyncio.sleep(1.5)
        
        await click_with_mouse(page, 'button:has-text("FHIR R4")')
        await page.wait_for_timeout(1000)
        await click_with_mouse(page, 'button:has-text("Validate Bundle")')
        await zoom_to_element(page, ".fhir-panel", scale=1.3)
        
        fhir_elapsed = time.time() - fhir_start_time
        await asyncio.sleep(max(1.0, durations["fhir"] - fhir_elapsed - 1.2))
        
        # Segment 8: Outro
        print("Segment 8: Outro sequence...")
        await zoom_out(page)
        await click_with_mouse(page, 'button:has-text("Safety Audit")')
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
 
    # 5. Final Compilation (Combine Video, Audio, and Background Music, NO burned subtitles)
    print("Compiling final video with audio and background music (no burned-in subtitles)...")
    final_output_path = "demo_assets/product_demo.mp4"
    compile_cmd = [
        "ffmpeg", "-y",
        "-i", "recordings/raw_video.webm",
        "-i", "recordings/full_audio.mp3",
        "-i", "recordings/bg_music.mp3",
        "-filter_complex",
        "[1:a]volume=1.0[v_nar];"
        "[2:a]volume=0.07,afade=t=out:st=160:d=3[v_bg];"
        "[v_nar][v_bg]amix=inputs=2:duration=first[outa]",
        "-map", "0:v",
        "-map", "[outa]",
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
