"use client";

import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
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

type WhatsAppContact = {
  id: number;
  name: string;
  phone: string;
  active: boolean;
};

type WhatsAppGroup = {
  id: number;
  groupName: string;
  link: string;
  active: boolean;
};

const COLORS = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#f59e0b",
  "#7c3aed",
  "#0891b2",
];

export default function ProjeSiparisKayitlariPage() {
  const [kayitlar, setKayitlar] = useState<ProjectOrder[]>([]);
  const [arama, setArama] = useState("");
  const [duzenlenen, setDuzenlenen] = useState<ProjectOrder | null>(null);

  const [mailListesi, setMailListesi] = useState<MailContact[]>([]);
  const [selectedMailIds, setSelectedMailIds] = useState<string[]>([]);
  const [selectedCcMailIds, setSelectedCcMailIds] = useState<string[]>([]);

  const [whatsappContacts, setWhatsappContacts] = useState<WhatsAppContact[]>([]);
  const [whatsappGroups, setWhatsappGroups] = useState<WhatsAppGroup[]>([]);
  const [selectedWhatsappContactId, setSelectedWhatsappContactId] = useState("");
  const [selectedWhatsappGroupId, setSelectedWhatsappGroupId] = useState("");

  const [musteriFiltre, setMusteriFiltre] = useState("");
  const [urunTipiFiltre, setUrunTipiFiltre] = useState("");
  const [durumFiltre, setDurumFiltre] = useState("Tümü");
  const [baslangicTarih, setBaslangicTarih] = useState("");
  const [bitisTarih, setBitisTarih] = useState("");

  useEffect(() => {
    verileriGetir();
    mailGetir();

    setWhatsappContacts(
      JSON.parse(localStorage.getItem("erp_whatsapp_contacts") || "[]")
    );

    setWhatsappGroups(
      JSON.parse(localStorage.getItem("erp_whatsapp_groups") || "[]")
    );
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
async function uretimeAktar(k: ProjectOrder) {
  const { error } = await supabase
    .from("production_projects")
    .insert([
      {
        project_name: k.proje_adi,
        customer_name: k.musteri_adi,
        product_type: k.urun_tipi,
        quantity: k.urun_adeti,
        planned_delivery_date: k.termin_tarihi,
        progress_percent: 0,
        active: true,
      },
    ]);

  if (error) {
    alert("Üretime aktarma hatası: " + error.message);
    return;
  }

  alert("Proje üretime aktarıldı.");
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
    setDuzenlenen({ ...duzenlenen, [e.target.name]: e.target.value });
  }

  const filtreliKayitlar = kayitlar.filter((k) => {
    const text = `${k.proje_adi} ${k.musteri_adi} ${k.urun_tipi}`.toLowerCase();

    const aramaUygun = text.includes(arama.toLowerCase());
    const musteriUygun = !musteriFiltre || k.musteri_adi === musteriFiltre;
    const urunTipiUygun = !urunTipiFiltre || k.urun_tipi === urunTipiFiltre;

    let durumUygun = true;

    if (durumFiltre === "Geciken") durumUygun = geciktiMi(k);

    if (durumFiltre === "Tamamlanan") {
      durumUygun = Number(k.tamamlanma_yuzdesi || 0) >= 100;
    }

    if (durumFiltre === "Devam Eden") {
      durumUygun = Number(k.tamamlanma_yuzdesi || 0) < 100;
    }

    if (durumFiltre === "Termin Yaklaşan") {
      durumUygun = yaklasiyorMu(k);
    }

    let tarihUygun = true;

    if (baslangicTarih) {
      tarihUygun = tarihUygun && k.proje_siparis_tarihi >= baslangicTarih;
    }

    if (bitisTarih) {
      tarihUygun = tarihUygun && k.proje_siparis_tarihi <= bitisTarih;
    }

    return aramaUygun && musteriUygun && urunTipiUygun && durumUygun && tarihUygun;
  });

  const toplamUrunAdeti = filtreliKayitlar.reduce(
    (t, k) => t + Number(k.urun_adeti || 0),
    0
  );

  const toplamSiyahSac = filtreliKayitlar.reduce(
    (t, k) => t + Number(k.siyah_sac_kg || 0),
    0
  );

  const toplamHardox = filtreliKayitlar.reduce(
    (t, k) => t + Number(k.hardox_kg || 0),
    0
  );

  const toplamMc700 = filtreliKayitlar.reduce(
    (t, k) => t + Number(k.mc700_strenx_kg || 0),
    0
  );

  const toplamAluminyum = filtreliKayitlar.reduce(
    (t, k) => t + Number(k.aluminyum_kg || 0),
    0
  );

  const toplamCrni = filtreliKayitlar.reduce(
    (t, k) => t + Number(k.crni_kg || 0),
    0
  );

  const toplamTalasli = filtreliKayitlar.reduce(
    (t, k) => t + Number(k.talasli_imalat_kg || 0),
    0
  );

  const genelToplam = filtreliKayitlar.reduce(
    (t, k) => t + Number(k.toplam_malzeme_kg || 0),
    0
  );

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

    return (
      kalanGunHesapla(k.termin_tarihi) < 0 &&
      Number(k.tamamlanma_yuzdesi || 0) < 100
    );
  }

  function yaklasiyorMu(k: ProjectOrder) {
    if (!k.termin_tarihi) return false;

    const kalanGun = kalanGunHesapla(k.termin_tarihi);

    return (
      kalanGun >= 0 &&
      kalanGun <= 3 &&
      Number(k.tamamlanma_yuzdesi || 0) < 100
    );
  }

  function terminYaklasanSiparisler() {
    return kayitlar.filter((k) => yaklasiyorMu(k));
  }

  function satirRengi(k: ProjectOrder) {
    if (geciktiMi(k)) return "bg-red-50 border-b border-red-200 text-slate-900";
    if (yaklasiyorMu(k)) return "bg-yellow-50 border-b border-yellow-200 text-slate-900";

    return "border-b border-slate-200 text-slate-900";
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
          Termin Yaklaştı ({kalanGunHesapla(k.termin_tarihi)} gün)
        </span>
      );
    }

    return <span className="text-green-600 font-semibold">Normal</span>;
  }

  function gecikmeGunuHesapla(terminTarihi: string) {
    const kalanGun = kalanGunHesapla(terminTarihi);
    return kalanGun < 0 ? Math.abs(kalanGun) : 0;
  }

  function gecikenSiparisMesajiHazirla() {
    const gecikenler = kayitlar.filter(geciktiMi);

    if (gecikenler.length === 0) {
      alert("Geciken sipariş bulunmuyor.");
      return null;
    }

    let message = "KRİTİK - GECİKEN PROJE SİPARİŞLERİ\n";
    message += "Tarih: " + new Date().toLocaleDateString("tr-TR") + "\n";
    message += "--------------------------------\n";

    gecikenler.forEach((k, index) => {
      message += `${index + 1}) ${k.proje_adi || "-"}\n`;
      message += `Sipariş Tarihi: ${k.proje_siparis_tarihi || "-"}\n`;
      message += `Müşteri: ${k.musteri_adi || "-"}\n`;
      message += `Ürün Tipi: ${k.urun_tipi || "-"}\n`;
      message += `Adet: ${k.urun_adeti || 0}\n`;
      message += `Termin: ${k.termin_tarihi || "-"}\n`;
      message += `Gecikme: ${gecikmeGunuHesapla(k.termin_tarihi)} gün\n`;
      message += `Tamamlanma: %${k.tamamlanma_yuzdesi || 0}\n`;
      message += `Toplam KG: ${Number(k.toplam_malzeme_kg || 0).toLocaleString("tr-TR")} kg\n`;
      message += "--------------------------------\n";
    });

    message += "Lütfen geciken siparişler için aksiyon durumunu güncelleyiniz.";

    return message;
  }

  function terminYaklasanMesajiHazirla() {
    const yaklasanlar = terminYaklasanSiparisler();

    if (yaklasanlar.length === 0) {
      alert("Termin tarihi yaklaşan sipariş bulunmuyor.");
      return null;
    }

    let message = "UYARI - TERMİN TARİHİ YAKLAŞAN PROJE SİPARİŞLERİ\n";
    message += "Tarih: " + new Date().toLocaleDateString("tr-TR") + "\n";
    message += "--------------------------------\n";

    yaklasanlar.forEach((k, index) => {
      message += `${index + 1}) ${k.proje_adi || "-"}\n`;
      message += `Sipariş Tarihi: ${k.proje_siparis_tarihi || "-"}\n`;
      message += `Müşteri: ${k.musteri_adi || "-"}\n`;
      message += `Ürün Tipi: ${k.urun_tipi || "-"}\n`;
      message += `Adet: ${k.urun_adeti || 0}\n`;
      message += `Termin: ${k.termin_tarihi || "-"}\n`;
      message += `Kalan Süre: ${kalanGunHesapla(k.termin_tarihi)} gün\n`;
      message += `Tamamlanma: %${k.tamamlanma_yuzdesi || 0}\n`;
      message += `Toplam KG: ${Number(k.toplam_malzeme_kg || 0).toLocaleString("tr-TR")} kg\n`;
      message += "--------------------------------\n";
    });

    message += "Lütfen termin tarihi yaklaşan siparişler için aksiyon alınız.";

    return message;
  }

  async function gecikenSiparisWhatsappKisiyeGonder() {
    const message = gecikenSiparisMesajiHazirla();
    if (!message) return;

    const contact = whatsappContacts.find(
      (c) => String(c.id) === selectedWhatsappContactId
    );

    if (!contact) {
      alert("Lütfen WhatsApp kişisi seçiniz.");
      return;
    }

    await navigator.clipboard.writeText(message);

    const url = `https://wa.me/${contact.phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }

  async function gecikenSiparisWhatsappGrubaGonder() {
    const message = gecikenSiparisMesajiHazirla();
    if (!message) return;

    const group = whatsappGroups.find(
      (g) => String(g.id) === selectedWhatsappGroupId
    );

    if (!group) {
      alert("Lütfen WhatsApp grubu seçiniz.");
      return;
    }

    await navigator.clipboard.writeText(message);
    window.open(group.link, "_blank");

    alert(
      "Geciken sipariş mesajı panoya kopyalandı. Açılan WhatsApp grubuna Ctrl + V ile yapıştırabilirsiniz."
    );
  }

  async function terminYaklasanWhatsappKisiyeGonder() {
    const message = terminYaklasanMesajiHazirla();
    if (!message) return;

    const contact = whatsappContacts.find(
      (c) => String(c.id) === selectedWhatsappContactId
    );

    if (!contact) {
      alert("Lütfen WhatsApp kişisi seçiniz.");
      return;
    }

    await navigator.clipboard.writeText(message);

    const url = `https://wa.me/${contact.phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }

  async function terminYaklasanWhatsappGrubaGonder() {
    const message = terminYaklasanMesajiHazirla();
    if (!message) return;

    const group = whatsappGroups.find(
      (g) => String(g.id) === selectedWhatsappGroupId
    );

    if (!group) {
      alert("Lütfen WhatsApp grubu seçiniz.");
      return;
    }

    await navigator.clipboard.writeText(message);
    window.open(group.link, "_blank");

    alert(
      "Termin yaklaşan sipariş mesajı panoya kopyalandı. Açılan WhatsApp grubuna Ctrl + V ile yapıştırabilirsiniz."
    );
  }

  function excelAktar() {
    if (filtreliKayitlar.length === 0) {
      alert("Excel'e aktarılacak kayıt bulunamadı.");
      return;
    }

    const excelData = filtreliKayitlar.map((k, index) => ({
      No: index + 1,
      "Sipariş Tarihi": k.proje_siparis_tarihi,
      "Termin Tarihi": k.termin_tarihi,
      "Müşteri Adı": k.musteri_adi,
      "Proje Adı": k.proje_adi,
      "Ürün Tipi": k.urun_tipi,
      "Ürün Adeti": k.urun_adeti,
      "Siyah Sac KG": k.siyah_sac_kg,
      "Hardox KG": k.hardox_kg,
      "MC700-Strenx KG": k.mc700_strenx_kg,
      "Alüminyum KG": k.aluminyum_kg,
      "CrNi KG": k.crni_kg,
      "Talaşlı İmalat KG": k.talasli_imalat_kg,
      "Toplam Malzeme KG": k.toplam_malzeme_kg,
      "Tamamlanma %": k.tamamlanma_yuzdesi,
      Durum: geciktiMi(k)
        ? "Gecikti"
        : yaklasiyorMu(k)
        ? "Termin Yaklaştı"
        : Number(k.tamamlanma_yuzdesi || 0) >= 100
        ? "Tamamlandı"
        : "Normal",
      "Gecikme Günü": gecikmeGunuHesapla(k.termin_tarihi),
      "Kalan Gün": kalanGunHesapla(k.termin_tarihi),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Proje Siparişleri");
    XLSX.writeFile(workbook, "proje_siparis_kayitlari.xlsx");
  }

  async function gecikenSiparisMailiGonder() {
    const secilenMailler = mailListesi
      .filter((m) => selectedMailIds.includes(m.id))
      .map((m) => m.email);

    const secilenCcMailler = mailListesi
      .filter((m) => selectedCcMailIds.includes(m.id))
      .map((m) => m.email);

    if (secilenMailler.length === 0) {
      alert("Lütfen en az bir ana mail alıcısı seçiniz.");
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
            <th>Sipariş Tarihi</th>
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
          <td>${k.proje_siparis_tarihi || ""}</td>
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
        cc: secilenCcMailler.join(";"),
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

  async function terminYaklasanSiparisMailiGonder() {
    const secilenMailler = mailListesi
      .filter((m) => selectedMailIds.includes(m.id))
      .map((m) => m.email);

    const secilenCcMailler = mailListesi
      .filter((m) => selectedCcMailIds.includes(m.id))
      .map((m) => m.email);

    if (secilenMailler.length === 0) {
      alert("Lütfen en az bir ana mail alıcısı seçiniz.");
      return;
    }

    const yaklasanlar = terminYaklasanSiparisler();

    if (yaklasanlar.length === 0) {
      alert("Termin tarihi yaklaşan sipariş bulunmuyor.");
      return;
    }

    let body = `
      <h2 style="color:#ca8a04;">UYARI - TERMİN TARİHİ YAKLAŞAN PROJE SİPARİŞLERİ</h2>
      <p>Aşağıdaki proje siparişlerinin termin tarihine 3 gün veya daha az kalmıştır.</p>
      <table border="1" cellpadding="8" cellspacing="0"
        style="border-collapse:collapse;width:100%;font-family:Arial;font-size:13px;">
        <thead>
          <tr style="background:#fef3c7;color:#92400e;">
            <th>Sipariş Tarihi</th>
            <th>Müşteri</th>
            <th>Proje</th>
            <th>Ürün Tipi</th>
            <th>Adet</th>
            <th>Termin</th>
            <th>Kalan Süre</th>
            <th>Tamamlanma</th>
            <th>Toplam KG</th>
          </tr>
        </thead>
        <tbody>
    `;

    yaklasanlar.forEach((k) => {
      body += `
        <tr>
          <td>${k.proje_siparis_tarihi || ""}</td>
          <td>${k.musteri_adi || ""}</td>
          <td>${k.proje_adi || ""}</td>
          <td>${k.urun_tipi || ""}</td>
          <td>${k.urun_adeti || 0}</td>
          <td>${k.termin_tarihi || ""}</td>
          <td style="color:#ca8a04;font-weight:bold;">
            ${kalanGunHesapla(k.termin_tarihi)} gün
          </td>
          <td>%${k.tamamlanma_yuzdesi || 0}</td>
          <td>${Number(k.toplam_malzeme_kg || 0).toLocaleString("tr-TR")} kg</td>
        </tr>
      `;
    });

    body += `
        </tbody>
      </table>
      <p style="margin-top:20px;color:#ca8a04;font-weight:bold;">
        Lütfen termin tarihi yaklaşan siparişler için aksiyon alınız.
      </p>
    `;

    const response = await fetch("/api/send-mail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: secilenMailler.join(";"),
        cc: secilenCcMailler.join(";"),
        subject: "UYARI - Termin Tarihi Yaklaşan Proje Siparişleri",
        body,
      }),
    });

    if (!response.ok) {
      const hata = await response.text();
      alert("Mail gönderilemedi: " + hata);
      return;
    }

    alert("Termin yaklaşan sipariş maili gönderildi.");
  }

  return (
    <main className="min-h-screen bg-slate-100 flex">
      <Sidebar fullName="Barış Nevruz" role="Yönetici" />

      <section className="flex-1 bg-slate-100 p-4 md:p-8 overflow-x-auto">
        <div className="max-w-7xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-slate-900">
          <h1 className="text-3xl font-bold text-slate-900">
            Proje Sipariş Kayıtları
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <Kpi title="Toplam Sipariş" value={filtreliKayitlar.length} />
            <Kpi title="Toplam Ürün Adeti" value={toplamUrunAdeti} />
            <Kpi title="Genel Toplam KG" value={genelToplam} />
            <Kpi
              title="Geciken Sipariş"
              value={filtreliKayitlar.filter(geciktiMi).length}
              danger
            />
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
                  <BarChart
                    data={malzemeTonajData}
                    margin={{ top: 20, right: 20, left: 10, bottom: 80 }}
                  >
                    <XAxis
                      dataKey="name"
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 11, fill: "#334155" }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#334155" }} />
                    <Tooltip
                      formatter={(value) =>
                        `${Number(value).toLocaleString("tr-TR")} kg`
                      }
                    />
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
                        <Cell
                          key={index}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) =>
                        `${Number(value).toLocaleString("tr-TR")} kg`
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartText />
              )}
            </ChartCard>

            <ChartCard title="Ürün Tipi Bazlı Tonaj">
              {hasUrunData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={urunTipiTonajData}
                    margin={{ top: 20, right: 20, left: 10, bottom: 80 }}
                  >
                    <XAxis
                      dataKey="name"
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 11, fill: "#334155" }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#334155" }} />
                    <Tooltip
                      formatter={(value) =>
                        `${Number(value).toLocaleString("tr-TR")} kg`
                      }
                    />
                    <Bar dataKey="kg" fill="#16a34a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartText />
              )}
            </ChartCard>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-8 mb-4">
            <label className="font-semibold text-slate-800 block mb-3">
              Mail Alıcıları
            </label>

            <div className="erp-table-wrap">
  <table className="erp-table border border-slate-300 text-sm text-slate-900">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="border border-slate-300 p-2">Kişi</th>
                    <th className="border border-slate-300 p-2">Mail</th>
                    <th className="border border-slate-300 p-2">TO</th>
                    <th className="border border-slate-300 p-2">CC</th>
                  </tr>
                </thead>

                <tbody>
                  {mailListesi.map((m) => (
                    <tr key={m.id} className="bg-white">
                      <td className="border border-slate-300 p-2">{m.name}</td>
                      <td className="border border-slate-300 p-2">{m.email}</td>

                      <td className="border border-slate-300 p-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedMailIds.includes(m.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMailIds([...selectedMailIds, m.id]);
                              setSelectedCcMailIds(
                                selectedCcMailIds.filter((x) => x !== m.id)
                              );
                            } else {
                              setSelectedMailIds(
                                selectedMailIds.filter((x) => x !== m.id)
                              );
                            }
                          }}
                        />
                      </td>

                      <td className="border border-slate-300 p-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedCcMailIds.includes(m.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCcMailIds([...selectedCcMailIds, m.id]);
                              setSelectedMailIds(
                                selectedMailIds.filter((x) => x !== m.id)
                              );
                            } else {
                              setSelectedCcMailIds(
                                selectedCcMailIds.filter((x) => x !== m.id)
                              );
                            }
                          }}
                        />
                      </td>
                    </tr>
                  ))}

                  {mailListesi.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="border border-slate-300 p-4 text-center text-slate-500"
                      >
                        Aktif mail kaydı bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-4 mb-4">
            <label className="font-semibold text-slate-800 block mb-3">
              WhatsApp Sipariş Gönderimi
            </label>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <select
                value={selectedWhatsappContactId}
                onChange={(e) => setSelectedWhatsappContactId(e.target.value)}
                className="border border-slate-300 rounded-xl px-3 py-3 bg-white text-slate-900"
              >
                <option value="">WhatsApp kişisi seçiniz</option>
                {whatsappContacts
                  .filter((c) => c.active !== false)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} - {c.phone}
                    </option>
                  ))}
              </select>

              <button
                onClick={gecikenSiparisWhatsappKisiyeGonder}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl font-bold"
              >
                Geciken Kişiye
              </button>

              <button
                onClick={terminYaklasanWhatsappKisiyeGonder}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-xl font-bold"
              >
                Yaklaşan Kişiye
              </button>

              <select
                value={selectedWhatsappGroupId}
                onChange={(e) => setSelectedWhatsappGroupId(e.target.value)}
                className="border border-slate-300 rounded-xl px-3 py-3 bg-white text-slate-900"
              >
                <option value="">WhatsApp grubu seçiniz</option>
                {whatsappGroups
                  .filter((g) => g.active !== false)
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.groupName}
                    </option>
                  ))}
              </select>

              <button
                onClick={gecikenSiparisWhatsappGrubaGonder}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl font-bold"
              >
                Geciken Gruba
              </button>

              <button
                onClick={terminYaklasanWhatsappGrubaGonder}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-xl font-bold"
              >
                Yaklaşan Gruba
              </button>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 mt-4 mb-4">
            <button
              onClick={excelAktar}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold"
            >
              Excel&apos;e Aktar
            </button>

            <button
              onClick={gecikenSiparisMailiGonder}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold"
            >
              Geciken Sipariş Maili Gönder
            </button>

            <button
              onClick={terminYaklasanSiparisMailiGonder}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-xl font-bold"
            >
              Termin Yaklaşan Maili Gönder
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
            <select
              value={musteriFiltre}
              onChange={(e) => setMusteriFiltre(e.target.value)}
              className="border border-slate-300 rounded-xl px-3 py-3"
            >
              <option value="">Tüm Müşteriler</option>

              {[...new Set(kayitlar.map((x) => x.musteri_adi))]
                .filter(Boolean)
                .map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
            </select>

            <select
              value={urunTipiFiltre}
              onChange={(e) => setUrunTipiFiltre(e.target.value)}
              className="border border-slate-300 rounded-xl px-3 py-3"
            >
              <option value="">Tüm Ürünler</option>

              {[...new Set(kayitlar.map((x) => x.urun_tipi))]
                .filter(Boolean)
                .map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
            </select>

            <select
              value={durumFiltre}
              onChange={(e) => setDurumFiltre(e.target.value)}
              className="border border-slate-300 rounded-xl px-3 py-3"
            >
              <option>Tümü</option>
              <option>Geciken</option>
              <option>Termin Yaklaşan</option>
              <option>Tamamlanan</option>
              <option>Devam Eden</option>
            </select>

            <input
              type="date"
              value={baslangicTarih}
              onChange={(e) => setBaslangicTarih(e.target.value)}
              className="border border-slate-300 rounded-xl px-3 py-3"
            />

            <input
              type="date"
              value={bitisTarih}
              onChange={(e) => setBitisTarih(e.target.value)}
              className="border border-slate-300 rounded-xl px-3 py-3"
            />
          </div>

          <input
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="Müşteri, proje adı veya ürün tipi ara..."
            className="w-full bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-xl px-4 py-3 mt-4"
          />

          <div className="mt-4">
            <button
              onClick={() => {
                setArama("");
                setMusteriFiltre("");
                setUrunTipiFiltre("");
                setDurumFiltre("Tümü");
                setBaslangicTarih("");
                setBitisTarih("");
              }}
              className="bg-slate-700 hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-bold"
            >
              Filtreleri Temizle
            </button>
          </div>

          <div className="erp-table-wrap mt-8">
  <table className="erp-table border-collapse text-sm">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="sticky left-0 z-30 bg-slate-800 text-white border border-slate-300 px-3 py-2">
  İşlem
</th>
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
                    <td className="sticky left-0 z-20 bg-white border border-slate-300 p-2">
  <div className="flex gap-2">
                        <button
                          onClick={() => setDuzenlenen(k)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg"
                        >
                          Düzenle
                        </button>

                        <button
                          onClick={() => sil(k.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg"
                        >
                          Sil
                        </button>
                        <button
  onClick={() => uretimeAktar(k)}
  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg"
>
  Üretime Aktar
</button>
                      </div>
                    </td>

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

                {filtreliKayitlar.length === 0 && (
                  <tr>
                    <td colSpan={16} className="p-6 text-center text-slate-500">
                      Kayıt bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {duzenlenen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto text-slate-900">
              <h2 className="text-2xl font-bold mb-5 text-slate-900">
                Sipariş Düzenle
              </h2>

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
                <button
                  onClick={() => setDuzenlenen(null)}
                  className="px-6 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-900"
                >
                  Vazgeç
                </button>

                <button
                  onClick={guncelle}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
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

function formatKg(value: number) {
  return `${Number(value || 0).toLocaleString("tr-TR")} kg`;
}

function EmptyChartText() {
  return (
    <div className="h-[360px] flex items-center justify-center text-slate-500 text-sm">
      Grafik için tonaj verisi yok.
    </div>
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

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 min-h-[430px]">
      <h2 className="text-lg font-bold text-slate-900 mb-4">{title}</h2>
      <div className="w-full h-[360px]">{children}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="p-3 text-left whitespace-nowrap">{children}</th>;
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`p-3 whitespace-nowrap ${className}`}>{children}</td>;
}

function EditInput({ label, name, value, onChange, type = "text" }: any) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-800 mb-1">
        {label}
      </label>

      <input
        name={name}
        type={type}
        value={value || ""}
        onChange={onChange}
        className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3"
      />
    </div>
  );
}