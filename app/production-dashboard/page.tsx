"use client";

import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ProductionDashboardPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);

  useEffect(() => {
    veriGetir();
  }, []);

  async function veriGetir() {
    const { data: workerData } = await supabase
      .from("production_workers")
      .select("*");

    const { data: projectData } = await supabase
      .from("production_projects")
      .select("*");

    const { data: progressData } = await supabase
      .from("production_progress")
      .select("*, production_projects(*)")
      .order("progress_date", { ascending: false })
      .limit(20);

    setWorkers(workerData || []);
    setProjects(projectData || []);
    setProgress(progressData || []);
  }

  function kalanGun(tarih: string) {
    if (!tarih) return 0;

    const bugun = new Date();
    const hedef = new Date(tarih);

    bugun.setHours(0, 0, 0, 0);
    hedef.setHours(0, 0, 0, 0);

    return Math.ceil(
      (hedef.getTime() - bugun.getTime()) / 86400000
    );
  }

  const aktifProjeler = projects.filter((p) => p.active);

  const tamamlananProjeler = projects.filter(
    (p) =>
      p.status === "Tamamlandı" ||
      p.status === "Sevk Edildi"
  );

  const gecikenProjeler = projects.filter(
    (p) =>
      p.active &&
      p.planned_delivery_date &&
      kalanGun(p.planned_delivery_date) < 0
  );

  const aktifPersonel = workers.filter(
    (w) => w.active
  );

  return (
    <main className="min-h-screen bg-slate-100 flex">
      <Sidebar fullName="Barış Nevruz" role="Yönetici" />

      <section className="flex-1 p-4 md:p-8 overflow-x-auto">
        <div className="max-w-7xl mx-auto">

          <h1 className="text-3xl font-bold text-slate-900">
            Üretim Dashboard
          </h1>

          <p className="text-slate-600 mt-2">
            Üretim planlama ve ilerleme merkezi
          </p>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-8">
            <Kpi
              title="Toplam Proje"
              value={projects.length}
            />

            <Kpi
              title="Aktif Proje"
              value={aktifProjeler.length}
            />

            <Kpi
              title="Tamamlanan"
              value={tamamlananProjeler.length}
            />

            <Kpi
              title="Geciken"
              value={gecikenProjeler.length}
              danger
            />

            <Kpi
              title="Aktif Personel"
              value={aktifPersonel.length}
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 mt-8">
            <h2 className="text-xl font-bold mb-4">
              Üretim Projeleri
            </h2>

            <div className="space-y-4">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="border border-slate-200 rounded-xl p-4"
                >
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-bold">
                        {p.project_name}
                      </h3>

                      <p className="text-sm text-slate-500">
                        {p.customer_name}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold">
                        %{p.progress_percent || 0}
                      </p>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 h-4 rounded-full mt-3 overflow-hidden">
                    <div
                      className="bg-blue-600 h-4"
                      style={{
                        width: `${Math.min(
                          100,
                          Number(p.progress_percent || 0)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}

              {projects.length === 0 && (
                <p className="text-slate-500">
                  Üretim projesi bulunamadı.
                </p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-8">

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-xl font-bold mb-4">
                Termin Yaklaşan / Geciken
              </h2>

              <div className="space-y-3">
                {projects
                  .filter((p) => p.active)
                  .map((p) => {
                    const gun = kalanGun(
                      p.planned_delivery_date
                    );

                    return (
                      <div
                        key={p.id}
                        className="flex justify-between border-b pb-2"
                      >
                        <span>
                          {p.project_name}
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
                          {gun < 0
                            ? `${Math.abs(gun)} gün gecikti`
                            : `${gun} gün kaldı`}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-xl font-bold mb-4">
                Son Üretim Kayıtları
              </h2>

              <div className="space-y-3">
                {progress.map((r) => (
                  <div
                    key={r.id}
                    className="border-b pb-3"
                  >
                    <p className="font-semibold">
                      {
                        r.production_projects
                          ?.project_name
                      }
                    </p>

                    <p className="text-sm text-slate-600">
                      {r.stage}
                    </p>

                    <p className="text-sm text-blue-600 font-semibold">
                      %{r.progress_percent}
                    </p>

                    <p className="text-xs text-slate-500">
                      {r.progress_date}
                    </p>
                  </div>
                ))}

                {progress.length === 0 && (
                  <p className="text-slate-500">
                    Kayıt bulunamadı.
                  </p>
                )}
              </div>
            </div>

          </div>
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
      className={`rounded-2xl p-5 border ${
        danger
          ? "bg-red-50 border-red-200"
          : "bg-white border-slate-200"
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
          danger
            ? "text-red-700"
            : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}