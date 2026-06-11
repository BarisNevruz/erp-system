"use client";

import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Project = {
  id: string;
  proje_adi: string;
  musteri_adi?: string;
  urun_tipi?: string;
};

type Worker = {
  id: string;
  full_name: string;
  department?: string;
  active: boolean;
};

type Progress = {
  id: string;
  project_order_id: string;
  proje_adi: string;
  urun_tipi?: string;
  asama: string;
  baslangic_tarihi: string;
  bitis_tarihi?: string | null;
  uretim_yuzdesi: number;
  genel_uretim_yuzdesi?: number;
  worker_ids?: string[];
  personel_sayisi?: number;
  calisma_saati?: number;
  adam_saat?: number;
  aciklama?: string;
  created_at?: string;
};

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

const STAGE_WEIGHTS: Record<string, number> = {
  "Şase Kanat Montajı": 5,
  "Şase Kanat Kaynağı": 5,
  "Genel Montaj": 20,
  "Genel Kaynak": 15,
  "Aksesuar Montajı": 5,
  "Aksesuar Kaynağı": 5,
  "Taşlama Temizlik": 5,
  Kumlama: 5,
  Metalizasyon: 5,
  Astarlama: 5,
  Boyama: 15,
  "Konfor Montajı": 5,
  Sevk: 5,
};

