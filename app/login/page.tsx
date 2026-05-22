"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold mb-3">
          Star Yağcılar ERP
        </h1>

        <p className="text-slate-300 mb-6">
          Microsoft hesabınız ile giriş yapın.
        </p>

        <button
          onClick={() =>
            signIn("azure-ad", {
              callbackUrl: "/dashboard",
            })
          }
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-white"
        >
          Microsoft ile Giriş Yap
        </button>
      </div>
    </main>
  );
}