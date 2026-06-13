"use client";

import { useState } from "react";
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
  const [open, setOpen] = useState(false);

  const canEdit = role === "Yönetici" || role === "Mühendis";

  function active(path: string) {
    return pathname === path
      ? "bg-slate-800 text-white"
      : "text-slate-300 hover:bg-slate-800 hover:text-white";
  }

  function go(path: string) {
    router.push(path);
    setOpen(false);
  }

  const menu = (
    <>
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold">{fullName}</h1>
        <p className="text-slate-400 text-sm mt-2">Yönetim Paneli</p>
        <p className="text-blue-400 text-sm mt-3">Yetki: {role}</p>
      </div>

      <nav className="p-4 space-y-2">
        <button
          onClick={() => go("/dashboard")}
          className={`w-full text-left px-4 py-3 rounded-xl ${active("/dashboard")}`}
        >
          🏠 Ana Sayfa
        </button>
<button
  onClick={() => go("/customer-orders")}
  className={`w-full text-left px-4 py-3 rounded-xl ${active("/customer-orders")}`}
>
  📋 Müşteri Siparişleri
</button>
        {canEdit && (
          <button
            onClick={() => go("/meeting")}
            className={`w-full text-left px-4 py-3 rounded-xl ${active("/meeting")}`}
          >
            Toplantı Karar Girişi
          </button>
        )}

        <button
          onClick={() => go("/decision-records")}
          className={`w-full text-left px-4 py-3 rounded-xl ${active("/decision-records")}`}
        >
          Karar Kayıtları
        </button>

        <button
          onClick={() => go("/daily")}
          className={`w-full text-left px-4 py-3 rounded-xl ${active("/daily")}`}
        >
          Günlük Faaliyet
        </button>

        <button
          onClick={() => go("/activity-records")}
          className={`w-full text-left px-4 py-3 rounded-xl ${active("/activity-records")}`}
        >
          Faaliyet Kayıtları
        </button>

        {canEdit && (
          <button
            onClick={() => go("/proje-siparis")}
            className={`w-full text-left px-4 py-3 rounded-xl ${active("/proje-siparis")}`}
          >
            Proje Sipariş Girişi
          </button>
        )}

        <button
          onClick={() => go("/proje-siparis-kayitlari")}
          className={`w-full text-left px-4 py-3 rounded-xl ${active("/proje-siparis-kayitlari")}`}
        >
          Proje Sipariş Kayıtları
        </button>

        <div className="pt-4 mt-4 border-t border-slate-800">
          <p className="px-4 mb-2 text-xs uppercase tracking-wide text-slate-500">
            Üretim
          </p>

          <button
            onClick={() => go("/production-tracking")}
            className={`w-full text-left px-4 py-3 rounded-xl ${active("/production-tracking")}`}
          >
            🏭 Üretim Takip
          </button>

          <button
            onClick={() => go("/production-workers")}
            className={`w-full text-left px-4 py-3 rounded-xl ${active("/production-workers")}`}
          >
            Üretim Personelleri
          </button>

          <button
            onClick={() => go("/production-projects")}
            className={`w-full text-left px-4 py-3 rounded-xl ${active("/production-projects")}`}
          >
            Üretim Projeleri
          </button>

          <button
            onClick={() => go("/production-progress")}
            className={`w-full text-left px-4 py-3 rounded-xl ${active("/production-progress")}`}
          >
            Üretim İlerlemesi
          </button>

          <button
            onClick={() => go("/production-stages")}
            className={`w-full text-left px-4 py-3 rounded-xl ${active("/production-stages")}`}
          >
            Üretim Aşamaları
          </button>

          <button
            onClick={() => go("/production-planning")}
            className={`w-full text-left px-4 py-3 rounded-xl ${active("/production-planning")}`}
          >
            Üretim Planlama
          </button>

          <button
            onClick={() => go("/production-capacity")}
            className={`w-full text-left px-4 py-3 rounded-xl ${active("/production-capacity")}`}
          >
            Kapasite Planlama
          </button>

          <button
            onClick={() => go("/production-dashboard")}
            className={`w-full text-left px-4 py-3 rounded-xl ${active("/production-dashboard")}`}
          >
            Üretim Dashboard
          </button>
        </div>

        {role === "Yönetici" && (
          <div className="pt-4 mt-4 border-t border-slate-800">
            <p className="px-4 mb-2 text-xs uppercase tracking-wide text-slate-500">
              Sistem
            </p>

            <button
              onClick={() => go("/settings")}
              className={`w-full text-left px-4 py-3 rounded-xl ${active("/settings")}`}
            >
              Ayarlar
            </button>

            <button
              onClick={() => go("/mail-settings")}
              className={`w-full text-left px-4 py-3 rounded-xl ${active("/mail-settings")}`}
            >
              Mail Ayarları
            </button>
          </div>
        )}
      </nav>

      <div className="p-4">
        <LogoutButton />
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-slate-950 text-white px-4 py-3 rounded-xl shadow-lg"
      >
        ☰ Menü
      </button>

      <aside className="hidden md:block w-72 bg-slate-950 text-white min-h-screen shrink-0 overflow-y-auto">
        {menu}
      </aside>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />

          <aside className="relative w-72 max-w-[85vw] bg-slate-950 text-white min-h-screen overflow-y-auto">
            <div className="flex justify-end p-3">
              <button
                onClick={() => setOpen(false)}
                className="bg-slate-800 text-white px-3 py-2 rounded-lg"
              >
                ✕
              </button>
            </div>

            {menu}
          </aside>
        </div>
      )}
    </>
  );
}