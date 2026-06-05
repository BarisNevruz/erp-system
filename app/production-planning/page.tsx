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

export default function ProductionPlanningPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState("");

  useEffect(() => {
    veriGetir();
  }, []);

  async function veriGetir() {
    const { data: projectData } = await supabase
      .from("production_projects")
      .select("*")
      .eq("active", true)
      .order("project_name");

    const { data: planData } = await supabase
      .from("production_plan_tasks")
      .select("*, production_projects(*)")
      .order("start_date");

    setProjects(projectData || []);
    setPlans(planData || []);
  }

  async function planOlustur() {
    if (!selectedProject) {
      alert("Proje seçiniz.");
      return;
    }

    const proje = projects.find(
      (p) => p.id === selectedProject
    );

    if (!proje?.start_date) {
      alert("Projede başlangıç tarihi yok.");
      return;
    }

    const eski = await supabase
      .from("production_plan_tasks")
      .delete()
      .eq("project_id", selectedProject);

    const baslangic = new Date(proje.start_date);

    const satirlar = STAGES.map((stage, i) => {
      const start = new Date(baslangic);
      start.setDate(start.getDate() + i * 2);

      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      return {
        project_id: selectedProject,
        stage_name: stage,
        start_date: start.toISOString().split("T")[0],
        end_date: end.toISOString().split("T")[0],
        completed: false,
      };
    });

    const { error } = await supabase
      .from("production_plan_tasks")
      .insert(satirlar);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Üretim planı oluşturuldu.");
    veriGetir();
  }

  return (
    <main className="min-h-screen bg-slate-100 flex">
      <Sidebar fullName="Barış Nevruz" role="Yönetici" />

      <section className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto bg-white rounded-2xl border border-slate-200 p-8">

          <h1 className="text-3xl font-bold">
            Üretim Planlama
          </h1>

          <p className="text-slate-600 mt-2">
            Proje bazlı üretim planı oluşturun.
          </p>

          <div className="grid md:grid-cols-3 gap-4 mt-8">

            <select
              value={selectedProject}
              onChange={(e) =>
                setSelectedProject(e.target.value)
              }
              className="border border-slate-300 rounded-xl p-3"
            >
              <option value="">
                Proje Seçiniz
              </option>

              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_name}
                </option>
              ))}
            </select>

            <button
              onClick={planOlustur}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-3"
            >
              Otomatik Plan Oluştur
            </button>
          </div>

          <div className="mt-10 overflow-x-auto">
            <table className="w-full border border-slate-300">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="p-3 border">
                    Proje
                  </th>

                  <th className="p-3 border">
                    Aşama
                  </th>

                  <th className="p-3 border">
                    Başlangıç
                  </th>

                  <th className="p-3 border">
                    Bitiş
                  </th>
                </tr>
              </thead>

              <tbody>
                {plans.map((p) => (
                  <tr key={p.id}>
                    <td className="border p-3">
                      {
                        p.production_projects
                          ?.project_name
                      }
                    </td>

                    <td className="border p-3">
                      {p.stage_name}
                    </td>

                    <td className="border p-3">
                      {p.start_date}
                    </td>

                    <td className="border p-3">
                      {p.end_date}
                    </td>
                  </tr>
                ))}

                {plans.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center p-6"
                    >
                      Plan bulunamadı
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