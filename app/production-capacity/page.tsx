"use client";

import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ProductionCapacityPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  const [projectId, setProjectId] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [stageName, setStageName] = useState("");
  const [workDate, setWorkDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [plannedHours, setPlannedHours] = useState("");
  const [actualHours, setActualHours] = useState("");

  useEffect(() => {
    veriGetir();
  }, []);

  async function veriGetir() {
    const { data: p } = await supabase
      .from("production_projects")
      .select("*")
      .eq("active", true);

    const { data: w } = await supabase
      .from("production_workers")
      .select("*")
      .eq("active", true);

    const { data: a } = await supabase
      .from("production_assignments")
      .select(`
        *,
        production_projects(project_name),
        production_workers(full_name)
      `)
      .order("work_date", { ascending: false });

    setProjects(p || []);
    setWorkers(w || []);
    setAssignments(a || []);
  }

  async function kaydet() {
    if (!projectId || !workerId) {
      alert("Proje ve personel seçiniz.");
      return;
    }

    const { error } = await supabase
      .from("production_assignments")
      .insert([
        {
          project_id: projectId,
          worker_id: workerId,
          stage_name: stageName,
          work_date: workDate,
          planned_hours: Number(plannedHours || 0),
          actual_hours: Number(actualHours || 0),
        },
      ]);

    if (error) {
      alert(error.message);
      return;
    }

    setPlannedHours("");
    setActualHours("");
    setStageName("");

    veriGetir();
  }

  async function sil(id: string) {
    if (!confirm("Kaydı silmek istiyor musunuz?")) return;

    await supabase
      .from("production_assignments")
      .delete()
      .eq("id", id);

    veriGetir();
  }

  const toplamPlanlanan = assignments.reduce(
    (t, x) => t + Number(x.planned_hours || 0),
    0
  );

  const toplamGerceklesen = assignments.reduce(
    (t, x) => t + Number(x.actual_hours || 0),
    0
  );

  return (
    <main className="min-h-screen bg-slate-100 flex">
      <Sidebar fullName="Barış Nevruz" role="Yönetici" />

      <section className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto bg-white rounded-2xl border border-slate-200 p-8">

          <h1 className="text-3xl font-bold">
            Üretim Kapasite Planlama
          </h1>

          <p className="text-slate-600 mt-2">
            Personel bazlı adam/saat planlama
          </p>

          <div className="grid md:grid-cols-4 gap-4 mt-8">

            <Kpi
              title="Toplam Kayıt"
              value={assignments.length}
            />

            <Kpi
              title="Planlanan Saat"
              value={toplamPlanlanan}
            />

            <Kpi
              title="Gerçekleşen Saat"
              value={toplamGerceklesen}
            />

            <Kpi
              title="Aktif Personel"
              value={workers.length}
            />

          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-8">

            <select
              value={projectId}
              onChange={(e) =>
                setProjectId(e.target.value)
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

            <select
              value={workerId}
              onChange={(e) =>
                setWorkerId(e.target.value)
              }
              className="border border-slate-300 rounded-xl p-3"
            >
              <option value="">
                Personel Seçiniz
              </option>

              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.full_name}
                </option>
              ))}
            </select>

            <input
              value={stageName}
              onChange={(e) =>
                setStageName(e.target.value)
              }
              placeholder="Aşama"
              className="border border-slate-300 rounded-xl p-3"
            />

            <input
              type="date"
              value={workDate}
              onChange={(e) =>
                setWorkDate(e.target.value)
              }
              className="border border-slate-300 rounded-xl p-3"
            />

            <input
              type="number"
              value={plannedHours}
              onChange={(e) =>
                setPlannedHours(e.target.value)
              }
              placeholder="Planlanan Saat"
              className="border border-slate-300 rounded-xl p-3"
            />

            <input
              type="number"
              value={actualHours}
              onChange={(e) =>
                setActualHours(e.target.value)
              }
              placeholder="Gerçekleşen Saat"
              className="border border-slate-300 rounded-xl p-3"
            />

          </div>

          <button
            onClick={kaydet}
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl"
          >
            Kaydet
          </button>

          <div className="overflow-x-auto mt-10">
            <table className="w-full border border-slate-300">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="border p-3">Tarih</th>
                  <th className="border p-3">Proje</th>
                  <th className="border p-3">Personel</th>
                  <th className="border p-3">Aşama</th>
                  <th className="border p-3">Plan</th>
                  <th className="border p-3">Gerçek</th>
                  <th className="border p-3">İşlem</th>
                </tr>
              </thead>

              <tbody>
                {assignments.map((a) => (
                  <tr key={a.id}>
                    <td className="border p-3">
                      {a.work_date}
                    </td>

                    <td className="border p-3">
                      {a.production_projects?.project_name}
                    </td>

                    <td className="border p-3">
                      {a.production_workers?.full_name}
                    </td>

                    <td className="border p-3">
                      {a.stage_name}
                    </td>

                    <td className="border p-3">
                      {a.planned_hours}
                    </td>

                    <td className="border p-3">
                      {a.actual_hours}
                    </td>

                    <td className="border p-3">
                      <button
                        onClick={() => sil(a.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded-lg"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </section>
    </main>
  );
}

function Kpi({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
      <p className="text-slate-600">
        {title}
      </p>

      <p className="text-3xl font-bold mt-2">
        {value}
      </p>
    </div>
  );
}