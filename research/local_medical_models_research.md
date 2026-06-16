# Local Medical AI Models Research for Pop!_OS

Pop!_OS (developed by System76) is a Ubuntu-based Linux distribution optimized for Nvidia CUDA, AMD ROCm, and Intel OpenVINO, making it an excellent platform for hosting local quantized LLMs. This document outlines suitable open-source medical models and explains how to configure them for multi-agent simulation in **Lumen**.

---

## 📸 Medical AI Image Presets & References

Based on the latest open-source healthcare AI benchmarks (OpenMedLLM, HuggingFace Open Health AI, MedicalModelLibrary, and Cake.ai):

### 1. MedGemma (Google Health)
*   **Sizes:** 4B (Multimodal) & 27B (Text & Multimodal).
*   **Architecture:** Gemma 2 / Gemma 3.
*   **Use Cases:** Clinical text reasoning, 2D diagnostic image interpretation (Chest X-Rays, dermatology scans).
*   **Ollama Tag:** `medgemma:4b` (approx 3.0 GB download).
*   **Hardware Fit on Pop!_OS:** Runs extremely fast on consumer NVIDIA GPUs (e.g., RTX 3060/4060) or system RAM via CPU thread orchestration.

### 2. Meditron (EPFL)
*   **Sizes:** 7B & 70B.
*   **Architecture:** Llama 2 adapted for medical literature, guidelines, and textbooks.
*   **Use Cases:** High-fidelity clinical Q&A, guideline compliance (WHO/NHS).
*   **Ollama Tag:** `meditron:7b` (approx 4.7 GB download).
*   **Hardware Fit on Pop!_OS:** Fits comfortably in 8GB VRAM cards.

### 3. Qwen2.5-Coder (Alibaba)
*   **Sizes:** 0.5B, 1.5B, 7B, 14B, 32B.
*   **Architecture:** Specialized code/reasoning models.
*   **Use Cases:** Ideal for simulating non-medical agents (e.g., **Patient Persona**, **Red-Team Intruder**, and **Safety Auditor**) because of its strict adherence to structured JSON schemas and fast token-per-second generation.
*   **Ollama Tag:** `qwen2.5-coder:1.5b` (approx 1.0 GB download) or `qwen2.5-coder:0.5b` (approx 350 MB download).
*   **Hardware Fit on Pop!_OS:** Can run concurrently alongside MedGemma without overloading VRAM (running smoothly in 8GB–16GB unified configurations).

---

## 🛠️ On-Device Multi-Agent Assignment Matrix

To run the four agents smoothly in parallel on a single local host (e.g. system with 16GB RAM + GPU):

| Agent | Role | Local Model Selection | Execution Backend | Memory Footprint |
|-------|------|-----------------------|-------------------|------------------|
| 🩺 **Doctor** | Diagnoses & Prescribes | `medgemma:4b` or `meditron:7b` | Ollama (`localhost:11434`) | ~3.0 GB |
| 👤 **Patient** | Simulation & Dialogue | `qwen2.5-coder:1.5b` or `0.5b` | Ollama / OpenVINO | ~1.0 GB |
| 🔴 **Red-Team** | Jailbreaks & Prompt Injection | `qwen2.5-coder:1.5b` or `0.5b` | Ollama / OpenVINO | Shared |
| 🔍 **Auditor** | Checks safety & logs telemetry | `qwen2.5-coder:1.5b` or `0.5b` | Ollama / OpenVINO | Shared |

Total local memory footprint: **~4.5 GB VRAM / RAM**, enabling real-time, low-latency agent chat loops entirely offline on Pop!_OS.

---

## 🚀 Step-by-Step Pop!_OS Setup Guide

To load these models for local execution:

### Step 1: Install Ollama
Ensure you have the Nvidia Container Toolkit installed if you have an NVIDIA GPU (standard on Pop!_OS Nvidia ISO):
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Step 2: Download Models
Run these commands to pull the optimized models:
```bash
ollama pull medgemma:4b
ollama pull qwen2.5-coder:1.5b
```

### Step 3: Run the Local API Server
Ollama launches an API server automatically on port `11434`. Validate that it is reachable:
```bash
curl http://localhost:11434/api/tags
```
If models are running on OpenVINO, direct requests to port `8000` (`http://127.0.0.1:8000/v1`).
