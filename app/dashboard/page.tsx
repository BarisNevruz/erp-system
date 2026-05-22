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

function DashboardContent() {
  const { data: session } = useSession();
  const router = useRouter();

  const [records, setRecords] = useState<Decision[]>([]);
  const [role, setRole] = useState("Operatör");
  const [fullName, setFullName] = useState("Kullanıcı");

  useEffect(() => {
    loadData();
    loadProfile();
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

  function isLate(d: Decision) {
    if (!d.deadline) return false;

    if (d.status === "Tamamlandı") return false;
    if (d.status === "İptal") return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadline = new Date(d.deadline);
    deadline.setHours(0, 0, 0, 0);

    return deadline < today;
  }

  function copyWhatsAppLateTasks() {
    const waGroups = JSON.parse(
      localStorage.getItem("erp_whatsapp_groups") || "[]"
    );

    const yonetimGroup = waGroups.find(
      (g: any) =>
        g.groupName === "Yönetim" &&
        g.active !== false
    );

    if (!yonetimGroup?.link) {
      alert(
        "Ayarlar sayfasında Yönetim WhatsApp grup linki bulunamadı."
      );
      return;
    }

    const lateTasks = records.filter((r) =>
      isLate(r)
    );

    if (lateTasks.length === 0) {
      alert("Geciken görev bulunamadı.");
      return;
    }

    let message = "GECİKEN GÖREVLER\n";
    message +=
      "Tarih: " +
      new Date().toLocaleDateString("tr-TR") +
      "\n";

    message +=
      "--------------------------------\n";

    lateTasks.forEach((r, index) => {
      message += `${index + 1}) ${r.decision}\n`;
      message += `Sorumlu: ${r.responsible}\n`;
      message += `Birim: ${r.department}\n`;
      message += `Termin: ${r.deadline}\n`;
      message += `Öncelik: ${r.priority}\n`;
      message +=
        "--------------------------------\n";
    });

    message +=
      "\nLütfen aksiyon durumlarını güncelleyiniz.";

    navigator.clipboard.writeText(message);

    window.open(yonetimGroup.link, "_blank");

    alert(
      "Mesaj panoya kopyalandı. WhatsApp grubuna Ctrl + V yapabilirsiniz."
    );
  }

  const canEdit =
    role === "Yönetici" ||
    role === "Mühendis";

  const total = records.length;

  const late = records.filter((r) =>
    isLate(r)
  ).length;

  const completed = records.filter(
    (r) => r.status === "Tamamlandı"
  ).length;

  const waiting = records.filter(
    (r) =>
      r.status !== "Tamamlandı" &&
      r.status !== "İptal"
  ).length;

  const statusChart = [
    {
      name: "Bekleyen",
      value: waiting,
    },
    {
      name: "Tamamlanan",
      value: completed,
    },
    {
      name: "Geciken",
      value: late,
    },
  ];

  const departmentData = Object.values(
    records.reduce((acc: any, item) => {
      if (!acc[item.department]) {
        acc[item.department] = {
          department: item.department,
          total: 0,
        };
      }

      acc[item.department].total += 1;

      return acc;
    }, {})
  );

  const COLORS = [
    "#2563eb",
    "#16a34a",
    "#dc2626",
  ];

  const criticalList = records
    .filter(
      (r) =>
        isLate(r) ||
        r.priority === "Kritik"
    )
    .slice(0, 8);

  return (
    <main className="min-h-screen bg-slate-900 flex">
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
            onClick={() => router.push("/")}
            className="w-full text-left hover:bg-slate-800 px-4 py-3 rounded-xl"
          >
            Ana Sayfa
          </button>

          <button
            onClick={() =>
              router.push("/dashboard")
            }
            className="w-full text-left bg-slate-800 px-4 py-3 rounded-xl"
          >
            Dashboard
          </button>

          {canEdit && (
            <button
              onClick={() =>
                router.push("/meeting")
              }
              className="w-full text-left hover:bg-slate-800 px-4 py-3 rounded-xl"
            >
              Toplantı Karar Girişi
            </button>
          )}

          <button
            onClick={() =>
              router.push("/decision-records")
            }
            className="w-full text-left hover:bg-slate-800 px-4 py-3 rounded-xl"
          >
            Karar Kayıtları
          </button>

          <button
            onClick={() =>
              router.push("/daily")
            }
            className="w-full text-left hover:bg-slate-800 px-4 py-3 rounded-xl"
          >
            Günlük Faaliyet
          </button>

          <button
            onClick={() =>
              router.push(
                "/activity-records"
              )
            }
            className="w-full text-left hover:bg-slate-800 px-4 py-3 rounded-xl"
          >
            Faaliyet Kayıtları
          </button>

          {role === "Yönetici" && (
            <button
              onClick={() =>
                router.push("/settings")
              }
              className="w-full text-left hover:bg-slate-800 px-4 py-3 rounded-xl"
            >
              Ayarlar
            </button>
          )}
        </nav>

        <div className="p-4">
          <button
            onClick={() =>
              signOut({
                callbackUrl: "/login",
              })
            }
            className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-xl font-semibold"
          >
            Çıkış Yap
          </button>
        </div>
      </aside>

      <section className="flex-1 p-8">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white">
              ERP Dashboard
            </h2>

            <p className="text-slate-300 mt-2">
              Hoş geldiniz,{" "}
              {session?.user?.email}
            </p>

            <p className="text-blue-400 text-sm mt-1">
              Yetki: {role}
            </p>
          </div>

          <div className="bg-slate-900 px-5 py-3 rounded-xl">
            <p className="text-sm text-slate-300">
              Sistem Durumu
            </p>

            <p className="font-bold text-green-500">
              Aktif
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <KpiCard
            title="Toplam Karar"
            value={total}
            color="bg-blue-600"
          />

          <KpiCard
            title="Açık Görev"
            value={waiting}
            color="bg-yellow-600"
          />

          <KpiCard
            title="Tamamlanan"
            value={completed}
            color="bg-green-600"
          />

          <KpiCard
            title="Geciken"
            value={late}
            color="bg-red-600"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <h3 className="text-xl font-bold text-white mb-6">
              Görev Durum Grafiği
            </h3>

            <div className="h-[320px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={statusChart}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={110}
                    label
                  >
                    {statusChart.map(
                      (entry, index) => (
                        <Cell
                          key={index}
                          fill={
                            COLORS[
                              index %
                                COLORS.length
                            ]
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <h3 className="text-xl font-bold text-white mb-6">
              Birim Görev Dağılımı
            </h3>

            <div className="h-[320px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={departmentData}
                >
                  <XAxis
                    dataKey="department"
                    stroke="#cbd5e1"
                  />

                  <YAxis stroke="#cbd5e1" />

                  <Tooltip />

                  <Bar
                    dataKey="total"
                    fill="#2563eb"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <h3 className="text-xl font-bold text-white mb-5">
              Kritik / Geciken Görevler
            </h3>

            <div className="space-y-3">
              {criticalList.length ===
                0 && (
                <p className="text-slate-300">
                  Kritik görev yok.
                </p>
              )}

              {criticalList.map((r) => (
                <div
                  key={r.id}
                  className={
                    isLate(r)
                      ? "border rounded-xl p-4 bg-red-900/30"
                      : "border rounded-xl p-4 bg-yellow-900/30"
                  }
                >
                  <div className="flex justify-between">
                    <h4 className="font-semibold text-white">
                      {r.decision}
                    </h4>

                    <span
                      className={
                        isLate(r)
                          ? "text-red-500 font-bold"
                          : "text-yellow-400 font-bold"
                      }
                    >
                      {isLate(r)
                        ? "GECİKTİ"
                        : r.priority}
                    </span>
                  </div>

                  <p className="text-sm text-slate-300 mt-2">
                    Sorumlu:{" "}
                    {r.responsible} |
                    Birim:{" "}
                    {r.department} |
                    Termin:{" "}
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
                <button
                  onClick={() =>
                    router.push("/meeting")
                  }
                  className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold"
                >
                  Yeni Karar Gir
                </button>
              )}

              <button
                onClick={() =>
                  router.push("/decision-records")
                }
                className="w-full bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-semibold"
              >
                Karar Kayıtları
              </button>

              {role === "Yönetici" && (
                <button
                  onClick={() =>
                    router.push("/settings")
                  }
                  className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-xl font-semibold"
                >
                  Ayarlar
                </button>
              )}

              {canEdit && (
                <button
                  onClick={
                    copyWhatsAppLateTasks
                  }
                  className="w-full bg-emerald-600 hover:bg-emerald-700 py-3 rounded-xl font-semibold"
                >
                  Gecikenleri WhatsApp Hazırla
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
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
    <div
      className={`${color} text-white rounded-2xl p-6`}
    >
      <p className="text-sm opacity-80">
        {title}
      </p>

      <h3 className="text-4xl font-bold mt-3">
        {value}
      </h3>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <SessionProvider>
      <DashboardContent />
    </SessionProvider>
  );
}