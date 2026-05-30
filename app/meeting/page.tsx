"use client";
import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const birimler = [
  "Üretim",
  "Planlama",
  "Kalite",
  "Proje",
  "Yönetim",
  "Depo",
  "Sevkiyat",
  "Satınalma",
  "Satış",
  "İnsan Kaynakları",
  "İdari İşler",
  "Finans",
  "Muhasebe",
  "Danışma",
];

export default function MeetingPage() {
  const [people, setPeople] = useState<any[]>([]);

  const [kararMaddesi, setKararMaddesi] = useState("");
  const [ilgiliKisiler, setIlgiliKisiler] = useState("");
  const [birim, setBirim] = useState("Üretim");
  const [oncelik, setOncelik] = useState("Normal");
  const [terminTarihi, setTerminTarihi] = useState("");
  const [durum, setDurum] = useState("Bekliyor");
  const [yoneticiNotu, setYoneticiNotu] = useState("");
  const [mailBirim, setMailBirim] = useState("Üretim");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPeople(JSON.parse(localStorage.getItem("erp_people") || "[]"));
  }, []);

  async function kaydet() {
    if (!kararMaddesi) {
      alert("Karar maddesi zorunludur.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("meeting_decisions").insert([
      {
        karar_maddesi: kararMaddesi,
        sorumlu_kisi: ilgiliKisiler,
        birim,
        oncelik,
        termin_tarihi: terminTarihi,
        durum,
        yonetici_notu: yoneticiNotu,
      },
    ]);

    setLoading(false);

    if (error) {
      alert("Kayıt hatası: " + error.message);
      return;
    }

    alert("Karar başarıyla kaydedildi.");

    setKararMaddesi("");
    setIlgiliKisiler("");
    setBirim("Üretim");
    setOncelik("Normal");
    setTerminTarihi("");
    setDurum("Bekliyor");
    setYoneticiNotu("");
  }

  async function mailGonder() {
    if (!kararMaddesi) {
      alert("Karar maddesi boş olamaz.");
      return;
    }

    setLoading(true);

    const { data: mailler, error: mailHata } = await supabase
      .from("mail_recipients")
      .select("*")
      .eq("birim", mailBirim)
      .eq("aktif", true);

    if (mailHata) {
      setLoading(false);
      alert("Mail listesi alınamadı: " + mailHata.message);
      return;
    }

    if (!mailler || mailler.length === 0) {
      setLoading(false);
      alert(mailBirim + " birimine ait aktif mail bulunamadı.");
      return;
    }

    const to = mailler.map((x: any) => x.email).join(",");

    const html = `
      <div style="font-family:Arial;padding:20px">
        <h2>Toplantı Kararı Bildirimi</h2>
        <p><b>Karar:</b> ${kararMaddesi}</p>
        <p><b>İlgili Kişiler:</b> ${ilgiliKisiler}</p>
        <p><b>Birim:</b> ${birim}</p>
        <p><b>Öncelik:</b> ${oncelik}</p>
        <p><b>Termin:</b> ${terminTarihi}</p>
        <p><b>Durum:</b> ${durum}</p>
        <p><b>Yönetici Notu:</b> ${yoneticiNotu}</p>
      </div>
    `;

    const res = await fetch("/api/send-mail", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        subject: "Toplantı Kararı Bildirimi",
        html,
      }),
    });

    const sonuc = await res.json();

    setLoading(false);

    if (!sonuc.ok) {
      alert("Mail gönderilemedi: " + sonuc.error);
      return;
    }

    alert("Mail başarıyla gönderildi.");
  }
return (
  <main className="min-h-screen bg-slate-100 flex">
    <Sidebar fullName="Barış Nevruz" role="Yönetici" />

    <section className="flex-1 p-8 overflow-x-hidden">
      <div className="max-w-6xl mx-auto bg-slate-800 rounded-2xl border border-slate-700 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              Toplantı Karar Girişi
            </h1>

            <p className="text-slate-300 mt-2">
              Yönetim toplantı kararlarını kaydedin ve mail gönderin.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="bg-slate-700 hover:bg-slate-600 px-5 py-3 rounded-xl font-semibold"
            >
              Dashboard
            </Link>

            <Link
              href="/"
              className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold"
            >
              Ana Sayfa
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="font-bold">Karar Maddesi</label>

            <textarea
              value={kararMaddesi}
              onChange={(e) => setKararMaddesi(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 mt-2 h-32"
              placeholder="Toplantı kararını giriniz..."
            />
          </div>

          <div>
            <label className="font-bold">İlgili Kişiler</label>

            <select
              value={ilgiliKisiler}
              onChange={(e) => setIlgiliKisiler(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 mt-2"
            >
              <option value="">Kişi seçiniz</option>

              {people.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name} - {p.department}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold">Birim</label>

            <select
              value={birim}
              onChange={(e) => setBirim(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 mt-2"
            >
              {birimler.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold">Öncelik</label>

            <select
              value={oncelik}
              onChange={(e) => setOncelik(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 mt-2"
            >
              <option>Düşük</option>
              <option>Normal</option>
              <option>Yüksek</option>
              <option>Kritik</option>
            </select>
          </div>

          <div>
            <label className="font-bold">Termin Tarihi</label>

            <input
              type="date"
              value={terminTarihi}
              onChange={(e) => setTerminTarihi(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 mt-2"
            />
          </div>

          <div>
            <label className="font-bold">Durum</label>

            <select
              value={durum}
              onChange={(e) => setDurum(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 mt-2"
            >
              <option>Bekliyor</option>
              <option>Devam Ediyor</option>
              <option>Tamamlandı</option>
              <option>Gecikti</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="font-bold">Yönetici Notu</label>

            <textarea
              value={yoneticiNotu}
              onChange={(e) => setYoneticiNotu(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 mt-2 h-24"
              placeholder="Yönetici notu..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="font-bold">Mail Gönderilecek Birim</label>

            <select
              value={mailBirim}
              onChange={(e) => setMailBirim(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 mt-2"
            >
              {birimler.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-8">
          <button
            onClick={kaydet}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            {loading ? "Kaydediliyor..." : "Kararı Kaydet"}
          </button>

          <button
            onClick={mailGonder}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            Mail Gönder
          </button>
        </div>
      </div>
          </section>
  </main>
);
}