/**
 * API endpoint to send professional invitation emails via Resend
 */
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface InvitationEmailProps {
  to: string;
  recipientName: string;
  accessCode: string;
  invitationUrl: string;
  expiryHours: number;
  personalMessage?: string;
}

function createInvitationEmailTemplate({
  recipientName,
  accessCode,
  invitationUrl,
  expiryHours,
  personalMessage,
}: Omit<InvitationEmailProps, "to">) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8fafc;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .header p {
            margin: 10px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 24px;
            color: #1f2937;
        }
        .message {
            font-size: 16px;
            margin-bottom: 32px;
            color: #374151;
        }
        .personal-message {
            background-color: #f0f9ff;
            border-left: 4px solid #2563eb;
            padding: 16px 20px;
            margin: 24px 0;
            border-radius: 4px;
        }
        .personal-message p {
            margin: 0;
            font-style: italic;
            color: #1e40af;
        }
        .cta-section {
            text-align: center;
            margin: 40px 0;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s;
        }
        .cta-button:hover {
            transform: translateY(-1px);
        }
        .access-code-section {
            background-color: #f9fafb;
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            padding: 24px;
            margin: 32px 0;
            text-align: center;
        }
        .access-code {
            font-family: 'Courier New', monospace;
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            background-color: white;
            padding: 12px 20px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
            display: inline-block;
            letter-spacing: 2px;
            margin: 8px 0;
        }
        .expiry-notice {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 16px;
            margin: 24px 0;
            text-align: center;
        }
        .expiry-notice .icon {
            font-size: 20px;
            margin-bottom: 8px;
        }
        .help-section {
            background-color: #f8fafc;
            padding: 24px;
            border-radius: 8px;
            margin-top: 32px;
        }
        .help-section h3 {
            margin: 0 0 12px 0;
            color: #1f2937;
            font-size: 16px;
        }
        .help-section ul {
            margin: 0;
            padding-left: 20px;
            color: #6b7280;
        }
        .help-section li {
            margin-bottom: 8px;
        }
        .footer {
            background-color: #f8fafc;
            padding: 32px 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            margin: 8px 0;
            color: #6b7280;
            font-size: 14px;
        }
        .security-notice {
            background-color: #f0f9ff;
            border: 1px solid #bfdbfe;
            border-radius: 6px;
            padding: 16px;
            margin: 24px 0;
        }
        .security-notice h4 {
            margin: 0 0 8px 0;
            color: #1e40af;
            font-size: 14px;
            font-weight: 600;
        }
        .security-notice p {
            margin: 0;
            color: #1e3a8a;
            font-size: 13px;
        }
        @media (max-width: 600px) {
            .container {
                margin: 0 16px;
            }
            .header, .content {
                padding: 24px 20px;
            }
            .access-code {
                font-size: 20px;
                padding: 10px 16px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>You're Invited</h1>
            <p>Join the Invoice Processing Platform</p>
        </div>

        <div class="content">
            <div class="greeting">
                Hi ${recipientName},
            </div>

            <div class="message">
                You've been invited to join our AI-powered platform for streamlined invoice processing and business intelligence.
            </div>

            ${
              personalMessage
                ? `
            <div class="personal-message">
                <p>"${personalMessage}"</p>
            </div>
            `
                : ""
            }

            <div class="cta-section">
                <a href="${invitationUrl}" class="cta-button">
                    Create Your Account →
                </a>
            </div>

            <div class="access-code-section">
                <h3 style="margin: 0 0 16px 0; color: #374151;">Your Access Code</h3>
                <div class="access-code">${accessCode}</div>
                <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 14px;">
                    You'll need this code to complete your account setup
                </p>
            </div>

            <div class="expiry-notice">
                <strong>Important:</strong> This invitation expires in ${expiryHours} hours for security reasons.
            </div>

            <div class="help-section">
                <h3>What happens next?</h3>
                <ul>
                    <li>Click the button above or visit the signup page</li>
                    <li>Enter your access code: <code>${accessCode}</code></li>
                    <li>Choose to sign up with Google or use a magic link</li>
                    <li>Start processing invoices with AI-powered intelligence!</li>
                </ul>
            </div>

            <div class="security-notice">
                <h4>Security Notice</h4>
                <p>This invitation was sent by an administrator. If you didn't expect this email, please ignore it. The access code will expire automatically.</p>
            </div>
        </div>

        <div class="footer">
            <p><strong>Invoice Processing Platform</strong></p>
            <p>AI-powered invoice processing and business intelligence</p>
            <p style="margin-top: 16px; font-size: 12px;">
                Need help? Contact your system administrator.
            </p>
        </div>
    </div>
</body>
</html>
  `.trim();
}

export async function POST(request: NextRequest) {
  try {
    const body: InvitationEmailProps = await request.json();

    const {
      to,
      recipientName,
      accessCode,
      invitationUrl,
      expiryHours,
      personalMessage,
    } = body;

    // Validate required fields
    if (
      !to ||
      !recipientName ||
      !accessCode ||
      !invitationUrl ||
      !expiryHours
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const htmlContent = createInvitationEmailTemplate({
      recipientName,
      accessCode,
      invitationUrl,
      expiryHours,
      personalMessage,
    });

    const plainTextContent = `
Hi ${recipientName},

You've been invited to join our invoice processing platform!

${personalMessage ? `Personal message: "${personalMessage}"` : ""}

Your access code: ${accessCode}

To create your account, visit: ${invitationUrl}

This invitation expires in ${expiryHours} hours.

What to do next:
1. Visit the signup page using the link above
2. Enter your access code: ${accessCode}
3. Choose to sign up with Google or use a magic link
4. Start using the system!

If you didn't expect this invitation, please ignore this email.

---
Invoice Processing Platform
AI-powered invoice processing and business intelligence
    `.trim();

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: "Invoice Platform <noreply@yourdomain.com>", // Replace with your verified domain
      to,
      subject: `You're invited to join`,
      html: htmlContent,
      text: plainTextContent,
      headers: {
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
        Importance: "high",
      },
      tags: [
        {
          name: "category",
          value: "user_invitation",
        },
        {
          name: "access_code",
          value: accessCode,
        },
      ],
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send invitation email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: data?.id,
      message: `Invitation sent successfully to ${to}`,
    });
  } catch (error) {
    console.error("Error in send-invitation API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
