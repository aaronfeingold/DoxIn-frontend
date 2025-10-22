"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield, Eye, EyeOff, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { clientConfig } from "@/config/client";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [codeValidationStatus, setCodeValidationStatus] = useState<
    "idle" | "validating" | "valid" | "invalid"
  >("idle");
  const [codeError, setCodeError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load access code from URL query param if present
  useEffect(() => {
    const codeFromUrl = searchParams.get("accessCode");
    if (codeFromUrl) {
      setAccessCode(codeFromUrl);
      validateAccessCode(codeFromUrl);
    }
  }, [searchParams]);

  const validateAccessCode = async (code: string) => {
    if (!code || code.length !== 12) {
      setCodeValidationStatus("invalid");
      setCodeError("Access code must be 12 characters");
      return;
    }

    setCodeValidationStatus("validating");
    setCodeError("");

    try {
      const response = await fetch(
        `${clientConfig.nextApiVer}/auth/validate-access-code`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessCode: code }),
        }
      );
      const data = await response.json();

      if (data.valid) {
        setCodeValidationStatus("valid");
        setCodeError("");
      } else {
        setCodeValidationStatus("invalid");
        setCodeError(data.error || "Invalid access code");
      }
    } catch (error) {
      console.error("Error validating access code:", error);
      setCodeValidationStatus("invalid");
      setCodeError("Failed to validate access code");
    }
  };

  const handleAccessCodeChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setAccessCode(upperValue);

    if (upperValue.length === 12) {
      validateAccessCode(upperValue);
    } else {
      setCodeValidationStatus("idle");
      setCodeError("");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !name || !accessCode) {
      toast.error("Please fill in all fields");
      return;
    }

    if (codeValidationStatus !== "valid") {
      toast.error("Please provide a valid access code");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      setIsSubmitting(true);

      // Mark access code as used before creating the account
      const useCodeResponse = await fetch(
        `${clientConfig.nextApiVer}/auth/use-access-code`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessCode, email }),
        }
      );

      if (!useCodeResponse.ok) {
        const data = await useCodeResponse.json();
        toast.error(data.error || "Failed to use access code");
        return;
      }

      await authClient.signUp.email({
        email,
        password,
        name,
      });

      // Track initial login event
      await fetch(`${clientConfig.nextApiVer}/auth/track-login`, {
        method: "POST",
      });

      toast.success("Account created successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Signup error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create account";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-600">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your details to get started
          </p>
        </div>

        <form onSubmit={handleSignup} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="accessCode"
                className="block text-sm font-medium text-gray-700"
              >
                Access Code
              </label>
              <div className="mt-1 relative">
                <input
                  id="accessCode"
                  type="text"
                  value={accessCode}
                  onChange={(e) => handleAccessCodeChange(e.target.value)}
                  maxLength={12}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10 uppercase font-mono tracking-wider"
                  placeholder="XXXXXXXXXXXX"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  {codeValidationStatus === "validating" && (
                    <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                  )}
                  {codeValidationStatus === "valid" && (
                    <Check className="h-5 w-5 text-green-500" />
                  )}
                  {codeValidationStatus === "invalid" && (
                    <X className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>
              {codeError && (
                <p className="mt-1 text-sm text-red-600">{codeError}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Don&apos;t have an access code?{" "}
                <Link
                  href="/auth/request-access"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Request one
                </Link>
              </p>
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Must be at least 8 characters
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/auth/signin"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