export default function ProductionProgressPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [records, setRecords] = useState<Progress[]>([]);

  const [progressDate, setProgressDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [projectId, setProjectId] = useState("");
  const [stage, setStage] = useState(STAGES[0]);
  const [progressPercent, setProgressPercent] = useState("");
  const [calismaSaati, setCalismaSaati] = useState("");
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [arama, setArama] = useState("");

  useEffect(() => {
    verileriGetir();
  }, []);

  async function verileriGetir() {
    const { data: projectData, error: projectError } = await supabase
      .from("project_orders")
      .select("id, proje_adi, musteri_adi, urun_tipi")
      .order("proje_adi", { ascending: true });

    if (projectError) {
      alert("Proje siparişleri alınamadı: " + projectError.message);
      return;
    }

    const { data: workerData, error: workerError } = await supabase
      .from("production_workers")
      .select("*")
      .eq("active", true)
      .order("full_name", { ascending: true });

    if (workerError) {
      alert("Personel listesi alınamadı: " + workerError.message);
      return;
    }

    const { data: progressData, error: progressError } = await supabase
      .from("production_progress")
      .select("*")
      .order("created_at", { ascending: false });

    if (progressError) {
      alert("Üretim ilerleme kayıtları alınamadı: " + progressError.message);
      return;
    }

    setProjects(projectData || []);
    setWorkers(workerData || []);
    setRecords(progressData || []);
  }

  function personelSec(id: string) {
    if (selectedWorkers.includes(id)) {
      setSelectedWorkers(selectedWorkers.filter((x) => x !== id));
    } else {
      setSelectedWorkers([...selectedWorkers, id]);
    }
  }

  function workerNames(ids?: string[]) {
    if (!ids || ids.length === 0) return "-";

    return ids
      .map((id) => workers.find((w) => w.id === id)?.full_name)
      .filter(Boolean)
      .join(", ");
  }

  async function projeYuzdesiniGuncelle(projectOrderId: string, projeAdi?: string) {
    const { data: projeKayitlari } = await supabase
      .from("production_progress")
      .select("genel_uretim_yuzdesi")
      .eq("project_order_id", projectOrderId);

    const genelToplam =
      projeKayitlari?.reduce(
        (sum, item) => sum + Number(item.genel_uretim_yuzdesi || 0),
        0
      ) || 0;

    const projeGenelYuzde = Math.min(100, Math.round(genelToplam));

    if (projeAdi) {
      await supabase
        .from("production_projects")
        .update({ progress_percent: projeGenelYuzde })
        .eq("project_name", projeAdi);
    }
  }

  async function kaydet() {
    if (!projectId) {
      alert("Lütfen proje seçiniz.");
      return;
    }

    if (selectedWorkers.length === 0) {
      alert("Lütfen en az 1 personel seçiniz.");
      return;
    }

    const percent = Number(progressPercent || 0);
    const saat = Number(calismaSaati || 0);

    if (percent < 0 || percent > 100) {
      alert("İlerleme yüzdesi 0 ile 100 arasında olmalıdır.");
      return;
    }

    if (saat <= 0) {
      alert("Çalışma saati 0'dan büyük olmalıdır.");
      return;
    }

    const seciliProje = projects.find((p) => p.id === projectId);
    const asamaAgirligi = STAGE_WEIGHTS[stage] || 0;
    const genelUretimYuzdesi = Number(
      ((percent * asamaAgirligi) / 100).toFixed(2)
    );
    const personelSayisi = selectedWorkers.length;
    const adamSaat = personelSayisi * saat;

    const { data: mevcutKayit, error: kontrolError } = await supabase
      .from("production_progress")
      .select("id")
      .eq("project_order_id", projectId)
      .eq("asama", stage)
      .maybeSingle();

    if (kontrolError) {
      alert("Mevcut kayıt kontrol hatası: " + kontrolError.message);
      return;
    }

    if (mevcutKayit) {
      const { error } = await supabase
        .from("production_progress")
        .update({
          baslangic_tarihi: progressDate,
          uretim_yuzdesi: percent,
          genel_uretim_yuzdesi: genelUretimYuzdesi,
          worker_ids: selectedWorkers,
          personel_sayisi: personelSayisi,
          calisma_saati: saat,
          adam_saat: adamSaat,
          aciklama: description,
        })
        .eq("id", mevcutKayit.id);

      if (error) {
        alert("Güncelleme hatası: " + error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("production_progress").insert([
        {
          project_order_id: projectId,
          proje_adi: seciliProje?.proje_adi || "",
          urun_tipi: seciliProje?.urun_tipi || "",
          asama: stage,
          baslangic_tarihi: progressDate,
          bitis_tarihi: null,
          uretim_yuzdesi: percent,
          genel_uretim_yuzdesi: genelUretimYuzdesi,
          worker_ids: selectedWorkers,
          personel_sayisi: personelSayisi,
          calisma_saati: saat,
          adam_saat: adamSaat,
          aciklama: description,
        },
      ]);

      if (error) {
        alert("Kayıt hatası: " + error.message);
        return;
      }
    }

    await projeYuzdesiniGuncelle(projectId, seciliProje?.proje_adi);

    alert(
      mevcutKayit
        ? "Mevcut aşama güncellendi."
        : "Yeni üretim ilerlemesi kaydedildi."
    );

    setProgressPercent("");
    setCalismaSaati("");
    setSelectedWorkers([]);
    setDescription("");
    verileriGetir();
  }

  async function sil(id: string) {
    if (!confirm("Bu üretim ilerleme kaydını silmek istiyor musunuz?")) return;

    const silinecekKayit = records.find((r) => r.id === id);

    const { error } = await supabase
      .from("production_progress")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Silme hatası: " + error.message);
      return;
    }

    if (silinecekKayit) {
      await projeYuzdesiniGuncelle(
        silinecekKayit.project_order_id,
        silinecekKayit.proje_adi
      );
    }

    alert("Kayıt silindi ve proje ilerleme yüzdesi güncellendi.");
    verileriGetir();
  }

  const filtreliRecords = records.filter((r) => {
    const text = `
      ${r.baslangic_tarihi || ""}
      ${r.proje_adi || ""}
      ${r.urun_tipi || ""}
      ${r.asama || ""}
      ${r.aciklama || ""}
      ${workerNames(r.worker_ids)}
    `.toLowerCase();

    return text.includes(arama.toLowerCase());
  });

  return (
    <main className="min-h-screen bg-slate-100 flex">
      <Sidebar fullName="Barış Nevruz" role="Yönetici" />

      <section className="flex-1 p-4 md:p-8 overflow-x-auto">
        <div className="max-w-7xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-slate-900">
          <h1 className="text-3xl font-bold">Günlük Üretim İlerlemesi</h1>

          <p className="text-slate-600 mt-2">
            Proje bazlı üretim aşaması, personel ve adam-saat kaydı.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <Kpi title="Toplam Kayıt" value={records.length} />
            <Kpi title="Proje Siparişi" value={projects.length} />
            <Kpi title="Aktif Personel" value={workers.length} />
            <Kpi title="Aşama Sayısı" value={STAGES.length} />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mt-8">
            <h2 className="text-xl font-bold mb-4">Yeni İlerleme Kaydı</h2>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="label">Tarih</label>
                <input
                  type="date"
                  value={progressDate}
                  onChange={(e) => setProgressDate(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Proje</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="input"
                >
                  <option value="">Proje seçiniz</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.proje_adi}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Üretim Aşaması</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="input"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s} (%{STAGE_WEIGHTS[s]})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Aşama İlerlemesi %</label>
                <input
                  type="number"
                  value={progressPercent}
                  onChange={(e) => setProgressPercent(e.target.value)}
                  className="input"
                  placeholder="0 - 100"
                />
              </div>

              <div>
                <label className="label">Çalışma Saati</label>
                <input
                  type="number"
                  value={calismaSaati}
                  onChange={(e) => setCalismaSaati(e.target.value)}
                  className="input"
                  placeholder="Örn: 8"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="label">Çalışan Personeller</label>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-2">
                {workers.map((w) => (
                  <label
                    key={w.id}
                    className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-4 py-3"
                  >
                    <input
                      type="checkbox"
                      checked={selectedWorkers.includes(w.id)}
                      onChange={() => personelSec(w.id)}
                    />
                    <span>
                      {w.full_name}
                      {w.department ? ` - ${w.department}` : ""}
                    </span>
                  </label>
                ))}

                {workers.length === 0 && (
                  <div className="text-slate-500">
                    Aktif üretim personeli bulunamadı.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6">
              <label className="label">Açıklama</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3 min-h-[100px]"
                placeholder="Bugünkü üretim ilerlemesi..."
              />
            </div>

            <button
              onClick={kaydet}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold"
            >
              İlerlemeyi Kaydet
            </button>
          </div>

          <input
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="Proje, ürün tipi, aşama, personel veya açıklama ara..."
            className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3 mt-8"
          />

          <div className="erp-table-wrap mt-8">
  <table className="erp-table border border-slate-300 text-sm">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <Th>Tarih</Th>
                  <Th>Proje</Th>
                  <Th>Ürün Tipi</Th>
                  <Th>Aşama</Th>
                  <Th>Aşama %</Th>
                  <Th>Genel Katkı %</Th>
                  <Th>Personel</Th>
                  <Th>Kişi</Th>
                  <Th>Saat</Th>
                  <Th>Adam/Saat</Th>
                  <Th>Açıklama</Th>
                  <Th>İşlem</Th>
                </tr>
              </thead>

              <tbody>
                {filtreliRecords.map((r) => (
                  <tr key={r.id} className="bg-white text-slate-900">
                    <Td>{r.baslangic_tarihi || "-"}</Td>
                    <Td>{r.proje_adi || "-"}</Td>
                    <Td>{r.urun_tipi || "-"}</Td>
                    <Td>{r.asama || "-"}</Td>
                    <Td>
                      <div className="w-32 bg-slate-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-blue-600 h-3 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              Number(r.uretim_yuzdesi || 0)
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold">
                        %{r.uretim_yuzdesi || 0}
                      </span>
                    </Td>
                    <Td>%{Number(r.genel_uretim_yuzdesi || 0)}</Td>
                    <Td>{workerNames(r.worker_ids)}</Td>
                    <Td>{r.personel_sayisi || 0}</Td>
                    <Td>{r.calisma_saati || 0}</Td>
                    <Td>{r.adam_saat || 0}</Td>
                    <Td>{r.aciklama || "-"}</Td>
                    <Td>
                      <button
                        onClick={() => sil(r.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg"
                      >
                        Sil
                      </button>
                    </Td>
                  </tr>
                ))}

                {filtreliRecords.length === 0 && (
                  <tr>
                    <td colSpan={12} className="p-6 text-center text-slate-500">
                      Üretim ilerleme kaydı bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

function Kpi({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl p-5 border bg-slate-50 border-slate-200">
      <p className="text-slate-600 font-semibold">{title}</p>
      <p className="text-2xl font-bold mt-1 text-slate-900">
        {Number(value || 0).toLocaleString("tr-TR")}
      </p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="border border-slate-300 p-2 text-left">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="border border-slate-300 p-2 align-top">{children}</td>;
}