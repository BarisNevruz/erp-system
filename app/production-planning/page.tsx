"use client";

import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const STAGES = [
  "Planlama",
  "Şase Kanat Montajı",
  "Şase Kanat Kaynağı",
  "Genel Montaj",
  "Genel Kaynak",
  "Aksesuar Montajı",
  "Aksesuar Kaynağı",
  "Taşlama Temizlik",
  "Kumlama",
  "Metalizasyon",
  "Astarlama",
  "Boyama",
  "Konfor Montajı",
  "Sevk",
];

type CustomerOrder = {
  id: string;
  siparis_no?: string;
  musteri?: string;
  proje_adi?: string;
  urun_tipi?: string;
  termin_tarihi?: string;
};

type Production = {
  id: string;
  project_id?: string;
  customer_order_id?: string;
  uretim_no?: string;
  uretim_durumu?: string;
  uretim_yuzdesi?: number;
  son_asama?: string;
  sorumlu?: string;
  notlar?: string;
  baslama_tarihi?: string;
  bitis_tarihi?: string;
};

type PlanRow = {
  id: string;
  production_id: string;
  uretim_no?: string;
  stage_name: string;
  start_date: string;
  end_date: string;
  completed?: boolean;
};

type Row = Production & {
  order?: CustomerOrder;
};

