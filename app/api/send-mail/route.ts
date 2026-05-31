import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(
    `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.AZURE_AD_CLIENT_ID!,
        client_secret: process.env.AZURE_AD_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        scope: "openid profile email offline_access Mail.Send",
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(JSON.stringify(data));
  }

  return data.access_token;
}

async function sendMail(accessToken: string, payload: any) {
  return fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

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
    .split(/[;,]/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((address) => ({
      emailAddress: { address },
    }));

  const ccRecipients = String(cc || "")
    .split(/[;,]/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((address) => ({
      emailAddress: { address },
    }));

  const payload = {
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
  };

  let graphResponse = await sendMail(session.accessToken, payload);

  if (graphResponse.status === 401 && session.refreshToken) {
    try {
      const newAccessToken = await refreshAccessToken(session.refreshToken);
      graphResponse = await sendMail(newAccessToken, payload);
    } catch (err: any) {
      return NextResponse.json(
        {
          error:
            "Token yenilenemedi. Lütfen çıkış yapıp tekrar Microsoft ile giriş yapın. Detay: " +
            err.message,
        },
        { status: 401 }
      );
    }
  }

  if (!graphResponse.ok) {
    const errorText = await graphResponse.text();
    return NextResponse.json({ error: errorText }, { status: graphResponse.status });
  }

  return NextResponse.json({ success: true });
}