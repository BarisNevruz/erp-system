import NextAuth from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

const handler = NextAuth({
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope:
            "openid profile email User.Read Mail.Send",
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
});

export { handler as GET, handler as POST };