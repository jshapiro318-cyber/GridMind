// ─────────────────────────────────────────────────────────────────────────────
// GridMind static reference catalog.
//
// This is the "facts about the world" layer: providers, regions, GPUs, models.
// It is intentionally framework-agnostic and import-safe on both server and
// client. When real provider integrations land, these tables get populated from
// live pricing/availability APIs instead of being hard-coded — the rest of the
// app reads through the same shapes.
// ─────────────────────────────────────────────────────────────────────────────

export type ProviderKind = "hyperscaler" | "neocloud";

export interface Provider {
  id: string;
  name: string;
  short: string;
  kind: ProviderKind;
  /** Multiplier applied to a GPU's reference hourly rate. */
  priceMult: number;
  accent: string;
  gpuIds: string[];
  regionIds: string[];
}

export interface Region {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  /** Industrial electricity price, US¢ per kWh. */
  electricityCents: number;
  /** Grid carbon intensity, gCO₂ per kWh. */
  carbon: number;
  /** Renewable share of the grid, 0–100. */
  renewablePct: number;
  /** Data-center power usage effectiveness. */
  pue: number;
  /** Representative network latency to the workload's users, ms. */
  latencyMs: number;
  /** Spare GPU capacity right now, 0–1. */
  availability: number;
}

export interface GpuType {
  id: string;
  name: string;
  vendor: "NVIDIA" | "AMD";
  vramGB: number;
  /** Relative training/inference throughput, A100-80GB = 1.0. */
  perf: number;
  /** Reference on-demand rate before provider multiplier, USD/hr. */
  refHourly: number;
  /** Board power draw, watts. */
  tdpW: number;
}

export interface ModelDef {
  id: string;
  name: string;
  family: "LLM" | "Image" | "Audio" | "Embedding" | "Custom";
  params: string;
  preferredGpu: string;
}

export const PROVIDERS: Provider[] = [
  {
    id: "aws",
    name: "Amazon Web Services",
    short: "AWS",
    kind: "hyperscaler",
    priceMult: 1.28,
    accent: "#ff9900",
    gpuIds: ["h200", "h100", "a100-80", "a100-40", "l40s", "a10g", "l4"],
    regionIds: ["us-east-1", "us-east-2", "us-west-2", "eu-west-1", "eu-central-1", "ap-south-1", "ap-southeast-1", "ap-northeast-1", "sa-east-1"],
  },
  {
    id: "gcp",
    name: "Google Cloud",
    short: "GCP",
    kind: "hyperscaler",
    priceMult: 1.2,
    accent: "#4285f4",
    gpuIds: ["h200", "h100", "a100-80", "a100-40", "l4"],
    regionIds: ["us-east-1", "us-west-2", "us-central-tx", "eu-west-1", "eu-north-1", "ap-south-1", "ap-northeast-1"],
  },
  {
    id: "azure",
    name: "Microsoft Azure",
    short: "Azure",
    kind: "hyperscaler",
    priceMult: 1.24,
    accent: "#0a84ff",
    gpuIds: ["h200", "h100", "a100-80", "l40s", "a10g"],
    regionIds: ["us-east-1", "us-east-2", "us-west-2", "eu-west-1", "eu-central-1", "ap-southeast-1", "ap-northeast-1"],
  },
  {
    id: "coreweave",
    name: "CoreWeave",
    short: "CoreWeave",
    kind: "neocloud",
    priceMult: 0.86,
    accent: "#7c5cff",
    gpuIds: ["h200", "h100", "a100-80", "a100-40", "l40s"],
    regionIds: ["us-east-1", "us-east-2", "us-west-2", "eu-west-1"],
  },
  {
    id: "lambda",
    name: "Lambda Labs",
    short: "Lambda",
    kind: "neocloud",
    priceMult: 0.8,
    accent: "#ecb84c",
    gpuIds: ["h200", "h100", "a100-80", "a100-40"],
    regionIds: ["us-east-1", "us-west-2", "us-central-tx"],
  },
  {
    id: "crusoe",
    name: "Crusoe",
    short: "Crusoe",
    kind: "neocloud",
    priceMult: 0.83,
    accent: "#4ad991",
    gpuIds: ["h200", "h100", "a100-80", "l40s"],
    regionIds: ["us-central-tx", "us-west-2", "ca-central"],
  },
  {
    id: "together",
    name: "Together AI",
    short: "Together",
    kind: "neocloud",
    priceMult: 0.77,
    accent: "#5b8cff",
    gpuIds: ["h200", "h100", "a100-80", "l40s"],
    regionIds: ["us-east-1", "us-west-2", "eu-north-1"],
  },
  {
    id: "runpod",
    name: "RunPod",
    short: "RunPod",
    kind: "neocloud",
    priceMult: 0.7,
    accent: "#a98bff",
    gpuIds: ["h100", "a100-80", "a100-40", "l40s", "a10g", "l4"],
    regionIds: ["us-east-2", "us-central-tx", "eu-central-1", "ap-south-1"],
  },
];

