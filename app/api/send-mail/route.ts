import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import AzureADProvider from "next-auth/providers/azure-ad";

const authOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope:
            "openid profile email offline_access User.Read Mail.Send Mail.ReadWrite",
          prompt: "consent",
        },
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, account }: any) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }

      if (account?.refresh_token) {
        token.refreshToken = account.refresh_token;
      }

      return token;
    },

    async session({ session, token }: any) {
      return {
        ...session,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
      };
    },

    async redirect({ baseUrl }: any) {
      return `${baseUrl}/dashboard`;
    },
  },
};

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
        scope:
          "openid profile email offline_access User.Read Mail.Send Mail.ReadWrite",
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
      {
        error:
          "Access token bulunamadı. Çıkış yapıp tekrar Microsoft ile giriş yapın.",
      },
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

  if (toRecipients.length === 0) {
    return NextResponse.json(
      { error: "En az bir alıcı mail adresi gerekli." },
      { status: 400 }
    );
  }

  const payload = {
    message: {
      subject: subject || "ERP Bildirimi",
      body: {
        contentType: "HTML",
        content: body || "",
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

    return NextResponse.json(
      { error: errorText },
      { status: graphResponse.status }
    );
  }

  return NextResponse.json({ success: true });
}