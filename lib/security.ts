import "server-only";

const MIN_SESSION_SECRET_LENGTH = 32;

export function requiredSessionSecret() {
  const value = process.env.AUTH_SESSION_SECRET;
  if (!value || value.length < MIN_SESSION_SECRET_LENGTH) {
    throw new Error("AUTH_SESSION_SECRET must be configured with at least 32 characters");
  }
  return value;
}
