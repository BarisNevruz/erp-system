"use client";
import Sidebar from "@/components/Sidebar";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ProjeSiparisPage() {
  const [form, setForm] = useState({
    proje_siparis_tarihi: "",
    termin_tarihi: "",
    proje_adi: "",
    urun_tipi: "",
    urun_adeti: "",
    siyah_sac_kg: "",
    hardox_kg: "",
    mc700_strenx_kg: "",
    aluminyum_kg: "",
    crni_kg: "",
    talasli_imalat_kg: "",
    musteri_adi: "",
    tamamlanma_yuzdesi: "",
  });

  function handleChange(e: any) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  const toplamKg =
    Number(form.siyah_sac_kg || 0) +
    Number(form.hardox_kg || 0) +
    Number(form.mc700_strenx_kg || 0) +
    Number(form.aluminyum_kg || 0) +
    Number(form.crni_kg || 0) +
    Number(form.talasli_imalat_kg || 0);

  async function kaydet() {
    const { error } = await supabase.from("project_orders").insert([
      {
        proje_siparis_tarihi: form.proje_siparis_tarihi,
        termin_tarihi: form.termin_tarihi,
        proje_adi: form.proje_adi,
        urun_tipi: form.urun_tipi,
        urun_adeti: Number(form.urun_adeti || 0),
        siyah_sac_kg: Number(form.siyah_sac_kg || 0),
        hardox_kg: Number(form.hardox_kg || 0),
        mc700_strenx_kg: Number(form.mc700_strenx_kg || 0),
        aluminyum_kg: Number(form.aluminyum_kg || 0),
        crni_kg: Number(form.crni_kg || 0),
        talasli_imalat_kg: Number(form.talasli_imalat_kg || 0),
        musteri_adi: form.musteri_adi,
        tamamlanma_yuzdesi: Number(form.tamamlanma_yuzdesi || 0),
      },
    ]);

    if (error) {
      alert("Kayıt sırasında hata oluştu: " + error.message);
      return;
    }

    alert("Proje siparişi kaydedildi.");

    setForm({
      proje_siparis_tarihi: "",
      termin_tarihi: "",
      proje_adi: "",
      urun_tipi: "",
      urun_adeti: "",
      siyah_sac_kg: "",
      hardox_kg: "",
      mc700_strenx_kg: "",
      aluminyum_kg: "",
      crni_kg: "",
      talasli_imalat_kg: "",
      musteri_adi: "",
      tamamlanma_yuzdesi: "",
    });
  }

  return (
  <main className="min-h-screen bg-slate-100 flex">
    <Sidebar fullName="Barış Nevruz" role="Yönetici" />

    <section className="flex-1 bg-slate-100 p-8 overflow-x-hidden">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-3xl font-bold text-white">
          Proje Sipariş Girişi
        </h1>

        <p className="text-slate-300 mt-2">
          Proje sipariş bilgilerini ve malzeme ağırlıklarını girin.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
          <Input label="Proje Sipariş Tarihi" name="proje_siparis_tarihi" type="date" value={form.proje_siparis_tarihi} onChange={handleChange} />
          <Input label="Termin Tarihi" name="termin_tarihi" type="date" value={form.termin_tarihi} onChange={handleChange} />
          <Input label="Müşteri Adı" name="musteri_adi" value={form.musteri_adi} onChange={handleChange} />

          <Input label="Proje Adı" name="proje_adi" value={form.proje_adi} onChange={handleChange} />

          <div>
            <label className="block text-sm font-semibold text-whitetext-slate-200 mb-1">
              Ürün Tipi
            </label>
            <select
              name="urun_tipi"
              value={form.urun_tipi}
              onChange={handleChange}
              className="w-full border rounded-xl px-4 py-3"
            >
              <option value="">Seçiniz</option>
              <option value="Platform">Platform</option>
              <option value="Lowbed">Lowbed</option>
              <option value="Konteyner Taşıyıcı">Konteyner Taşıyıcı</option>
              <option value="Damper Treyler">Damper Treyler</option>
              <option value="Şase">Şase</option>
              <option value="Araç Üstü Kasa">Araç Üstü Kasa</option>
              <option value="Römork">Römork</option>
              <option value="Özel Proje">Özel Proje</option>
            </select>
          </div>

          <Input label="Ürün Adeti" name="urun_adeti" type="number" value={form.urun_adeti} onChange={handleChange} />

          <Input label="Siyah Sac KG" name="siyah_sac_kg" type="number" value={form.siyah_sac_kg} onChange={handleChange} />
          <Input label="Hardox KG" name="hardox_kg" type="number" value={form.hardox_kg} onChange={handleChange} />
          <Input label="MC700 - Strenx KG" name="mc700_strenx_kg" type="number" value={form.mc700_strenx_kg} onChange={handleChange} />
          <Input label="Alüminyum KG" name="aluminyum_kg" type="number" value={form.aluminyum_kg} onChange={handleChange} />
          <Input label="CrNi KG" name="crni_kg" type="number" value={form.crni_kg} onChange={handleChange} />
          <Input label="Talaşlı İmalat KG" name="talasli_imalat_kg" type="number" value={form.talasli_imalat_kg} onChange={handleChange} />

          <Input label="Tamamlanma %" name="tamamlanma_yuzdesi" type="number" value={form.tamamlanma_yuzdesi} onChange={handleChange} />
        </div>

        <div className="mt-8 bg-slate-100 rounded-2xl p-5">
          <p className="text-slate-300">Genel Toplam Malzeme Ağırlığı</p>
          <p className="text-3xl font-bold text-white">
            {toplamKg.toLocaleString("tr-TR")} KG
          </p>
        </div>

        <button
          onClick={kaydet}
          className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold"
        >
          Kaydet
        </button>
      </div>
       </section>
    </main>
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
      <label className="block text-sm font-semibold text-whitetext-slate-200 mb-1">
        {label}
      </label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className="w-full border rounded-xl px-4 py-3"
      />
    </div>

);
}
 