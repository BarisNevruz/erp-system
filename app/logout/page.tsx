"use client";

import { signOut } from "next-auth/react";
import { useEffect } from "react";

export default function LogoutPage() {
  useEffect(() => {
    signOut({ callbackUrl: "/login" });
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold">
          Çıkış yapılıyor...
        </h1>
      </div>
    </main>
  );
}