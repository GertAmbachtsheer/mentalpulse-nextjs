import { isClerkAPIResponseError } from "@clerk/nextjs/errors";

/** First human-readable message from a Clerk API error, if any. */
export function clerkErrorFirstMessage(error: unknown): string | undefined {
  if (error == null) return undefined;
  if (isClerkAPIResponseError(error)) {
    return error.errors[0]?.longMessage ?? error.errors[0]?.message;
  }
  if (error instanceof Error) return error.message;
  return undefined;
}
