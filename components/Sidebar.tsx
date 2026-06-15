"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

type SidebarProps = {
  fullName?: string;
  role?: string;
};

type MenuItem = {
  label: string;
  icon: string;
  path: string;
  editOnly?: boolean;
};

export default function Sidebar({
  fullName = "Kullanıcı",
  role = "Operatör",
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const canEdit = role === "Yönetici" || role === "Mühendis";

  function active(path: string) {
    return pathname === path
      ? "bg-slate-800 text-white"
      : "text-slate-300 hover:bg-slate-800 hover:text-white";
  }

  function go(path: string) {
    router.push(path);
    setMobileOpen(false);
  }

  const mainMenu: MenuItem[] = [
    { label: "Ana Sayfa", icon: "🏠", path: "/dashboard" },
    { label: "Müşteri Siparişleri", icon: "📋", path: "/customer-orders" },
    { label: "Toplantı Karar Girişi", icon: "📝", path: "/meeting", editOnly: true },
    { label: "Karar Kayıtları", icon: "📁", path: "/decision-records" },
    { label: "Günlük Faaliyet", icon: "🗓️", path: "/daily" },
    { label: "Faaliyet Kayıtları", icon: "📄", path: "/activity-records" },
    { label: "Proje Sipariş Girişi", icon: "🛒", path: "/proje-siparis", editOnly: true },
    { label: "Proje Sipariş Kayıtları", icon: "📦", path: "/proje-siparis-kayitlari" },
  ];

  const productionMenu: MenuItem[] = [
    { label: "Üretim Takip", icon: "🏭", path: "/production-tracking" },
    { label: "Üretim Personelleri", icon: "👷", path: "/production-workers" },
    { label: "Üretim Projeleri", icon: "🧩", path: "/production-projects" },
    { label: "Üretim İlerlemesi", icon: "📈", path: "/production-progress" },
    { label: "Üretim Aşamaları", icon: "🔧", path: "/production-stages" },
    { label: "Üretim Planlama", icon: "📅", path: "/production-planning" },
    { label: "Kapasite Planlama", icon: "⚙️", path: "/production-capacity" },
    { label: "Üretim Dashboard", icon: "📊", path: "/production-dashboard" },
  ];

  const systemMenu: MenuItem[] = [
    { label: "Ayarlar", icon: "⚙️", path: "/settings" },
    { label: "Mail Ayarları", icon: "✉️", path: "/mail-settings" },
  ];

  function MenuButton({ item }: { item: MenuItem }) {
    if (item.editOnly && !canEdit) return null;

    return (
      <button
        onClick={() => go(item.path)}
        title={collapsed ? item.label : ""}
        className={`w-full flex items-center gap-3 rounded-xl transition ${active(
          item.path
        )} ${collapsed ? "justify-center px-2 py-3" : "text-left px-4 py-3"}`}
      >
        <span className="text-lg shrink-0">{item.icon}</span>
        {!collapsed && <span className="truncate">{item.label}</span>}
      </button>
    );
  }

  const menuContent = (
    <>
      <div
        className={`border-b border-slate-800 ${
          collapsed ? "p-3" : "p-6"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          {!collapsed ? (
            <div>
              <h1 className="text-2xl font-bold leading-tight">{fullName}</h1>
              <p className="text-slate-400 text-sm mt-2">Yönetim Paneli</p>
              <p className="text-blue-400 text-sm mt-3">Yetki: {role}</p>
            </div>
          ) : (
            <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center font-bold">
              BN
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex w-9 h-9 items-center justify-center rounded-lg bg-slate-800 text-white hover:bg-slate-700"
            title={collapsed ? "Menüyü Aç" : "Menüyü Daralt"}
          >
            {collapsed ? "›" : "‹"}
          </button>
        </div>
      </div>

      <nav className={`space-y-2 ${collapsed ? "p-3" : "p-4"}`}>
        {mainMenu.map((item) => (
          <MenuButton key={item.path} item={item} />
        ))}

        <div className="pt-4 mt-4 border-t border-slate-800">
          {!collapsed && (
            <p className="px-4 mb-2 text-xs uppercase tracking-wide text-slate-500">
              Üretim
            </p>
          )}

          {productionMenu.map((item) => (
            <MenuButton key={item.path} item={item} />
          ))}
        </div>

        {role === "Yönetici" && (
          <div className="pt-4 mt-4 border-t border-slate-800">
            {!collapsed && (
              <p className="px-4 mb-2 text-xs uppercase tracking-wide text-slate-500">
                Sistem
              </p>
            )}

            {systemMenu.map((item) => (
              <MenuButton key={item.path} item={item} />
            ))}
          </div>
        )}
      </nav>

      <div className={`${collapsed ? "p-3" : "p-4"}`}>
        {!collapsed && <LogoutButton />}
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-slate-950 text-white px-4 py-3 rounded-xl shadow-lg"
      >
        ☰ Menü
      </button>

      <aside
        className={`hidden md:block bg-slate-950 text-white min-h-screen shrink-0 overflow-y-auto transition-all duration-300 ${
          collapsed ? "w-20" : "w-72"
        }`}
      >
        {menuContent}
      </aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="relative w-72 max-w-[85vw] bg-slate-950 text-white min-h-screen overflow-y-auto">
            <div className="flex justify-end p-3">
              <button
                onClick={() => setMobileOpen(false)}
                className="bg-slate-800 text-white px-3 py-2 rounded-lg"
              >
                ✕
              </button>
            </div>

            {menuContent}
          </aside>
        </div>
      )}
    </>
  );
}