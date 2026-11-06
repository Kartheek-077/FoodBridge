import { AxiosError, AxiosHeaders, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios";
import { handleMockRequest, type MockFile } from "./handlers";
import { refreshDbFromStorage } from "./db";

let latencyMs = 450;
export function setMockLatency(ms: number) {
  latencyMs = ms;
}

const MAX_IMAGE_DIM = 1000;

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

/** Downscale images so they fit comfortably in localStorage. */
async function fileToMock(file: File): Promise<MockFile> {
  const base = { name: file.name, type: file.type, size: file.size };
  try {
    if (file.type.startsWith("image/") && typeof createImageBitmap !== "undefined") {
      const bmp = await createImageBitmap(file);
      const scale = Math.min(1, MAX_IMAGE_DIM / Math.max(bmp.width, bmp.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bmp.width * scale);
      canvas.height = Math.round(bmp.height * scale);
      canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
      return { ...base, dataUrl: canvas.toDataURL("image/jpeg", 0.75) };
    }
    if (file.size > 1_500_000) return { ...base, dataUrl: null };
    return { ...base, dataUrl: await readAsDataUrl(file) };
  } catch {
    return { ...base, dataUrl: null };
  }
}

async function normalizeBody(data: unknown): Promise<Record<string, unknown> | null> {
  if (data == null) return null;
  if (typeof FormData !== "undefined" && data instanceof FormData) {
    const out: Record<string, unknown> = {};
    for (const [key, value] of data.entries()) {
      out[key] = typeof value === "string" ? value : await fileToMock(value as File);
    }
    return out;
  }
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  return data as Record<string, unknown>;
}

/** Axios adapter that answers every request from the in-browser mock backend. */
export const mockAdapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
  const headers = AxiosHeaders.from(config.headers);
  const auth = headers.get("Authorization");
  const body = await normalizeBody(config.data);
  if (latencyMs > 0) await new Promise((r) => setTimeout(r, latencyMs + Math.random() * 250));
  refreshDbFromStorage();
  const res = handleMockRequest({
    method: config.method ?? "get",
    url: config.url ?? "",
    params: config.params,
    body,
    token: typeof auth === "string" ? auth : null,
  });
  const response = {
    data: res.data,
    status: res.status,
    statusText: res.status < 400 ? "OK" : "Error",
    headers: new AxiosHeaders(),
    config,
    request: {},
  };
  if (res.status >= 400) {
    const message = (res.data as { message?: string })?.message ?? "Request failed";
    throw new AxiosError(
      message,
      res.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
      config,
      {},
      response,
    );
  }
  return response;
};