export default function ProductionPlanningPage() {
  const [productions, setProductions] = useState<Row[]>([]);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [selectedProductionId, setSelectedProductionId] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: productionData, error: productionError } = await supabase
      .from("production_tracking")
      .select("*")
      .order("uretim_no", { ascending: true });

    if (productionError) {
      alert("Üretim kayıtları alınamadı: " + productionError.message);
      return;
    }

    const { data: orders } = await supabase.from("customer_orders").select("*");

    const { data: planData, error: planError } = await supabase
      .from("production_plan_tasks")
      .select("*")
      .order("start_date", { ascending: true });

    if (planError) {
      alert("Plan kayıtları alınamadı: " + planError.message);
      return;
    }

    const combined =
      (productionData || []).map((p: Production) => {
        const linkedOrderId = p.customer_order_id || p.project_id;

        const order = (orders || []).find(
          (o: CustomerOrder) => String(o.id) === String(linkedOrderId)
        );

        return {
          ...p,
          order,
        };
      }) || [];

    setProductions(combined);
    setPlans(planData || []);
  }

  async function planOlustur() {
    if (!selectedProductionId) {
      alert("Üretim no seçiniz.");
      return;
    }

    if (!startDate) {
      alert("Başlangıç tarihi seçiniz.");
      return;
    }

    const selected = productions.find((p) => p.id === selectedProductionId);

    if (!selected) {
      alert("Seçilen üretim bulunamadı.");
      return;
    }

    await supabase
      .from("production_plan_tasks")
      .delete()
      .eq("production_id", selectedProductionId);

    const baslangic = new Date(startDate);

    const rows = STAGES.map((stage, i) => {
      const start = new Date(baslangic);
      start.setDate(start.getDate() + i * 2);

      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      return {
        production_id: selectedProductionId,
        uretim_no: selected.uretim_no || "",
        stage_name: stage,
        start_date: start.toISOString().split("T")[0],
        end_date: end.toISOString().split("T")[0],
        completed: false,
      };
    });

    const { error } = await supabase.from("production_plan_tasks").insert(rows);

    if (error) {
      alert("Plan oluşturma hatası: " + error.message);
      return;
    }

    alert("Üretim planı oluşturuldu.");
    loadData();
  }

  async function planiSil(productionId: string) {
    if (!confirm("Bu üretim numarasının planını silmek istiyor musunuz?")) return;

    const { error } = await supabase
      .from("production_plan_tasks")
      .delete()
      .eq("production_id", productionId);

    if (error) {
      alert("Plan silme hatası: " + error.message);
      return;
    }

    alert("Plan silindi.");
    loadData();
  }

  function exportExcel() {
    const exportRows = filteredPlans.map((p) => {
      const production = productions.find((x) => x.id === p.production_id);

      return {
        "Üretim No": p.uretim_no || production?.uretim_no || "",
        Müşteri: production?.order?.musteri || "",
        Proje: production?.order?.proje_adi || "",
        Ürün: production?.order?.urun_tipi || "",
        Aşama: p.stage_name || "",
        Başlangıç: p.start_date || "",
        Bitiş: p.end_date || "",
        Tamamlandı: p.completed ? "Evet" : "Hayır",
      };
    });

    if (exportRows.length === 0) {
      alert("Excel'e aktarılacak kayıt yok.");
      return;
    }

    const header = Object.keys(exportRows[0]);
    const csv = [
      header.join(";"),
      ...exportRows.map((r: any) =>
        header.map((h) => `"${String(r[h] || "").replace(/"/g, "'")}"`).join(";")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "uretim-planlama.xls";
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredPlans = plans.filter((p) => {
    const production = productions.find((x) => x.id === p.production_id);

    const text = `
      ${p.uretim_no || ""}
      ${production?.uretim_no || ""}
      ${production?.order?.musteri || ""}
      ${production?.order?.proje_adi || ""}
      ${production?.order?.urun_tipi || ""}
      ${p.stage_name || ""}
      ${p.start_date || ""}
      ${p.end_date || ""}
    `.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  const selectedProduction = productions.find(
    (p) => p.id === selectedProductionId
  );

  return (
    <main className="min-h-screen bg-slate-100 flex">
      <Sidebar fullName="Barış Nevruz" role="Yönetici" />

      <section className="flex-1 p-6 overflow-x-hidden">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Üretim Planlama
            </h1>
            <p className="text-slate-500">
              Üretime aktarılan üretim numaraları için otomatik aşama planı oluşturun.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi title="Üretim Kaydı" value={productions.length} />
            <Kpi title="Plan Satırı" value={plans.length} />
            <Kpi
              title="Planlı Üretim"
              value={new Set(plans.map((p) => p.production_id)).size}
            />
            <Kpi
              title="Plansız Üretim"
              value={
                productions.length -
                new Set(plans.map((p) => p.production_id)).size
              }
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              Otomatik Plan Oluştur
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={selectedProductionId}
                onChange={(e) => setSelectedProductionId(e.target.value)}
                className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
              >
                <option value="">Üretim no seçiniz</option>
                {productions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.uretim_no || "No Yok"} - {p.order?.musteri || "-"} -{" "}
                    {p.order?.proje_adi || "-"}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
              />

              <button
                onClick={planOlustur}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-3 font-semibold"
              >
                Otomatik Plan Oluştur
              </button>

              <button
                onClick={exportExcel}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-3 font-semibold"
              >
                Excel'e Aktar
              </button>
            </div>

            {selectedProduction && (
              <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700">
                Seçilen üretim: <b>{selectedProduction.uretim_no}</b> /{" "}
                {selectedProduction.order?.musteri || "-"} /{" "}
                {selectedProduction.order?.proje_adi || "-"} /{" "}
                {selectedProduction.order?.urun_tipi || "-"}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Üretim no, müşteri, proje, aşama veya tarih ara..."
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
            />
          </div>

          <div className="space-y-3">
            {filteredPlans.map((p) => {
              const production = productions.find((x) => x.id === p.production_id);

              return (
                <div
                  key={p.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
                >
                  <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                    <Info title="Üretim No" value={p.uretim_no || production?.uretim_no || "-"} bold />
                    <Info title="Müşteri" value={production?.order?.musteri || "-"} />
                    <Info title="Proje" value={production?.order?.proje_adi || "-"} />
                    <Info title="Ürün" value={production?.order?.urun_tipi || "-"} />
                    <Info title="Aşama" value={p.stage_name || "-"} />
                    <Info title="Başlangıç" value={p.start_date || "-"} />
                    <Info title="Bitiş" value={p.end_date || "-"} />
                  </div>
                </div>
              );
            })}

            {filteredPlans.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
                Plan bulunamadı.
              </div>
            )}
          </div>

          {plans.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Planlı Üretimler
              </h2>

              <div className="space-y-2">
                {Array.from(new Set(plans.map((p) => p.production_id))).map(
                  (productionId) => {
                    const production = productions.find((x) => x.id === productionId);

                    return (
                      <div
                        key={productionId}
                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                      >
                        <div className="text-sm text-slate-700">
                          <b>{production?.uretim_no || "-"}</b> /{" "}
                          {production?.order?.musteri || "-"} /{" "}
                          {production?.order?.proje_adi || "-"}
                        </div>

                        <button
                          onClick={() => planiSil(productionId)}
                          className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 font-semibold"
                        >
                          Planı Sil
                        </button>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Kpi({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <p className="text-slate-500 text-sm">{title}</p>
      <p className="text-3xl font-bold text-slate-900 mt-2">
        {Number(value || 0).toLocaleString("tr-TR")}
      </p>
    </div>
  );
}

function Info({
  title,
  value,
  bold = false,
}: {
  title: string;
  value: string | number;
  bold?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500">{title}</p>
      <p className={bold ? "font-bold text-slate-900" : "text-slate-800"}>
        {value}
      </p>
    </div>
  );
}