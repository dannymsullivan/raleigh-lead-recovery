export function isTransientCredentialError(error: unknown): boolean {
  const message = error instanceof Error
    ? error.message
    : typeof error === "string"
      ? error
      : typeof error === "object" && error !== null && "message" in error && typeof error.message === "string"
        ? error.message
        : "";
  return /jwt issued at future|token is not yet valid/i.test(message);
}

export async function retryTransientCredentialError<T>(operation: () => Promise<T>, delayMs = 350): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!isTransientCredentialError(error)) throw error;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return operation();
  }
}