export const REGIONS: Region[] = [
  { id: "us-east-1", name: "US East (N. Virginia)", city: "Ashburn", country: "USA", lat: 38.95, lon: -77.45, electricityCents: 11.5, carbon: 367, renewablePct: 38, pue: 1.18, latencyMs: 12, availability: 0.6 },
  { id: "us-east-2", name: "US East (Ohio)", city: "Columbus", country: "USA", lat: 40.0, lon: -83.0, electricityCents: 9.8, carbon: 410, renewablePct: 28, pue: 1.16, latencyMs: 19, availability: 0.71 },
  { id: "us-west-2", name: "US West (Oregon)", city: "Boardman", country: "USA", lat: 45.87, lon: -119.69, electricityCents: 7.2, carbon: 95, renewablePct: 86, pue: 1.15, latencyMs: 24, availability: 0.66 },
  { id: "us-central-tx", name: "US Central (Texas)", city: "Dallas", country: "USA", lat: 32.78, lon: -96.8, electricityCents: 8.4, carbon: 392, renewablePct: 31, pue: 1.2, latencyMs: 16, availability: 0.79 },
  { id: "ca-central", name: "Canada (Montréal)", city: "Montréal", country: "Canada", lat: 45.5, lon: -73.57, electricityCents: 6.1, carbon: 31, renewablePct: 99, pue: 1.13, latencyMs: 21, availability: 0.55 },
  { id: "eu-west-1", name: "EU West (Ireland)", city: "Dublin", country: "Ireland", lat: 53.34, lon: -6.26, electricityCents: 24.5, carbon: 296, renewablePct: 43, pue: 1.21, latencyMs: 92, availability: 0.49 },
  { id: "eu-central-1", name: "EU Central (Frankfurt)", city: "Frankfurt", country: "Germany", lat: 50.11, lon: 8.68, electricityCents: 31.2, carbon: 372, renewablePct: 52, pue: 1.22, latencyMs: 98, availability: 0.47 },
  { id: "eu-north-1", name: "EU North (Stockholm)", city: "Stockholm", country: "Sweden", lat: 59.33, lon: 18.07, electricityCents: 9.4, carbon: 24, renewablePct: 98, pue: 1.1, latencyMs: 105, availability: 0.58 },
  { id: "ap-south-1", name: "Asia Pacific (Mumbai)", city: "Mumbai", country: "India", lat: 19.08, lon: 72.88, electricityCents: 8.9, carbon: 708, renewablePct: 19, pue: 1.34, latencyMs: 180, availability: 0.6 },
  { id: "ap-southeast-1", name: "Asia Pacific (Singapore)", city: "Singapore", country: "Singapore", lat: 1.35, lon: 103.82, electricityCents: 18.6, carbon: 408, renewablePct: 4, pue: 1.32, latencyMs: 165, availability: 0.44 },
  { id: "ap-northeast-1", name: "Asia Pacific (Tokyo)", city: "Tokyo", country: "Japan", lat: 35.68, lon: 139.69, electricityCents: 23.8, carbon: 462, renewablePct: 23, pue: 1.28, latencyMs: 150, availability: 0.42 },
  { id: "sa-east-1", name: "South America (São Paulo)", city: "São Paulo", country: "Brazil", lat: -23.55, lon: -46.63, electricityCents: 11.7, carbon: 99, renewablePct: 83, pue: 1.25, latencyMs: 140, availability: 0.5 },
  { id: "me-central-1", name: "Middle East (UAE)", city: "Dubai", country: "UAE", lat: 25.2, lon: 55.27, electricityCents: 7.8, carbon: 489, renewablePct: 9, pue: 1.4, latencyMs: 170, availability: 0.52 },
];

