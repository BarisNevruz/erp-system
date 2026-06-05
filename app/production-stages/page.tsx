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

export default function ProductionStagesPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [stageData, setStageData] = useState<any[]>([]);

  useEffect(() => {
    projeGetir();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      asamalariGetir();
    }
  }, [selectedProject]);

  async function projeGetir() {
    const { data } = await supabase
      .from("production_projects")
      .select("*")
      .eq("active", true)
      .order("project_name");

    setProjects(data || []);
  }

  async function asamalariGetir() {
    const { data } = await supabase
      .from("production_stage_progress")
      .select("*")
      .eq("project_id", selectedProject);

    setStageData(data || []);
  }

  async function kaydet(stageName: string, completed: boolean) {
    const mevcut = stageData.find(
      (x) => x.stage_name === stageName
    );

    if (mevcut) {
      await supabase
        .from("production_stage_progress")
        .update({
          completed,
          completed_date: completed
            ? new Date().toISOString().split("T")[0]
            : null,
        })
        .eq("id", mevcut.id);
    } else {
      await supabase
        .from("production_stage_progress")
        .insert([
          {
            project_id: selectedProject,
            stage_name: stageName,
            completed,
            completed_date: completed
              ? new Date().toISOString().split("T")[0]
              : null,
          },
        ]);
    }

    asamalariGetir();
    projeYuzdesiGuncelle();
  }

  async function projeYuzdesiGuncelle() {
    const { data } = await supabase
      .from("production_stage_progress")
      .select("*")
      .eq("project_id", selectedProject)
      .eq("completed", true);

    const tamamlanan = data?.length || 0;

    const yuzde = Math.round(
      (tamamlanan / STAGES.length) * 100
    );

    await supabase
      .from("production_projects")
      .update({
        progress_percent: yuzde,
      })
      .eq("id", selectedProject);
  }

  function tamamlandi(stageName: string) {
    return stageData.some(
      (x) =>
        x.stage_name === stageName &&
        x.completed === true
    );
  }

  const tamamlananAdet = stageData.filter(
    (x) => x.completed
  ).length;

  const yuzde = Math.round(
    (tamamlananAdet / STAGES.length) * 100
  );

  return (
    <main className="min-h-screen bg-slate-100 flex">
      <Sidebar fullName="Barış Nevruz" role="Yönetici" />

      <section className="flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8">

          <h1 className="text-3xl font-bold">
            Üretim Aşamaları
          </h1>

          <p className="text-slate-600 mt-2">
            Proje bazlı üretim aşamalarını takip edin.
          </p>

          <div className="mt-6">
            <label className="font-semibold">
              Proje Seç
            </label>

            <select
              value={selectedProject}
              onChange={(e) =>
                setSelectedProject(e.target.value)
              }
              className="w-full border border-slate-300 rounded-xl p-3 mt-2"
            >
              <option value="">
                Proje seçiniz
              </option>

              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_name}
                </option>
              ))}
            </select>
          </div>

          {selectedProject && (
            <>
              <div className="mt-8">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">
                    Genel İlerleme
                  </span>

                  <span className="font-bold">
                    %{yuzde}
                  </span>
                </div>

                <div className="w-full h-5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="bg-green-600 h-5"
                    style={{
                      width: `${yuzde}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-8 space-y-3">
                {STAGES.map((stage) => (
                  <div
                    key={stage}
                    className="flex items-center justify-between border border-slate-200 rounded-xl p-4"
                  >
                    <div>
                      <p className="font-semibold">
                        {stage}
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={tamamlandi(stage)}
                      onChange={(e) =>
                        kaydet(
                          stage,
                          e.target.checked
                        )
                      }
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