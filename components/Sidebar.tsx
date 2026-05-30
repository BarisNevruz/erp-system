"use client";

import { usePathname, useRouter } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

type SidebarProps = {
  fullName?: string;
  role?: string;
};

export default function Sidebar({
  fullName = "Kullanıcı",
  role = "Operatör",
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const canEdit =
    role === "Yönetici" ||
    role === "Mühendis";

  function active(path: string) {
    return pathname === path
      ? "bg-slate-800 text-white"
      : "text-slate-300 hover:bg-slate-800";
  }

  return (
    <aside className="w-72 bg-slate-950 text-white min-h-screen">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold">
          {fullName}
        </h1>

        <p className="text-slate-400 text-sm mt-2">
          Yönetim Paneli
        </p>

        <p className="text-blue-400 text-sm mt-3">
          Yetki: {role}
        </p>
      </div>

      <nav className="p-4 space-y-2">

        <button
          onClick={() => router.push("/dashboard")}
          className={`w-full text-left px-4 py-3 rounded-xl ${active("/dashboard")}`}
        >
          🏠 Ana Sayfa
        </button>

        {canEdit && (
          <button
            onClick={() => router.push("/meeting")}
            className={`w-full text-left px-4 py-3 rounded-xl ${active("/meeting")}`}
          >
            Toplantı Karar Girişi
          </button>
        )}

        <button
          onClick={() => router.push("/decision-records")}
          className={`w-full text-left px-4 py-3 rounded-xl ${active("/decision-records")}`}
        >
          Karar Kayıtları
        </button>

        <button
          onClick={() => router.push("/daily")}
          className={`w-full text-left px-4 py-3 rounded-xl ${active("/daily")}`}
        >
          Günlük Faaliyet
        </button>

        <button
          onClick={() => router.push("/activity-records")}
          className={`w-full text-left px-4 py-3 rounded-xl ${active("/activity-records")}`}
        >
          Faaliyet Kayıtları
        </button>

        {canEdit && (
          <button
            onClick={() => router.push("/proje-siparis")}
            className={`w-full text-left px-4 py-3 rounded-xl ${active("/proje-siparis")}`}
          >
            Proje Sipariş Girişi
          </button>
        )}

        <button
          onClick={() => router.push("/proje-siparis-kayitlari")}
          className={`w-full text-left px-4 py-3 rounded-xl ${active("/proje-siparis-kayitlari")}`}
        >
          Proje Sipariş Kayıtları
        </button>

        {role === "Yönetici" && (
          <>
            <button
              onClick={() => router.push("/settings")}
              className={`w-full text-left px-4 py-3 rounded-xl ${active("/settings")}`}
            >
              Ayarlar
            </button>

            <button
              onClick={() => router.push("/mail-settings")}
              className={`w-full text-left px-4 py-3 rounded-xl ${active("/mail-settings")}`}
            >
              Mail Ayarları
            </button>
          </>
        )}
      </nav>

      <div className="p-4">
        <LogoutButton />
      </div>
    </aside>
  );
}