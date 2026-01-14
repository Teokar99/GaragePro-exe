const isDevelopment = import.meta.env.DEV;

export const logError = (message: string, error?: unknown): void => {
  if (isDevelopment) {
    console.error(message, error);
  }
};

export const logInfo = (message: string, data?: unknown): void => {
  if (isDevelopment) {
    console.log(message, data);
  }
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  if (error && typeof error === "object") {
    const e = error as any;
    return (
      e.message ||
      e.error ||
      e.cause ||
      (typeof e.toString === "function" ? e.toString() : "") ||
      JSON.stringify(error)
    );
  }

  return String(error);
};

export const handleDatabaseError = (error: unknown, operation: string): void => {
  const errorMessage = getErrorMessage(error);
  logError(`Error during ${operation}:`, error);

  if (errorMessage === 'Failed to fetch') {
    throw new Error('Network error: Unable to connect to the server. Please check your internet connection and try again.');
  }

  throw new Error(`Error during ${operation}: ${errorMessage}`, { cause: error as any });
};
