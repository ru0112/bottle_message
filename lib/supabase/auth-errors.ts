export function isAuthSessionMissingError(error: unknown): boolean {
  return error instanceof Error && error.name === "AuthSessionMissingError";
}
