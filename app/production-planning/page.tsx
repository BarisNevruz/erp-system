"use client";

import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const STAGES = [
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

const AREAS = [
  { hol: "1. Hol", name: "Lazer" },
  { hol: "1. Hol", name: "Giyotin" },
  { hol: "1. Hol", name: "Abkant 1" },
  { hol: "1. Hol", name: "Abkant 2" },
  { hol: "1. Hol", name: "Pozisyoner" },
  { hol: "1. Hol", name: "Kaynak Robotu 1" },
  { hol: "1. Hol", name: "Kaynak Robotu 2" },
  { hol: "1. Hol", name: "Şase Montaj Robotu" },
  { hol: "1. Hol", name: "1. Hol Genel Üretim Alanı" },

  { hol: "2. Hol", name: "2. Hol Montaj Alanı" },
  { hol: "2. Hol", name: "2. Hol Kaynak Alanı" },
  { hol: "2. Hol", name: "2. Hol Taşlama Temizlik Alanı" },
  { hol: "2. Hol", name: "2. Hol Genel Üretim Alanı" },

  { hol: "3. Hol", name: "Kumlama" },
  { hol: "3. Hol", name: "Metalizasyon" },
  { hol: "3. Hol", name: "Astarlama" },
  { hol: "3. Hol", name: "Boyama" },
  { hol: "3. Hol", name: "Konfor Montajı" },
  { hol: "3. Hol", name: "Depo / Sevk Hazırlık" },
  { hol: "3. Hol", name: "3. Hol Genel Boya Alanı" },
];

type Production = {
  id: string;
  uretim_no?: string;
  customer_order_id?: string;
  project_id?: string;
  uretim_yuzdesi?: number;
  uretim_durumu?: string;
  son_asama?: string;
};

type CustomerOrder = {
  id: string;
  musteri?: string;
  proje_adi?: string;
  urun_tipi?: string;
};

type Worker = {
  id: string;
  name?: string;
  full_name?: string;
  department?: string;
  active?: boolean;
};

type Entry = {
  id: string;
  production_id: string;
  uretim_no?: string;
  area_name: string;
  stage_name: string;
  quantity?: number;
  progress_percent?: number;
  worker_names?: string[];
  entry_date?: string;
  notes?: string;
  created_at?: string;
};

type Row = Production & {
  order?: CustomerOrder;
};

export default function ProductionPlanningPage() {
  const [productions, setProductions] = useState<Row[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);

  const [selectedArea, setSelectedArea] = useState<any>(null);
  const [productionId, setProductionId] = useState("");
  const [stageName, setStageName] = useState(STAGES[0]);
  const [quantity, setQuantity] = useState(1);
  const [progressPercent, setProgressPercent] = useState(0);
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");

  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [oldProductionId, setOldProductionId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  function workerDisplayName(w: Worker) {
    return w.full_name || w.name || "";
  }

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

    const { data: workerData, error: workerError } = await supabase
      .from("production_workers")
      .select("id,name,full_name,department,active")
      .order("full_name", { ascending: true });

    if (workerError) {
      alert("Personeller alınamadı: " + workerError.message);
    }

    const { data: entryData } = await supabase
      .from("production_area_entries")
      .select("*")
      .order("created_at", { ascending: false });

    const combined =
      (productionData || []).map((p: Production) => {
        const orderId = p.customer_order_id || p.project_id;
        const order = (orders || []).find(
          (o: CustomerOrder) => String(o.id) === String(orderId)
        );

        return { ...p, order };
      }) || [];

    setProductions(combined);
    setWorkers(workerData || []);
    setEntries(entryData || []);
  }

  function openArea(area: any) {
    setSelectedArea(area);
    setProductionId("");
    setStageName(STAGES[0]);
    setQuantity(1);
    setProgressPercent(0);
    setSelectedWorkers([]);
    setNotes("");
    setEditingEntryId(null);
    setOldProductionId(null);
  }

  function cancelEdit() {
    setSelectedArea(null);
    setProductionId("");
    setStageName(STAGES[0]);
    setQuantity(1);
    setProgressPercent(0);
    setSelectedWorkers([]);
    setNotes("");
    setEditingEntryId(null);
    setOldProductionId(null);
  }

  function toggleWorker(name: string) {
    if (!name) return;

    setSelectedWorkers((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  }

  function startEdit(entry: Entry) {
    const area = AREAS.find((a) => a.name === entry.area_name) || {
      hol: "",
      name: entry.area_name,
    };

    setSelectedArea(area);
    setProductionId(entry.production_id);
    setStageName(entry.stage_name || STAGES[0]);
    setQuantity(Number(entry.quantity) || 1);
    setProgressPercent(Number(entry.progress_percent) || 0);
    setSelectedWorkers(entry.worker_names || []);
    setNotes(entry.notes || "");
    setEditingEntryId(entry.id);
    setOldProductionId(entry.production_id);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function recalculateProduction(productionIdToUpdate: string) {
    if (!productionIdToUpdate) return;

    const { data: allEntries, error } = await supabase
      .from("production_area_entries")
      .select("*")
      .eq("production_id", productionIdToUpdate)
      .order("created_at", { ascending: false });

    if (error) {
      alert("Üretim yüzdesi hesaplanamadı: " + error.message);
      return;
    }

    const stagePercents: Record<string, number> = {};

    STAGES.forEach((stage) => {
      const stageEntries = (allEntries || []).filter(
        (e: Entry) => e.stage_name === stage
      );

      const maxPercent = Math.max(
        0,
        ...stageEntries.map((e: Entry) => Number(e.progress_percent) || 0)
      );

      stagePercents[stage] = Math.min(100, maxPercent);
    });

    let totalPercent = Math.round(
      STAGES.reduce((sum, stage) => sum + stagePercents[stage], 0) /
        STAGES.length
    );

    const hasSevk100 = (allEntries || []).some(
      (e: Entry) =>
        e.stage_name === "Sevk" && Number(e.progress_percent || 0) >= 100
    );

    if (hasSevk100) totalPercent = 100;

    totalPercent = Math.min(100, Math.max(0, totalPercent));

    const lastEntry = allEntries && allEntries.length > 0 ? allEntries[0] : null;

    const status =
      totalPercent >= 100
        ? "Tamamlandı"
        : totalPercent > 0
        ? "Devam Ediyor"
        : "Planlandı";

    const { error: updateError } = await supabase
      .from("production_tracking")
      .update({
        uretim_yuzdesi: totalPercent,
        son_asama: lastEntry?.stage_name || "",
        uretim_durumu: status,
      })
      .eq("id", productionIdToUpdate);

    if (updateError) {
      alert("Üretim takip güncellenemedi: " + updateError.message);
    }
  }

  async function saveEntry() {
    if (!selectedArea) return alert("Alan seçiniz.");
    if (!productionId) return alert("Üretim no seçiniz.");
    if (!stageName) return alert("Üretim aşaması seçiniz.");

    const selectedProduction = productions.find((p) => p.id === productionId);

    if (!selectedProduction) {
      alert("Üretim kaydı bulunamadı.");
      return;
    }

    const safeProgress = Math.min(100, Math.max(0, Number(progressPercent) || 0));

    const payload = {
      production_id: productionId,
      uretim_no: selectedProduction.uretim_no || "",
      area_name: selectedArea.name,
      stage_name: stageName,
      quantity: Number(quantity) || 1,
      progress_percent: safeProgress,
      worker_names: selectedWorkers,
      entry_date: new Date().toISOString().split("T")[0],
      notes,
    };

    if (editingEntryId) {
      const { error } = await supabase
        .from("production_area_entries")
        .update(payload)
        .eq("id", editingEntryId);

      if (error) {
        alert("Üretim girişi güncellenemedi: " + error.message);
        return;
      }

      await recalculateProduction(productionId);

      if (oldProductionId && oldProductionId !== productionId) {
        await recalculateProduction(oldProductionId);
      }

      alert("Üretim girişi güncellendi.");
    } else {
      const { error } = await supabase
        .from("production_area_entries")
        .insert(payload);

      if (error) {
        alert("Üretim girişi kaydedilemedi: " + error.message);
        return;
      }

      await recalculateProduction(productionId);
      alert("Üretim girişi kaydedildi.");
    }

    cancelEdit();
    loadData();
  }

  async function deleteEntry(entry: Entry) {
    const ok = confirm("Bu üretim girişini silmek istiyor musunuz?");
    if (!ok) return;

    const { error } = await supabase
      .from("production_area_entries")
      .delete()
      .eq("id", entry.id);

    if (error) {
      alert("Silme hatası: " + error.message);
      return;
    }

    await recalculateProduction(entry.production_id);

    if (editingEntryId === entry.id) {
      cancelEdit();
    }

    alert("Üretim girişi silindi.");
    loadData();
  }

  function getAreaEntries(areaName: string) {
    return entries.filter((e) => e.area_name === areaName);
  }

  function getAreaStatus(areaName: string) {
    const areaEntries = getAreaEntries(areaName);

    if (areaEntries.length === 0) return "bg-white border-slate-300";

    const last = areaEntries[0];
    const lastDate = last.entry_date ? new Date(last.entry_date) : null;
    const today = new Date();

    if (!lastDate) return "bg-yellow-50 border-yellow-300";

    const diffDay = Math.floor(
      (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDay <= 1) return "bg-green-50 border-green-400";
    if (diffDay <= 3) return "bg-yellow-50 border-yellow-400";
    return "bg-red-50 border-red-400";
  }

  const filteredEntries = entries.filter((e) => {
    const text = `
      ${e.uretim_no || ""}
      ${e.area_name || ""}
      ${e.stage_name || ""}
      ${(e.worker_names || []).join(" ")}
      ${e.notes || ""}
    `.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  function exportExcel() {
    const rows = filteredEntries.map((e) => {
      const area = AREAS.find((a) => a.name === e.area_name);

      return {
        Tarih: e.entry_date || "",
        Hol: area?.hol || "",
        "Üretim No": e.uretim_no || "",
        Alan: e.area_name || "",
        Aşama: e.stage_name || "",
        "İş/Parça Adedi": e.quantity || 1,
        "Aşama İlerleme %": e.progress_percent || 0,
        Personel: (e.worker_names || []).join(", "),
        Not: e.notes || "",
      };
    });

    if (rows.length === 0) {
      alert("Excel'e aktarılacak kayıt yok.");
      return;
    }

    const header = Object.keys(rows[0]);
    const csv = [
      header.join(";"),
      ...rows.map((r: any) =>
        header
          .map((h) => `"${String(r[h] || "").replace(/"/g, "'")}"`)
          .join(";")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "krokili-uretim-plani.xls";
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPdf() {
    const html = `
      <html>
        <head>
          <title>Üretim Planı Raporu</title>
          <style>
            body { font-family: Arial; padding: 24px; color: #111827; }
            h1 { font-size: 22px; margin-bottom: 4px; }
            p { color: #4b5563; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
            th, td { border: 1px solid #d1d5db; padding: 6px; text-align: left; vertical-align: top; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>Üretim Planı - Krokili Giriş Raporu</h1>
          <p>Rapor Tarihi: ${new Date().toLocaleDateString("tr-TR")}</p>

          <table>
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Hol</th>
                <th>Üretim No</th>
                <th>Alan</th>
                <th>Aşama</th>
                <th>Adet</th>
                <th>%</th>
                <th>Personel</th>
                <th>Not</th>
              </tr>
            </thead>
            <tbody>
              ${filteredEntries
                .map((e) => {
                  const area = AREAS.find((a) => a.name === e.area_name);

                  return `
                    <tr>
                      <td>${e.entry_date || ""}</td>
                      <td>${area?.hol || ""}</td>
                      <td>${e.uretim_no || ""}</td>
                      <td>${e.area_name || ""}</td>
                      <td>${e.stage_name || ""}</td>
                      <td>${e.quantity || 1}</td>
                      <td>%${e.progress_percent || 0}</td>
                      <td>${(e.worker_names || []).join(", ")}</td>
                      <td>${e.notes || ""}</td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const win = window.open("", "_blank");

    if (!win) {
      alert("PDF penceresi açılamadı. Tarayıcı pop-up iznini kontrol edin.");
      return;
    }

    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <main className="min-h-screen bg-slate-100 flex">
      <Sidebar fullName="Barış Nevruz" role="Yönetici" />

      <section className="flex-1 p-3 overflow-x-hidden">
        <div className="w-full space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Üretim Planı - Krokili Giriş
            </h1>
            <p className="text-slate-500">
              İş/parça adedi ve aşama ilerleme yüzdesini manuel girerek üretim takibi yapın.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi title="Üretim Kaydı" value={productions.length} />
            <Kpi title="Personel" value={workers.length} />
            <Kpi title="Üretim Girişi" value={entries.length} />
            <Kpi title="Alan Sayısı" value={AREAS.length} />
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                Fabrika Krokisi
              </h2>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={exportExcel}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2 font-semibold"
                >
                  Excel'e Aktar
                </button>

                <button
                  onClick={exportPdf}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-2 font-semibold"
                >
                  PDF Al
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {["1. Hol", "2. Hol", "3. Hol"].map((hol) => (
                <div
                  key={hol}
                  className="border-2 border-slate-300 rounded-2xl p-3 bg-slate-50"
                >
                  <h3 className="font-bold text-slate-900 mb-3">{hol}</h3>

                  <div className="grid grid-cols-2 gap-2">
                    {AREAS.filter((a) => a.hol === hol).map((area) => {
                      const areaEntries = getAreaEntries(area.name);
                      const lastEntry = areaEntries[0];

                      return (
                        <button
                          key={area.name}
                          onClick={() => openArea(area)}
                          className={`min-h-[96px] hover:bg-blue-50 border rounded-xl p-2 text-left shadow-sm ${getAreaStatus(
                            area.name
                          )}`}
                        >
                          <p className="font-bold text-slate-900 text-sm leading-tight">
                            {area.name}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Giriş: {areaEntries.length}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Son No: {lastEntry?.uretim_no || "-"}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Son: {lastEntry?.stage_name || "-"} / %
                            {lastEntry?.progress_percent || 0}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedArea && (
            <div className="bg-white border border-blue-300 rounded-2xl p-4 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                {editingEntryId ? "Üretim Girişi Düzenle" : "Üretim Girişi"} -{" "}
                {selectedArea.name}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                <select
                  value={productionId}
                  onChange={(e) => setProductionId(e.target.value)}
                  className="border border-slate-300 rounded-xl px-3 py-3 text-slate-900"
                >
                  <option value="">Üretim no seçiniz</option>
                  {productions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.uretim_no || "-"} - {p.order?.musteri || "-"} -{" "}
                      {p.order?.proje_adi || "-"}
                    </option>
                  ))}
                </select>

                <select
                  value={stageName}
                  onChange={(e) => setStageName(e.target.value)}
                  className="border border-slate-300 rounded-xl px-3 py-3 text-slate-900"
                >
                  {STAGES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>

                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  placeholder="İş / Parça Adedi"
                  className="border border-slate-300 rounded-xl px-3 py-3 text-slate-900"
                />

                <input
                  type="number"
                  min={0}
                  max={100}
                  value={progressPercent}
                  onChange={(e) => setProgressPercent(Number(e.target.value))}
                  placeholder="Aşama İlerleme %"
                  className="border border-slate-300 rounded-xl px-3 py-3 text-slate-900"
                />

                <button
                  onClick={saveEntry}
                  className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-3 font-semibold"
                >
                  {editingEntryId ? "Güncelle" : "Kaydet"}
                </button>

                <div className="md:col-span-2 xl:col-span-5">
                  <p className="text-sm font-semibold text-slate-700 mb-2">
                    Personel Seç
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {workers.map((w) => {
                      const personName = workerDisplayName(w);

                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => toggleWorker(personName)}
                          className={
                            selectedWorkers.includes(personName)
                              ? "bg-blue-600 text-white rounded-lg px-3 py-2 text-sm font-semibold"
                              : "bg-slate-100 text-slate-700 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold"
                          }
                        >
                          {personName || "İsimsiz Personel"}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Not"
                  rows={2}
                  className="md:col-span-2 xl:col-span-5 border border-slate-300 rounded-xl px-3 py-3 text-slate-900"
                />

                <button
                  onClick={cancelEdit}
                  className="md:col-span-2 xl:col-span-5 bg-slate-500 hover:bg-slate-600 text-white rounded-xl px-4 py-3 font-semibold"
                >
                  Vazgeç
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Üretim no, alan, aşama, personel veya not ara..."
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 bg-slate-50 text-slate-700 text-xs font-bold border-b border-slate-200">
              <div className="col-span-1 px-3 py-3">Tarih</div>
              <div className="col-span-1 px-3 py-3">Üretim No</div>
              <div className="col-span-2 px-3 py-3">Hol / Alan</div>
              <div className="col-span-2 px-3 py-3">Aşama</div>
              <div className="col-span-1 px-3 py-3">Adet</div>
              <div className="col-span-1 px-3 py-3">%</div>
              <div className="col-span-2 px-3 py-3">Personel</div>
              <div className="col-span-2 px-3 py-3">İşlem</div>
            </div>

            {filteredEntries.map((e) => {
              const area = AREAS.find((a) => a.name === e.area_name);

              return (
                <div
                  key={e.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <div className="grid grid-cols-12 text-sm items-center">
                    <div className="col-span-1 px-3 py-3 text-slate-700">
                      {e.entry_date || "-"}
                    </div>

                    <div className="col-span-1 px-3 py-3 font-bold text-slate-900">
                      {e.uretim_no || "-"}
                    </div>

                    <div className="col-span-2 px-3 py-3 text-slate-700">
                      <div className="font-semibold">{area?.hol || "-"}</div>
                      <div className="text-xs text-slate-500 break-words">
                        {e.area_name}
                      </div>
                    </div>

                    <div className="col-span-2 px-3 py-3 text-slate-700 break-words">
                      {e.stage_name}
                    </div>

                    <div className="col-span-1 px-3 py-3 text-slate-700">
                      {e.quantity || 1}
                    </div>

                    <div className="col-span-1 px-3 py-3">
                      <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                        %{e.progress_percent || 0}
                      </span>
                    </div>

                    <div className="col-span-2 px-3 py-3 text-slate-700 break-words">
                      {(e.worker_names || []).join(", ") || "-"}
                    </div>

                    <div className="col-span-2 px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => startEdit(e)}
                          className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-3 py-2 font-semibold"
                        >
                          Düzenle
                        </button>

                        <button
                          onClick={() => deleteEntry(e)}
                          className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-2 font-semibold"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  </div>

                  {e.notes && (
                    <div className="px-3 pb-3 text-xs text-slate-600">
                      <span className="font-semibold">Not:</span> {e.notes}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredEntries.length === 0 && (
              <div className="px-4 py-8 text-center text-slate-500">
                Üretim girişi bulunamadı.
              </div>
            )}

            <div className="px-4 py-4 text-sm text-slate-500 border-t">
              Toplam {filteredEntries.length} kayıt gösteriliyor.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Kpi({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <p className="text-slate-500 text-sm">{title}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">
        {Number(value || 0).toLocaleString("tr-TR")}
      </p>
    </div>
  );
}