"use client";

import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ProductionProject = {
  id: string;
  project_code?: string;
  project_order_id?: string;
  project_name: string;
  customer_name: string;
  product_type: string;
  quantity: number;
  start_date: string;
  planned_delivery_date: string;
  status: string;
  progress_percent: number;
  active: boolean;
  created_at?: string;
};

const PRODUCT_TYPES = [
  "Platform",
  "Lowbed",
  "Konteyner Taşıyıcı",
  "Damper Treyler",
  "Şase",
  "Araç Üstü Kasa",
  "Römork",
  "Özel Proje",
];

const STATUS_LIST = [
  "Devam Ediyor",
  "Beklemede",
  "Tamamlandı",
  "Sevk Edildi",
  "İptal",
];

export default function ProductionProjectsPage() {
  const [projects, setProjects] = useState<ProductionProject[]>([]);
  const [arama, setArama] = useState("");
  const [editing, setEditing] = useState<ProductionProject | null>(null);

  const [form, setForm] = useState({
    project_code: "",
    project_name: "",
    customer_name: "",
    product_type: "",
    quantity: "",
    start_date: "",
    planned_delivery_date: "",
    status: "Devam Ediyor",
    progress_percent: "0",
  });

  useEffect(() => {
    projeleriGetir();
  }, []);

  async function projeleriGetir() {
    const { data, error } = await supabase
      .from("production_projects")
      .select("*")
      .order("planned_delivery_date", { ascending: true });

    if (error) {
      alert("Üretim projeleri alınamadı: " + error.message);
      return;
    }

    setProjects(data || []);
  }

  function handleChange(e: any) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function projeEkle() {
    if (!form.project_name.trim()) {
      alert("Proje adı zorunludur.");
      return;
    }

    const { error } = await supabase.from("production_projects").insert([
      {
        project_code: form.project_code.trim(),
        project_name: form.project_name.trim(),
        customer_name: form.customer_name.trim(),
        product_type: form.product_type,
        quantity: Number(form.quantity || 0),
        start_date: form.start_date || null,
        planned_delivery_date: form.planned_delivery_date || null,
        status: form.status,
        progress_percent: Number(form.progress_percent || 0),
        active: true,
      },
    ]);

    if (error) {
      alert("Proje ekleme hatası: " + error.message);
      return;
    }

    setForm({
      project_code: "",
      project_name: "",
      customer_name: "",
      product_type: "",
      quantity: "",
      start_date: "",
      planned_delivery_date: "",
      status: "Devam Ediyor",
      progress_percent: "0",
    });

    projeleriGetir();
  }

  async function projeGuncelle() {
    if (!editing) return;

    if (!editing.project_name.trim()) {
      alert("Proje adı boş olamaz.");
      return;
    }

    const { error } = await supabase
      .from("production_projects")
      .update({
        project_code: editing.project_code || "",
        project_name: editing.project_name.trim(),
        customer_name: editing.customer_name || "",
        product_type: editing.product_type || "",
        quantity: Number(editing.quantity || 0),
        start_date: editing.start_date || null,
        planned_delivery_date: editing.planned_delivery_date || null,
        status: editing.status || "Devam Ediyor",
        progress_percent: Number(editing.progress_percent || 0),
        active: editing.active,
      })
      .eq("id", editing.id);

    if (error) {
      alert("Güncelleme hatası: " + error.message);
      return;
    }

    setEditing(null);
    projeleriGetir();
  }

  async function aktifPasifYap(project: ProductionProject) {
    const { error } = await supabase
      .from("production_projects")
      .update({ active: !project.active })
      .eq("id", project.id);

    if (error) {
      alert("Durum güncelleme hatası: " + error.message);
      return;
    }

    projeleriGetir();
  }

  async function projeSil(id: string) {
    if (!confirm("Bu üretim projesini silmek istiyor musunuz?")) return;

    const { error } = await supabase
      .from("production_projects")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Silme hatası: " + error.message);
      return;
    }

    projeleriGetir();
  }

  function kalanGunHesapla(date?: string) {
    if (!date) return 0;

    const bugun = new Date();
    const hedef = new Date(date);

    bugun.setHours(0, 0, 0, 0);
    hedef.setHours(0, 0, 0, 0);

    return Math.ceil((hedef.getTime() - bugun.getTime()) / 86400000);
  }

  function durumRengi(project: ProductionProject) {
    if (!project.active) return "bg-slate-50 text-slate-500";
    if (project.status === "Tamamlandı" || project.status === "Sevk Edildi") {
      return "bg-green-50 border-b border-green-200 text-slate-900";
    }

    const kalan = kalanGunHesapla(project.planned_delivery_date);

    if (kalan < 0) return "bg-red-50 border-b border-red-200 text-slate-900";
    if (kalan <= 3) return "bg-yellow-50 border-b border-yellow-200 text-slate-900";

    return "bg-white border-b border-slate-200 text-slate-900";
  }

  const filtreliProjeler = projects.filter((p) => {
    const text = `${p.project_code || ""} ${p.project_name || ""} ${
      p.customer_name || ""
    } ${p.product_type || ""} ${p.status || ""}`.toLowerCase();

    return text.includes(arama.toLowerCase());
  });

  const aktifProjeler = projects.filter((p) => p.active);
  const tamamlananProjeler = projects.filter(
    (p) => p.status === "Tamamlandı" || p.status === "Sevk Edildi"
  );
  const gecikenProjeler = projects.filter(
    (p) =>
      p.active &&
      p.status !== "Tamamlandı" &&
      p.status !== "Sevk Edildi" &&
      p.planned_delivery_date &&
      kalanGunHesapla(p.planned_delivery_date) < 0
  );

  return (
    <main className="min-h-screen bg-slate-100 flex">
      <Sidebar fullName="Barış Nevruz" role="Yönetici" />

      <section className="flex-1 p-4 md:p-8 overflow-x-auto">
        <div className="max-w-7xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-slate-900">
          <h1 className="text-3xl font-bold text-slate-900">
            Üretim Projeleri
          </h1>

          <p className="text-slate-600 mt-2">
            Üretimdeki projeleri kaydedin, planlayın ve ilerleme yüzdesini takip edin.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <Kpi title="Toplam Proje" value={projects.length} />
            <Kpi title="Aktif Proje" value={aktifProjeler.length} />
            <Kpi title="Tamamlanan" value={tamamlananProjeler.length} />
            <Kpi title="Geciken" value={gecikenProjeler.length} danger />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mt-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Yeni Üretim Projesi
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                label="Proje Kodu"
                name="project_code"
                value={form.project_code}
                onChange={handleChange}
              />

              <Input
                label="Proje Adı"
                name="project_name"
                value={form.project_name}
                onChange={handleChange}
              />

              <Input
                label="Müşteri"
                name="customer_name"
                value={form.customer_name}
                onChange={handleChange}
              />

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Ürün Tipi
                </label>
                <select
                  name="product_type"
                  value={form.product_type}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3"
                >
                  <option value="">Seçiniz</option>
                  {PRODUCT_TYPES.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Adet"
                name="quantity"
                type="number"
                value={form.quantity}
                onChange={handleChange}
              />

              <Input
                label="Başlangıç Tarihi"
                name="start_date"
                type="date"
                value={form.start_date}
                onChange={handleChange}
              />

              <Input
                label="Planlanan Sevk Tarihi"
                name="planned_delivery_date"
                type="date"
                value={form.planned_delivery_date}
                onChange={handleChange}
              />

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Durum
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3"
                >
                  {STATUS_LIST.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="İlerleme %"
                name="progress_percent"
                type="number"
                value={form.progress_percent}
                onChange={handleChange}
              />

              <button
                onClick={projeEkle}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold md:mt-6"
              >
                Proje Ekle
              </button>
            </div>
          </div>

          <input
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="Proje kodu, proje adı, müşteri, ürün tipi veya durum ara..."
            className="w-full bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-xl px-4 py-3 mt-8"
          />

          <div className="overflow-x-auto mt-8">
            <table className="w-full border border-slate-300 text-sm min-w-[1300px]">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <Th>İşlem</Th>
                  <Th>Kod</Th>
                  <Th>Proje</Th>
                  <Th>Müşteri</Th>
                  <Th>Ürün Tipi</Th>
                  <Th>Adet</Th>
                  <Th>Başlangıç</Th>
                  <Th>Planlanan Sevk</Th>
                  <Th>Kalan Gün</Th>
                  <Th>İlerleme</Th>
                  <Th>Durum</Th>
                  <Th>Aktif</Th>
                </tr>
              </thead>

              <tbody>
                {filtreliProjeler.map((p) => (
                  <tr key={p.id} className={durumRengi(p)}>
                    <Td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditing(p)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg"
                        >
                          Düzenle
                        </button>

                        <button
                          onClick={() => aktifPasifYap(p)}
                          className={
                            p.active
                              ? "bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded-lg"
                              : "bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg"
                          }
                        >
                          {p.active ? "Pasif Yap" : "Aktif Yap"}
                        </button>

                        <button
                          onClick={() => projeSil(p.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg"
                        >
                          Sil
                        </button>
                      </div>
                    </Td>

                    <Td>{p.project_code || "-"}</Td>
                    <Td>{p.project_name}</Td>
                    <Td>{p.customer_name || "-"}</Td>
                    <Td>{p.product_type || "-"}</Td>
                    <Td>{p.quantity || 0}</Td>
                    <Td>{p.start_date || "-"}</Td>
                    <Td>{p.planned_delivery_date || "-"}</Td>
                    <Td>
                      {p.planned_delivery_date
                        ? kalanGunHesapla(p.planned_delivery_date)
                        : "-"}
                    </Td>
                    <Td>
                      <div className="w-32 bg-slate-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-blue-600 h-3 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              Number(p.progress_percent || 0)
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold">
                        %{p.progress_percent || 0}
                      </span>
                    </Td>
                    <Td>{p.status || "-"}</Td>
                    <Td>{p.active ? "Aktif" : "Pasif"}</Td>
                  </tr>
                ))}

                {filtreliProjeler.length === 0 && (
                  <tr>
                    <td colSpan={12} className="p-6 text-center text-slate-500">
                      Üretim projesi bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {editing && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto text-slate-900">
              <h2 className="text-2xl font-bold mb-5">Üretim Projesi Düzenle</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <EditInput
                  label="Proje Kodu"
                  value={editing.project_code || ""}
                  onChange={(value) =>
                    setEditing({ ...editing, project_code: value })
                  }
                />

                <EditInput
                  label="Proje Adı"
                  value={editing.project_name || ""}
                  onChange={(value) =>
                    setEditing({ ...editing, project_name: value })
                  }
                />

                <EditInput
                  label="Müşteri"
                  value={editing.customer_name || ""}
                  onChange={(value) =>
                    setEditing({ ...editing, customer_name: value })
                  }
                />

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Ürün Tipi
                  </label>
                  <select
                    value={editing.product_type || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, product_type: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3"
                  >
                    <option value="">Seçiniz</option>
                    {PRODUCT_TYPES.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </div>

                <EditInput
                  label="Adet"
                  type="number"
                  value={String(editing.quantity || 0)}
                  onChange={(value) =>
                    setEditing({ ...editing, quantity: Number(value || 0) })
                  }
                />

                <EditInput
                  label="Başlangıç Tarihi"
                  type="date"
                  value={editing.start_date || ""}
                  onChange={(value) =>
                    setEditing({ ...editing, start_date: value })
                  }
                />

                <EditInput
                  label="Planlanan Sevk Tarihi"
                  type="date"
                  value={editing.planned_delivery_date || ""}
                  onChange={(value) =>
                    setEditing({ ...editing, planned_delivery_date: value })
                  }
                />

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Durum
                  </label>
                  <select
                    value={editing.status || "Devam Ediyor"}
                    onChange={(e) =>
                      setEditing({ ...editing, status: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3"
                  >
                    {STATUS_LIST.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </div>

                <EditInput
                  label="İlerleme %"
                  type="number"
                  value={String(editing.progress_percent || 0)}
                  onChange={(value) =>
                    setEditing({
                      ...editing,
                      progress_percent: Number(value || 0),
                    })
                  }
                />

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Aktif / Pasif
                  </label>
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
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setEditing(null)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-900 px-5 py-3 rounded-xl"
                >
                  Vazgeç
                </button>

                <button
                  onClick={projeGuncelle}
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

function Input({
  label,
  name,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  onChange: any;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">
        {label}
      </label>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3"
      />
    </div>
  );
}

function EditInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3"
      />
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="border border-slate-300 p-2 text-left">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="border border-slate-300 p-2">{children}</td>;
}