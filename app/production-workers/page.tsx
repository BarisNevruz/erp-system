"use client";

import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Worker = {
  id: string;
  full_name: string;
  department: string;
  active: boolean;
  created_at?: string;
};

export default function ProductionWorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [arama, setArama] = useState("");
  const [editing, setEditing] = useState<Worker | null>(null);

  useEffect(() => {
    workersGetir();
  }, []);

  async function workersGetir() {
    const { data, error } = await supabase
      .from("production_workers")
      .select("*")
      .order("full_name", { ascending: true });

    if (error) {
      alert("Personeller alınamadı: " + error.message);
      return;
    }

    setWorkers(data || []);
  }

  async function personelEkle() {
    if (!fullName.trim()) {
      alert("Personel adı zorunludur.");
      return;
    }

    const { error } = await supabase.from("production_workers").insert([
      {
        full_name: fullName.trim(),
        department: department.trim(),
        active: true,
      },
    ]);

    if (error) {
      alert("Personel ekleme hatası: " + error.message);
      return;
    }

    setFullName("");
    setDepartment("");
    workersGetir();
  }

  async function personelGuncelle() {
    if (!editing) return;

    if (!editing.full_name.trim()) {
      alert("Personel adı boş olamaz.");
      return;
    }

    const { error } = await supabase
      .from("production_workers")
      .update({
        full_name: editing.full_name.trim(),
        department: editing.department?.trim() || "",
        active: editing.active,
      })
      .eq("id", editing.id);

    if (error) {
      alert("Güncelleme hatası: " + error.message);
      return;
    }

    setEditing(null);
    workersGetir();
  }

  async function aktifPasifYap(worker: Worker) {
    const { error } = await supabase
      .from("production_workers")
      .update({ active: !worker.active })
      .eq("id", worker.id);

    if (error) {
      alert("Durum güncelleme hatası: " + error.message);
      return;
    }

    workersGetir();
  }

  async function personelSil(id: string) {
    if (!confirm("Bu personeli silmek istiyor musunuz?")) return;

    const { error } = await supabase
      .from("production_workers")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Silme hatası: " + error.message);
      return;
    }

    workersGetir();
  }

  const filtreliWorkers = workers.filter((w) => {
    const text = `${w.full_name} ${w.department}`.toLowerCase();
    return text.includes(arama.toLowerCase());
  });

  return (
    <main className="min-h-screen bg-slate-100 flex">
      <Sidebar fullName="Barış Nevruz" role="Yönetici" />

      <section className="flex-1 p-4 md:p-8 overflow-x-auto">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-slate-900">
          <h1 className="text-3xl font-bold text-slate-900">
            Üretim Personelleri
          </h1>

          <p className="text-slate-600 mt-2">
            Üretimde çalışan personelleri kaydedin ve yönetin.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ad Soyad"
              className="bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3"
            />

            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Birim / Bölüm"
              className="bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3"
            />

            <button
              onClick={personelEkle}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold"
            >
              Personel Ekle
            </button>

            <input
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Personel ara..."
              className="bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Kpi title="Toplam Personel" value={workers.length} />
            <Kpi
              title="Aktif Personel"
              value={workers.filter((w) => w.active).length}
            />
            <Kpi
              title="Pasif Personel"
              value={workers.filter((w) => !w.active).length}
              danger
            />
          </div>

          <div className="overflow-x-auto mt-8">
            <table className="w-full border border-slate-300 text-sm min-w-[800px]">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <Th>Ad Soyad</Th>
                  <Th>Birim</Th>
                  <Th>Durum</Th>
                  <Th>İşlem</Th>
                </tr>
              </thead>

              <tbody>
                {filtreliWorkers.map((w) => (
                  <tr key={w.id} className="bg-white text-slate-900">
                    <Td>{w.full_name}</Td>
                    <Td>{w.department || "-"}</Td>
                    <Td>
                      <span
                        className={
                          w.active
                            ? "px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-xs"
                            : "px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold text-xs"
                        }
                      >
                        {w.active ? "Aktif" : "Pasif"}
                      </span>
                    </Td>

                    <Td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditing(w)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg"
                        >
                          Düzenle
                        </button>

                        <button
                          onClick={() => aktifPasifYap(w)}
                          className={
                            w.active
                              ? "bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded-lg"
                              : "bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg"
                          }
                        >
                          {w.active ? "Pasif Yap" : "Aktif Yap"}
                        </button>

                        <button
                          onClick={() => personelSil(w.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg"
                        >
                          Sil
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}

                {filtreliWorkers.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-6 text-center text-slate-500"
                    >
                      Personel kaydı bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {editing && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-xl w-full text-slate-900">
              <h2 className="text-2xl font-bold mb-5">Personel Düzenle</h2>

              <div className="space-y-4">
                <input
                  value={editing.full_name}
                  onChange={(e) =>
                    setEditing({ ...editing, full_name: e.target.value })
                  }
                  placeholder="Ad Soyad"
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3"
                />

                <input
                  value={editing.department || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, department: e.target.value })
                  }
                  placeholder="Birim / Bölüm"
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3"
                />

                <select
                  value={editing.active ? "Aktif" : "Pasif"}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      active: e.target.value === "Aktif",
                    })
                  }
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3"
                >
                  <option>Aktif</option>
                  <option>Pasif</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setEditing(null)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-900 px-5 py-3 rounded-xl"
                >
                  Vazgeç
                </button>

                <button
                  onClick={personelGuncelle}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold"
                >
                  Güncelle
                </button>
              </div>
            </div>
          </div>
        )}
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
        danger ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"
      }`}
    >
      <p
        className={
          danger ? "text-red-600 font-semibold" : "text-slate-600 font-semibold"
        }
      >
        {title}
      </p>

      <p
        className={`text-2xl font-bold mt-1 ${
          danger ? "text-red-700" : "text-slate-900"
        }`}
      >
        {Number(value || 0).toLocaleString("tr-TR")}
      </p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="border border-slate-300 p-2 text-left">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="border border-slate-300 p-2">{children}</td>;
}