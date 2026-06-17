import os
import argparse
import subprocess
from huggingface_hub import snapshot_download

MODEL_MAPPING = {
    "qwen": {
        "repo_id": "OpenVINO/Qwen2.5-7B-Instruct-int4-ov",
        "desc": "Qwen 2.5 7B Instruct (INT4 Quantized for OpenVINO)"
    },
    "deepseek": {
        "repo_id": "OpenVINO/DeepSeek-R1-Distill-Qwen-7B-int4-ov",
        "desc": "DeepSeek R1 Distill Qwen 7B (INT4 Quantized for OpenVINO)"
    },
    "gemma": {
        "repo_id": "OpenVINO/gemma-4-12b-it-int4-ov",
        "desc": "Gemma 4 12B Instruct (INT4 Quantized for OpenVINO - Gated model)"
    },
    "medgemma": {
        "repo_id": "convaiinnovations/medgemma-4b-ecginstruct",
        "desc": "MedGemma 4B Instruct (Public community model - auto-converted to OpenVINO INT4)"
    }
}

OPENVINO_MODELS_DIR = "/home/sucharithpop/intel-ai-playground/models/LLM/openvino"

def download_model(model_key, token=None):
    if model_key not in MODEL_MAPPING:
        print(f"Error: Unknown model key '{model_key}'. Available options: {list(MODEL_MAPPING.keys())}")
        return False
    
    model_info = MODEL_MAPPING[model_key]
    repo_id = model_info["repo_id"]
    
    # Set destinations
    if model_key == "medgemma":
        dest_dir = os.path.join("models", "medgemma-raw")
        final_ov_dir = os.path.join(OPENVINO_MODELS_DIR, "OpenVINO---medgemma-int4-ov")
    else:
        dest_dir = os.path.join("models", model_key)
        final_ov_dir = None
        
    print(f"\n==================================================")
    print(f"Starting download of: {model_info['desc']}")
    print(f"Repository: {repo_id}")
    print(f"Destination: {os.path.abspath(dest_dir)}")
    print(f"==================================================\n")
    
    try:
        snapshot_download(
            repo_id=repo_id,
            local_dir=dest_dir,
            local_dir_use_symlinks=False,
            token=token
        )
        print(f"\nSuccessfully downloaded and saved raw files to '{dest_dir}'!\n")
        
        # If it's medgemma, run the OpenVINO conversion step
        if model_key == "medgemma":
            print(f"==================================================")
            print(f"Converting raw MedGemma weights to OpenVINO INT4...")
            print(f"Output Directory: {final_ov_dir}")
            print(f"==================================================\n")
            
            os.makedirs(OPENVINO_MODELS_DIR, exist_ok=True)
            
            # Use the virtual environment's optimum-cli tool
            venv_optimum_cli = "/home/sucharithpop/Downloads/re/.venv/bin/optimum-cli"
            
            cmd = [
                venv_optimum_cli,
                "export",
                "openvino",
                "--model", dest_dir,
                "--weight-format", "int4",
                "--task", "image-text-to-text",
                final_ov_dir
            ]
            
            print(f"Running command: {' '.join(cmd)}")
            result = subprocess.run(cmd, capture_output=False, text=True)
            
            if result.returncode == 0:
                print(f"\n✓ MedGemma converted to OpenVINO INT4 successfully!")
                print(f"Cleaning up raw download directory to save disk space...")
                subprocess.run(["rm", "-rf", dest_dir])
                print("Raw cleanup complete.")
                return True
            else:
                print(f"\n✗ Error during OpenVINO model export. Return code: {result.returncode}")
                return False
                
        return True
    except Exception as e:
        print(f"\nError downloading/converting model '{model_key}': {e}")
        if model_key in ["gemma", "medgemma"]:
            print("\nNOTE: Gemma and MedGemma are gated models. You must accept Google's terms on Hugging Face")
            print("and provide your Hugging Face API token using the '--token' argument.")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Download OpenVINO INT4 models from Hugging Face for Host Server.")
    parser.add_argument(
        "model", 
        choices=list(MODEL_MAPPING.keys()) + ["all"], 
        help="The model to download. Choose 'all' to download all of them."
    )
    parser.add_argument(
        "--token", 
        default=None, 
        help="Hugging Face API token (required for gated models like Gemma or MedGemma)."
    )
    
    args = parser.parse_args()
    
    os.makedirs("models", exist_ok=True)
    
    if args.model == "all":
        for key in MODEL_MAPPING.keys():
            download_model(key, args.token)
    else:
        download_model(args.model, args.token)
