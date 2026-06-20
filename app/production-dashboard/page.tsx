"use client";

import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
  bitis_tarihi?: string;
};

type Entry = {
  id: string;
  production_id: string;
  uretim_no?: string;
  area_name?: string;
  stage_name?: string;
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

export default function ProductionDashboardPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [productions, setProductions] = useState<Row[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data: workerData } = await supabase
      .from("production_workers")
      .select("*");

    const { data: orders } = await supabase
      .from("customer_orders")
      .select("*");

    const { data: productionData, error: productionError } = await supabase
      .from("production_tracking")
      .select("*")
      .order("uretim_no", { ascending: true });

    if (productionError) {
      alert("Üretim takip verileri alınamadı: " + productionError.message);
      setLoading(false);
      return;
    }

    const { data: entryData } = await supabase
      .from("production_area_entries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    const combined =
      (productionData || []).map((p: Production) => {
        const orderId = p.customer_order_id || p.project_id;
        const order = (orders || []).find(
          (o: CustomerOrder) => String(o.id) === String(orderId)
        );

        return { ...p, order };
      }) || [];

    setWorkers(workerData || []);
    setProductions(combined);
    setEntries(entryData || []);
    setLoading(false);
  }

  function kalanGun(tarih?: string) {
    if (!tarih) return 0;

    const bugun = new Date();
    const hedef = new Date(tarih);

    bugun.setHours(0, 0, 0, 0);
    hedef.setHours(0, 0, 0, 0);

    return Math.ceil((hedef.getTime() - bugun.getTime()) / 86400000);
  }

  function getStatus(p: Row) {
    const termin = p.order?.termin_tarihi;
    const gun = kalanGun(termin);

    if (
      termin &&
      gun < 0 &&
      Number(p.uretim_yuzdesi || 0) < 100 &&
      p.uretim_durumu !== "Tamamlandı" &&
      p.uretim_durumu !== "Sevk Edildi"
    ) {
      return "Geciken";
    }

    return p.uretim_durumu || "Planlandı";
  }

  const toplam = productions.length;

  const aktif = productions.filter((p) => {
    const s = getStatus(p);
    return s === "Devam Ediyor" || s === "Üretime Başlandı" || s === "Planlandı";
  }).length;

  const tamamlanan = productions.filter((p) => {
    const s = getStatus(p);
    return s === "Tamamlandı" || s === "Sevk Edildi" || Number(p.uretim_yuzdesi || 0) >= 100;
  }).length;

  const geciken = productions.filter((p) => getStatus(p) === "Geciken").length;

  const aktifPersonel = workers.filter((w) => w.active !== false).length;

  const terminYaklasan = productions.filter((p) => {
    const gun = kalanGun(p.order?.termin_tarihi);
    return p.order?.termin_tarihi && gun <= 7 && Number(p.uretim_yuzdesi || 0) < 100;
  });

  return (
    <main className="min-h-screen bg-slate-100 flex">
      <Sidebar fullName="Barış Nevruz" role="Yönetici" />

      <section className="flex-1 p-6 overflow-x-hidden">
        <div className="w-full space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Üretim Dashboard
            </h1>
            <p className="text-slate-600 mt-2">
              Üretim takip, müşteri siparişleri ve krokili üretim giriş merkezi
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Kpi title="Toplam Üretim" value={toplam} />
            <Kpi title="Aktif Üretim" value={aktif} />
            <Kpi title="Tamamlanan" value={tamamlanan} />
            <Kpi title="Geciken" value={geciken} danger />
            <Kpi title="Aktif Personel" value={aktifPersonel} />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-xl font-bold mb-4 text-slate-900">
              Üretim Kayıtları
            </h2>

            <div className="space-y-3">
              {productions.map((p) => {
                const status = getStatus(p);
                const percent = Number(p.uretim_yuzdesi || 0);

                return (
                  <div
                    key={p.id}
                    className="border border-slate-200 rounded-xl p-4 bg-white"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-center">
                      <Info title="Üretim No" value={p.uretim_no || "-"} bold />
                      <Info title="Müşteri" value={p.order?.musteri || "-"} />
                      <Info title="Proje" value={p.order?.proje_adi || "-"} />
                      <Info title="Ürün" value={p.order?.urun_tipi || "-"} />
                      <Info title="Termin" value={p.order?.termin_tarihi || "-"} />
                      <div>
                        <p className="text-xs text-slate-500">Durum</p>
                        <span
                          className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
                            status === "Geciken"
                              ? "bg-red-100 text-red-700"
                              : percent >= 100
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">
                          Son Aşama: {p.son_asama || "-"}
                        </span>
                        <span className="font-bold text-slate-900">
                          %{percent}
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                        <div
                          className={`h-3 ${
                            status === "Geciken"
                              ? "bg-red-500"
                              : percent >= 100
                              ? "bg-green-600"
                              : "bg-blue-600"
                          }`}
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {productions.length === 0 && (
                <p className="text-slate-500">Üretim kaydı bulunamadı.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-slate-900">
                Termin Yaklaşan / Geciken
              </h2>

              <div className="space-y-3">
                {terminYaklasan.map((p) => {
                  const gun = kalanGun(p.order?.termin_tarihi);

                  return (
                    <div
                      key={p.id}
                      className="flex justify-between border-b border-slate-100 pb-2"
                    >
                      <span className="font-semibold text-slate-800">
                        {p.uretim_no || "-"} / {p.order?.musteri || "-"}
                      </span>

                      <span
                        className={
                          gun < 0
                            ? "text-red-600 font-bold"
                            : gun <= 3
                            ? "text-yellow-600 font-bold"
                            : "text-slate-600"
                        }
                      >
                        {gun < 0 ? `${Math.abs(gun)} gün gecikti` : `${gun} gün kaldı`}
                      </span>
                    </div>
                  );
                })}

                {terminYaklasan.length === 0 && (
                  <p className="text-slate-500">Yaklaşan veya geciken kayıt yok.</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-slate-900">
                Son Üretim Girişleri
              </h2>

              <div className="space-y-3">
                {entries.map((e) => (
                  <div key={e.id} className="border-b border-slate-100 pb-3">
                    <p className="font-bold text-slate-900">
                      {e.uretim_no || "-"} / {e.stage_name || "-"}
                    </p>
                    <p className="text-sm text-slate-600">
                      {e.area_name || "-"} / İş-Parça: {e.quantity || 1}
                    </p>
                    <p className="text-sm text-blue-600 font-semibold">
                      Aşama ilerleme: %{e.progress_percent || 0}
                    </p>
                    <p className="text-xs text-slate-500">
                      Personel: {(e.worker_names || []).join(", ") || "-"} / Tarih:{" "}
                      {e.entry_date || "-"}
                    </p>
                  </div>
                ))}

                {entries.length === 0 && (
                  <p className="text-slate-500">Kayıt bulunamadı.</p>
                )}
              </div>
            </div>
          </div>

          {loading && (
            <p className="text-sm text-slate-500">Veriler yükleniyor...</p>
          )}
        </div>
      </section>
    </main>
  );
}

function Kpi({
  title,
  value,
  danger = false,
}: {
  title: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 border shadow-sm ${
        danger ? "bg-red-50 border-red-200" : "bg-white border-slate-200"
      }`}
    >
      <p
        className={
          danger
            ? "text-red-600 font-semibold"
            : "text-slate-600 font-semibold"
        }
      >
        {title}
      </p>

      <p
        className={`text-3xl font-bold mt-2 ${
          danger ? "text-red-700" : "text-slate-900"
        }`}
      >
        {value}
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