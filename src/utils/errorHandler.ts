import { invoke } from "@tauri-apps/api/tauri";

const isDevelopment = import.meta.env.DEV;

const writeToLog = (level: string, message: string) => {
  invoke("log_to_file", { level, message }).catch(() => {});
};

export const logError = (message: string, error?: unknown): void => {
  const errStr = error !== undefined ? `: ${getErrorMessage(error)}` : "";
  if (isDevelopment) {
    console.error(message, error);
  }
  writeToLog("error", `${message}${errStr}`);
};

export const logInfo = (message: string, data?: unknown): void => {
  if (isDevelopment) {
    console.log(message, data);
  }
  // Only log info in production to avoid noise
  if (!isDevelopment) {
    writeToLog("info", message);
  }
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  if (error && typeof error === "object") {
    const e = error as { message?: unknown; error?: unknown; cause?: unknown };
    const candidate = e.message ?? e.error ?? e.cause;
    if (typeof candidate === "string" && candidate) return candidate;
    return String(error) || JSON.stringify(error);
  }

  return String(error);
};

export const handleDatabaseError = (error: unknown, operation: string): void => {
  const errorMessage = getErrorMessage(error);
  logError(`Error during ${operation}`, error);

  if (errorMessage === "Failed to fetch") {
    throw new Error(
      "Network error: Unable to connect to the server. Please check your internet connection and try again."
    );
  }

  throw new Error(`Error during ${operation}: ${errorMessage}`);
};
