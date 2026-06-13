"use client";

import Sidebar from "@/components/Sidebar";
import { useEffect, useMemo, useState } from "react";
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

type CustomerOrder = {
  siparis_no?: string | null;
  musteri?: string | null;
  proje_adi?: string | null;
  urun_tipi?: string | null;
  termin_tarihi?: string | null;
};

type ProductionItem = {
  id: string;
  uretim_no?: string | null;
  uretim_yuzdesi?: number | null;
  uretim_durumu?: string | null;
  son_asama?: string | null;
  customer_orders?: CustomerOrder | CustomerOrder[] | null;
};

type StageRow = {
  id: string;
  production_id: string;
  uretim_no?: string | null;
  stage_name: string;
  start_date?: string | null;
  end_date?: string | null;
  completed: boolean;
};

export default function ProductionStagesPage() {
  const [projects, setProjects] = useState<ProductionItem[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [stageData, setStageData] = useState<StageRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    projeleriGetir();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      asamalariGetir(selectedProject);
    } else {
      setStageData([]);
    }
  }, [selectedProject]);

  async function projeleriGetir() {
    setLoading(true);

    const { data, error } = await supabase
      .from("production_tracking")
      .select(`
        id,
        uretim_no,
        uretim_yuzdesi,
        uretim_durumu,
        son_asama,
        customer_orders (
          siparis_no,
          musteri,
          proje_adi,
          urun_tipi,
          termin_tarihi
        )
      `)
      .order("uretim_no", { ascending: true });

    if (error) {
      alert("Üretim kayıtları alınamadı: " + error.message);
      setLoading(false);
      return;
    }

    setProjects((data || []) as ProductionItem[]);
    setLoading(false);
  }

  async function asamalariGetir(productionId: string) {
    const { data, error } = await supabase
      .from("production_plan_tasks")
      .select("*")
      .eq("production_id", productionId)
      .order("created_at", { ascending: true });

    if (error) {
      alert("Üretim aşamaları alınamadı: " + error.message);
      return;
    }

    setStageData((data || []) as StageRow[]);
  }

  function getCustomerOrder(project: ProductionItem): CustomerOrder | null {
    if (Array.isArray(project.customer_orders)) {
      return project.customer_orders[0] || null;
    }

    return project.customer_orders || null;
  }

  function tamamlandi(stageName: string) {
    return stageData.some(
      (item) => item.stage_name === stageName && item.completed === true
    );
  }

  async function kaydet(stageName: string, completed: boolean) {
    if (!selectedProject) return;

    const selected = projects.find((item) => item.id === selectedProject);
    const mevcut = stageData.find((item) => item.stage_name === stageName);

    if (mevcut) {
      const { error } = await supabase
        .from("production_plan_tasks")
        .update({
          completed,
          end_date: completed ? new Date().toISOString().split("T")[0] : null,
        })
        .eq("id", mevcut.id);

      if (error) {
        alert("Aşama güncellenemedi: " + error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("production_plan_tasks").insert({
        production_id: selectedProject,
        uretim_no: selected?.uretim_no || "",
        stage_name: stageName,
        start_date: new Date().toISOString().split("T")[0],
        end_date: completed ? new Date().toISOString().split("T")[0] : null,
        completed,
      });

      if (error) {
        alert("Aşama kaydedilemedi: " + error.message);
        return;
      }
    }

    await asamalariGetir(selectedProject);
    await uretimYuzdesiGuncelle(stageName, completed);
  }

  async function uretimYuzdesiGuncelle(stageName: string, completed: boolean) {
    if (!selectedProject) return;

    const { data, error } = await supabase
      .from("production_plan_tasks")
      .select("*")
      .eq("production_id", selectedProject)
      .eq("completed", true);

    if (error) {
      alert("Yüzde hesaplanamadı: " + error.message);
      return;
    }

    const tamamlananAdet = data?.length || 0;
    const yuzde = Math.round((tamamlananAdet / STAGES.length) * 100);

    const yeniDurum =
      yuzde >= 100 ? "Tamamlandı" : yuzde > 0 ? "Devam Ediyor" : "Planlandı";

    const yeniSonAsama = completed
      ? stageName
      : (data && data.length > 0 ? data[data.length - 1].stage_name : "Planlama");

    const { error: updateError } = await supabase
      .from("production_tracking")
      .update({
        uretim_yuzdesi: yuzde,
        uretim_durumu: yeniDurum,
        son_asama: yeniSonAsama,
        bitis_tarihi:
          yuzde >= 100 ? new Date().toISOString().split("T")[0] : null,
      })
      .eq("id", selectedProject);

    if (updateError) {
      alert("Üretim kaydı güncellenemedi: " + updateError.message);
      return;
    }

    await projeleriGetir();
  }

  const selectedProduction = useMemo(
    () => projects.find((item) => item.id === selectedProject),
    [projects, selectedProject]
  );

  const selectedOrder = selectedProduction
    ? getCustomerOrder(selectedProduction)
    : null;

  const tamamlananAdet = stageData.filter((item) => item.completed).length;
  const yuzde = Math.round((tamamlananAdet / STAGES.length) * 100);

  return (
    <main className="min-h-screen bg-slate-100 flex">
      <Sidebar fullName="Barış Nevruz" role="Yönetici" />

      <section className="flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Üretim Aşamaları
          </h1>

          <p className="text-slate-600 mt-2">
            Üretim numarası bazlı aşama takibi yapın.
          </p>

          <div className="mt-6">
            <label className="font-semibold text-slate-900">Üretim No Seç</label>

            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-3 mt-2 text-slate-900 bg-white"
            >
              <option value="">Üretim no seçiniz</option>

              {projects.map((project) => {
                const order = getCustomerOrder(project);

                return (
                  <option key={project.id} value={project.id}>
                    {project.uretim_no || "-"} - {order?.musteri || "-"} -{" "}
                    {order?.proje_adi || "-"} - {order?.urun_tipi || "-"}
                  </option>
                );
              })}
            </select>

            {loading && (
              <p className="text-sm text-slate-500 mt-2">Veriler yükleniyor...</p>
            )}

            {!loading && projects.length === 0 && (
              <p className="text-sm text-red-600 mt-2">
                Üretim kaydı bulunamadı. Önce müşteri siparişini üretime aktarın.
              </p>
            )}
          </div>

          {selectedProduction && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-3">
              <Info title="Üretim No" value={selectedProduction.uretim_no || "-"} />
              <Info title="Müşteri" value={selectedOrder?.musteri || "-"} />
              <Info title="Proje" value={selectedOrder?.proje_adi || "-"} />
              <Info title="Ürün" value={selectedOrder?.urun_tipi || "-"} />
              <Info title="Termin" value={selectedOrder?.termin_tarihi || "-"} />
            </div>
          )}

          {selectedProject && (
            <>
              <div className="mt-8">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-slate-900">
                    Genel İlerleme
                  </span>

                  <span className="font-bold text-slate-900">%{yuzde}</span>
                </div>

                <div className="w-full h-5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="bg-green-600 h-5 transition-all"
                    style={{ width: `${yuzde}%` }}
                  />
                </div>
              </div>

              <div className="mt-8 space-y-3">
                {STAGES.map((stage) => (
                  <div
                    key={stage}
                    className="flex items-center justify-between border border-slate-200 rounded-xl p-4 bg-slate-50"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{stage}</p>
                      <p className="text-sm text-slate-500">
                        {tamamlandi(stage) ? "Tamamlandı" : "Bekliyor"}
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={tamamlandi(stage)}
                      onChange={(e) => kaydet(stage, e.target.checked)}
                      className="w-6 h-6"
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function Info({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="font-semibold text-slate-900 break-words">{value}</p>
    </div>
  );
}