const EMBEDDING_SERVICE_URL = process.env.EMBEDDING_SERVICE_URL || "http://localhost:8000";

export async function getEmbedding(imageBuffer: Buffer): Promise<number[]> {
  const form = new FormData();
  form.append("file", new Blob([imageBuffer]), "image.jpg");

  const response = await fetch(`${EMBEDDING_SERVICE_URL}/embed`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    throw new Error(`embedding_service_error_${response.status}`);
  }

  const data = (await response.json()) as { embedding: number[] };
  return data.embedding;
}
