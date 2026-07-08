const API_BASE = import.meta.env.VITE_API_URL || "";

export interface TranscriptLine {
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

export interface Call {
  call_id: string;
  caller_phone: string;
  status: "active" | "ended";
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  transcript?: TranscriptLine[];
  language?: string;
  intent?: string;
  sentiment?: string;
}

export interface Ticket {
  ticket_id: string;
  category: string;
  location: string;
  description: string;
  status: string;
  priority: string;
  created_at?: string;
}

export interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
  result?: Record<string, unknown>;
  status: string;
  timestamp: string;
}

export interface EvaluationResult {
  overall_score: number;
  task_success_rate: number;
  address_capture_accuracy: number;
  escalation_precision: number;
  citizen_sentiment_score: number;
  hallucination_rate: number;
  average_latency_ms: number;
  prompt_version: string;
  notes?: string;
}

export interface PromptVersion {
  version: string;
  notes: string;
  timestamp: string;
}

export async function getCalls(): Promise<{ active: Call[]; recent: Call[] }> {
  const res = await fetch(`${API_BASE}/api/calls`);
  if (!res.ok) throw new Error("Failed to fetch calls");
  return res.json();
}

export async function getTickets(): Promise<Ticket[]> {
  const res = await fetch(`${API_BASE}/api/tickets`);
  if (!res.ok) throw new Error("Failed to fetch tickets");
  const data = await res.json();
  return data.tickets;
}

export async function getToolCalls(): Promise<ToolCall[]> {
  const res = await fetch(`${API_BASE}/api/tool-calls`);
  if (!res.ok) throw new Error("Failed to fetch tool calls");
  const data = await res.json();
  return data.tool_calls;
}

export async function getEvalHistory(): Promise<{
  history: EvaluationResult[];
  prompt_versions: PromptVersion[];
}> {
  const res = await fetch(`${API_BASE}/api/evals/history`);
  if (!res.ok) throw new Error("Failed to fetch eval history");
  return res.json();
}

export async function runEvaluation(): Promise<{
  result: EvaluationResult;
  prompt_versions: PromptVersion[];
}> {
  const res = await fetch(`${API_BASE}/api/evals/run`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to run evaluation");
  return res.json();
}

export function subscribeToEvents(callback: (event: any) => void): () => void {
  const sseUrl = `${API_BASE}/api/events/stream`;
  const eventSource = new EventSource(sseUrl);

  eventSource.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (payload.type !== "connected") {
        callback(payload);
      }
    } catch (err) {
      console.error("Failed to parse SSE event:", err);
    }
  };

  eventSource.onerror = (err) => {
    console.error("SSE connection error:", err);
  };

  return () => {
    eventSource.close();
  };
}
