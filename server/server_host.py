import os
import gc
import time
import asyncio
import threading
import psutil
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    import openvino_genai as ov_genai
except ImportError:
    ov_genai = None

app = FastAPI(title="OpenVINO Host Model Server for Odysseus")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global states
ACTIVE_MODEL_KEY = None
ACTIVE_DEVICE = "CPU"
PIPELINE = None
STATE_LOCK = threading.Lock()
DOWNLOADS = {}

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
OPENVINO_MODELS_DIR = "/home/sucharithpop/intel-ai-playground/models/LLM/openvino"
EXTERNAL_MODELS_DIR = "/media/sucharithpop/01DCEAE1E7161EC0/dev/tresd/pop_os"

def get_model_configs() -> Dict[str, Dict[str, str]]:
    configs = {}
    
    # Core default fallback
    configs["qwen"] = {
        "name": "Qwen 3 4B",
        "path": "/home/sucharithpop/intel-ai-playground/models/LLM/openvino/OpenVINO---Qwen3-4B-int4-ov"
    }
    
    dirs_to_scan = [OPENVINO_MODELS_DIR, EXTERNAL_MODELS_DIR, MODELS_DIR]
    for m_dir in dirs_to_scan:
        if os.path.exists(m_dir):
            try:
                for entry in os.scandir(m_dir):
                    if entry.is_dir():
                        path = entry.path
                        has_xml = os.path.exists(os.path.join(path, "openvino_model.xml")) or os.path.exists(os.path.join(path, "openvino_language_model.xml"))
                        if has_xml:
                            folder_name = entry.name
                            key = folder_name.replace("OpenVINO---", "").lower()
                            if key.endswith("-ov"):
                                key = key[:-3]
                            
                            clean_key = key
                            if "medgemma" in key:
                                clean_key = "medgemma"
                            elif "gemma" in key:
                                clean_key = "gemma"
                            elif "qwen" in key:
                                if "coder" in key:
                                    clean_key = "coder"
                                elif "vl" in key:
                                    clean_key = "qwen-vl"
                                elif "deepseek" in key or "r1" in key:
                                    clean_key = "deepseek"
                                else:
                                    clean_key = "qwen"
                            elif "deepseek" in key or "r1" in key:
                                clean_key = "deepseek"
                                
                            name = folder_name.replace("OpenVINO---", "").replace("-ov", "").replace("---", " ").replace("-", " ")
                            configs[clean_key] = {
                                "name": name.title(),
                                "path": path
                            }
            except Exception as e:
                print(f"Error scanning OpenVINO models in {m_dir}: {e}")
                
    return configs

class SwitchModelRequest(BaseModel):
    model: str
    device: str = "CPU"

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatCompletionRequest(BaseModel):
    model: str
    messages: List[ChatMessage]
    stream: bool = False
    temperature: float = 0.7
    max_tokens: int = 4096
    top_p: float = 0.9
    response_format: Optional[Dict[str, Any]] = None

    class Config:
        extra = "allow"

class DownloadRequest(BaseModel):
    model: str
    token: Optional[str] = None

class QueueStreamer:
    def __init__(self, queue: asyncio.Queue, loop: asyncio.AbstractEventLoop):
        self.queue = queue
        self.loop = loop
        self.is_aborted = False

    def __call__(self, subword: str) -> bool:
        if self.is_aborted:
            return True
        self.loop.call_soon_threadsafe(self.queue.put_nowait, subword)
        return False

def format_prompt(messages: List[Dict[str, str]], model_key: str) -> str:
    if model_key in ["qwen", "deepseek", "coder"]:
        prompt = ""
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "system":
                prompt += f"<|im_start|>system\n{content}<|im_end|>\n"
            elif role == "user":
                prompt += f"<|im_start|>user\n{content}<|im_end|>\n"
            elif role == "assistant":
                prompt += f"<|im_start|>assistant\n{content}<|im_end|>\n"
        prompt += "<|im_start|>assistant\n"
        return prompt
    elif model_key in ["gemma", "medgemma"]:
        prompt = ""
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "system":
                prompt += f"<start_of_turn>user\nSystem instruction: {content}<end_of_turn>\n"
            elif role == "user":
                prompt += f"<start_of_turn>user\n{content}<end_of_turn>\n"
            elif role == "assistant" or role == "model":
                prompt += f"<start_of_turn>model\n{content}<end_of_turn>\n"
        prompt += "<start_of_turn>model\n"
        return prompt
    else:
        prompt = ""
        for msg in messages:
            prompt += f"{msg.get('role', 'user')}: {msg.get('content', '')}\n"
        prompt += "assistant: "
        return prompt

