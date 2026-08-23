import os
import sys
import urllib.request
import tarfile
from pathlib import Path

MODEL_NAME = "sherpa-onnx-streaming-zipformer-ar_en_id_ja_ru_th_vi_zh-2025-02-10"
MODEL_URL = f"https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/{MODEL_NAME}.tar.bz2"
MODELS_DIR = Path(__file__).resolve().parent / "models"
MODEL_DIR = MODELS_DIR / MODEL_NAME

def report_hook(count, block_size, total_size):
    if total_size > 0:
        percent = int(count * block_size * 100 / total_size)
        if percent % 10 == 0:
            sys.stdout.write(f"\rDownloading: {percent}%")
            sys.stdout.flush()

def download_and_extract():
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    
    # Check if the extracted directory exists and is not empty
    if MODEL_DIR.exists() and any(MODEL_DIR.iterdir()):
        print(f"✅ Model {MODEL_NAME} already exists. Skipping download.")
        return

    tar_path = MODELS_DIR / f"{MODEL_NAME}.tar.bz2"
    
    if not tar_path.exists():
        print(f"⏳ Downloading {MODEL_NAME} (approx 247MB, this may take a while)...")
        try:
            urllib.request.urlretrieve(MODEL_URL, tar_path, reporthook=report_hook)
            print("\n✅ Download completed.")
        except Exception as e:
            print(f"\n❌ Failed to download model: {e}")
            sys.exit(1)
            
    print("⏳ Extracting model...")
    try:
        with tarfile.open(tar_path, "r:bz2") as tar:
            tar.extractall(path=MODELS_DIR)
        print("✅ Extraction completed.")
        
        # Remove tar to save space if needed
        # tar_path.unlink()
    except Exception as e:
        print(f"❌ Failed to extract model: {e}")
        sys.exit(1)

if __name__ == "__main__":
    download_and_extract()