export const GPUS: GpuType[] = [
  { id: "h200", name: "NVIDIA H200", vendor: "NVIDIA", vramGB: 141, perf: 1.95, refHourly: 4.5, tdpW: 700 },
  { id: "h100", name: "NVIDIA H100", vendor: "NVIDIA", vramGB: 80, perf: 1.6, refHourly: 3.2, tdpW: 700 },
  { id: "mi300x", name: "AMD MI300X", vendor: "AMD", vramGB: 192, perf: 1.55, refHourly: 2.9, tdpW: 750 },
  { id: "a100-80", name: "NVIDIA A100 80GB", vendor: "NVIDIA", vramGB: 80, perf: 1.0, refHourly: 1.85, tdpW: 400 },
  { id: "a100-40", name: "NVIDIA A100 40GB", vendor: "NVIDIA", vramGB: 40, perf: 0.92, refHourly: 1.45, tdpW: 400 },
  { id: "l40s", name: "NVIDIA L40S", vendor: "NVIDIA", vramGB: 48, perf: 0.72, refHourly: 1.05, tdpW: 350 },
  { id: "a10g", name: "NVIDIA A10G", vendor: "NVIDIA", vramGB: 24, perf: 0.42, refHourly: 0.75, tdpW: 150 },
  { id: "l4", name: "NVIDIA L4", vendor: "NVIDIA", vramGB: 24, perf: 0.34, refHourly: 0.43, tdpW: 72 },
];

export const MODELS: ModelDef[] = [
  { id: "llama-3.1-405b", name: "Llama 3.1 405B", family: "LLM", params: "405B", preferredGpu: "h200" },
  { id: "llama-3.1-70b", name: "Llama 3.1 70B", family: "LLM", params: "70B", preferredGpu: "h100" },
  { id: "llama-3.1-8b", name: "Llama 3.1 8B", family: "LLM", params: "8B", preferredGpu: "a100-40" },
  { id: "mixtral-8x22b", name: "Mixtral 8x22B", family: "LLM", params: "141B", preferredGpu: "h100" },
  { id: "qwen2.5-72b", name: "Qwen2.5 72B", family: "LLM", params: "72B", preferredGpu: "h100" },
  { id: "gpt-oss-120b", name: "GPT-OSS 120B", family: "LLM", params: "120B", preferredGpu: "h200" },
  { id: "sdxl", name: "Stable Diffusion XL", family: "Image", params: "3.5B", preferredGpu: "l40s" },
  { id: "whisper-v3", name: "Whisper Large v3", family: "Audio", params: "1.5B", preferredGpu: "a10g" },
  { id: "bge-m3", name: "BGE-M3 Embeddings", family: "Embedding", params: "0.6B", preferredGpu: "l4" },
  { id: "ft-support-13b", name: "Support Agent FT 13B", family: "Custom", params: "13B", preferredGpu: "a100-80" },
];

export const TEAMS = ["Research", "Platform", "Product", "Data Science", "Growth"] as const;
export type Team = (typeof TEAMS)[number];

export interface ProjectDef {
  id: string;
  name: string;
  team: Team;
}

export const PROJECTS: ProjectDef[] = [
  { id: "atlas", name: "Atlas Foundation Model", team: "Research" },
  { id: "ft-factory", name: "Fine-tune Factory", team: "Research" },
  { id: "inference-gw", name: "Inference Gateway", team: "Platform" },
  { id: "eval-harness", name: "Eval Harness", team: "Platform" },
  { id: "rag-kb", name: "RAG Knowledge Base", team: "Product" },
  { id: "voice-agents", name: "Voice Agents", team: "Product" },
  { id: "vision-pipe", name: "Vision Pipeline", team: "Data Science" },
  { id: "batch-embed", name: "Batch Embeddings", team: "Data Science" },
  { id: "reco-v3", name: "Recommender v3", team: "Growth" },
];

// ── Lookup helpers ───────────────────────────────────────────────────────────
export const providerById = (id: string) => PROVIDERS.find((p) => p.id === id);
export const regionById = (id: string) => REGIONS.find((r) => r.id === id);
export const gpuById = (id: string) => GPUS.find((g) => g.id === id);
export const modelById = (id: string) => MODELS.find((m) => m.id === id);
export const projectById = (id: string) => PROJECTS.find((p) => p.id === id);

/** On-demand hourly rate for a GPU on a given provider, USD/hr. */
export function hourlyRate(gpuId: string, providerId: string): number {
  const g = gpuById(gpuId);
  const p = providerById(providerId);
  if (!g || !p) return 0;
  return g.refHourly * p.priceMult;
}

/**
 * Equirectangular projection → unit square [0,1].
 * Used to place region nodes on the Global Compute Map.
 */
export function project(lat: number, lon: number): { x: number; y: number } {
  return { x: (lon + 180) / 360, y: (90 - lat) / 180 };
}
