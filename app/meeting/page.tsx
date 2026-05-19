"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

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
  const [toplantiTarihi, setToplantiTarihi] = useState("");
  const [toplantiTuru, setToplantiTuru] = useState("Yönetim");
  const [toplantiYeri, setToplantiYeri] = useState("");
  const [katilimcilar, setKatilimcilar] = useState("");

  const [kararMaddesi, setKararMaddesi] = useState("");
  const [ilgiliKisiler, setIlgiliKisiler] = useState("");
  const [birim, setBirim] = useState("Üretim");
  const [oncelik, setOncelik] = useState("Normal");
  const [terminTarihi, setTerminTarihi] = useState("");
  const [durum, setDurum] = useState("Bekliyor");
  const [yoneticiNotu, setYoneticiNotu] = useState("");

  async function kaydet() {
    if (!toplantiTarihi || !kararMaddesi || !ilgiliKisiler || !terminTarihi) {
      alert("Toplantı tarihi, karar maddesi, ilgili kişiler ve termin tarihi zorunludur.");
      return;
    }

    const { error } = await supabase.from("meeting_decisions").insert([
      {
        toplanti_tarihi: toplantiTarihi,
        toplanti_turu: toplantiTuru,
        toplanti_yeri: toplantiYeri,
        katilimcilar: katilimcilar,
        karar_maddesi: kararMaddesi,
        sorumlu_kisi: ilgiliKisiler,
        birim: birim,
        oncelik: oncelik,
        termin_tarihi: terminTarihi,
        durum: durum,
        yonetici_notu: yoneticiNotu,
      },
    ]);

    if (error) {
      alert("Kayıt hatası: " + error.message);
      return;
    }

    alert("Karar başarıyla kaydedildi.");

    setKararMaddesi("");
    setIlgiliKisiler("");
    setTerminTarihi("");
    setYoneticiNotu("");
    setDurum("Bekliyor");
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Barış Nevruz Yönetim Paneli
        </h1>

        <p className="text-slate-500 mt-2">
          Toplantı karar kayıt ekranı
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-slate-700">
          Toplantı Bilgileri
        </h2>

        <div className="grid grid-cols-2 gap-5">
          <Field label="Toplantı Tarihi">
            <input
              type="date"
              value={toplantiTarihi}
              onChange={(e) => setToplantiTarihi(e.target.value)}
              className="input"
            />
          </Field>

          <Field label="Toplantı Türü">
            <input
              value={toplantiTuru}
              onChange={(e) => setToplantiTuru(e.target.value)}
              className="input"
              placeholder="Örn: Yönetim, Üretim, Kalite"
            />
          </Field>

          <Field label="Toplantı Yeri">
            <input
              value={toplantiYeri}
              onChange={(e) => setToplantiYeri(e.target.value)}
              className="input"
              placeholder="Toplantı yeri"
            />
          </Field>

          <Field label="Katılımcılar">
            <textarea
              value={katilimcilar}
              onChange={(e) => setKatilimcilar(e.target.value)}
              className="input h-24"
              placeholder="Katılımcıları elle yazın"
            />
          </Field>
        </div>

        <h2 className="text-xl font-bold mt-10 mb-4 text-slate-700">
          Karar Bilgileri
        </h2>

        <div className="grid grid-cols-2 gap-5">
          <div className="col-span-2">
            <Field label="Karar Maddesi">
              <textarea
                value={kararMaddesi}
                onChange={(e) => setKararMaddesi(e.target.value)}
                className="input h-28"
                placeholder="Karar maddesi yazın"
              />
            </Field>
          </div>

          <Field label="İlgili Kişiler">
            <input
              value={ilgiliKisiler}
              onChange={(e) => setIlgiliKisiler(e.target.value)}
              className="input"
              placeholder="İlgili kişileri elle yazın"
            />
          </Field>

          <Field label="Birim">
            <select
              value={birim}
              onChange={(e) => setBirim(e.target.value)}
              className="input"
            >
              {birimler.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </Field>

          <Field label="Öncelik">
            <select
              value={oncelik}
              onChange={(e) => setOncelik(e.target.value)}
              className="input"
            >
              <option>Düşük</option>
              <option>Normal</option>
              <option>Yüksek</option>
              <option>Kritik</option>
            </select>
          </Field>

          <Field label="Termin Tarihi">
            <input
              type="date"
              value={terminTarihi}
              onChange={(e) => setTerminTarihi(e.target.value)}
              className="input"
            />
          </Field>

          <Field label="Durum">
            <select
              value={durum}
              onChange={(e) => setDurum(e.target.value)}
              className="input"
            >
              <option>Bekliyor</option>
              <option>Devam Ediyor</option>
              <option>Tamamlandı</option>
              <option>Gecikti</option>
              <option>İptal</option>
            </select>
          </Field>

          <div className="col-span-2">
            <Field label="Yönetici Notu">
              <textarea
                value={yoneticiNotu}
                onChange={(e) => setYoneticiNotu(e.target.value)}
                className="input h-24"
                placeholder="Yönetici notu"
              />
            </Field>
          </div>
        </div>

        <button
          onClick={kaydet}
          style={{
            width: "100%",
            marginTop: "32px",
            backgroundColor: "#1d4ed8",
            color: "white",
            fontSize: "22px",
            fontWeight: "bold",
            padding: "18px",
            borderRadius: "14px",
            border: "none",
            cursor: "pointer",
          }}
        >
          KAYDET
        </button>
      </div>
    </main>
  );
}

function Field({ label, children }: any) {
  return (
    <div>
      <label className="font-bold text-slate-700">{label}</label>
      <div className="mt-2">{children}</div>
    </div>
  );
}