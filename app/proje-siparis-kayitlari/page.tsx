"use client";
import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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

type MailContact = {
  id: string;
  name: string;
  email: string;
  active: boolean;
};

const COLORS = ["#2563eb", "#dc2626", "#16a34a", "#f59e0b", "#7c3aed", "#0891b2"];

export default function ProjeSiparisKayitlariPage() {
  const [kayitlar, setKayitlar] = useState<ProjectOrder[]>([]);
  const [arama, setArama] = useState("");
  const [duzenlenen, setDuzenlenen] = useState<ProjectOrder | null>(null);
  const [mailListesi, setMailListesi] = useState<MailContact[]>([]);
  const [selectedMailIds, setSelectedMailIds] = useState<string[]>([]);

  useEffect(() => {
    verileriGetir();
    mailGetir();
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

  async function mailGetir() {
    const { data, error } = await supabase
      .from("mail_contacts")
      .select("*")
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) {
      alert("Mail listesi alınamadı: " + error.message);
      return;
    }

    setMailListesi(data || []);
  }

  async function sil(id: string) {
    if (!confirm("Bu proje siparişini silmek istiyor musunuz?")) return;

    const { error } = await supabase.from("project_orders").delete().eq("id", id);

    if (error) {
      alert("Silme hatası: " + error.message);
      return;
    }

    alert("Kayıt silindi.");
    verileriGetir();
  }

  async function guncelle() {
    if (!duzenlenen) return;

    const toplam =
      Number(duzenlenen.siyah_sac_kg || 0) +
      Number(duzenlenen.hardox_kg || 0) +
      Number(duzenlenen.mc700_strenx_kg || 0) +
      Number(duzenlenen.aluminyum_kg || 0) +
      Number(duzenlenen.crni_kg || 0) +
      Number(duzenlenen.talasli_imalat_kg || 0);

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
        toplam_malzeme_kg: toplam,
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
    setDuzenlenen({ ...duzenlenen, [e.target.name]: e.target.value });
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

  const malzemeTonajData = [
    { name: "Siyah Sac", kg: toplamSiyahSac },
    { name: "Hardox", kg: toplamHardox },
    { name: "MC700", kg: toplamMc700 },
    { name: "Alüminyum", kg: toplamAluminyum },
    { name: "CrNi", kg: toplamCrni },
    { name: "Talaşlı", kg: toplamTalasli },
  ];

  const musteriTonajData = Object.values(
    filtreliKayitlar.reduce((acc: any, k) => {
      const key = k.musteri_adi || "Belirsiz";
      acc[key] = acc[key] || { name: key, kg: 0 };
      acc[key].kg += Number(k.toplam_malzeme_kg || 0);
      return acc;
    }, {})
  ) as any[];

  const urunTipiTonajData = Object.values(
    filtreliKayitlar.reduce((acc: any, k) => {
      const key = k.urun_tipi || "Belirsiz";
      acc[key] = acc[key] || { name: key, kg: 0 };
      acc[key].kg += Number(k.toplam_malzeme_kg || 0);
      return acc;
    }, {})
  ) as any[];

  const hasMalzemeData = malzemeTonajData.some((x) => Number(x.kg || 0) > 0);
  const hasMusteriData = musteriTonajData.some((x) => Number(x.kg || 0) > 0);
  const hasUrunData = urunTipiTonajData.some((x) => Number(x.kg || 0) > 0);

  function kalanGunHesapla(terminTarihi: string) {
    const bugun = new Date();
    const termin = new Date(terminTarihi);

    bugun.setHours(0, 0, 0, 0);
    termin.setHours(0, 0, 0, 0);

    const farkMs = termin.getTime() - bugun.getTime();
    return Math.ceil(farkMs / (1000 * 60 * 60 * 24));
  }

  function geciktiMi(k: ProjectOrder) {
    if (!k.termin_tarihi) return false;
    return kalanGunHesapla(k.termin_tarihi) < 0 && Number(k.tamamlanma_yuzdesi || 0) < 100;
  }

  function yaklasiyorMu(k: ProjectOrder) {
    if (!k.termin_tarihi) return false;
    const kalanGun = kalanGunHesapla(k.termin_tarihi);
    return kalanGun >= 0 && kalanGun <= 7 && Number(k.tamamlanma_yuzdesi || 0) < 100;
  }

  function satirRengi(k: ProjectOrder) {
    if (geciktiMi(k)) return "bg-red-100 border-b border-red-300";
    if (yaklasiyorMu(k)) return "bg-yellow-100 border-b border-yellow-300";
    return "border-b";
  }

  function durumEtiketi(k: ProjectOrder) {
    if (Number(k.tamamlanma_yuzdesi || 0) >= 100) {
      return <span className="text-green-700 font-bold">Tamamlandı</span>;
    }

    if (geciktiMi(k)) {
      return <span className="text-red-700 font-bold">Gecikti</span>;
    }

    if (yaklasiyorMu(k)) {
      return (
        <span className="text-yellow-700 font-bold">
          Yaklaşıyor ({kalanGunHesapla(k.termin_tarihi)} gün)
        </span>
      );
    }

    return <span className="text-green-600 font-semibold">Normal</span>;
  }

  function gecikmeGunuHesapla(terminTarihi: string) {
    const kalanGun = kalanGunHesapla(terminTarihi);
    return kalanGun < 0 ? Math.abs(kalanGun) : 0;
  }

  async function gecikenSiparisMailiGonder() {
    const secilenMailler = mailListesi
      .filter((m) => selectedMailIds.includes(m.id))
      .map((m) => m.email);

    if (secilenMailler.length === 0) {
      alert("Lütfen en az bir mail alıcısı seçiniz.");
      return;
    }

    const gecikenler = kayitlar.filter(geciktiMi);

    if (gecikenler.length === 0) {
      alert("Geciken sipariş bulunmuyor.");
      return;
    }

    let body = `
      <h2 style="color:red;">KRİTİK - GECİKEN PROJE SİPARİŞLERİ</h2>
      <p>Aşağıdaki proje siparişlerinin termin tarihi geçmiştir.</p>
      <table border="1" cellpadding="8" cellspacing="0"
        style="border-collapse:collapse;width:100%;font-family:Arial;font-size:13px;">
        <thead>
          <tr style="background:#fee2e2;color:#991b1b;">
            <th>Müşteri</th>
            <th>Proje</th>
            <th>Ürün Tipi</th>
            <th>Adet</th>
            <th>Termin</th>
            <th>Gecikme</th>
            <th>Tamamlanma</th>
            <th>Toplam KG</th>
          </tr>
        </thead>
        <tbody>
    `;

    gecikenler.forEach((k) => {
      body += `
        <tr>
          <td>${k.musteri_adi || ""}</td>
          <td>${k.proje_adi || ""}</td>
          <td>${k.urun_tipi || ""}</td>
          <td>${k.urun_adeti || 0}</td>
          <td>${k.termin_tarihi || ""}</td>
          <td style="color:red;font-weight:bold;">
            ${gecikmeGunuHesapla(k.termin_tarihi)} gün
          </td>
          <td>%${k.tamamlanma_yuzdesi || 0}</td>
          <td>${Number(k.toplam_malzeme_kg || 0).toLocaleString("tr-TR")} kg</td>
        </tr>
      `;
    });

    body += `
        </tbody>
      </table>
      <p style="margin-top:20px;color:red;font-weight:bold;">
        Lütfen geciken siparişler için aksiyon durumunu güncelleyiniz.
      </p>
    `;

    const response = await fetch("/api/send-mail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: secilenMailler.join(";"),
        cc: "",
        subject: "KRİTİK - Geciken Proje Siparişleri",
        body,
      }),
    });

    if (!response.ok) {
      const hata = await response.text();
      alert("Mail gönderilemedi: " + hata);
      return;
    }

    alert("Geciken sipariş maili gönderildi.");
  }

  return (
    <main className="min-h-screen bg-slate-100 flex">
  <Sidebar fullName="Barış Nevruz" role="Yönetici" />

  <section className="flex-1 bg-slate-100 p-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-3xl font-bold text-white">Proje Sipariş Kayıtları</h1>

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <ChartCard title="Malzeme Bazlı Tonaj">
            {hasMalzemeData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={malzemeTonajData} margin={{ top: 20, right: 20, left: 10, bottom: 80 }}>
                  <XAxis dataKey="name" interval={0} angle={-35} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => `${Number(value).toLocaleString("tr-TR")} kg`} />
                  <Bar dataKey="kg" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartText />
            )}
          </ChartCard>

          <ChartCard title="Müşteri Bazlı Tonaj">
            {hasMusteriData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={musteriTonajData}
                    dataKey="kg"
                    nameKey="name"
                    outerRadius={95}
                    label={({ name }) => String(name).slice(0, 14)}
                  >
                    {musteriTonajData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${Number(value).toLocaleString("tr-TR")} kg`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartText />
            )}
          </ChartCard>

          <ChartCard title="Ürün Tipi Bazlı Tonaj">
            {hasUrunData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={urunTipiTonajData} margin={{ top: 20, right: 20, left: 10, bottom: 80 }}>
                  <XAxis dataKey="name" interval={0} angle={-35} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => `${Number(value).toLocaleString("tr-TR")} kg`} />
                  <Bar dataKey="kg" fill="#16a34a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartText />
            )}
          </ChartCard>
        </div>

        <div className="bg-slate-100 rounded-xl p-4 mt-8 mb-4">
          <label className="font-semibold block mb-3">Mail Alıcıları</label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {mailListesi.map((m) => (
              <label key={m.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedMailIds.includes(m.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedMailIds([...selectedMailIds, m.id]);
                    } else {
                      setSelectedMailIds(selectedMailIds.filter((x) => x !== m.id));
                    }
                  }}
                />
                <span>{m.name} - {m.email}</span>
              </label>
            ))}

            {mailListesi.length === 0 && (
              <p className="text-slate-300">Aktif mail kaydı bulunamadı.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-4 mb-4">
          <button
            onClick={gecikenSiparisMailiGonder}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold"
          >
            Geciken Sipariş Maili Gönder
          </button>
        </div>

        <input
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          placeholder="Müşteri, proje adı veya ürün tipi ara..."
          className="w-full border rounded-xl px-4 py-3 mt-4"
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
                <tr key={k.id} className={satirRengi(k)}>
                  <Td>
                    <div className="flex gap-2">
                      <button onClick={() => setDuzenlenen(k)} className="bg-blue-600 text-white px-3 py-1 rounded-lg">
                        Düzenle
                      </button>
                      <button onClick={() => sil(k.id)} className="bg-red-600 text-white px-3 py-1 rounded-lg">
                        Sil
                      </button>
                    </div>
                  </Td>

                  <Td>{durumEtiketi(k)}</Td>
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
    </section>
</main>
  );
}

function formatKg(value: number) {
  return `${Number(value || 0).toLocaleString("tr-TR")} kg`;
}

function EmptyChartText() {
  return (
    <div className="h-[360px] flex items-center justify-center text-slate-300 text-sm">
      Grafik için tonaj verisi yok.
    </div>
  );
}

function Kpi({ title, value, danger = false }: { title: string; value: number; danger?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 ${danger ? "bg-red-100" : "bg-slate-100"}`}>
      <p className={danger ? "text-red-600" : "text-slate-300"}>{title}</p>
      <p className={`text-2xl font-bold ${danger ? "text-red-700" : "text-white"}`}>
        {Number(value || 0).toLocaleString("tr-TR")}
      </p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-100 rounded-2xl p-5 min-h-[430px]">
      <h2 className="text-lg font-bold text-white mb-4">{title}</h2>
      <div className="w-full h-[360px]">{children}</div>
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
      <label className="block text-sm font-semibold text-whitetext-slate-200 mb-1">{label}</label>
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