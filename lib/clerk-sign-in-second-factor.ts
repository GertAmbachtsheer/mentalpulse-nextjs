import type { SignInFutureResource } from "@clerk/nextjs/types";
import { clerkErrorFirstMessage } from "@/lib/clerk-error-message";

type AppRouterLike = { push: (href: string) => void };

export type SecondFactorKind =
  | "email_code"
  | "phone_code"
  | "totp"
  | "backup_code";

function pickSecondFactorKind(
  signIn: SignInFutureResource
): SecondFactorKind | null {
  const factors = signIn.supportedSecondFactors ?? [];
  if (!factors.length) return null;
  if (factors.some((f) => f.strategy === "email_code")) return "email_code";
  if (factors.some((f) => f.strategy === "phone_code")) return "phone_code";
  if (factors.some((f) => f.strategy === "totp")) return "totp";
  if (factors.some((f) => f.strategy === "backup_code")) return "backup_code";
  return null;
}

/**
 * After a successful password first factor, prepares Client Trust or MFA second factor:
 * sends email/phone codes when applicable, or returns totp/backup for direct entry.
 */
export async function prepareSignInSecondFactor(
  signIn: SignInFutureResource
): Promise<
  | { ok: true; kind: SecondFactorKind }
  | { ok: false; message: string }
> {
  const kind = pickSecondFactorKind(signIn);
  if (!kind) {
    return {
      ok: false,
      message:
        "Additional sign-in verification is required, but this app does not support your second-factor method yet. Try Clerk’s hosted sign-in or contact support.",
    };
  }
  if (kind === "email_code") {
    const { error } = await signIn.mfa.sendEmailCode();
    if (error) {
      return {
        ok: false,
        message: clerkErrorFirstMessage(error) ?? "Could not send email code.",
      };
    }
    return { ok: true, kind };
  }
  if (kind === "phone_code") {
    const { error } = await signIn.mfa.sendPhoneCode();
    if (error) {
      return {
        ok: false,
        message: clerkErrorFirstMessage(error) ?? "Could not send SMS code.",
      };
    }
    return { ok: true, kind };
  }
  return { ok: true, kind };
}

export async function verifySignInSecondFactor(
  signIn: SignInFutureResource,
  kind: SecondFactorKind,
  code: string
) {
  switch (kind) {
    case "email_code":
      return signIn.mfa.verifyEmailCode({ code });
    case "phone_code":
      return signIn.mfa.verifyPhoneCode({ code });
    case "totp":
      return signIn.mfa.verifyTOTP({ code });
    case "backup_code":
      return signIn.mfa.verifyBackupCode({ code });
    default: {
      const _x: never = kind;
      throw new Error(`Unsupported second factor: ${_x}`);
    }
  }
}

export async function finalizeSignInNavigate(
  signIn: SignInFutureResource,
  router: AppRouterLike,
  path: string
) {
  return signIn.finalize({
    navigate: async ({ session, decorateUrl }) => {
      if (session?.currentTask) {
        return;
      }
      const url = decorateUrl(path);
      if (url.startsWith("http")) {
        window.location.href = url;
      } else {
        router.push(url);
      }
    },
  });
}
