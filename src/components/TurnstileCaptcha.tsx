"use client";

/**
 * Cloudflare Turnstile CAPTCHA Component
 *
 * Provides bot protection for sensitive forms:
 * - Access code requests
 * - Login forms (optional)
 * - Password reset
 *
 * Environment Variables:
 * - NEXT_PUBLIC_TURNSTILE_SITE_KEY: Public site key from Cloudflare
 */

import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";
import { useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { clientConfig } from "@/config/client";

interface TurnstileCaptchaProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  className?: string;
}

export function TurnstileCaptcha({
  onSuccess,
  onError,
  onExpire,
  className = "",
}: TurnstileCaptchaProps) {
  const turnstileRef = useRef<TurnstileInstance>(null);

  const siteKey = clientConfig.turnstileSiteKey;

  if (!siteKey) {
    console.warn(
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY not set. CAPTCHA will not be rendered."
    );
    return (
      <div className="flex items-center gap-2 rounded border border-yellow-500 bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span>
          CAPTCHA not configured. Set NEXT_PUBLIC_TURNSTILE_SITE_KEY environment
          variable.
        </span>
      </div>
    );
  }

  return (
    <div className={className}>
      <Turnstile
        ref={turnstileRef}
        siteKey={siteKey}
        onSuccess={onSuccess}
        onError={() => {
          console.error("Turnstile error");
          onError?.();
        }}
        onExpire={() => {
          console.log("Turnstile token expired");
          onExpire?.();
        }}
        options={{
          theme: "auto", // Automatically match system theme
          size: "normal",
          retry: "auto",
        }}
      />
    </div>
  );
}
