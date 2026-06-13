"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";

type CustomerOrder = {
  id: string;
  siparis_no?: string;
  musteri?: string;
  proje_adi?: string;
  urun_tipi?: string;
  adet?: number;
  termin_tarihi?: string;
};

type Worker = {
  id: string;
  full_name: string;
  department?: string;
  active?: boolean;
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

type Row = Production & {
  order?: CustomerOrder;
};

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

const DURUMLAR = [
  "Planlandı",
  "Üretime Başlandı",
  "Devam Ediyor",
  "Beklemede",
  "Tamamlandı",
  "Sevk Edildi",
];

export default function ProductionProjectsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedProductionId, setSelectedProductionId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [uretimDurumu, setUretimDurumu] = useState("Planlandı");
  const [uretimYuzdesi, setUretimYuzdesi] = useState(0);
  const [sonAsama, setSonAsama] = useState("Planlama");
  const [sorumlu, setSorumlu] = useState("");
  const [notlar, setNotlar] = useState("");
  const [baslamaTarihi, setBaslamaTarihi] = useState("");
  const [bitisTarihi, setBitisTarihi] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data: productions, error: productionError } = await supabase
      .from("production_tracking")
      .select("*")
      .order("uretim_no", { ascending: true });

    if (productionError) {
      alert("Üretim kayıtları alınamadı: " + productionError.message);
      setLoading(false);
      return;
    }

    const { data: orders } = await supabase
      .from("customer_orders")
      .select("*");

    const { data: workerData } = await supabase
      .from("production_workers")
      .select("*")
      .eq("active", true)
      .order("full_name", { ascending: true });

    const combined =
      (productions || []).map((p: Production) => {
        const linkedOrderId = p.customer_order_id || p.project_id;

        const order = (orders || []).find(
          (o: CustomerOrder) => String(o.id) === String(linkedOrderId)
        );

        return {
          ...p,
          order,
        };
      }) || [];

    setRows(combined);
    setWorkers(workerData || []);
    setLoading(false);
  }

  function selectProduction(id: string) {
    const selected = rows.find((r) => r.id === id);
    if (!selected) return;

    setSelectedProductionId(id);
    setUretimDurumu(selected.uretim_durumu || "Planlandı");
    setUretimYuzdesi(Number(selected.uretim_yuzdesi || 0));
    setSonAsama(selected.son_asama || "Planlama");
    setSorumlu(selected.sorumlu || "");
    setNotlar(selected.notlar || "");
    setBaslamaTarihi(selected.baslama_tarihi || "");
    setBitisTarihi(selected.bitis_tarihi || "");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveProgress() {
    if (!selectedProductionId) {
      alert("Lütfen üretim numarası seçiniz.");
      return;
    }

    const percent = Math.max(0, Math.min(100, Number(uretimYuzdesi) || 0));

    const finalStatus =
      percent >= 100 && uretimDurumu !== "Sevk Edildi"
        ? "Tamamlandı"
        : uretimDurumu;

    const { error } = await supabase
      .from("production_tracking")
      .update({
        uretim_durumu: finalStatus,
        uretim_yuzdesi: percent,
        son_asama: sonAsama,
        sorumlu,
        notlar,
        baslama_tarihi: baslamaTarihi || null,
        bitis_tarihi: bitisTarihi || null,
      })
      .eq("id", selectedProductionId);

    if (error) {
      alert("Üretim güncelleme hatası: " + error.message);
      return;
    }

    alert("Üretim ilerlemesi güncellendi.");
    loadData();
  }

  async function deleteProduction(id: string) {
    if (!confirm("Bu üretim kaydını silmek istiyor musunuz?")) return;

    const { error } = await supabase
      .from("production_tracking")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Silme hatası: " + error.message);
      return;
    }

    alert("Üretim kaydı silindi.");
    loadData();
  }

  function exportExcel() {
    const exportRows = filteredRows.map((r) => ({
      "Üretim No": r.uretim_no || "",
      Müşteri: r.order?.musteri || "",
      Proje: r.order?.proje_adi || "",
      Ürün: r.order?.urun_tipi || "",
      Termin: r.order?.termin_tarihi || "",
      Durum: r.uretim_durumu || "",
      "Üretim %": r.uretim_yuzdesi || 0,
      "Son Aşama": r.son_asama || "",
      Sorumlu: r.sorumlu || "",
      Not: r.notlar || "",
    }));

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
    a.download = "uretim-projeleri.xls";
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredRows = rows.filter((r) => {
    const text = `
      ${r.uretim_no || ""}
      ${r.order?.musteri || ""}
      ${r.order?.proje_adi || ""}
      ${r.order?.urun_tipi || ""}
      ${r.uretim_durumu || ""}
      ${r.son_asama || ""}
      ${r.sorumlu || ""}
      ${r.notlar || ""}
    `.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  const selectedRow = rows.find((r) => r.id === selectedProductionId);

  return (
    <main className="min-h-screen bg-slate-100 flex">
      <Sidebar fullName="Barış Nevruz" role="Yönetici" />

      <section className="flex-1 p-6 overflow-x-hidden">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Üretim Projeleri
            </h1>
            <p className="text-slate-500">
              Üretim takipteki kayıtların ilerleme bilgilerini buradan girin.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi title="Toplam Üretim" value={rows.length} />
            <Kpi
              title="Planlanan"
              value={rows.filter((r) => (r.uretim_durumu || "Planlandı") === "Planlandı").length}
            />
            <Kpi
              title="Devam Eden"
              value={
                rows.filter(
                  (r) =>
                    r.uretim_durumu === "Devam Ediyor" ||
                    r.uretim_durumu === "Üretime Başlandı"
                ).length
              }
            />
            <Kpi
              title="Tamamlanan"
              value={
                rows.filter(
                  (r) =>
                    r.uretim_durumu === "Tamamlandı" ||
                    r.uretim_durumu === "Sevk Edildi"
                ).length
              }
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              Üretim İlerlemesi Gir
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={selectedProductionId}
                onChange={(e) => selectProduction(e.target.value)}
                className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
              >
                <option value="">Üretim no seçiniz</option>
                {rows.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.uretim_no || "No Yok"} - {r.order?.musteri || "Müşteri Yok"} -{" "}
                    {r.order?.proje_adi || "Proje Yok"}
                  </option>
                ))}
              </select>

              <select
                value={uretimDurumu}
                onChange={(e) => setUretimDurumu(e.target.value)}
                className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
              >
                {DURUMLAR.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>

              <select
                value={sonAsama}
                onChange={(e) => setSonAsama(e.target.value)}
                className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
              >
                {STAGES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>

              <input
                type="number"
                min={0}
                max={100}
                value={uretimYuzdesi}
                onChange={(e) => setUretimYuzdesi(Number(e.target.value))}
                placeholder="Üretim %"
                className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
              />

              <select
                value={sorumlu}
                onChange={(e) => setSorumlu(e.target.value)}
                className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
              >
                <option value="">Sorumlu seçiniz</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.full_name}>
                    {w.full_name}
                    {w.department ? ` - ${w.department}` : ""}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={baslamaTarihi}
                onChange={(e) => setBaslamaTarihi(e.target.value)}
                className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
              />

              <input
                type="date"
                value={bitisTarihi}
                onChange={(e) => setBitisTarihi(e.target.value)}
                className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
              />

              <button
                onClick={saveProgress}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-3 font-semibold"
              >
                İlerlemeyi Kaydet
              </button>

              <textarea
                value={notlar}
                onChange={(e) => setNotlar(e.target.value)}
                placeholder="Üretim notu"
                rows={2}
                className="md:col-span-4 border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
              />
            </div>

            {selectedRow && (
              <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700">
                Seçilen üretim: <b>{selectedRow.uretim_no || "-"}</b> /{" "}
                {selectedRow.order?.musteri || "-"} /{" "}
                {selectedRow.order?.proje_adi || "-"} /{" "}
                {selectedRow.order?.urun_tipi || "-"}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Üretim no, müşteri, proje, aşama ara..."
                className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
              />

              <button
                onClick={loadData}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-3 font-semibold"
              >
                Yenile
              </button>

              <button
                onClick={exportExcel}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-3 font-semibold"
              >
                Excel'e Aktar
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredRows.map((r) => (
              <div
                key={r.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
              >
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <Info title="Üretim No" value={r.uretim_no || "-"} bold />
                  <Info title="Müşteri" value={r.order?.musteri || "-"} />
                  <Info title="Proje" value={r.order?.proje_adi || "-"} />
                  <Info title="Ürün" value={r.order?.urun_tipi || "-"} />
                  <Info title="Termin" value={r.order?.termin_tarihi || "-"} />
                  <Info title="Durum" value={r.uretim_durumu || "Planlandı"} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4 pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500">Üretim %</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(Number(r.uretim_yuzdesi || 0), 100)}%`,
                          }}
                        />
                      </div>
                      <span className="font-bold text-slate-900">
                        {r.uretim_yuzdesi || 0}%
                      </span>
                    </div>
                  </div>

                  <Info title="Son Aşama" value={r.son_asama || "-"} />
                  <Info title="Sorumlu" value={r.sorumlu || "-"} />
                  <Info title="Not" value={r.notlar || "-"} />

                  <div className="flex gap-2 items-end">
                    <button
                      onClick={() => selectProduction(r.id)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-2 font-semibold"
                    >
                      Düzenle
                    </button>

                    <button
                      onClick={() => deleteProduction(r.id)}
                      className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-2 font-semibold"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredRows.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
                Üretim kaydı bulunamadı. Üretim Takipte kayıt varsa Yenile butonuna basın.
              </div>
            )}
          </div>

          {loading && (
            <p className="text-sm text-slate-500">Veriler yükleniyor...</p>
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