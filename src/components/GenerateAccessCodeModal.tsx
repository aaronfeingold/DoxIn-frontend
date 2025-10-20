"use client";

import React, { useState } from "react";
import { X, Key, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface GenerateAccessCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GenerateAccessCodeModal({
  isOpen,
  onClose,
}: GenerateAccessCodeModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<{
    access_code: string;
    invitation_url: string;
    expires_at: string;
    expiry_hours: number;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/auth/generate-access-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to generate access code");
      }

      const data = await response.json();
      setGeneratedCode({
        access_code: data.access_code,
        invitation_url: data.invitation_url,
        expires_at: data.expires_at,
        expiry_hours: data.expiry_hours,
      });
      toast.success("Access code generated successfully!");
    } catch (error) {
      console.error("Error generating access code:", error);
      toast.error("Failed to generate access code");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, type: "code" | "url") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "code") {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      }
      toast.success("Copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleClose = () => {
    setGeneratedCode(null);
    setCopiedCode(false);
    setCopiedUrl(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Key className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Generate Access Code
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        {!generatedCode ? (
          <div>
            <p className="text-gray-600 mb-6">
              Generate a unique access code that can be used for user
              registration. The code will expire in 24 hours.
            </p>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  Generating...
                </>
              ) : (
                <>
                  <Key className="h-5 w-5" />
                  Generate Code
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Access Code */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Code
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 font-mono text-lg font-bold text-blue-600 bg-white px-4 py-3 rounded border border-gray-300">
                  {generatedCode.access_code}
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(generatedCode.access_code, "code")
                  }
                  className="p-3 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  {copiedCode ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <Copy className="h-5 w-5 text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Invitation URL */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invitation URL
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 text-sm text-gray-700 bg-white px-4 py-3 rounded border border-gray-300 truncate">
                  {generatedCode.invitation_url}
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(generatedCode.invitation_url, "url")
                  }
                  className="p-3 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  {copiedUrl ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <Copy className="h-5 w-5 text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Expiry Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Expires in:</strong> {generatedCode.expiry_hours} hours
              </p>
              <p className="text-xs text-amber-700 mt-1">
                {new Date(generatedCode.expires_at).toLocaleString()}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setGeneratedCode(null);
                  handleGenerate();
                }}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Generate Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
