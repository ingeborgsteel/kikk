interface LogEntry {
  level: "info" | "error" | "warn";
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

const LOG_ENDPOINT = "/api/logs";

async function sendLog(entry: LogEntry): Promise<void> {
  try {
    await fetch(LOG_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
  } catch (error) {
    // Fallback to console if logging fails
    console.error("[Logger] Failed to send log:", error);
  }
}

export async function logInfo(
  message: string,
  context?: Record<string, unknown>,
): Promise<void> {
  const entry: LogEntry = {
    level: "info",
    message,
    context,
    timestamp: new Date().toISOString(),
  };
  console.log(`[INFO] ${message}`, context || "");
  await sendLog(entry);
}

export async function logError(
  message: string,
  error?: unknown,
  context?: Record<string, unknown>,
): Promise<void> {
  const entry: LogEntry = {
    level: "error",
    message,
    context: {
      ...context,
      error: error instanceof Error ? error.message : String(error),
    },
    timestamp: new Date().toISOString(),
  };
  console.error(`[ERROR] ${message}`, error || "", context || "");
  await sendLog(entry);
}

export async function logWarn(
  message: string,
  context?: Record<string, unknown>,
): Promise<void> {
  const entry: LogEntry = {
    level: "warn",
    message,
    context,
    timestamp: new Date().toISOString(),
  };
  console.warn(`[WARN] ${message}`, context || "");
  await sendLog(entry);
}
