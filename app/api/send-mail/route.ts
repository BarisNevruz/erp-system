import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Access token bulunamadı. Çıkış yapıp tekrar giriş yapın." },
      { status: 401 }
    );
  }

  const { to, cc, subject, body } = await req.json();

  const toRecipients = String(to || "")
    .split(";")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((address) => ({
      emailAddress: { address },
    }));

  const ccRecipients = String(cc || "")
    .split(";")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((address) => ({
      emailAddress: { address },
    }));

  const graphResponse = await fetch(
    "https://graph.microsoft.com/v1.0/me/sendMail",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject,
          body: {
            contentType: "HTML",
            content: body,
          },
          toRecipients,
          ccRecipients,
        },
        saveToSentItems: true,
      }),
    }
  );

  if (!graphResponse.ok) {
    const errorText = await graphResponse.text();
    return NextResponse.json({ error: errorText }, { status: graphResponse.status });
  }

  return NextResponse.json({ success: true });
}