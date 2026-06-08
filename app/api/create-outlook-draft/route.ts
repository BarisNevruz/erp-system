import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function POST(req: Request) {
  try {
    const token = await getToken({
      req: req as any,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const accessToken =
      (token as any)?.accessToken ||
      (token as any)?.account?.access_token;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Microsoft access token bulunamadı." },
        { status: 401 }
      );
    }

    const { to, cc, subject, bodyHtml } = await req.json();

    const toRecipients = String(to || "")
      .split(";")
      .map((m) => m.trim())
      .filter(Boolean)
      .map((email) => ({
        emailAddress: { address: email },
      }));

    const ccRecipients = String(cc || "")
      .split(";")
      .map((m) => m.trim())
      .filter(Boolean)
      .map((email) => ({
        emailAddress: { address: email },
      }));

    const graphRes = await fetch("https://graph.microsoft.com/v1.0/me/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject,
        body: {
          contentType: "HTML",
          content: bodyHtml,
        },
        toRecipients,
        ccRecipients,
      }),
    });

    const data = await graphRes.json();

    if (!graphRes.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "Taslak oluşturulamadı." },
        { status: graphRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      draftId: data.id,
      webLink: data.webLink,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Sunucu hatası" },
      { status: 500 }
    );
  }
}