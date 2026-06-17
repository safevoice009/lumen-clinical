import asyncio
from playwright.async_api import async_playwright
import os

async def wait_for_step_enabled(page):
    print("Waiting for Step button to be enabled (model inference)...")
    # Wait up to 180 seconds (3 minutes) for local CPU model inference and load cycles to complete
    await page.wait_for_selector('button:has-text("Step →"):not([disabled])', timeout=180000)
    print("Step button is now enabled.")

async def main():
    import time
    import json
    
    os.makedirs("recordings", exist_ok=True)
    async with async_playwright() as p:
        print("Launching browser...")
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            record_video_dir="recordings/",
            record_video_size={"width": 1920, "height": 1080}
        )
        page = await context.new_page()
        
        start_time = time.time()
        timeline = []
        
        def log_event(name):
            elapsed = time.time() - start_time
            print(f"EVENT: {name} at {elapsed:.2f}s")
            timeline.append({"event": name, "timestamp": elapsed})
            
        log_event("start")
        
        # Attach console listeners for debugging
        page.on("console", lambda msg: print(f"BROWSER CONSOLE [{msg.type}]: {msg.text}"))
        page.on("pageerror", lambda err: print(f"BROWSER ERROR: {err.message}"))
        
        print("Navigating to local dev app on http://localhost:3000...")
        await page.goto("http://localhost:3000")
        await page.wait_for_load_state("load")
        await page.wait_for_timeout(2000)
        
        print("Checking if passcode lock screen is visible...")
        if await page.locator('input[type="password"]').count() > 0:
            print("Passcode screen visible. Unlocking with passcode...")
            await page.fill('input[type="password"]', "LUMEN2026")
            await page.click('button:has-text("Unlock Workstation")')
            await page.wait_for_timeout(2000)
            log_event("passcode_unlocked")
        else:
            print("No passcode lock screen visible. Already unlocked.")
            log_event("passcode_unlocked")
            
        await page.screenshot(path="recordings/unlocked_state.png")
        
        print("Opening Settings...")
        await page.click('button[title="Clinical AI Model Settings"]')
        await page.wait_for_timeout(1500)
        log_event("settings_open")
        await page.screenshot(path="recordings/settings_open.png")
        
        print("Selecting Intel OpenVINO preset...")
        await page.click('button.preset-btn:has-text("Intel OpenVINO")')
        await page.wait_for_timeout(1000)
        log_event("preset_selected")
        await page.screenshot(path="recordings/preset_selected.png")
        
        print("Saving settings...")
        await page.click('button:has-text("Save & Apply")')
        await page.wait_for_timeout(2000)
        log_event("settings_saved")
        await page.screenshot(path="recordings/after_save.png")
        
        print("Enabling Live LLM Engine...")
        live_checkbox = page.locator('.violation-toggle:has-text("Live LLM Engine") input[type="checkbox"]')
        is_checked = await live_checkbox.is_checked()
        if not is_checked:
            await page.click('.violation-toggle:has-text("Live LLM Engine") label.toggle-switch')
            await page.wait_for_timeout(1000)
        log_event("live_mode_enabled")
        await page.screenshot(path="recordings/live_mode_enabled.png")
        
        print("Selecting openvino in Doctor Model dropdown...")
        await page.locator('div.violation-toggle:has-text("🩺 Doctor Model") select').select_option("openvino")
        await page.wait_for_timeout(1000)

        print("Selecting openvino in Patient Model dropdown...")
        await page.locator('div.violation-toggle:has-text("👤 Patient Model") select').select_option("openvino")
        await page.wait_for_timeout(1000)

        print("Selecting openvino in Red-Team Model dropdown...")
        await page.locator('div.violation-toggle:has-text("🔴 Red-Team Model") select').select_option("openvino")
        await page.wait_for_timeout(1000)
        log_event("dropdowns_selected")
        await page.screenshot(path="recordings/dropdowns_selected.png")
        
        # Verify the Step button is ready
        await wait_for_step_enabled(page)
        
        print("Triggering Step 1...")
        log_event("step_1_start")
        await page.click('button:has-text("Step →")')
        
        # Wait for Step 1 to complete inference
        await wait_for_step_enabled(page)
        log_event("step_1_completed")
        await page.wait_for_timeout(3000)
        await page.screenshot(path="recordings/step_1_completed.png")
        
        print("Switching to Multimodal Board...")
        await page.click('button:has-text("Multimodal Board")')
        await page.wait_for_timeout(1500)
        log_event("multimodal_board_open")
        await page.screenshot(path="recordings/multimodal_board_open.png")
        
        print("Selecting ECG Strip preset...")
        await page.click('button:has-text("ECG Strip")')
        await page.wait_for_timeout(1500)
        log_event("ecg_selected")
        await page.screenshot(path="recordings/ecg_strip_selected.png")
        
        print("Clicking on ECG image coordinates to mark pathology...")
        img_locator = page.locator('img[alt="ECG Strip: Anterior STEMI (ST-Elevation)"]')
        box = await img_locator.bounding_box()
        if box:
            print(f"ECG image bounding box: {box}")
            await img_locator.click(position={"x": box["width"] * 0.6, "y": box["height"] * 0.4})
        else:
            print("ECG image bounding box not found, clicking fallback coordinates")
            await page.mouse.click(600, 500)
            
        await page.wait_for_timeout(1500)
        log_event("ecg_clicked")
        await page.screenshot(path="recordings/ecg_clicked.png")
        
        print("Writing clinician annotation notes...")
        await page.fill('textarea[id="clinician-notes"]', "Dr. Baddam Sucharith Reddy notes significant ST-elevation in leads V2-V4 indicating acute anterior myocardial infarction.")
        await page.wait_for_timeout(1000)
        log_event("notes_written")
        await page.screenshot(path="recordings/notes_written.png")
        
        print("Attaching visual finding...")
        await page.click('button:has-text("Attach Visual Finding")')
        await page.wait_for_timeout(1500)
        log_event("finding_attached")
        await page.screenshot(path="recordings/finding_attached.png")
        
        print("Triggering Step 2 (Multimodal safety check)...")
        log_event("step_2_start")
        await page.click('button:has-text("Step →")')
        
        # Wait for Step 2 to complete inference (requires 180s timeout)
        await wait_for_step_enabled(page)
        log_event("step_2_completed")
        await page.wait_for_timeout(3000)
        await page.screenshot(path="recordings/step_2_completed.png")
        
        print("Switching to FHIR R4 tab...")
        await page.click('button:has-text("FHIR R4")')
        await page.wait_for_timeout(1500)
        log_event("fhir_tab_open")
        await page.screenshot(path="recordings/fhir_tab_open.png")
        
        print("Validating FHIR Bundle against HAPI FHIR server...")
        await page.click('button:has-text("Validate Bundle")')
        print("Waiting 8 seconds for HAPI validation response...")
        await page.wait_for_timeout(8000)
        log_event("fhir_validated")
        await page.screenshot(path="recordings/fhir_validated.png")
        
        print("Switching back to Safety Audit tab...")
        await page.click('button:has-text("Safety Audit")')
        await page.wait_for_timeout(3000)
        log_event("safety_audit_tab_open")
        await page.screenshot(path="recordings/final_state.png")
        
        log_event("end")
        
        print("Closing context and saving video...")
        await context.close()
        video_path = await page.video.path()
        print(f"Video recorded successfully at: {video_path}")
        
        with open("recordings/last_video_path.txt", "w") as f:
            f.write(video_path)
            
        with open("recordings/timeline.json", "w") as f:
            json.dump(timeline, f, indent=2)
            print("Timeline saved to recordings/timeline.json")
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
