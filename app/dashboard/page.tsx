"use client";

import { SessionProvider, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type Decision = {
  id: number;
  meetingNo: string;
  decision: string;
  responsible: string;
  department: string;
  priority: string;
  deadline: string;
  status: string;
  mailSent: boolean;
};

type ProjectOrder = {
  id: string;
  proje_siparis_tarihi: string;
  termin_tarihi: string;
  proje_adi: string;
  urun_tipi: string;
  urun_adeti: number;
  siyah_sac_kg: number;
  hardox_kg: number;
  mc700_strenx_kg: number;
  aluminyum_kg: number;
  crni_kg: number;
  talasli_imalat_kg: number;
  toplam_malzeme_kg: number;
  musteri_adi: string;
  tamamlanma_yuzdesi: number;
};

function DashboardContent() {
  const { data: session } = useSession();
  const router = useRouter();

  const [records, setRecords] = useState<Decision[]>([]);
  const [projectOrders, setProjectOrders] = useState<ProjectOrder[]>([]);
  const [role, setRole] = useState("Operatör");
  const [fullName, setFullName] = useState("Kullanıcı");

  useEffect(() => {
    loadData();
    loadProfile();
    loadProjectOrders();
  }, [session?.user?.email]);

  async function loadProfile() {
    if (!session?.user?.email) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", session.user.email)
      .eq("active", true)
      .single();

    if (data) {
      setRole(data.role);
      setFullName(data.full_name);
    }
  }

  async function loadData() {
    const { data } = await supabase
      .from("decisions")
      .select("*")
      .order("id", { ascending: false });

    const mapped = (data || []).map((r: any) => ({
      id: r.id,
      meetingNo: r.meeting_no,
      decision: r.decision,
      responsible: r.responsible,
      department: r.department,
      priority: r.priority,
      deadline: r.deadline,
      status: r.status,
      mailSent: r.mail_sent,
    }));

    setRecords(mapped);
  }

  async function loadProjectOrders() {
    const { data } = await supabase
      .from("project_orders")
      .select("*")
      .order("termin_tarihi", { ascending: true });

    setProjectOrders(data || []);
  }

  function isLate(d: Decision) {
    if (!d.deadline) return false;
    if (d.status === "Tamamlandı") return false;
    if (d.status === "İptal") return false;

    const today = new Date();
    const deadline = new Date(d.deadline);

    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);

    return deadline < today;
  }

  function isProjectLate(p: ProjectOrder) {
    if (!p.termin_tarihi) return false;

    const today = new Date();
    const termin = new Date(p.termin_tarihi);

    today.setHours(0, 0, 0, 0);
    termin.setHours(0, 0, 0, 0);

    return termin < today && Number(p.tamamlanma_yuzdesi || 0) < 100;
  }

  function copyWhatsAppLateTasks() {
    const waGroups = JSON.parse(
      localStorage.getItem("erp_whatsapp_groups") || "[]"
    );

    const yonetimGroup = waGroups.find(
      (g: any) => g.groupName === "Yönetim" && g.active !== false
    );

    if (!yonetimGroup?.link) {
      alert("Ayarlar sayfasında Yönetim WhatsApp grup linki bulunamadı.");
      return;
    }

    const lateTasks = records.filter((r) => isLate(r));

    if (lateTasks.length === 0) {
      alert("Geciken görev bulunamadı.");
      return;
    }

    let message = "GECİKEN GÖREVLER\n";
    message += "Tarih: " + new Date().toLocaleDateString("tr-TR") + "\n";
    message += "--------------------------------\n";

    lateTasks.forEach((r, index) => {
      message += `${index + 1}) ${r.decision}\n`;
      message += `Sorumlu: ${r.responsible}\n`;
      message += `Birim: ${r.department}\n`;
      message += `Termin: ${r.deadline}\n`;
      message += `Öncelik: ${r.priority}\n`;
      message += "--------------------------------\n";
    });

    message += "\nLütfen aksiyon durumlarını güncelleyiniz.";

    navigator.clipboard.writeText(message);
    window.open(yonetimGroup.link, "_blank");

    alert("Mesaj panoya kopyalandı. WhatsApp grubuna Ctrl + V yapabilirsiniz.");
  }

  const canEdit = role === "Yönetici" || role === "Mühendis";

  const total = records.length;
  const late = records.filter((r) => isLate(r)).length;
  const completed = records.filter((r) => r.status === "Tamamlandı").length;
  const waiting = records.filter(
    (r) => r.status !== "Tamamlandı" && r.status !== "İptal"
  ).length;

  const toplamSiparis = projectOrders.length;
  const toplamUrunAdeti = projectOrders.reduce(
    (t, x) => t + Number(x.urun_adeti || 0),
    0
  );

  const toplamSiyahSac = projectOrders.reduce(
    (t, x) => t + Number(x.siyah_sac_kg || 0),
    0
  );
  const toplamHardox = projectOrders.reduce(
    (t, x) => t + Number(x.hardox_kg || 0),
    0
  );
  const toplamMc700 = projectOrders.reduce(
    (t, x) => t + Number(x.mc700_strenx_kg || 0),
    0
  );
  const toplamAluminyum = projectOrders.reduce(
    (t, x) => t + Number(x.aluminyum_kg || 0),
    0
  );
  const toplamCrni = projectOrders.reduce(
    (t, x) => t + Number(x.crni_kg || 0),
    0
  );
  const toplamTalasli = projectOrders.reduce(
    (t, x) => t + Number(x.talasli_imalat_kg || 0),
    0
  );

  const genelToplamKg =
    toplamSiyahSac +
    toplamHardox +
    toplamMc700 +
    toplamAluminyum +
    toplamCrni +
    toplamTalasli;

  const gecikenSiparisler = projectOrders.filter((x) => isProjectLate(x));

  const statusChart = [
    { name: "Bekleyen", value: waiting },
    { name: "Tamamlanan", value: completed },
    { name: "Geciken", value: late },
  ];

  const materialChart = [
    { name: "Siyah Sac", value: toplamSiyahSac },
    { name: "Hardox", value: toplamHardox },
    { name: "MC700", value: toplamMc700 },
    { name: "Alüminyum", value: toplamAluminyum },
    { name: "CrNi", value: toplamCrni },
    { name: "Talaşlı", value: toplamTalasli },
  ];

  const COLORS = ["#2563eb", "#16a34a", "#dc2626"];

  const criticalList = records
    .filter((r) => isLate(r) || r.priority === "Kritik")
    .slice(0, 8);

  const sonSiparisler = projectOrders.slice(0, 8);

  return (
    <main className="min-h-screen bg-slate-900 flex">
      <aside className="w-72 bg-slate-950 text-white min-h-screen">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold">{fullName}</h1>
          <p className="text-slate-400 text-sm mt-2">Yönetim Paneli</p>
          <p className="text-blue-400 text-sm mt-3">Yetki: {role}</p>
        </div>

        <nav className="p-4 space-y-2">
          <MenuButton text="Ana Sayfa" onClick={() => router.push("/")} />
          <MenuButton text="Dashboard" active onClick={() => router.push("/dashboard")} />

          {canEdit && (
            <MenuButton text="Toplantı Karar Girişi" onClick={() => router.push("/meeting")} />
          )}

          <MenuButton text="Karar Kayıtları" onClick={() => router.push("/decision-records")} />
          <MenuButton text="Günlük Faaliyet" onClick={() => router.push("/daily")} />
          <MenuButton text="Faaliyet Kayıtları" onClick={() => router.push("/activity-records")} />

          {canEdit && (
            <MenuButton text="Proje Sipariş Girişi" onClick={() => router.push("/proje-siparis")} />
          )}

          <MenuButton text="Proje Sipariş Kayıtları" onClick={() => router.push("/proje-siparis-kayitlari")} />

          {role === "Yönetici" && (
            <>
              <MenuButton text="Ayarlar" onClick={() => router.push("/settings")} />
              <MenuButton text="Mail Ayarları" onClick={() => router.push("/mail-settings")} />
            </>
          )}
        </nav>

        <div className="p-4">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-xl font-semibold"
          >
            Çıkış Yap
          </button>
        </div>
      </aside>

      <section className="flex-1 p-8 overflow-x-hidden">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white">ERP Dashboard</h2>
            <p className="text-slate-300 mt-2">
              Hoş geldiniz, {session?.user?.email}
            </p>
            <p className="text-blue-400 text-sm mt-1">Yetki: {role}</p>
          </div>

          <div className="bg-slate-900 px-5 py-3 rounded-xl">
            <p className="text-sm text-slate-300">Sistem Durumu</p>
            <p className="font-bold text-green-500">Aktif</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <KpiCard title="Toplam Karar" value={total} color="bg-blue-600" />
          <KpiCard title="Açık Görev" value={waiting} color="bg-yellow-600" />
          <KpiCard title="Tamamlanan" value={completed} color="bg-green-600" />
          <KpiCard title="Geciken" value={late} color="bg-red-600" />
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-5">
            Proje Sipariş Özeti
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
            <KpiCard title="Toplam Sipariş" value={toplamSiparis} color="bg-indigo-600" />
            <KpiCard title="Ürün Adedi" value={toplamUrunAdeti} color="bg-cyan-600" />
            <KpiCard title="Genel Toplam KG" value={Math.round(genelToplamKg)} color="bg-emerald-600" />
            <KpiCard title="Siyah Sac KG" value={Math.round(toplamSiyahSac)} color="bg-slate-600" />
            <KpiCard title="Geciken Sipariş" value={gecikenSiparisler.length} color="bg-red-700" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mt-5">
            <KpiCard title="Hardox KG" value={Math.round(toplamHardox)} color="bg-orange-600" />
            <KpiCard title="MC700-Strenx KG" value={Math.round(toplamMc700)} color="bg-purple-600" />
            <KpiCard title="Alüminyum KG" value={Math.round(toplamAluminyum)} color="bg-sky-600" />
            <KpiCard title="CrNi KG" value={Math.round(toplamCrni)} color="bg-teal-600" />
            <KpiCard title="Talaşlı KG" value={Math.round(toplamTalasli)} color="bg-pink-600" />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <ChartBox title="Görev Durum Grafiği">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChart}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={110}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {statusChart.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>

          <ChartBox title="Malzeme Ağırlık Dağılımı">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={materialChart}
                margin={{ top: 20, right: 20, left: 20, bottom: 80 }}
              >
                <XAxis
                  dataKey="name"
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  tick={{ fill: "#ffffff", fontSize: 12 }}
                />
                <YAxis tick={{ fill: "#ffffff" }} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <ListBox title="Son Proje Siparişleri">
            {sonSiparisler.length === 0 && (
              <p className="text-slate-300">Proje siparişi bulunamadı.</p>
            )}

            {sonSiparisler.map((p) => (
              <div key={p.id} className="border border-slate-700 rounded-xl p-4 bg-slate-900">
                <div className="flex justify-between">
                  <h4 className="font-semibold text-white">{p.proje_adi}</h4>
                  <span className="text-blue-400 font-bold">
                    %{p.tamamlanma_yuzdesi}
                  </span>
                </div>

                <p className="text-sm text-slate-300 mt-2">
                  Müşteri: {p.musteri_adi} | Ürün: {p.urun_tipi} | Adet:{" "}
                  {p.urun_adeti} | Termin: {p.termin_tarihi}
                </p>

                <p className="text-sm text-slate-400 mt-1">
                  Toplam:{" "}
                  {Number(p.toplam_malzeme_kg || 0).toLocaleString("tr-TR")} kg
                </p>
              </div>
            ))}
          </ListBox>

          <ListBox title="Geciken Proje Siparişleri">
            {gecikenSiparisler.length === 0 && (
              <p className="text-slate-300">Geciken proje siparişi yok.</p>
            )}

            {gecikenSiparisler.slice(0, 8).map((p) => (
              <div key={p.id} className="border border-red-800 rounded-xl p-4 bg-red-900/30">
                <div className="flex justify-between">
                  <h4 className="font-semibold text-white">{p.proje_adi}</h4>
                  <span className="text-red-500 font-bold">GECİKTİ</span>
                </div>

                <p className="text-sm text-slate-300 mt-2">
                  Müşteri: {p.musteri_adi} | Termin: {p.termin_tarihi} |
                  Tamamlanma: %{p.tamamlanma_yuzdesi}
                </p>
              </div>
            ))}
          </ListBox>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <h3 className="text-xl font-bold text-white mb-5">
              Kritik / Geciken Görevler
            </h3>

            <div className="space-y-3">
              {criticalList.length === 0 && (
                <p className="text-slate-300">Kritik görev yok.</p>
              )}

              {criticalList.map((r) => (
                <div
                  key={r.id}
                  className={
                    isLate(r)
                      ? "border border-red-800 rounded-xl p-4 bg-red-900/30"
                      : "border border-yellow-800 rounded-xl p-4 bg-yellow-900/30"
                  }
                >
                  <div className="flex justify-between">
                    <h4 className="font-semibold text-white">{r.decision}</h4>
                    <span
                      className={
                        isLate(r)
                          ? "text-red-500 font-bold"
                          : "text-yellow-400 font-bold"
                      }
                    >
                      {isLate(r) ? "GECİKTİ" : r.priority}
                    </span>
                  </div>

                  <p className="text-sm text-slate-300 mt-2">
                    Sorumlu: {r.responsible} | Birim: {r.department} | Termin:{" "}
                    {r.deadline}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <h3 className="text-xl font-bold text-white mb-5">
              Hızlı İşlemler
            </h3>

            <div className="space-y-3">
              {canEdit && (
                <ActionButton text="Yeni Karar Gir" onClick={() => router.push("/meeting")} color="bg-blue-600 hover:bg-blue-700" />
              )}

              <ActionButton text="Karar Kayıtları" onClick={() => router.push("/decision-records")} color="bg-slate-700 hover:bg-slate-600" />

              {canEdit && (
                <ActionButton text="Proje Sipariş Girişi" onClick={() => router.push("/proje-siparis")} color="bg-indigo-600 hover:bg-indigo-700" />
              )}

              <ActionButton text="Proje Sipariş Kayıtları" onClick={() => router.push("/proje-siparis-kayitlari")} color="bg-cyan-600 hover:bg-cyan-700" />

              {role === "Yönetici" && (
                <>
                  <ActionButton text="Ayarlar" onClick={() => router.push("/settings")} color="bg-green-600 hover:bg-green-700" />
                  <ActionButton text="Mail Ayarları" onClick={() => router.push("/mail-settings")} color="bg-purple-600 hover:bg-purple-700" />
                </>
              )}

              {canEdit && (
                <ActionButton text="Gecikenleri WhatsApp Hazırla" onClick={copyWhatsAppLateTasks} color="bg-emerald-600 hover:bg-emerald-700" />
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function MenuButton({
  text,
  onClick,
  active = false,
}: {
  text: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl ${
        active ? "bg-slate-800" : "hover:bg-slate-800"
      }`}
    >
      {text}
    </button>
  );
}

function KpiCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`${color} text-white rounded-2xl p-6`}>
      <p className="text-sm opacity-80">{title}</p>
      <h3 className="text-4xl font-bold mt-3">
        {Number(value || 0).toLocaleString("tr-TR")}
      </h3>
    </div>
  );
}

function ChartBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
      <h3 className="text-xl font-bold text-white mb-6">{title}</h3>
      <div className="w-full h-[420px]">{children}</div>
    </div>
  );
}

function ListBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
      <h3 className="text-xl font-bold text-white mb-5">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ActionButton({
  text,
  onClick,
  color,
}: {
  text: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full ${color} py-3 rounded-xl font-semibold text-white`}
    >
      {text}
    </button>
  );
}

export default function DashboardPage() {
  return (
    <SessionProvider>
      <DashboardContent />
    </SessionProvider>
  );
}