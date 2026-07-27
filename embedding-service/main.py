import io

import open_clip
import torch
from fastapi import FastAPI, File, UploadFile
from PIL import Image

app = FastAPI(title="CrushAI Embedding Service")

MODEL_NAME = "ViT-B-32"
PRETRAINED = "laion2b_s34b_b79k"

device = "cuda" if torch.cuda.is_available() else "cpu"
model, _, preprocess = open_clip.create_model_and_transforms(MODEL_NAME, pretrained=PRETRAINED)
model.to(device)
model.eval()


@app.get("/health")
def health():
    return {"ok": True, "device": device, "model": MODEL_NAME}


@app.post("/embed")
async def embed(file: UploadFile = File(...)):
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    tensor = preprocess(image).unsqueeze(0).to(device)

    with torch.no_grad():
        features = model.encode_image(tensor)
        features = features / features.norm(dim=-1, keepdim=True)

    embedding = features.squeeze(0).cpu().tolist()
    return {"embedding": embedding, "dim": len(embedding)}
