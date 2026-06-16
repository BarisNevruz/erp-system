"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";

type CustomerOrder = {
  id: string;
  siparis_no?: string;
  musteri: string;
  proje_adi?: string;
  urun_tipi?: string;
  adet?: number;
  siparis_tarihi?: string;
  termin_tarihi?: string;
  aciklama?: string;
  durum?: string;
};

const emptyForm = {
  siparis_no: "",
  musteri: "",
  proje_adi: "",
  urun_tipi: "",
  adet: 1,
  siparis_tarihi: "",
  termin_tarihi: "",
  aciklama: "",
  durum: "Aktif",
};

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);

    const { data, error } = await supabase
      .from("customer_orders")
      .select("*")
      .order("siparis_tarihi", { ascending: false, nullsFirst: false })
      .order("siparis_no", { ascending: false });

    if (error) {
      alert("Müşteri siparişleri alınamadı: " + error.message);
      setLoading(false);
      return;
    }

    setOrders(data || []);
    setLoading(false);
  }

  async function saveOrder() {
    if (!form.siparis_no.trim()) {
      alert("Sipariş no zorunludur.");
      return;
    }

    if (!form.musteri.trim()) {
      alert("Müşteri adı zorunludur.");
      return;
    }

    const duplicateQuery = supabase
      .from("customer_orders")
      .select("id")
      .eq("siparis_no", form.siparis_no);

    const { data: duplicate } = editingId
      ? await duplicateQuery.neq("id", editingId).maybeSingle()
      : await duplicateQuery.maybeSingle();

    if (duplicate) {
      alert("Bu sipariş numarası başka bir kayıtta zaten var.");
      return;
    }

    const payload = {
      siparis_no: form.siparis_no,
      musteri: form.musteri,
      proje_adi: form.proje_adi || "",
      urun_tipi: form.urun_tipi || "",
      adet: Number(form.adet) || 1,
      siparis_tarihi: form.siparis_tarihi || null,
      termin_tarihi: form.termin_tarihi || null,
      aciklama: form.aciklama || "",
      durum: form.durum || "Aktif",
    };

    if (editingId) {
      const { error } = await supabase
        .from("customer_orders")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        alert("Güncelleme hatası: " + error.message);
        return;
      }

      alert("Müşteri siparişi güncellendi.");
    } else {
      const { error } = await supabase.from("customer_orders").insert(payload);

      if (error) {
        alert("Kayıt hatası: " + error.message);
        return;
      }

      alert("Müşteri siparişi kaydedildi.");
    }

    cancelEdit();
    loadOrders();
  }

  function startEdit(order: CustomerOrder) {
    setEditingId(order.id);
    setForm({
      siparis_no: order.siparis_no || "",
      musteri: order.musteri || "",
      proje_adi: order.proje_adi || "",
      urun_tipi: order.urun_tipi || "",
      adet: Number(order.adet) || 1,
      siparis_tarihi: order.siparis_tarihi || "",
      termin_tarihi: order.termin_tarihi || "",
      aciklama: order.aciklama || "",
      durum: order.durum || "Aktif",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function transferToProduction(order: CustomerOrder) {
    const startNo = Number(order.siparis_no);
    const adet = Number(order.adet) || 1;

    if (!order.siparis_no || isNaN(startNo)) {
      alert("Üretime aktarım için sipariş no sayısal olmalıdır. Örn: 1001");
      return;
    }

    const { data: existing } = await supabase
      .from("production_tracking")
      .select("id")
      .eq("customer_order_id", order.id);

    if (existing && existing.length > 0) {
      alert("Bu müşteri siparişi zaten üretime aktarılmış.");
      return;
    }

    const rows = Array.from({ length: adet }, (_, i) => ({
      project_id: order.id,
      customer_order_id: order.id,
      uretim_no: String(startNo + i),
      uretim_durumu: "Planlandı",
      uretim_yuzdesi: 0,
      son_asama: "",
      sorumlu: "",
      notlar: "",
      baslama_tarihi: null,
      bitis_tarihi: null,
    }));

    const { error } = await supabase.from("production_tracking").insert(rows);

    if (error) {
      alert("Üretime aktarım hatası: " + error.message);
      return;
    }

    alert(`${adet} adet üretim kaydı oluşturuldu.`);
  }

  async function deleteOrder(id: string) {
    const ok = confirm("Bu müşteri siparişini silmek istiyor musunuz?");
    if (!ok) return;

    const { error } = await supabase.from("customer_orders").delete().eq("id", id);

    if (error) {
      alert("Silme hatası: " + error.message);
      return;
    }

    if (editingId === id) cancelEdit();

    loadOrders();
  }

  const filteredOrders = orders.filter((order) => {
    const text = `
      ${order.siparis_no || ""}
      ${order.musteri || ""}
      ${order.proje_adi || ""}
      ${order.urun_tipi || ""}
      ${order.aciklama || ""}
    `.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  function exportExcel() {
    const rows = filteredOrders.map((o) => ({
      "Sipariş No": o.siparis_no || "",
      Müşteri: o.musteri || "",
      Proje: o.proje_adi || "",
      "Ürün Tipi": o.urun_tipi || "",
      Adet: o.adet || 1,
      "Sipariş Tarihi": o.siparis_tarihi || "",
      Termin: o.termin_tarihi || "",
      Durum: o.durum || "",
      Açıklama: o.aciklama || "",
    }));

    const header = Object.keys(rows[0] || {});
    const csv = [
      header.join(";"),
      ...rows.map((r: any) => header.map((h) => `"${r[h] || ""}"`).join(";")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "musteri-siparisleri.xls";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-100 flex">
      <Sidebar fullName="Barış Nevruz" role="Yönetici" />

      <section className="flex-1 p-6 overflow-x-hidden">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Müşteri Siparişleri
            </h1>
            <p className="text-slate-500">
              Müşteri siparişlerini girin, düzenleyin ve üretime tek tuşla aktarın.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              {editingId ? "Müşteri Siparişi Düzenle" : "Yeni Müşteri Siparişi"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input value={form.siparis_no} onChange={(e) => setForm({ ...form, siparis_no: e.target.value })} placeholder="Başlangıç Sipariş No" className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900" />
              <input value={form.musteri} onChange={(e) => setForm({ ...form, musteri: e.target.value })} placeholder="Müşteri" className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900" />
              <input value={form.proje_adi} onChange={(e) => setForm({ ...form, proje_adi: e.target.value })} placeholder="Proje Adı" className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900" />
              <input value={form.urun_tipi} onChange={(e) => setForm({ ...form, urun_tipi: e.target.value })} placeholder="Ürün Tipi" className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900" />

              <input type="number" value={form.adet} onChange={(e) => setForm({ ...form, adet: Number(e.target.value) })} placeholder="Adet" className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900" />
              <input type="date" value={form.siparis_tarihi} onChange={(e) => setForm({ ...form, siparis_tarihi: e.target.value })} className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900" />
              <input type="date" value={form.termin_tarihi} onChange={(e) => setForm({ ...form, termin_tarihi: e.target.value })} className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900" />

              <select value={form.durum} onChange={(e) => setForm({ ...form, durum: e.target.value })} className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900">
                <option>Aktif</option>
                <option>Pasif</option>
                <option>İptal</option>
              </select>

              <textarea value={form.aciklama} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} placeholder="Açıklama" rows={2} className="md:col-span-3 border border-slate-300 rounded-xl px-4 py-3 text-slate-900" />

              <div className="flex gap-2">
                <button onClick={saveOrder} className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-3 font-semibold">
                  {editingId ? "Güncelle" : "Kaydet"}
                </button>

                {editingId && (
                  <button onClick={cancelEdit} className="flex-1 bg-slate-500 hover:bg-slate-600 text-white rounded-xl px-4 py-3 font-semibold">
                    Vazgeç
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ara..." className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900" />

              <button onClick={loadOrders} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-3 font-semibold">
                Yenile
              </button>

              <button onClick={exportExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-3 font-semibold">
                Excel'e Aktar
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1350px]">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-4 py-4 text-left">Başlangıç No</th>
                    <th className="px-4 py-4 text-left">Müşteri</th>
                    <th className="px-4 py-4 text-left">Proje</th>
                    <th className="px-4 py-4 text-left">Ürün Tipi</th>
                    <th className="px-4 py-4 text-left">Adet</th>
                    <th className="px-4 py-4 text-left">Sipariş Tarihi</th>
                    <th className="px-4 py-4 text-left">Termin</th>
                    <th className="px-4 py-4 text-left">Durum</th>
                    <th className="px-4 py-4 text-left">Açıklama</th>
                    <th className="px-4 py-4 text-left">İşlem</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-4 font-medium text-slate-900">{order.siparis_no || "-"}</td>
                      <td className="px-4 py-4 text-slate-700">{order.musteri || "-"}</td>
                      <td className="px-4 py-4 text-slate-700">{order.proje_adi || "-"}</td>
                      <td className="px-4 py-4 text-slate-700">{order.urun_tipi || "-"}</td>
                      <td className="px-4 py-4 text-slate-700">{order.adet || 1}</td>
                      <td className="px-4 py-4 text-slate-700">{order.siparis_tarihi || "-"}</td>
                      <td className="px-4 py-4 text-slate-700">{order.termin_tarihi || "-"}</td>
                      <td className="px-4 py-4">
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                          {order.durum || "Aktif"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-700 max-w-[240px]">{order.aciklama || "-"}</td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => startEdit(order)} className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-3 py-2 font-semibold">
                            Düzenle
                          </button>
                          <button onClick={() => transferToProduction(order)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-2 font-semibold">
                            Üretime Aktar
                          </button>
                          <button onClick={() => deleteOrder(order.id)} className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-2 font-semibold">
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                        Kayıt bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-4 text-sm text-slate-500 border-t">
              Toplam {filteredOrders.length} kayıt gösteriliyor.
            </div>
          </div>

          {loading && <p className="text-slate-500 text-sm">Veriler yükleniyor...</p>}
        </div>
      </section>
    </main>
  );
}