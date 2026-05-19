"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function DashboardPage() {
  const [kararlar, setKararlar] = useState<any[]>([]);

  useEffect(() => {
    verileriGetir();
  }, []);

  async function verileriGetir() {
    const { data, error } = await supabase
      .from("meeting_decisions")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setKararlar(data || []);
  }

  const bugun = new Date().toISOString().slice(0, 10);

  const toplam = kararlar.length;
  const bekleyen = kararlar.filter((x) => x.durum === "Bekliyor").length;
  const devam = kararlar.filter((x) => x.durum === "Devam Ediyor").length;
  const tamam = kararlar.filter((x) => x.durum === "Tamamlandı").length;
  const geciken = kararlar.filter(
    (x) => x.termin_tarihi < bugun && x.durum !== "Tamamlandı" && x.durum !== "İptal"
  ).length;
  const kritik = kararlar.filter((x) => x.oncelik === "Kritik").length;

  const gecikenListe = kararlar.filter(
    (x) => x.termin_tarihi < bugun && x.durum !== "Tamamlandı" && x.durum !== "İptal"
  );

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-800">
              Barış Nevruz Yönetim Dashboard
            </h1>
            <p className="text-slate-500 mt-2">
              Toplantı kararları ve görev takip özeti
            </p>
          </div>

          <div className="flex gap-3">
            <a href="/" className="btnDark">Ana Sayfa</a>
            <a href="/meeting" className="btnBlue">Yeni Karar</a>
            <a href="/decisions" className="btnDark">Karar Listesi</a>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">
          <Card title="Toplam Karar" value={toplam} color="#2563eb" />
          <Card title="Bekleyen" value={bekleyen} color="#f59e0b" />
          <Card title="Devam Eden" value={devam} color="#0ea5e9" />
          <Card title="Tamamlanan" value={tamam} color="#16a34a" />
          <Card title="Geciken" value={geciken} color="#dc2626" />
          <Card title="Kritik" value={kritik} color="#7c3aed" />
        </div>

        <div className="bg-white rounded-2xl shadow mt-10 p-6">
          <h2 className="text-2xl font-bold mb-5 text-red-700">
            Geciken Görevler
          </h2>

          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "#991b1b", color: "white" }}>
                <th className="p-3 text-left">Karar</th>
                <th className="p-3 text-left">İlgili Kişiler</th>
                <th className="p-3 text-left">Birim</th>
                <th className="p-3 text-left">Termin</th>
                <th className="p-3 text-left">Durum</th>
              </tr>
            </thead>

            <tbody>
              {gecikenListe.length === 0 && (
                <tr>
                  <td className="p-4 text-slate-500" colSpan={5}>
                    Geciken görev bulunmuyor.
                  </td>
                </tr>
              )}

              {gecikenListe.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #e2e8f0", background: "#fee2e2" }}>
                  <td className="p-3">{item.karar_maddesi}</td>
                  <td className="p-3">{item.sorumlu_kisi}</td>
                  <td className="p-3">{item.birim}</td>
                  <td className="p-3">{item.termin_tarihi}</td>
                  <td className="p-3 font-bold text-red-700">{item.durum}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-2xl shadow mt-8 p-6">
          <h2 className="text-2xl font-bold mb-5">
            Son Eklenen Kararlar
          </h2>

          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "#0f172a", color: "white" }}>
                <th className="p-3 text-left">Karar</th>
                <th className="p-3 text-left">Kişiler</th>
                <th className="p-3 text-left">Birim</th>
                <th className="p-3 text-left">Öncelik</th>
                <th className="p-3 text-left">Durum</th>
              </tr>
            </thead>

            <tbody>
              {kararlar.slice(0, 10).map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td className="p-3">{item.karar_maddesi}</td>
                  <td className="p-3">{item.sorumlu_kisi}</td>
                  <td className="p-3">{item.birim}</td>
                  <td className="p-3">{item.oncelik}</td>
                  <td className="p-3">{item.durum}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function Card({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <div style={{ background: color, color: "white", padding: "28px", borderRadius: "20px" }}>
      <div style={{ fontSize: 18, opacity: 0.9 }}>{title}</div>
      <div style={{ fontSize: 42, fontWeight: "bold", marginTop: 8 }}>{value}</div>
    </div>
  );
}