def get_installed_models() -> List[str]:
    installed = []
    configs = get_model_configs()
    for key, cfg in configs.items():
        model_path = cfg["path"]
        if os.path.exists(model_path):
            try:
                has_xml = any(f.endswith(".xml") for f in os.listdir(model_path))
                if has_xml:
                    installed.append(key)
            except Exception:
                pass
    return installed

def load_model_internal(model_key: str, device: str) -> bool:
    global ACTIVE_MODEL_KEY, ACTIVE_DEVICE, PIPELINE
    
    if ov_genai is None:
        print("Error: openvino_genai not imported")
        return False
        
    if PIPELINE is not None:
        print(f"Unloading model: {ACTIVE_MODEL_KEY}...")
        PIPELINE = None
        # Force garbage collection multiple times to clear python references
        for _ in range(3):
            gc.collect()
        try:
            import ctypes
            libc = ctypes.CDLL("libc.so.6")
            # Force trimmer multiple times to release all free blocks
            for _ in range(3):
                libc.malloc_trim(0)
            print("Successfully trimmed memory via malloc_trim.")
        except Exception as trim_err:
            print(f"Failed to trim memory: {trim_err}")
        time.sleep(1)
        
    configs = get_model_configs()
    cfg = configs.get(model_key)
    if not cfg:
        return False
        
    model_path = cfg["path"]
    if not os.path.exists(model_path):
        return False
        
    print(f"Loading '{model_key}' on device '{device}'...")
    try:
        if device.upper() == "CPU":
            # Dynamic core usage optimization to prevent system lag and freeze
            logical_cores = psutil.cpu_count(logical=True) or 4
            physical_cores = psutil.cpu_count(logical=False) or logical_cores
            optimal_threads = max(2, physical_cores)
            # Leave at least 2 logical cores free on multi-core systems for OS/GUI smoothness
            if logical_cores > 4:
                optimal_threads = min(optimal_threads, logical_cores - 2)
                
            print(f"Applying CPU optimization properties: threads={optimal_threads}")
            ov_config = {
                "INFERENCE_NUM_THREADS": str(optimal_threads),
                "NUM_STREAMS": "1",
                "PERFORMANCE_HINT": "LATENCY",
                "ENABLE_CPU_PINNING": "NO"
            }
            if model_key == "medgemma":
                PIPELINE = ov_genai.VLMPipeline(model_path, "CPU", **ov_config)
            else:
                PIPELINE = ov_genai.LLMPipeline(model_path, "CPU", **ov_config)
        else:
            if model_key == "medgemma":
                PIPELINE = ov_genai.VLMPipeline(model_path, device.upper())
            else:
                PIPELINE = ov_genai.LLMPipeline(model_path, device.upper())
        ACTIVE_MODEL_KEY = model_key
        ACTIVE_DEVICE = device.upper()
        print("Model loaded successfully.")
        return True
    except Exception as e:
        print(f"Error loading model: {e}")
        PIPELINE = None
        ACTIVE_MODEL_KEY = None
        return False

@app.get("/api/status")
def status():
    vm = psutil.virtual_memory()
    installed = get_installed_models()
    configs = get_model_configs()
    return {
        "active_model": ACTIVE_MODEL_KEY,
        "active_device": ACTIVE_DEVICE,
        "models_installed": installed,
        "models_available": list(configs.keys()),
        "ram": {
            "total_gb": round(vm.total / (1024**3), 2),
            "used_gb": round(vm.used / (1024**3), 2),
            "percent": vm.percent
        }
    }

