"use client";

import React, { useState } from "react";
import { X, Mail, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface SendInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SendInvitationModal({
  isOpen,
  onClose,
}: SendInvitationModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !name) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSending(true);

    try {
      // Step 1: Generate access code
      const codeResponse = await fetch("/api/auth/generate-access-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!codeResponse.ok) {
        throw new Error("Failed to generate access code");
      }

      const codeData = await codeResponse.json();

      // Step 2: Send invitation email
      const emailResponse = await fetch("/api/send-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          recipientName: name,
          accessCode: codeData.access_code,
          invitationUrl: codeData.invitation_url,
          expiryHours: codeData.expiry_hours,
          personalMessage: personalMessage || undefined,
        }),
      });

      if (!emailResponse.ok) {
        throw new Error("Failed to send invitation email");
      }

      setSent(true);
      toast.success(`Invitation sent successfully to ${email}!`);

      // Reset form after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error("Failed to send invitation");
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setName("");
    setPersonalMessage("");
    setSent(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={!isSending ? handleClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Send Invitation
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSending}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        {sent ? (
          <div className="text-center py-8">
            <div className="mb-4 flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Invitation Sent!
            </h3>
            <p className="text-gray-600">
              The invitation has been sent to <strong>{email}</strong>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            <p className="text-gray-600 text-sm mb-4">
              Send an invitation email with an access code to a new user. The
              access code will be automatically generated and included in the
              email.
            </p>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isSending}
              />
            </div>

            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Recipient Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isSending}
              />
            </div>

            {/* Personal Message Field */}
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Personal Message (Optional)
              </label>
              <textarea
                id="message"
                value={personalMessage}
                onChange={(e) => setPersonalMessage(e.target.value)}
                placeholder="Add a personal message to the invitation..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={isSending}
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                The invitation will include:
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                <li>A unique access code (expires in 24 hours)</li>
                <li>A direct link to the signup page</li>
                <li>Instructions for creating an account</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSending}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Send Invitation
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
