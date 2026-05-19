"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function DecisionsPage() {
  const [kararlar, setKararlar] = useState<any[]>([]);
  const [birimFiltre, setBirimFiltre] = useState("Tümü");
  const [durumFiltre, setDurumFiltre] = useState("Tümü");
  const [arama, setArama] = useState("");

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

  async function durumGuncelle(id: string, yeniDurum: string) {
    const { error } = await supabase
      .from("meeting_decisions")
      .update({ durum: yeniDurum })
      .eq("id", id);

    if (error) {
      alert("Durum güncellenemedi: " + error.message);
      return;
    }

    await verileriGetir();
  }

  const filtreliKararlar = kararlar.filter((item) => {
    const birimUygun = birimFiltre === "Tümü" || item.birim === birimFiltre;
    const durumUygun = durumFiltre === "Tümü" || item.durum === durumFiltre;

    const aramaUygun =
      item.karar_maddesi?.toLowerCase().includes(arama.toLowerCase()) ||
      item.sorumlu_kisi?.toLowerCase().includes(arama.toLowerCase()) ||
      item.birim?.toLowerCase().includes(arama.toLowerCase());

    return birimUygun && durumUygun && aramaUygun;
  });

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow p-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Karar Listesi
            </h1>
            <p className="text-slate-500 mt-1">
              Toplantı kararlarını filtreleyin ve durumlarını güncelleyin
            </p>
          </div>

          <div className="flex gap-3">
            <a href="/dashboard" className="btnDark">Dashboard</a>
            <a href="/meeting" className="btnBlue">Yeni Karar Ekle</a>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-8">
          <input
            placeholder="Karar / kişi / birim ara"
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            className="input"
          />

          <select
            value={birimFiltre}
            onChange={(e) => setBirimFiltre(e.target.value)}
            className="input"
          >
            <option>Tümü</option>
            <option>Üretim</option>
            <option>Planlama</option>
            <option>Kalite</option>
            <option>Proje</option>
            <option>Yönetim</option>
            <option>Depo</option>
            <option>Sevkiyat</option>
            <option>Satınalma</option>
            <option>Satış</option>
            <option>İnsan Kaynakları</option>
            <option>İdari İşler</option>
            <option>Finans</option>
            <option>Muhasebe</option>
            <option>Danışma</option>
          </select>

          <select
            value={durumFiltre}
            onChange={(e) => setDurumFiltre(e.target.value)}
            className="input"
          >
            <option>Tümü</option>
            <option>Bekliyor</option>
            <option>Devam Ediyor</option>
            <option>Tamamlandı</option>
            <option>Gecikti</option>
            <option>İptal</option>
          </select>

          <button onClick={verileriGetir} className="btnDark">
            Listeyi Yenile
          </button>
        </div>

        <div className="mt-5 text-slate-600 font-semibold">
          Gösterilen kayıt: {filtreliKararlar.length}
        </div>

        <div className="overflow-auto mt-5">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ backgroundColor: "#0f172a", color: "white" }}>
                <th className="p-3 text-left">Toplantı Tarihi</th>
                <th className="p-3 text-left">Karar</th>
                <th className="p-3 text-left">İlgili Kişiler</th>
                <th className="p-3 text-left">Birim</th>
                <th className="p-3 text-left">Öncelik</th>
                <th className="p-3 text-left">Termin</th>
                <th className="p-3 text-left">Durum</th>
              </tr>
            </thead>

            <tbody>
              {filtreliKararlar.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: "1px solid #e2e8f0",
                    backgroundColor:
                      item.durum === "Gecikti"
                        ? "#fee2e2"
                        : item.durum === "Tamamlandı"
                        ? "#dbeafe"
                        : item.durum === "Bekliyor"
                        ? "#fef3c7"
                        : "white",
                  }}
                >
                  <td className="p-3">{item.toplanti_tarihi}</td>
                  <td className="p-3">{item.karar_maddesi}</td>
                  <td className="p-3">{item.sorumlu_kisi}</td>
                  <td className="p-3">{item.birim}</td>
                  <td className="p-3">{item.oncelik}</td>
                  <td className="p-3">{item.termin_tarihi}</td>
                  <td className="p-3">
                    <select
                      value={item.durum || "Bekliyor"}
                      onChange={(e) => durumGuncelle(item.id, e.target.value)}
                      style={{
                        padding: "8px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontWeight: "bold",
                      }}
                    >
                      <option>Bekliyor</option>
                      <option>Devam Ediyor</option>
                      <option>Tamamlandı</option>
                      <option>Gecikti</option>
                      <option>İptal</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}