@app.post("/api/switch")
def switch_model(req: SwitchModelRequest):
    if ov_genai is None:
        raise HTTPException(status_code=500, detail="OpenVINO GenAI not installed")
        
    configs = get_model_configs()
    if req.model not in configs:
        raise HTTPException(status_code=400, detail="Invalid model")
        
    device = req.device.upper()
    if device not in ["CPU", "GPU"]:
        raise HTTPException(status_code=400, detail="Invalid device")
        
    installed = get_installed_models()
    if req.model not in installed:
        raise HTTPException(status_code=400, detail="Model weights not downloaded")
        
    with STATE_LOCK:
        success = load_model_internal(req.model, device)
        
    if not success:
        raise HTTPException(status_code=500, detail="Error loading model")
        
    return {"status": "success", "active_model": ACTIVE_MODEL_KEY, "device": ACTIVE_DEVICE}

@app.get("/v1/models")
@app.get("/models")
def list_models():
    installed = get_installed_models()
    configs = get_model_configs()
    data = []
    for key in installed:
        cfg = configs.get(key)
        if cfg:
            folder_name = os.path.basename(cfg["path"])
            data.append({
                "id": folder_name,
                "object": "model",
                "created": int(time.time()),
                "owned_by": "openvino"
            })
    return {"object": "list", "data": data}

def load_model_with_lock(target_key: str, device: str) -> bool:
    with STATE_LOCK:
        if PIPELINE is None or ACTIVE_MODEL_KEY != target_key:
            return load_model_internal(target_key, device)
        return True

