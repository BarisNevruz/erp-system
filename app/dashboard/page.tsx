"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";

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
  id: string;
  toplanti_no: string;
  karar: string;
  sorumlu: string;
  birim: string;
  oncelik: string;
  termin_tarihi: string;
  durum: string;
  mail_grubu: string;
  toplanti_tarihi: string;
  created_at: string;
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

type CustomerOrder = {
  id: string;
  siparis_no: string;
  musteri: string;
  proje_adi: string;
  urun_tipi: string;
  adet: number;
  siparis_tarihi: string;
  termin_tarihi: string;
  durum: string;
};

type ProductionTracking = {
  id: string;
  uretim_no: string;
  siparis_no: string;
  musteri: string;
  proje_adi: string;
  urun_tipi: string;
  durum: string;
  uretim_yuzdesi: number;
  termin_tarihi: string;
};

function DashboardContent() {
  const { data: session } = useSession();
  const router = useRouter();

  const [role, setRole] = useState("Operatör");
  const [fullName, setFullName] = useState("Kullanıcı");

  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [projectOrders, setProjectOrders] = useState<ProjectOrder[]>([]);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [productionRows, setProductionRows] = useState<ProductionTracking[]>([]);

  useEffect(() => {
    loadProfile();
    loadDashboardData();
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
      setRole(data.role || "Operatör");
      setFullName(data.full_name || "Kullanıcı");
    }
  }

  async function loadDashboardData() {
    const [decisionRes, projectRes, customerRes, productionRes] =
      await Promise.all([
        supabase
          .from("meeting_decisions")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("project_orders")
          .select("*")
          .order("termin_tarihi", { ascending: true }),

        supabase
          .from("customer_orders")
          .select("*")
          .order("termin_tarihi", { ascending: true }),

        supabase
          .from("production_tracking")
          .select("*")
          .order("termin_tarihi", { ascending: true }),
      ]);

    setDecisions((decisionRes.data || []).map(mapDecision));
    setProjectOrders(projectRes.data || []);
    setCustomerOrders(customerRes.data || []);
    setProductionRows(productionRes.data || []);
  }

  function getText(r: any, keys: string[]) {
  for (const key of keys) {
    const value = r?.[key];

    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  return "";
}

function getDecisionText(r: any) {
  const direct = getText(r, [
    "decision",
    "decision_text",
    "decisionText",
    "karar",
    "karar_metni",
    "kararMetni",
    "karar_aciklama",
    "toplanti_karari",
    "meeting_decision",
    "meetingDecision",
    "description",
    "aciklama",
    "madde",
    "konu",
  ]);

  if (direct) return direct;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const ignoredKeys = [
    "id",
    "created_at",
    "updated_at",
    "toplanti_no",
    "meeting_no",
    "meetingNo",
    "meeting_date",
    "meetingDate",
    "toplanti_tarihi",
    "deadline",
    "termin",
    "termin_tarihi",
    "due_date",
    "status",
    "durum",
    "priority",
    "oncelik",
    "responsible",
    "sorumlu",
    "department",
    "birim",
    "mail_group",
    "mail_grubu",
    "manager_note",
    "managerNote",
  ];

  const found = Object.entries(r).find(([key, value]) => {
    const text = String(value || "").trim();

    return (
      !ignoredKeys.includes(key) &&
      text.length > 5 &&
      !uuidRegex.test(text) &&
      !/^\d{4}-\d{2}-\d{2}/.test(text)
    );
  });

  return found ? String(found[1]).trim() : "";
}

function mapDecision(r: any): Decision {
  return {
    id: String(r.id || ""),
    toplanti_no: getText(r, ["toplanti_no", "meetingNo", "meeting_no"]),
    karar: getDecisionText(r),
    sorumlu: getText(r, ["responsible", "sorumlu"]),
    birim: getText(r, ["department", "birim"]),
    oncelik: getText(r, ["priority", "oncelik"]) || "Normal",
    termin_tarihi: getText(r, [
      "deadline",
      "termin_tarihi",
      "termin",
      "due_date",
      "vade_tarihi",
    ]),
    durum: getText(r, ["status", "durum"]) || "Bekliyor",
    mail_grubu: getText(r, ["mail_group", "mail_grubu"]),
    toplanti_tarihi: getText(r, [
      "meeting_date",
      "meetingDate",
      "toplanti_tarihi",
    ]),
    created_at: getText(r, ["created_at", "createdAt"]),
  };
}

  function todayDate() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function parseDate(date?: string) {
    if (!date) return null;

    const clean = String(date).trim();

    if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
      const d = new Date(clean);
      if (!isNaN(d.getTime())) return d;
    }

    if (/^\d{2}\.\d{2}\.\d{4}$/.test(clean)) {
      const [day, month, year] = clean.split(".");
      const d = new Date(Number(year), Number(month) - 1, Number(day));
      if (!isNaN(d.getTime())) return d;
    }

    const d = new Date(clean);
    if (!isNaN(d.getTime())) return d;

    return null;
  }

  function isLateDate(date?: string, completed?: boolean) {
    if (!date || completed) return false;

    const target = parseDate(date);
    if (!target) return false;

    target.setHours(0, 0, 0, 0);
    return target < todayDate();
  }

  function isApproaching(date?: string, completed?: boolean) {
    if (!date || completed) return false;

    const target = parseDate(date);
    if (!target) return false;

    target.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil(
      (target.getTime() - todayDate().getTime()) / (1000 * 60 * 60 * 24)
    );

    return diffDays >= 0 && diffDays <= 7;
  }

  function normalizeText(value?: string) {
    return String(value || "").trim().toLocaleLowerCase("tr-TR");
  }

  function isDecisionCompleted(d: Decision) {
    const durum = normalizeText(d.durum);
    return durum === "tamamlandı" || durum === "tamamlandi" || durum === "iptal";
  }

  function isDecisionCritical(d: Decision) {
    const oncelik = normalizeText(d.oncelik);
    return oncelik === "kritik";
  }

  function isProjectCompleted(p: ProjectOrder) {
    return Number(p.tamamlanma_yuzdesi || 0) >= 100;
  }

  function isCustomerCompleted(c: CustomerOrder) {
    const durum = normalizeText(c.durum);
    return (
      durum === "sevk edildi" ||
      durum === "sevk" ||
      durum === "tamamlandı" ||
      durum === "tamamlandi"
    );
  }

  function isProductionCompleted(p: ProductionTracking) {
    const durum = normalizeText(p.durum);

    return (
      durum === "sevk edildi" ||
      durum === "sevk" ||
      durum === "tamamlandı" ||
      durum === "tamamlandi" ||
      Number(p.uretim_yuzdesi || 0) >= 100
    );
  }

  const canEdit = role === "Yönetici" || role === "Mühendis";

  const dashboard = useMemo(() => {
    const decisionTotal = decisions.length;
    const decisionCompleted = decisions.filter(isDecisionCompleted).length;
    const decisionOpen = decisions.filter((x) => !isDecisionCompleted(x)).length;

    const lateDecisions = decisions.filter((x) =>
      isLateDate(x.termin_tarihi, isDecisionCompleted(x))
    );

    const criticalOrLateDecisions = decisions.filter(
      (x) =>
        isDecisionCritical(x) ||
        isLateDate(x.termin_tarihi, isDecisionCompleted(x))
    );

    const totalCustomerOrders = customerOrders.length;
    const totalCustomerQty = customerOrders.reduce(
      (t, x) => t + Number(x.adet || 0),
      0
    );

    const shippedCustomerOrders = customerOrders.filter((x) =>
      isCustomerCompleted(x)
    ).length;

    const activeCustomerOrders = customerOrders.filter(
      (x) => !isCustomerCompleted(x)
    ).length;

    const lateCustomerOrders = customerOrders.filter((x) =>
      isLateDate(x.termin_tarihi, isCustomerCompleted(x))
    ).length;

    const totalProjectOrders = projectOrders.length;
    const totalProjectQty = projectOrders.reduce(
      (t, x) => t + Number(x.urun_adeti || 0),
      0
    );

    const lateProjectOrders = projectOrders.filter((x) =>
      isLateDate(x.termin_tarihi, isProjectCompleted(x))
    );

    const approachingProjectOrders = projectOrders.filter((x) =>
      isApproaching(x.termin_tarihi, isProjectCompleted(x))
    );

    const siyahSac = projectOrders.reduce(
      (t, x) => t + Number(x.siyah_sac_kg || 0),
      0
    );

    const hardox = projectOrders.reduce(
      (t, x) => t + Number(x.hardox_kg || 0),
      0
    );

    const mc700 = projectOrders.reduce(
      (t, x) => t + Number(x.mc700_strenx_kg || 0),
      0
    );

    const aluminyum = projectOrders.reduce(
      (t, x) => t + Number(x.aluminyum_kg || 0),
      0
    );

    const crni = projectOrders.reduce(
      (t, x) => t + Number(x.crni_kg || 0),
      0
    );

    const talasli = projectOrders.reduce(
      (t, x) => t + Number(x.talasli_imalat_kg || 0),
      0
    );

    const totalKg =
      siyahSac + hardox + mc700 + aluminyum + crni + talasli;

    const productionTotal = productionRows.length;
    const productionCompleted = productionRows.filter(
      isProductionCompleted
    ).length;

    const productionActive = productionRows.filter(
      (x) => !isProductionCompleted(x)
    ).length;

    const productionLate = productionRows.filter((x) =>
      isLateDate(x.termin_tarihi, isProductionCompleted(x))
    ).length;

    const avgProduction =
      productionRows.length === 0
        ? 0
        : Math.round(
            productionRows.reduce(
              (t, x) => t + Number(x.uretim_yuzdesi || 0),
              0
            ) / productionRows.length
          );

    return {
      decisionTotal,
      decisionCompleted,
      decisionOpen,
      lateDecisions,
      criticalOrLateDecisions,

      totalCustomerOrders,
      totalCustomerQty,
      shippedCustomerOrders,
      activeCustomerOrders,
      lateCustomerOrders,

      totalProjectOrders,
      totalProjectQty,
      lateProjectOrders,
      approachingProjectOrders,

      siyahSac,
      hardox,
      mc700,
      aluminyum,
      crni,
      talasli,
      totalKg,

      productionTotal,
      productionCompleted,
      productionActive,
      productionLate,
      avgProduction,
    };
  }, [decisions, projectOrders, customerOrders, productionRows]);

  const materialChart = [
    { name: "Siyah Sac", value: dashboard.siyahSac },
    { name: "Hardox", value: dashboard.hardox },
    { name: "MC700", value: dashboard.mc700 },
    { name: "Alüminyum", value: dashboard.aluminyum },
    { name: "CrNi", value: dashboard.crni },
    { name: "Talaşlı", value: dashboard.talasli },
  ];

  const orderChart = [
    { name: "Müşteri Siparişi", value: dashboard.totalCustomerOrders },
    { name: "Proje Siparişi", value: dashboard.totalProjectOrders },
    { name: "Üretim Kaydı", value: dashboard.productionTotal },
  ];

  const PIE_COLORS = ["#2563eb", "#16a34a", "#dc2626", "#d97706"];

  return (
    <main className="min-h-screen bg-slate-100 flex">
      <Sidebar fullName={fullName} role={role} />

      <section className="flex-1 p-6 overflow-x-hidden">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 flex items-center justify-between mb-6">
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

        <Section title="Karar Kayıtları Özeti">
          <KpiCard title="Toplam Karar" value={dashboard.decisionTotal} color="bg-blue-600" />
          <KpiCard title="Açık Karar" value={dashboard.decisionOpen} color="bg-yellow-600" />
          <KpiCard title="Tamamlanan" value={dashboard.decisionCompleted} color="bg-green-600" />
          <KpiCard title="Geciken Karar" value={dashboard.lateDecisions.length} color="bg-red-600" />
        </Section>

        <Section title="Müşteri Siparişleri Özeti">
          <KpiCard title="Toplam Sipariş" value={dashboard.totalCustomerOrders} color="bg-indigo-600" />
          <KpiCard title="Toplam Ürün Adedi" value={dashboard.totalCustomerQty} color="bg-cyan-600" />
          <KpiCard title="Sevk Edilen" value={dashboard.shippedCustomerOrders} color="bg-green-600" />
          <KpiCard title="İşlemde Olan" value={dashboard.activeCustomerOrders} color="bg-orange-600" />
          <KpiCard title="Geciken" value={dashboard.lateCustomerOrders} color="bg-red-600" />
        </Section>

        <Section title="Proje Siparişleri ve Malzeme Özeti">
          <KpiCard title="Proje Siparişi" value={dashboard.totalProjectOrders} color="bg-purple-600" />
          <KpiCard title="Ürün Adedi" value={dashboard.totalProjectQty} color="bg-blue-600" />
          <KpiCard title="Termin Yaklaşan" value={dashboard.approachingProjectOrders.length} color="bg-yellow-600" />
          <KpiCard title="Geciken Sipariş" value={dashboard.lateProjectOrders.length} color="bg-red-700" />
          <KpiCard title="Genel Toplam KG" value={Math.round(dashboard.totalKg)} color="bg-emerald-600" />
          <KpiCard title="Siyah Sac KG" value={Math.round(dashboard.siyahSac)} color="bg-slate-600" />
          <KpiCard title="Hardox KG" value={Math.round(dashboard.hardox)} color="bg-orange-700" />
          <KpiCard title="MC700 / Strenx KG" value={Math.round(dashboard.mc700)} color="bg-violet-600" />
          <KpiCard title="Alüminyum KG" value={Math.round(dashboard.aluminyum)} color="bg-sky-600" />
          <KpiCard title="CrNi KG" value={Math.round(dashboard.crni)} color="bg-teal-600" />
          <KpiCard title="Talaşlı KG" value={Math.round(dashboard.talasli)} color="bg-pink-600" />
        </Section>

        <Section title="Üretim Özeti">
          <KpiCard title="Üretim Kaydı" value={dashboard.productionTotal} color="bg-blue-700" />
          <KpiCard title="Üretimde" value={dashboard.productionActive} color="bg-orange-600" />
          <KpiCard title="Tamamlanan / Sevk" value={dashboard.productionCompleted} color="bg-green-600" />
          <KpiCard title="Geciken Üretim" value={dashboard.productionLate} color="bg-red-700" />
          <KpiCard title="Ortalama Üretim %" value={dashboard.avgProduction} color="bg-cyan-700" />
        </Section>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <ChartBox title="Sipariş / Üretim Dağılımı">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderChart}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={110}
                  label={({ name, percent }) =>
                    `${name} ${(((percent ?? 0) as number) * 100).toFixed(0)}%`
                  }
                >
                  {orderChart.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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
          <ListBox title="Geciken Proje Siparişleri">
            {dashboard.lateProjectOrders.length === 0 && (
              <p className="text-slate-300">Geciken proje siparişi yok.</p>
            )}

            {dashboard.lateProjectOrders.slice(0, 8).map((p) => (
              <InfoRow
                key={p.id}
                title={p.proje_adi || "-"}
                badge="GECİKTİ"
                danger
                text={`Müşteri: ${p.musteri_adi || "-"} | Ürün: ${
                  p.urun_tipi || "-"
                } | Termin: ${p.termin_tarihi || "-"} | Tamamlanma: %${
                  p.tamamlanma_yuzdesi || 0
                }`}
              />
            ))}
          </ListBox>

          <ListBox title="Son Müşteri Siparişleri">
            {customerOrders.length === 0 && (
              <p className="text-slate-300">Müşteri siparişi bulunamadı.</p>
            )}

            {customerOrders.slice(0, 8).map((c) => (
              <InfoRow
                key={c.id}
                title={`${c.siparis_no || "-"} - ${c.proje_adi || "-"}`}
                badge={c.durum || "Bekliyor"}
                text={`Müşteri: ${c.musteri || "-"} | Ürün: ${
                  c.urun_tipi || "-"
                } | Adet: ${c.adet || 0} | Termin: ${c.termin_tarihi || "-"}`}
              />
            ))}
          </ListBox>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <ListBox title="Kritik / Geciken Kararlar">
              {dashboard.criticalOrLateDecisions.length === 0 && (
                <p className="text-slate-300">Kritik veya geciken karar yok.</p>
              )}

              {dashboard.criticalOrLateDecisions.slice(0, 8).map((d) => {
                const gecikti = isLateDate(
                  d.termin_tarihi,
                  isDecisionCompleted(d)
                );

                return (
                  <InfoRow
                    key={d.id}
                    title={d.karar || "Karar metni boş"}
                    badge={gecikti ? "GECİKTİ" : d.oncelik}
                    danger={gecikti}
                    text={`Toplantı No: ${d.toplanti_no || "-"} | Sorumlu: ${
                      d.sorumlu || "-"
                    } | Birim: ${d.birim || "-"} | Termin: ${
                      d.termin_tarihi || "-"
                    }`}
                  />
                );
              })}
            </ListBox>
          </div>

          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <h3 className="text-xl font-bold text-white mb-5">Hızlı İşlemler</h3>

            <div className="space-y-3">
              {canEdit && (
                <ActionButton
                  text="Yeni Karar Gir"
                  onClick={() => router.push("/meeting")}
                  color="bg-blue-600 hover:bg-blue-700"
                />
              )}

              <ActionButton
                text="Karar Kayıtları"
                onClick={() => router.push("/decision-records")}
                color="bg-slate-700 hover:bg-slate-600"
              />

              <ActionButton
                text="Müşteri Siparişleri"
                onClick={() => router.push("/customer-orders")}
                color="bg-indigo-600 hover:bg-indigo-700"
              />

              <ActionButton
                text="Proje Sipariş Kayıtları"
                onClick={() => router.push("/proje-siparis-kayitlari")}
                color="bg-cyan-600 hover:bg-cyan-700"
              />

              <ActionButton
                text="Üretim Takip"
                onClick={() => router.push("/production-tracking")}
                color="bg-emerald-600 hover:bg-emerald-700"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 mb-6">
      <h3 className="text-xl font-bold text-white mb-5">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-5">
        {children}
      </div>
    </div>
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
    <div className={`${color} text-white rounded-2xl p-5 min-h-[120px]`}>
      <p className="text-sm opacity-90">{title}</p>
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
      <div className="w-full h-[360px]">{children}</div>
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

function InfoRow({
  title,
  text,
  badge,
  danger = false,
}: {
  title: string;
  text: string;
  badge: string;
  danger?: boolean;
}) {
  return (
    <div
      className={
        danger
          ? "border border-red-800 rounded-xl p-4 bg-red-900/30"
          : "border border-slate-700 rounded-xl p-4 bg-slate-900"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-semibold text-white">{title}</h4>
        <span
          className={
            danger
              ? "text-red-400 font-bold text-sm"
              : "text-blue-400 font-bold text-sm"
          }
        >
          {badge}
        </span>
      </div>

      <p className="text-sm text-slate-300 mt-2">{text}</p>
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