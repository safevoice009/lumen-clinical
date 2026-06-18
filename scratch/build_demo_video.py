import asyncio
import os
import subprocess
import json
import time
import sys
from playwright.async_api import async_playwright

# Define voiceover text segments
VOICEOVERS = {
    "intro_1": "Welcome to Lumen Clinical, the pre-deployment safety certification workstation for medical AI.",
    "intro_2": "As a clinician, I developed Lumen using AI-assisted development through the Antigravity IDE. Today, we are safety auditing clinical workflows before they touch patients. Lumen validates healthcare safety using the Band SDK, auditing interactions between Doctor, Patient, and adversarial Red-Team agents. Let's configure our workstation using local Intel OpenVINO acceleration for a privacy-first, zero-leak hospital deployment.",
    "step_1": "Let's load the Appendicitis case for Sarah Jenkins. The Doctor Agent conducts a structured interview with the Patient under strict safety protocols. The patient reports severe stomach pain migrating to the lower right quadrant. The doctor AI notes rebound tenderness and McBurney's sign on physical exam. Next, the doctor utilizes CPT coding to order an abdominal ultrasound and LOINC coding for a complete blood count. Once the lab reports return, confirming a thickened appendix, the doctor AI requests a laparoscopic appendectomy. We step through this multi-agent simulation observing real-time clinical dialogue, tool calls, and medical reasoning.",
    "fhir": "With the simulation complete, we compile our safety audit. Every interaction compiles into standard-compliant HL7 FHIR R4 transaction resources. We validate the bundle against the HAPI FHIR server, ensuring clinical interoperability and standard compliance.",
    "multimodal": "Next, we review visual diagnostics. In the Multimodal Board, we select coordinates to pinpoint ST-elevation pathology directly on the ECG image, document clinician findings, and attach them to the EHR for complete diagnostic context.",
    "redteam": "To stress-test safety, the Red-Team Lab runs adversarial jailbreaks to bypass clinical guidelines. Our safety auditor monitors the traffic, flagging violations in the telemetry console. We also use Clinical Compare to evaluate safety behaviors side-by-side across LLM gateways.",
    "clinician": "Under the Clinician pillar, Clinical Copilot automates EHR note scribing and diagnostic suggestions. In the Doc Workbench, we audit note formatting, while Deep Research synthesizes multi-source medical insights from PubMed.",
    "drift": "To prevent model decay, we run Drift Tests to evaluate clinical reasoning drift across ten thousand simulated patient flows. The Benchmark Lab further evaluates twenty standard MedQA cases, computing aggregate safety scores before routing.",
    "outro": "Lumen provides the pre-deployment safety gate clinical AI deserves, protecting patient lives. We credit the open-source community, including the Band SDK, HAPI FHIR, medSpacy, PyHealth, and OMOP. Lumen was built with the Antigravity IDE. Thank you for watching."
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

async def generate_speech(text, output_path, voice="en-US-AndrewNeural"):
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
        
    # Skip scrollIntoView if the element is part of the sticky navigation bar or already in viewport
    is_in_nav = await locator.evaluate("el => !!el.closest('.app-nav')")
    is_in_viewport = await locator.evaluate("""el => {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }""")
    if not is_in_nav and not is_in_viewport:
        # Scroll to center to prevent floating header or telemetry panel overlap
        await locator.evaluate("el => el.scrollIntoView({ block: 'center' })")
        await page.wait_for_timeout(800)
    else:
        print("Element is in navigation or already in viewport. Skipping scrollIntoView.")
    
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

async def click_with_verify(page, click_selector, verification_selector, retries=5):
    print(f"Clicking {click_selector} and verifying with {verification_selector}...")
    for attempt in range(retries):
        try:
            await click_with_mouse(page, click_selector)
            # Wait a short moment to see if verification selector is visible
            await page.wait_for_selector(verification_selector, state="visible", timeout=2500)
            print(f"Successfully clicked and verified {click_selector}")
            return
        except Exception as e:
            print(f"Attempt {attempt+1} click on {click_selector} did not trigger verification: {e}. Retrying...")
            await asyncio.sleep(1.0)
    raise RuntimeError(f"Failed to verify click on {click_selector} after {retries} attempts.")

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

async def switch_to_tab(page, tab_name, verification_selector, retries=5):
    print(f"Switching to tab: {tab_name}...")
    tab_selector = f'button.rpanel-tab:has-text("{tab_name}")'
    for attempt in range(retries):
        try:
            await page.evaluate("window.scrollTo(0, 0)")
            await click_with_mouse(page, tab_selector)
            # wait up to 2.5s for verification_selector to be visible
            await page.wait_for_selector(verification_selector, state="visible", timeout=2500)
            print(f"Successfully switched to tab: {tab_name}")
            return
        except Exception as e:
            print(f"Attempt {attempt+1} to switch to tab {tab_name} failed: {e}. Retrying...")
            await asyncio.sleep(1.0)
    raise RuntimeError(f"Failed to switch to tab {tab_name} after {retries} attempts.")

async def switch_to_mode(page, pillar, target_mode, verification_selector, retries=5):
    print(f"Switching to mode: {target_mode} under pillar: {pillar}...")
    pillar_btn_selector = f'button.nav-menu-btn:has-text("{pillar}")'
    dropdown_link_selector = f'button:has-text("{target_mode}")'
    
    for attempt in range(retries):
        try:
            # Move mouse away to reset hover state
            await move_mouse_to(page, 960, 100, steps=10)
            await page.wait_for_timeout(300)
            
            # Hover over the pillar button
            await move_mouse_to_element(page, pillar_btn_selector, steps=15)
            await page.wait_for_timeout(800)
            
            # Click the dropdown link
            await click_with_mouse(page, dropdown_link_selector, steps=15)
            
            # Wait for verification selector
            await page.wait_for_selector(verification_selector, state="visible", timeout=3000)
            # Force scroll-to-top to override any layout offsets
            await page.evaluate("window.scrollTo(0, 0)")
            print(f"Successfully switched to mode {target_mode}")
            await page.wait_for_timeout(1000)
            return
        except Exception as e:
            print(f"Attempt {attempt+1} to switch to mode {target_mode} under pillar {pillar} failed: {e}. Retrying...")
            await asyncio.sleep(1.0)
    raise RuntimeError(f"Failed to switch to mode {target_mode} under pillar {pillar} after {retries} attempts.")

async def main():
    os.makedirs("recordings", exist_ok=True)
    os.makedirs("demo_assets", exist_ok=True)
    
    print("Starting OpenVINO local model server...")
    openvino_log = open("openvino_server.log", "w")
    openvino_proc = subprocess.Popen([
        sys.executable,
        "server/server_host.py"
    ], stdout=openvino_log, stderr=openvino_log)
    
    try:
        # Wait for OpenVINO startup
        await asyncio.sleep(3.0)
        
        # 1. Generate Voiceover Audio Files
        audio_paths = {}
        for key, text in VOICEOVERS.items():
            path = f"recordings/{key}.mp3"
            await generate_speech(text, path)
            audio_paths[key] = path
            
        user_voice_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "name.m4a"))
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
            
        # Compile segment 0 audio: intro_1 + user_voice + intro_2
        print("Concatenating intro segment audio...")
        segment_0_audio_cmd = [
            "ffmpeg", "-y",
            "-i", audio_paths["intro_1"],
            "-i", user_voice_path,
            "-i", audio_paths["intro_2"],
            "-filter_complex",
            "[0:a]aresample=44100[a0];"
            "[1:a]aresample=44100[a1];"
            "[2:a]aresample=44100[a2];"
            "[a0][a1][a2]concat=n=3:v=0:a=1[outa]",
            "-map", "[outa]", "recordings/segment_0_audio.mp3"
        ]
        run_cmd(segment_0_audio_cmd)
        
        # Setup audio mapping for all 8 segments
        segment_audios = {
            0: "recordings/segment_0_audio.mp3",
            1: audio_paths["step_1"],
            2: audio_paths["fhir"],
            3: audio_paths["multimodal"],
            4: audio_paths["redteam"],
            5: audio_paths["clinician"],
            6: audio_paths["drift"],
            7: audio_paths["outro"]
        }
        
        segment_durations = {
            0: durations["intro_1"] + durations["user_voice"] + durations["intro_2"],
            1: durations["step_1"],
            2: durations["fhir"],
            3: durations["multimodal"],
            4: durations["redteam"],
            5: durations["clinician"],
            6: durations["drift"],
            7: durations["outro"]
        }
        
        # 2. Compile SRT Subtitles using accurate durations
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
            
        # Segment 0 Subtitles (Intro Part 1, User Voice, Intro Part 2)
        srt_content += add_srt_entry(1, current_time, durations["intro_1"], VOICEOVERS["intro_1"])
        current_time += durations["intro_1"]
        srt_content += add_srt_entry(2, current_time, durations["user_voice"], "I am Dr. Baddam Sucharith Reddy.")
        current_time += durations["user_voice"]
        srt_content += add_srt_entry(3, current_time, durations["intro_2"], VOICEOVERS["intro_2"])
        current_time += durations["intro_2"]
        
        # Remaining segments
        srt_content += add_srt_entry(4, current_time, durations["step_1"], VOICEOVERS["step_1"])
        current_time += durations["step_1"]
        
        srt_content += add_srt_entry(5, current_time, durations["fhir"], VOICEOVERS["fhir"])
        current_time += durations["fhir"]
        
        srt_content += add_srt_entry(6, current_time, durations["multimodal"], VOICEOVERS["multimodal"])
        current_time += durations["multimodal"]
        
        srt_content += add_srt_entry(7, current_time, durations["redteam"], VOICEOVERS["redteam"])
        current_time += durations["redteam"]
        
        srt_content += add_srt_entry(8, current_time, durations["clinician"], VOICEOVERS["clinician"])
        current_time += durations["clinician"]
        
        srt_content += add_srt_entry(9, current_time, durations["drift"], VOICEOVERS["drift"])
        current_time += durations["drift"]
        
        srt_content += add_srt_entry(10, current_time, durations["outro"], VOICEOVERS["outro"])
        
        srt_path = "demo_assets/subtitles.srt"
        with open(srt_path, "w") as f:
            f.write(srt_content)
        print(f"Subtitles saved to {srt_path}")
        
        # Concatenate audio tracks into full_audio.mp3
        print("Concatenating all segment audio tracks into full_audio.mp3...")
        concat_audio_cmd = [
            "ffmpeg", "-y",
            "-i", segment_audios[0],
            "-i", segment_audios[1],
            "-i", segment_audios[2],
            "-i", segment_audios[3],
            "-i", segment_audios[4],
            "-i", segment_audios[5],
            "-i", segment_audios[6],
            "-i", segment_audios[7],
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
        run_cmd(concat_audio_cmd)
        total_audio_duration = get_duration("recordings/full_audio.mp3")
        print(f"Combined audio duration: {total_audio_duration:.2f}s")
        
        # 3. Automate Walkthrough using Playwright and capture segment bounds
        timestamps = []
        
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
            
            def mark_segment_start(idx):
                elapsed = time.time() - recording_start_time
                print(f"SEGMENT START: {idx} at {elapsed:.2f}s")
                timestamps.append({"index": idx, "start": elapsed})
                
            def mark_segment_end(idx):
                elapsed = time.time() - recording_start_time
                print(f"SEGMENT END: {idx} at {elapsed:.2f}s")
                for item in timestamps:
                    if item["index"] == idx:
                        item["end"] = elapsed
            
            # Navigate to Local dev server containing the auto-scroll fix
            print("Navigating to local development server...")
            await page.goto("http://localhost:3000")
            await page.wait_for_load_state("load")
            await page.evaluate("localStorage.setItem('lumen_use_demo_scripts', 'true')")
            await page.wait_for_timeout(1000)
            
            # --- SEGMENT 0: Intro (Splash, settings, preset select) ---
            mark_segment_start(0)
            seg_0_start = time.time()
            
            await show_splash_screen(page)
            # Wait for splash screen display during intro narrative
            await asyncio.sleep(durations["intro_1"] + durations["user_voice"])
            
            await hide_splash_screen(page)
            await asyncio.sleep(1.0)
            await inject_cursor(page)
            
            # Enter passcode
            if await page.locator('input[type="password"]').count() > 0:
                print("Entering passcode...")
                await fill_with_mouse(page, 'input[type="password"]', "LUMEN2026")
                await page.wait_for_timeout(500)
                await click_with_mouse(page, 'button:has-text("Unlock Workstation")')
                await page.wait_for_timeout(2000)
                
            # Switch to Light Mode immediately
            print("Switching theme to Light Mode...")
            is_dark = await page.evaluate("() => document.documentElement.getAttribute('data-theme') !== 'light'")
            if is_dark:
                theme_btn = page.locator('button[title="Switch to light mode"]')
                if await theme_btn.count() > 0:
                    await click_with_mouse(page, theme_btn)
                else:
                    await page.evaluate("() => { document.documentElement.setAttribute('data-theme', 'light'); localStorage.setItem('lumen-theme', 'light'); }")
                await page.wait_for_timeout(1000)
                
            # Open settings and load OpenVINO
            print("Configuring settings presets...")
            await click_with_mouse(page, 'button[title="Clinical AI Model Settings"]')
            await page.wait_for_timeout(1000)
            await click_with_mouse(page, 'button.preset-btn:has-text("Intel OpenVINO")')
            await page.wait_for_timeout(1000)
            await click_with_mouse(page, 'button:has-text("Save & Apply")')
            await page.wait_for_timeout(1500)
            
            # Enable Live LLM Engine and select doctor/patient/red-team options
            live_checkbox = page.locator('.violation-toggle:has-text("Live LLM Engine") input[type="checkbox"]')
            if not await live_checkbox.is_checked():
                await click_with_mouse(page, '.violation-toggle:has-text("Live LLM Engine") label.toggle-switch')
                await page.wait_for_timeout(1000)
                
            await page.locator('div.violation-toggle:has-text("🩺 Doctor Model") select').select_option("openvino")
            await page.wait_for_timeout(500)
            await page.locator('div.violation-toggle:has-text("👤 Patient Model") select').select_option("openvino")
            await page.wait_for_timeout(500)
            await page.locator('div.violation-toggle:has-text("🔴 Red-Team Model") select').select_option("openvino")
            await page.wait_for_timeout(1500)
            
            # Sync timing for intro segment
            seg_0_elapsed = time.time() - seg_0_start
            if seg_0_elapsed < segment_durations[0]:
                print(f"Sync sleep: Intro segment remaining {segment_durations[0] - seg_0_elapsed:.2f}s")
                await asyncio.sleep(segment_durations[0] - seg_0_elapsed)
            
            mark_segment_end(0)
            
            # --- SEGMENT 1: Step 1 & Full Sandbox Patient Simulation Loop ---
            mark_segment_start(1)
            seg_1_start = time.time()
            
            print("Selecting Sarah Jenkins patient scenario...")
            await click_with_mouse(page, 'button.patient-card:has-text("Sarah Jenkins")')
            await page.wait_for_timeout(1000)
            
            await zoom_to_element(page, ".panel-chat", scale=1.4)
            print("Running full sandbox simulation loops...")
            
            # Run the steps in a loop until Compile button is visible
            simulation_timeout = time.time() + 150.0  # 2.5 minutes maximum timeout
            while time.time() < simulation_timeout:
                compile_btn = page.locator('button:has-text("Compile Audit & FHIR")')
                if await compile_btn.count() > 0:
                    is_visible = await compile_btn.is_visible()
                    if is_visible:
                        print("Compile Audit button visible in segment 1!")
                        break
                    
                execute_btn = page.locator('button:has-text("Execute Lab")')
                if await execute_btn.count() > 0:
                    is_visible = await execute_btn.first.is_visible()
                    if is_visible:
                        print("Unblocking tool call...")
                        await click_with_mouse(page, execute_btn.first)
                        await asyncio.sleep(2.5)
                        continue
                    
                step_btn = page.locator('button:has-text("Step →")')
                if await step_btn.count() > 0:
                    is_visible = await step_btn.is_visible()
                    if is_visible:
                        is_disabled = await step_btn.get_attribute("disabled") is not None
                        if not is_disabled:
                            await click_with_mouse(page, step_btn)
                            await asyncio.sleep(2.5)
                        else:
                            print("Waiting for step button to be enabled (model generating)...")
                            await asyncio.sleep(1.5)
                    else:
                        await asyncio.sleep(1.0)
                else:
                    await asyncio.sleep(1.0)
            
            await page.screenshot(path="recordings/debug_segment_1_end.png")
            await page.wait_for_timeout(1500)
            
            # Sync timing for simulation segment
            seg_1_elapsed = time.time() - seg_1_start
            if seg_1_elapsed < segment_durations[1]:
                print(f"Sync sleep: Step 1 segment remaining {segment_durations[1] - seg_1_elapsed:.2f}s")
                await asyncio.sleep(segment_durations[1] - seg_1_elapsed)
                
            mark_segment_end(1)
            
            # --- SEGMENT 2: FHIR R4 Validation & Safety Audit ---
            mark_segment_start(2)
            seg_2_start = time.time()
            
            await zoom_out(page)
            await page.screenshot(path="recordings/debug_segment_2_start.png")
            buttons = await page.locator("button").all_inner_texts()
            print("AVAILABLE BUTTONS IN SEGMENT 2:", buttons)
            
            # Execute all pending tool calls before compiling
            while True:
                execute_btn = page.locator('button:has-text("Execute Lab")')
                if await execute_btn.count() > 0:
                    if await execute_btn.first.is_visible():
                        print("Executing pending tool call in Segment 2...")
                        await click_with_mouse(page, execute_btn.first)
                        await page.wait_for_timeout(3000)
                        continue
                break
                    
            print("Compiling Audit...")
            await click_with_mouse(page, 'button:has-text("Compile Audit & FHIR")')
            await page.wait_for_selector('button:has-text("FHIR R4")', timeout=30000)
            await page.wait_for_timeout(1000)
            
            await switch_to_tab(page, "FHIR R4", "button:has-text('Validate Bundle')")
            await click_with_mouse(page, 'button:has-text("Validate Bundle")')
            await zoom_to_element(page, ".fhir-panel", scale=1.3)
            await page.wait_for_timeout(1500)
            
            # Sync timing for FHIR segment
            seg_2_elapsed = time.time() - seg_2_start
            if seg_2_elapsed < segment_durations[2]:
                print(f"Sync sleep: FHIR segment remaining {segment_durations[2] - seg_2_elapsed:.2f}s")
                await asyncio.sleep(segment_durations[2] - seg_2_elapsed)
                
            mark_segment_end(2)
            
            # --- SEGMENT 3: Multimodal Board ---
            mark_segment_start(3)
            seg_3_start = time.time()
            
            await zoom_out(page)
            print("Opening Multimodal Board...")
            await switch_to_tab(page, "Multimodal Board", "button:has-text('ECG Strip')")
            await click_with_mouse(page, 'button:has-text("ECG Strip")')
            await page.wait_for_timeout(1000)
            
            img_locator = page.locator('img[src*="ecg_stemi"]').first
            await img_locator.wait_for(state="visible", timeout=10000)
            await img_locator.evaluate("el => el.scrollIntoView({ block: 'center' })")
            await page.wait_for_timeout(300)
            box = await img_locator.bounding_box()
            if box:
                x = box["x"] + box["width"] * 0.6
                y = box["y"] + box["height"] * 0.4
                await move_mouse_to(page, x, y, steps=20)
                await page.mouse.down()
                await asyncio.sleep(0.15)
                await page.mouse.up()
            await page.wait_for_timeout(1000)
            
            await zoom_to_element(page, ".multimodal-grid", scale=1.3)
            await fill_with_mouse(page, 'textarea[id="clinician-notes"]', "Dr. Baddam Sucharith Reddy notes significant ST-elevation in leads V2-V4 indicating acute anterior myocardial infarction.")
            await page.wait_for_timeout(1000)
            await click_with_verify(page, 'button:has-text("Attach Visual Finding")', 'button:has-text("Clear Attached Finding")')
            await page.wait_for_timeout(1500)
            
            # Sync timing for Multimodal segment
            seg_3_elapsed = time.time() - seg_3_start
            if seg_3_elapsed < segment_durations[3]:
                print(f"Sync sleep: Multimodal segment remaining {segment_durations[3] - seg_3_elapsed:.2f}s")
                await asyncio.sleep(segment_durations[3] - seg_3_elapsed)
                
            mark_segment_end(3)
            
            # --- SEGMENT 4: Red-Team Lab & Clinical Compare ---
            mark_segment_start(4)
            seg_4_start = time.time()
            
            await zoom_out(page)
            # Open Red-Team Lab
            await switch_to_mode(page, "Sandbox", "Red-Team Lab", 'div.rt-badge:has-text("Red-Team Mode Active")')
            await page.wait_for_timeout(2000)
            # Open Clinical Compare
            await switch_to_mode(page, "Sandbox", "Clinical Compare", 'div.rt-badge:has-text("Clinical Compare Module Active")')
            await page.wait_for_timeout(2000)
            
            # Sync timing for Redteam segment
            seg_4_elapsed = time.time() - seg_4_start
            if seg_4_elapsed < segment_durations[4]:
                print(f"Sync sleep: Redteam segment remaining {segment_durations[4] - seg_4_elapsed:.2f}s")
                await asyncio.sleep(segment_durations[4] - seg_4_elapsed)
                
            mark_segment_end(4)
            
            # --- SEGMENT 5: Clinician (Copilot, Scribe & Deep Research) ---
            mark_segment_start(5)
            seg_5_start = time.time()
            
            # Open Clinical Copilot
            await switch_to_mode(page, "Clinician", "Clinical Copilot", 'div.rt-badge:has-text("Medical Clinical Copilot Active")')
            await page.wait_for_timeout(2000)
            # Open Doc Workbench
            await switch_to_mode(page, "Clinician", "Doc Workbench", 'div.rt-badge:has-text("Medical Scribe & Document Workbench Active")')
            await page.wait_for_timeout(2000)
            # Open Deep Research
            await switch_to_mode(page, "Clinician", "Deep Research", 'div.rt-badge:has-text("Guidelines Deep Research Synthesizer Active")')
            await page.wait_for_timeout(2000)
            
            # Sync timing for Clinician segment
            seg_5_elapsed = time.time() - seg_5_start
            if seg_5_elapsed < segment_durations[5]:
                print(f"Sync sleep: Clinician segment remaining {segment_durations[5] - seg_5_elapsed:.2f}s")
                await asyncio.sleep(segment_durations[5] - seg_5_elapsed)
                
            mark_segment_end(5)
            
            # --- SEGMENT 6: Drift & Benchmark Lab ---
            mark_segment_start(6)
            seg_6_start = time.time()
            
            # Open Benchmark Lab
            await switch_to_mode(page, "Sandbox", "Benchmark Lab", 'h3:has-text("Clinical LLM Benchmark Lab")')
            await page.wait_for_timeout(1000)
            print("Running Benchmark...")
            await click_with_verify(page, 'button:has-text("Run Benchmark")', 'span:has-text("Evaluating MedQA Safety Targets")', retries=5)
            await page.wait_for_selector('button:has-text("Reset")', timeout=30000)
            await page.wait_for_timeout(2000)
            
            # Open Safety Leaderboard
            await switch_to_mode(page, "Standards", "Safety Leaderboard", '.leaderboard-view')
            await page.wait_for_timeout(1000)
            print("Opening Clinical Governance & Drift Auditor...")
            await click_with_verify(page, 'button.lb-subpanel-tab:has-text("Clinical Governance & Drift Auditor")', 'h4:has-text("Real-Time Model Drift")')
            await page.wait_for_timeout(1000)
            print("Triggering Model Drift Check...")
            await click_with_verify(page, 'button:has-text("Trigger Model Drift Check")', 'button:has-text("Simulating 10,000 Patient Flows")')
            await page.wait_for_timeout(6000)
            
            # Sync timing for Drift segment
            seg_6_elapsed = time.time() - seg_6_start
            if seg_6_elapsed < segment_durations[6]:
                print(f"Sync sleep: Drift segment remaining {segment_durations[6] - seg_6_elapsed:.2f}s")
                await asyncio.sleep(segment_durations[6] - seg_6_elapsed)
                
            mark_segment_end(6)
            
            # --- SEGMENT 7: Outro & Credits ---
            mark_segment_start(7)
            seg_7_start = time.time()
            
            # Return to Simulation Sandbox at home first
            await switch_to_mode(page, "Sandbox", "Clinical Simulation", 'button:has-text("Step →")')
            await zoom_out(page)
            await switch_to_tab(page, "Safety Audit", ".panel-audit")
            await page.wait_for_timeout(1000)
            
            # Scroll to footer
            print("Scrolling to credits...")
            await page.evaluate("window.scrollTo(0, 1000)")
            
            # Sync timing for Outro segment
            seg_7_elapsed = time.time() - seg_7_start
            if seg_7_elapsed < segment_durations[7]:
                print(f"Sync sleep: Outro segment remaining {segment_durations[7] - seg_7_elapsed:.2f}s")
                await asyncio.sleep(segment_durations[7] - seg_7_elapsed)
            
            mark_segment_end(7)
            
            await context.close()
            video_path = await page.video.path()
            print(f"Raw video saved at: {video_path}")
            run_cmd(["cp", video_path, "recordings/raw_video.webm"])
            await browser.close()
            
            # 4. Timeline Offset Calibration
            raw_video_dur = get_duration("recordings/raw_video.webm")
            total_elapsed = time.time() - recording_start_time
            delay = max(0.0, total_elapsed - raw_video_dur)
            print(f"\n=============================================")
            print(f"⏱️ CALIBRATION DETAILS:")
            print(f"Raw Video Duration: {raw_video_dur:.2f}s")
            print(f"Total Python Elapsed: {total_elapsed:.2f}s")
            print(f"Offset delay to subtract: {delay:.2f}s")
            print(f"=============================================\n")
            
            # Adjust segment boundaries
            for item in timestamps:
                item["start"] = max(0.0, item["start"] - delay)
                if "end" in item:
                    item["end"] = max(0.0, item["end"] - delay)
            
            # Convert variable frame rate raw WebM to constant frame rate MP4
            print("Transcoding raw WebM to constant frame rate (CFR) MP4 for frame-accurate slicing...")
            transcode_cmd = [
                "ffmpeg", "-y",
                "-i", "recordings/raw_video.webm",
                "-c:v", "libx264",
                "-preset", "ultrafast",
                "-crf", "18",
                "-r", "25",
                "-g", "25",
                "-keyint_min", "25",
                "-force_key_frames", "expr:gte(t,n_forced*1)",
                "-fps_mode", "cfr",
                "recordings/raw_video_cfr.mp4"
            ]
            run_cmd(transcode_cmd)
            
        # 5. FFmpeg Post-Production Segment Processing
        print("\n--- Slicing and scaling segments via FFmpeg ---")
        concat_list_content = ""
        for i in range(8):
            seg_start = timestamps[i]["start"]
            seg_end = timestamps[i]["end"]
            d_video = seg_end - seg_start
            d_audio = segment_durations[i]
            
            print(f"Segment {i}: raw video={d_video:.2f}s, target audio={d_audio:.2f}s (seek start={seg_start:.3f}s)")
            
            output_seg_path = f"recordings/segment_{i}_scaled.mp4"
            if d_video >= d_audio:
                # Video too slow, speed up
                filter_str = f"[0:v]setpts=PTS-STARTPTS,setpts=({d_audio:.6f}/{d_video:.6f})*PTS,fps=25[outv]"
                cmd = [
                    "ffmpeg", "-y",
                    "-ss", f"{seg_start:.3f}",
                    "-t", f"{d_video:.3f}",
                    "-i", "recordings/raw_video_cfr.mp4",
                    "-filter_complex", filter_str,
                    "-map", "[outv]",
                    "-an",
                    "-c:v", "libx264",
                    "-pix_fmt", "yuv420p",
                    "-r", "25",
                    output_seg_path
                ]
            else:
                # Video too fast, pad/clone last frame
                pad_dur = d_audio - d_video
                filter_str = f"[0:v]setpts=PTS-STARTPTS,tpad=stop_duration={pad_dur:.6f}:stop_mode=clone,fps=25[outv]"
                cmd = [
                    "ffmpeg", "-y",
                    "-ss", f"{seg_start:.3f}",
                    "-t", f"{d_video:.3f}",
                    "-i", "recordings/raw_video_cfr.mp4",
                    "-filter_complex", filter_str,
                    "-map", "[outv]",
                    "-an",
                    "-c:v", "libx264",
                    "-pix_fmt", "yuv420p",
                    "-r", "25",
                    output_seg_path
                ]
            run_cmd(cmd)
            concat_list_content += f"file 'segment_{i}_scaled.mp4'\n"
            
        concat_list_path = "recordings/concat_list.txt"
        with open(concat_list_path, "w") as f:
            f.write(concat_list_content)
            
        print("Concatenating scaled segments...")
        concat_video_cmd = [
            "ffmpeg", "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", concat_list_path,
            "-c", "copy",
            "recordings/full_video_scaled.mp4"
        ]
        run_cmd(concat_video_cmd)
        
        # 6. Final Compilation with full audio and background music
        print("Compiling final video...")
        final_output_path = "demo_assets/product_demo.mp4"
        compile_cmd = [
            "ffmpeg", "-y",
            "-i", "recordings/full_video_scaled.mp4",
            "-i", "recordings/full_audio.mp3",
            "-i", "recordings/bg_music.mp3",
            "-filter_complex",
            "[1:a]volume=1.0[v_nar];"
            f"[2:a]volume=0.07,afade=t=out:st={total_audio_duration - 3.0:.2f}:d=3[v_bg];"
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
            final_output_path
        ]
        run_cmd(compile_cmd)
        
        print("\n=============================================")
        print(f"🎉 SUCCESS! Final product demo compiled at: {final_output_path}")
        print("Subtitles file and final audio copied to demo_assets/ folder.")
        print("=============================================")
        
    finally:
        print("Shutting down OpenVINO local model server...")
        openvino_proc.terminate()
        openvino_proc.wait()
        openvino_log.close()

if __name__ == "__main__":
    asyncio.run(main())