@app.post("/v1/chat/completions")
async def chat_completions(req: ChatCompletionRequest):
    global PIPELINE, ACTIVE_MODEL_KEY
    
    # Normalize requested model key
    requested_model = req.model.lower()
    target_key = "qwen"
    if "medgemma" in requested_model:
        target_key = "medgemma"
    elif "gemma" in requested_model:
        target_key = "gemma"
    elif "deepseek" in requested_model or "r1" in requested_model:
        target_key = "deepseek"
    elif "coder" in requested_model:
        target_key = "coder"
    elif "qwen" in requested_model:
        target_key = "qwen"
        
    print(f"[DEBUG] chat_completions: requested_model={req.model}, target_key={target_key}")
        
    installed = get_installed_models()
    if target_key not in installed:
        if installed:
            target_key = installed[0]
        else:
            raise HTTPException(status_code=400, detail="No models downloaded.")
            
    # Switch models dynamically if not loaded or if a different model is requested
    if PIPELINE is None or ACTIVE_MODEL_KEY != target_key:
        success = await asyncio.to_thread(load_model_with_lock, target_key, "CPU")
        if not success:
            raise HTTPException(status_code=500, detail=f"Failed to load model: {target_key}")
                
    msg_dicts = [{"role": m.role, "content": m.content} for m in req.messages]
    formatted_prompt = format_prompt(msg_dicts, ACTIVE_MODEL_KEY)
    
    gen_config = ov_genai.GenerationConfig()
    gen_config.max_new_tokens = req.max_tokens
    if req.temperature > 0:
        gen_config.temperature = req.temperature
        gen_config.top_p = req.top_p
        gen_config.do_sample = True
    else:
        gen_config.do_sample = False

    if req.stream:
        queue = asyncio.Queue()
        loop = asyncio.get_running_loop()
        streamer = QueueStreamer(queue, loop)

        def run_inference():
            with STATE_LOCK:
                try:
                    PIPELINE.generate(formatted_prompt, generation_config=gen_config, streamer=streamer)
                except Exception as e:
                    print(f"Error: {e}")
                finally:
                    # Clean up local references to prevent reference cycles
                    del streamer
                    loop.call_soon_threadsafe(queue.put_nowait, None)

        threading.Thread(target=run_inference, daemon=True).start()

        async def event_generator():
            created_time = int(time.time())
            completion_id = f"chatcmpl-{created_time}"
            
            try:
                while True:
                    token = await queue.get()
                    if token is None:
                        yield f"data: [DONE]\n\n"
                        break
                    
                    chunk = {
                        "id": completion_id,
                        "object": "chat.completion.chunk",
                        "created": created_time,
                        "model": ACTIVE_MODEL_KEY,
                        "choices": [
                            {
                                "index": 0,
                                "delta": {"content": token},
                                "finish_reason": None
                            }
                        ]
                    }
                    import json
                    yield f"data: {json.dumps(chunk)}\n\n"
            except asyncio.CancelledError:
                streamer.is_aborted = True
                print("Client disconnected, aborting generation...")
                raise

        return StreamingResponse(event_generator(), media_type="text/event-stream")
        
    else:
        try:
            def run_sync():
                with STATE_LOCK:
                    return PIPELINE.generate(formatted_prompt, generation_config=gen_config)
                
            response_text = await asyncio.to_thread(run_sync)
            response_str = str(response_text)
            tokens_count = len(response_str.split())
            
            return {
                "id": f"chatcmpl-{int(time.time())}",
                "object": "chat.completion",
                "created": int(time.time()),
                "model": ACTIVE_MODEL_KEY,
                "choices": [
                    {
                        "index": 0,
                        "message": {
                            "role": "assistant",
                            "content": response_str
                        },
                        "finish_reason": "stop"
                    }
                ],
                "usage": {
                    "completion_tokens": tokens_count,
                    "total_tokens": tokens_count
                }
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

# Model download background tasks
def bg_download_thread(model_key: str, token: Optional[str]):
    global DOWNLOADS
    from download_host_models import MODEL_MAPPING, download_model
    
    cfg = MODEL_MAPPING.get(model_key)
    if not cfg:
        DOWNLOADS[model_key] = {"status": "failed", "progress": 0, "message": "Unknown model key"}
        return
        
    repo_id = cfg["repo_id"]
    DOWNLOADS[model_key] = {"status": "running", "progress": 10, "message": f"Starting download/conversion of {repo_id}..."}
    
    try:
        # Run download and OpenVINO conversion directly
        success = download_model(model_key, token)
        if success:
            DOWNLOADS[model_key] = {
                "status": "completed", 
                "progress": 100, 
                "message": f"Successfully loaded model '{model_key}' to OpenVINO local storage."
            }
        else:
            DOWNLOADS[model_key] = {
                "status": "failed", 
                "progress": 0, 
                "message": f"Failed to download/convert model '{model_key}'. Check console logs or token authorization."
            }
    except Exception as e:
        err_msg = str(e)
        if "gated" in err_msg.lower() or "authorization" in err_msg.lower() or "401" in err_msg.lower():
            err_msg = "Access denied. Model is gated. Please ensure you accepted terms on Hugging Face and provided a valid HF API token."
        DOWNLOADS[model_key] = {
            "status": "failed", 
            "progress": 0, 
            "message": f"Error: {err_msg}"
        }

@app.post("/api/download")
def start_download(req: DownloadRequest):
    global DOWNLOADS
    configs = get_model_configs()
    if req.model not in configs:
        raise HTTPException(status_code=400, detail="Invalid model choice")
        
    status_info = DOWNLOADS.get(req.model, {})
    if status_info.get("status") == "running":
        return {"status": "running", "message": "Download is already in progress"}
        
    DOWNLOADS[req.model] = {"status": "running", "progress": 0, "message": "Initiating download..."}
    
    threading.Thread(target=bg_download_thread, args=(req.model, req.token), daemon=True).start()
    return {"status": "success", "message": "Download started in background"}

@app.get("/api/download-status")
def get_download_status(model: str):
    global DOWNLOADS
    configs = get_model_configs()
    if model not in configs:
        raise HTTPException(status_code=400, detail="Invalid model choice")
        
    status_info = DOWNLOADS.get(model)
    if not status_info:
        installed = get_installed_models()
        if model in installed:
            return {"status": "completed", "progress": 100, "message": "Model is already present on local disk."}
        else:
            return {"status": "idle", "progress": 0, "message": "Not downloaded yet."}
            
    return status_info

if __name__ == "__main__":
    import uvicorn
    print(f"OpenVINO host model server starting on port 8000. Models found: {get_installed_models()}")
    uvicorn.run("server_host:app", host="0.0.0.0", port=8000, reload=False)
