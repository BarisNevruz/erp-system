"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ProjectOrder = {
  id: string;
  proje_siparis_tarihi: string;
  termin_tarihi: string;
  proje_adi: string;
  urun_tipi: string;
  urun_adeti: number;
  siyah_sac_kg: number;
  hardox_kg: number;
  mc700_strenx_kg: number;
  aluminyum_kg: number;
  crni_kg: number;
  talasli_imalat_kg: number;
  toplam_malzeme_kg: number;
  musteri_adi: string;
  tamamlanma_yuzdesi: number;
};

export default function ProjeSiparisKayitlariPage() {
  const [kayitlar, setKayitlar] = useState<ProjectOrder[]>([]);
  const [arama, setArama] = useState("");
  const [duzenlenen, setDuzenlenen] = useState<ProjectOrder | null>(null);

  useEffect(() => {
    verileriGetir();
  }, []);

  async function verileriGetir() {
    const { data, error } = await supabase
      .from("project_orders")
      .select("*")
      .order("termin_tarihi", { ascending: true });

    if (error) {
      alert("Veriler alınamadı: " + error.message);
      return;
    }

    setKayitlar(data || []);
  }

  async function sil(id: string) {
    const onay = confirm("Bu proje siparişini silmek istiyor musunuz?");
    if (!onay) return;

    const { error } = await supabase
      .from("project_orders")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Silme hatası: " + error.message);
      return;
    }

    alert("Kayıt silindi.");
    verileriGetir();
  }

  async function guncelle() {
    if (!duzenlenen) return;

    const { error } = await supabase
      .from("project_orders")
      .update({
        proje_siparis_tarihi: duzenlenen.proje_siparis_tarihi,
        termin_tarihi: duzenlenen.termin_tarihi,
        proje_adi: duzenlenen.proje_adi,
        urun_tipi: duzenlenen.urun_tipi,
        urun_adeti: Number(duzenlenen.urun_adeti || 0),
        siyah_sac_kg: Number(duzenlenen.siyah_sac_kg || 0),
        hardox_kg: Number(duzenlenen.hardox_kg || 0),
        mc700_strenx_kg: Number(duzenlenen.mc700_strenx_kg || 0),
        aluminyum_kg: Number(duzenlenen.aluminyum_kg || 0),
        crni_kg: Number(duzenlenen.crni_kg || 0),
        talasli_imalat_kg: Number(duzenlenen.talasli_imalat_kg || 0),
        musteri_adi: duzenlenen.musteri_adi,
        tamamlanma_yuzdesi: Number(duzenlenen.tamamlanma_yuzdesi || 0),
      })
      .eq("id", duzenlenen.id);

    if (error) {
      alert("Güncelleme hatası: " + error.message);
      return;
    }

    alert("Kayıt güncellendi.");
    setDuzenlenen(null);
    verileriGetir();
  }

  function handleEditChange(e: any) {
    if (!duzenlenen) return;

    setDuzenlenen({
      ...duzenlenen,
      [e.target.name]: e.target.value,
    });
  }

  const filtreliKayitlar = kayitlar.filter((k) => {
    const text = `${k.proje_adi} ${k.musteri_adi} ${k.urun_tipi}`.toLowerCase();
    return text.includes(arama.toLowerCase());
  });

  const toplamUrunAdeti = filtreliKayitlar.reduce((t, k) => t + Number(k.urun_adeti || 0), 0);
  const toplamSiyahSac = filtreliKayitlar.reduce((t, k) => t + Number(k.siyah_sac_kg || 0), 0);
  const toplamHardox = filtreliKayitlar.reduce((t, k) => t + Number(k.hardox_kg || 0), 0);
  const toplamMc700 = filtreliKayitlar.reduce((t, k) => t + Number(k.mc700_strenx_kg || 0), 0);
  const toplamAluminyum = filtreliKayitlar.reduce((t, k) => t + Number(k.aluminyum_kg || 0), 0);
  const toplamCrni = filtreliKayitlar.reduce((t, k) => t + Number(k.crni_kg || 0), 0);
  const toplamTalasli = filtreliKayitlar.reduce((t, k) => t + Number(k.talasli_imalat_kg || 0), 0);
  const genelToplam = filtreliKayitlar.reduce((t, k) => t + Number(k.toplam_malzeme_kg || 0), 0);

  function geciktiMi(k: ProjectOrder) {
    const bugun = new Date();
    const termin = new Date(k.termin_tarihi);
    bugun.setHours(0, 0, 0, 0);
    termin.setHours(0, 0, 0, 0);
    return termin < bugun && Number(k.tamamlanma_yuzdesi || 0) < 100;
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Proje Sipariş Kayıtları
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <Kpi title="Toplam Sipariş" value={filtreliKayitlar.length} />
          <Kpi title="Toplam Ürün Adeti" value={toplamUrunAdeti} />
          <Kpi title="Genel Toplam KG" value={genelToplam} />
          <Kpi title="Geciken Sipariş" value={filtreliKayitlar.filter(geciktiMi).length} danger />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mt-5">
          <Kpi title="Siyah Sac KG" value={toplamSiyahSac} />
          <Kpi title="Hardox KG" value={toplamHardox} />
          <Kpi title="MC700-Strenx KG" value={toplamMc700} />
          <Kpi title="Alüminyum KG" value={toplamAluminyum} />
          <Kpi title="CrNi KG" value={toplamCrni} />
          <Kpi title="Talaşlı KG" value={toplamTalasli} />
        </div>

        <input
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          placeholder="Müşteri, proje adı veya ürün tipi ara..."
          className="w-full border rounded-xl px-4 py-3 mt-8"
        />

        <div className="overflow-x-auto mt-8">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-900 text-white">
                <Th>İşlem</Th>
                <Th>Durum</Th>
                <Th>Sipariş Tarihi</Th>
                <Th>Termin</Th>
                <Th>Müşteri</Th>
                <Th>Proje</Th>
                <Th>Ürün Tipi</Th>
                <Th>Adet</Th>
                <Th>Siyah Sac</Th>
                <Th>Hardox</Th>
                <Th>MC700-Strenx</Th>
                <Th>Alüminyum</Th>
                <Th>CrNi</Th>
                <Th>Talaşlı</Th>
                <Th>Toplam KG</Th>
                <Th>%</Th>
              </tr>
            </thead>

            <tbody>
              {filtreliKayitlar.map((k) => (
                <tr key={k.id} className={geciktiMi(k) ? "bg-red-50" : "border-b"}>
                  <Td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDuzenlenen(k)}
                        className="bg-blue-600 text-white px-3 py-1 rounded-lg"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => sil(k.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded-lg"
                      >
                        Sil
                      </button>
                    </div>
                  </Td>
                  <Td>{geciktiMi(k) ? <span className="text-red-600 font-bold">Gecikti</span> : <span className="text-green-600 font-semibold">Normal</span>}</Td>
                  <Td>{k.proje_siparis_tarihi}</Td>
                  <Td>{k.termin_tarihi}</Td>
                  <Td>{k.musteri_adi}</Td>
                  <Td>{k.proje_adi}</Td>
                  <Td>{k.urun_tipi}</Td>
                  <Td>{k.urun_adeti}</Td>
                  <Td>{formatKg(k.siyah_sac_kg)}</Td>
                  <Td>{formatKg(k.hardox_kg)}</Td>
                  <Td>{formatKg(k.mc700_strenx_kg)}</Td>
                  <Td>{formatKg(k.aluminyum_kg)}</Td>
                  <Td>{formatKg(k.crni_kg)}</Td>
                  <Td>{formatKg(k.talasli_imalat_kg)}</Td>
                  <Td className="font-bold">{formatKg(k.toplam_malzeme_kg)}</Td>
                  <Td>%{k.tamamlanma_yuzdesi}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {duzenlenen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-5">Sipariş Düzenle</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <EditInput label="Sipariş Tarihi" name="proje_siparis_tarihi" type="date" value={duzenlenen.proje_siparis_tarihi} onChange={handleEditChange} />
              <EditInput label="Termin Tarihi" name="termin_tarihi" type="date" value={duzenlenen.termin_tarihi} onChange={handleEditChange} />
              <EditInput label="Müşteri Adı" name="musteri_adi" value={duzenlenen.musteri_adi} onChange={handleEditChange} />
              <EditInput label="Proje Adı" name="proje_adi" value={duzenlenen.proje_adi} onChange={handleEditChange} />
              <EditInput label="Ürün Tipi" name="urun_tipi" value={duzenlenen.urun_tipi} onChange={handleEditChange} />
              <EditInput label="Ürün Adeti" name="urun_adeti" type="number" value={String(duzenlenen.urun_adeti)} onChange={handleEditChange} />
              <EditInput label="Siyah Sac KG" name="siyah_sac_kg" type="number" value={String(duzenlenen.siyah_sac_kg)} onChange={handleEditChange} />
              <EditInput label="Hardox KG" name="hardox_kg" type="number" value={String(duzenlenen.hardox_kg)} onChange={handleEditChange} />
              <EditInput label="MC700-Strenx KG" name="mc700_strenx_kg" type="number" value={String(duzenlenen.mc700_strenx_kg)} onChange={handleEditChange} />
              <EditInput label="Alüminyum KG" name="aluminyum_kg" type="number" value={String(duzenlenen.aluminyum_kg)} onChange={handleEditChange} />
              <EditInput label="CrNi KG" name="crni_kg" type="number" value={String(duzenlenen.crni_kg)} onChange={handleEditChange} />
              <EditInput label="Talaşlı İmalat KG" name="talasli_imalat_kg" type="number" value={String(duzenlenen.talasli_imalat_kg)} onChange={handleEditChange} />
              <EditInput label="Tamamlanma %" name="tamamlanma_yuzdesi" type="number" value={String(duzenlenen.tamamlanma_yuzdesi)} onChange={handleEditChange} />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setDuzenlenen(null)} className="px-6 py-3 rounded-xl bg-slate-200">
                Vazgeç
              </button>
              <button onClick={guncelle} className="px-6 py-3 rounded-xl bg-blue-600 text-white">
                Güncelle
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function formatKg(value: number) {
  return `${Number(value || 0).toLocaleString("tr-TR")} kg`;
}

function Kpi({ title, value, danger = false }: { title: string; value: number; danger?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 ${danger ? "bg-red-100" : "bg-slate-100"}`}>
      <p className={danger ? "text-red-600" : "text-slate-500"}>{title}</p>
      <p className={`text-2xl font-bold ${danger ? "text-red-700" : "text-slate-800"}`}>
        {Number(value || 0).toLocaleString("tr-TR")}
      </p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="p-3 text-left whitespace-nowrap">{children}</th>;
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`p-3 whitespace-nowrap ${className}`}>{children}</td>;
}

function EditInput({ label, name, value, onChange, type = "text" }: any) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
      <input
        name={name}
        type={type}
        value={value || ""}
        onChange={onChange}
        className="w-full border rounded-xl px-4 py-3"
      />
    </div>
  );
}