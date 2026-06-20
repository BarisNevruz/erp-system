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

type Production = {
  id: string;
  project_id: string;
  customer_order_id?: string;
  uretim_no?: string;
  uretim_durumu: string;
  uretim_yuzdesi: number;
  son_asama?: string;
  sorumlu?: string;
  notlar?: string;
  bitis_tarihi?: string;
};

type Row = Production & {
  order?: CustomerOrder;
};

export default function ProductionTrackingPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tümü");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data: orders, error: orderError } = await supabase
      .from("customer_orders")
      .select("*");

    if (orderError) {
      alert("Müşteri siparişleri alınamadı: " + orderError.message);
      setLoading(false);
      return;
    }

    const { data: productions, error: productionError } = await supabase
      .from("production_tracking")
      .select("*")
      .order("uretim_no", { ascending: true });

    if (productionError) {
      alert("Üretim kayıtları alınamadı: " + productionError.message);
      setLoading(false);
      return;
    }

    const combined =
      productions?.map((p: Production) => {
        const order = orders?.find(
          (o: CustomerOrder) =>
            o.id === p.customer_order_id || o.id === p.project_id
        );

        return { ...p, order };
      }) || [];

    setRows(combined);
    setLoading(false);
  }

  async function markCompleted(row: Row) {
    const ok = confirm(
      `${row.uretim_no || "-"} üretim numarasını tamamlandı yapmak istiyor musunuz?`
    );

    if (!ok) return;

    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabase
      .from("production_tracking")
      .update({
        uretim_yuzdesi: 100,
        uretim_durumu: "Tamamlandı",
        son_asama: "Sevk",
        bitis_tarihi: today,
      })
      .eq("id", row.id);

    if (error) {
      alert("Tamamlandı yapılamadı: " + error.message);
      return;
    }

    alert("Üretim tamamlandı olarak işaretlendi.");
    loadData();
  }

  function getStatus(row: Row) {
    const termin = row.order?.termin_tarihi
      ? new Date(row.order.termin_tarihi)
      : null;

    const today = new Date();

    if (
      termin &&
      termin < today &&
      row.uretim_yuzdesi < 100 &&
      row.uretim_durumu !== "Sevk Edildi"
    ) {
      return "Geciken";
    }

    return row.uretim_durumu || "Planlandı";
  }

  function statusClass(status: string) {
    if (status === "Tamamlandı" || status === "Sevk Edildi")
      return "bg-green-100 text-green-700";
    if (status === "Geciken") return "bg-red-100 text-red-700";
    if (status === "Devam Ediyor" || status === "Üretime Başlandı")
      return "bg-yellow-100 text-yellow-700";
    if (status === "Beklemede") return "bg-slate-100 text-slate-700";
    return "bg-blue-100 text-blue-700";
  }

  function exportExcel() {
    const exportRows = filteredRows.map((r) => ({
      "Üretim No": r.uretim_no || "",
      Müşteri: r.order?.musteri || "",
      Proje: r.order?.proje_adi || "",
      Ürün: r.order?.urun_tipi || "",
      Termin: r.order?.termin_tarihi || "",
      "Üretim %": r.uretim_yuzdesi || 0,
      Durum: getStatus(r),
      "Son Aşama": r.son_asama || "",
      Sorumlu: r.sorumlu || "",
      "Bitiş Tarihi": r.bitis_tarihi || "",
      Not: r.notlar || "",
    }));

    const header = Object.keys(exportRows[0] || {});
    const csv = [
      header.join(";"),
      ...exportRows.map((r: any) =>
        header.map((h) => `"${r[h] || ""}"`).join(";")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "uretim-takip.xls";
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredRows = rows.filter((row) => {
    const status = getStatus(row);

    const text = `
      ${row.uretim_no || ""}
      ${row.order?.musteri || ""}
      ${row.order?.proje_adi || ""}
      ${row.order?.urun_tipi || ""}
      ${row.son_asama || ""}
      ${row.sorumlu || ""}
    `.toLowerCase();

    return (
      text.includes(search.toLowerCase()) &&
      (statusFilter === "Tümü" || status === statusFilter)
    );
  });

  const total = rows.length;
  const planned = rows.filter((r) => getStatus(r) === "Planlandı").length;
  const active = rows.filter(
    (r) =>
      getStatus(r) === "Üretime Başlandı" ||
      getStatus(r) === "Devam Ediyor"
  ).length;
  const delayed = rows.filter((r) => getStatus(r) === "Geciken").length;
  const completed = rows.filter(
    (r) => getStatus(r) === "Tamamlandı" || getStatus(r) === "Sevk Edildi"
  ).length;

  return (
    <main className="min-h-screen bg-slate-100 flex">
      <Sidebar fullName="Barış Nevruz" role="Yönetici" />

      <section className="flex-1 p-6 overflow-x-hidden">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Üretim Takip</h1>
            <p className="text-slate-500">
              Üretime aktarılan her ürün ayrı üretim numarası ile takip edilir.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ara..."
                className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
              >
                <option>Tümü</option>
                <option>Planlandı</option>
                <option>Üretime Başlandı</option>
                <option>Devam Ediyor</option>
                <option>Beklemede</option>
                <option>Tamamlandı</option>
                <option>Sevk Edildi</option>
                <option>Geciken</option>
              </select>

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

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Kpi title="Toplam" value={total} />
            <Kpi title="Planlandı" value={planned} />
            <Kpi title="Devam Eden" value={active} />
            <Kpi title="Geciken" value={delayed} />
            <Kpi title="Tamamlanan" value={completed} />
          </div>

          <div className="space-y-3">
            {filteredRows.map((row) => {
              const status = getStatus(row);
              const isCompleted =
                status === "Tamamlandı" || status === "Sevk Edildi";

              return (
                <div
                  key={row.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4"
                >
                  <div className="grid grid-cols-2 md:grid-cols-7 gap-4 items-center">
                    <div>
                      <p className="text-xs text-slate-500">Üretim No</p>
                      <p className="font-bold text-slate-900">
                        {row.uretim_no || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Müşteri</p>
                      <p className="font-semibold text-slate-900">
                        {row.order?.musteri || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Proje</p>
                      <p className="text-slate-800">
                        {row.order?.proje_adi || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Ürün</p>
                      <p className="text-slate-800">
                        {row.order?.urun_tipi || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Termin</p>
                      <p className="text-slate-800">
                        {row.order?.termin_tarihi || "-"}
                      </p>
                    </div>

                    <div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                    </div>

                    <div>
                      <button
                        onClick={() => markCompleted(row)}
                        disabled={isCompleted}
                        className={
                          isCompleted
                            ? "bg-slate-300 text-slate-500 rounded-xl px-3 py-2 font-semibold cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700 text-white rounded-xl px-3 py-2 font-semibold"
                        }
                      >
                        {isCompleted ? "Tamamlandı" : "Tamamlandı Yap"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4 pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500">Üretim %</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              status === "Geciken"
                                ? "bg-red-500"
                                : status === "Planlandı"
                                ? "bg-blue-500"
                                : "bg-green-500"
                            }`}
                            style={{
                              width: `${Math.min(
                                Number(row.uretim_yuzdesi) || 0,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="font-semibold text-slate-900">
                          {row.uretim_yuzdesi || 0}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Son Aşama</p>
                      <p className="text-slate-800">{row.son_asama || "-"}</p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Sorumlu</p>
                      <p className="text-slate-800">{row.sorumlu || "-"}</p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Bitiş Tarihi</p>
                      <p className="text-slate-800">
                        {row.bitis_tarihi || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Not</p>
                      <p className="text-slate-800 line-clamp-2">
                        {row.notlar || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredRows.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
                Kayıt bulunamadı.
              </div>
            )}
          </div>

          {loading && (
            <p className="text-slate-500 text-sm">Veriler yükleniyor...</p>
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
      <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
    </div>
  );
}