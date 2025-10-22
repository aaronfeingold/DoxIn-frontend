/**
 * Batch Send Invitations Endpoint
 *
 * Generates access codes and sends invitation emails for approved requests.
 * This is the workflow: Admin approves requests → Then uses this endpoint to send invitations
 *
 * POST /api/admin/access-requests/batch-send-invitations
 * Body: { requestIds: string[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Resend } from "resend";
import crypto from "crypto";
import { serverConfig } from "@/config/server";
import { prisma } from "@/lib/prisma";

const resend = new Resend(serverConfig.resendApiKey);

/**
 * Generate a secure random access code
 */
function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid ambiguous characters
  let code = "";
  const randomBytes = crypto.randomBytes(12);

  for (let i = 0; i < 12; i++) {
    code += chars[randomBytes[i] % chars.length];
  }

  return code;
}

/**
 * Generate access code email HTML template
 */
function getInvitationEmailHtml(name: string, accessCode: string): string {
  const invitationUrl = `${serverConfig.betterAuthUrl}/auth/signup?code=${accessCode}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to the Platform</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; text-align: center;">
                Welcome to the Platform!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi ${name},
              </p>
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Great news! Your access request has been approved. You can now create your account and start using the platform.
              </p>

              <!-- Access Code Box -->
              <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px;">
                <p style="margin: 0 0 10px; color: #666666; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  Your Access Code
                </p>
                <p style="margin: 0; color: #333333; font-size: 24px; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 2px;">
                  ${accessCode}
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${invitationUrl}" style="display: inline-block; padding: 14px 32px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; transition: background-color 0.3s;">
                  Create Your Account
                </a>
              </div>

              <!-- Expiration Notice -->
              <div style="margin: 30px 0; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  ⏱️ <strong>Important:</strong> This access code will expire in 24 hours. Please create your account soon!
                </p>
              </div>

              <!-- Security Notice -->
              <p style="margin: 20px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                <strong>Security Note:</strong> This access code is unique to your email address and can only be used once. If you didn't request access to our platform, please ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #666666; font-size: 12px; text-align: center; line-height: 1.6;">
                If you have any questions, please don't hesitate to contact our support team.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { requestIds } = body;

    if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
      return NextResponse.json(
        { error: "requestIds array is required" },
        { status: 400 }
      );
    }

    // Fetch approved requests
    const requests = await prisma.accessRequest.findMany({
      where: {
        id: { in: requestIds },
        status: "approved",
      },
    });

    if (requests.length === 0) {
      return NextResponse.json(
        { error: "No approved requests found" },
        { status: 404 }
      );
    }

    const results = [];
    const errors = [];

    for (const request of requests) {
      try {
        // Check if access code already exists for this request
        const existingCode = await prisma.accessCode.findFirst({
          where: { accessRequestId: request.id },
        });

        if (existingCode) {
          errors.push({
            requestId: request.id,
            email: request.email,
            error: "Access code already generated",
          });
          continue;
        }

        // Generate unique access code
        let code: string;
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 10) {
          code = generateAccessCode();
          const existing = await prisma.accessCode.findUnique({
            where: { code },
          });
          if (!existing) {
            isUnique = true;
          }
          attempts++;
        }

        if (!isUnique) {
          errors.push({
            requestId: request.id,
            email: request.email,
            error: "Failed to generate unique code",
          });
          continue;
        }

        // Create access code
        const accessCode = await prisma.accessCode.create({
          data: {
            code: code!,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            generatedBy: session.user.id,
            generationType: "user_request",
            accessRequestId: request.id,
          },
        });

        // Send invitation email
        try {
          await resend.emails.send({
            from: "Invoice Platform <noreply@yourdomain.com>", // Update with your domain
            to: request.email,
            subject: "Welcome! Your access code is ready",
            html: getInvitationEmailHtml(request.name, accessCode.code),
            tags: [
              { name: "category", value: "access_invitation" },
              { name: "request_id", value: request.id },
            ],
          });

          results.push({
            requestId: request.id,
            email: request.email,
            name: request.name,
            code: accessCode.code,
            success: true,
          });
        } catch (emailError) {
          console.error("Error sending email:", emailError);
          errors.push({
            requestId: request.id,
            email: request.email,
            error: "Email sending failed",
          });
        }
      } catch (error) {
        console.error(`Error processing request ${request.id}:`, error);
        errors.push({
          requestId: request.id,
          email: request.email,
          error: "Processing failed",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${results.length} invitation(s)`,
      results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: requestIds.length,
        successful: results.length,
        failed: errors.length,
      },
    });
  } catch (error) {
    console.error("Error batch sending invitations:", error);
    return NextResponse.json(
      { error: "Failed to send invitations" },
      { status: 500 }
    );
  }
}
