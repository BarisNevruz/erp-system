"use client";

import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

type ActivityRecord = {
  id: number;
  activity_date: string;
  item_no: number;
  activity_text: string;
  created_by?: string;
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

export default function ActivityRecordsPage() {
  const [kayitlar, setKayitlar] = useState<ActivityRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);

  const [selectedContactId, setSelectedContactId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");

  const [tumKayitlariGoster, setTumKayitlariGoster] = useState(false);
  const [arama, setArama] = useState("");
  const [baslangicTarih, setBaslangicTarih] = useState("");
  const [bitisTarih, setBitisTarih] = useState("");

  useEffect(() => {
    veriGetir();

    setContacts(
      JSON.parse(localStorage.getItem("erp_whatsapp_contacts") || "[]")
    );

    setGroups(
      JSON.parse(localStorage.getItem("erp_whatsapp_groups") || "[]")
    );
  }, []);

  async function veriGetir() {
    const { data, error } = await supabase
      .from("daily_activities")
      .select("*")
      .order("activity_date", { ascending: false })
      .order("item_no", { ascending: true });

    if (error) {
      alert("Veri çekme hatası: " + error.message);
      return;
    }

    setKayitlar(data || []);
  }

  const filtreliKayitlar = kayitlar.filter((k) => {
    let tarihUygun = true;

    if (baslangicTarih || bitisTarih) {
      if (baslangicTarih) {
        tarihUygun = tarihUygun && k.activity_date >= baslangicTarih;
      }

      if (bitisTarih) {
        tarihUygun = tarihUygun && k.activity_date <= bitisTarih;
      }
    } else {
      tarihUygun = tumKayitlariGoster
        ? true
        : k.activity_date === selectedDate;
    }

    const aramaUygun =
      `${k.activity_date || ""} ${k.item_no || ""} ${k.activity_text || ""} ${
        k.created_by || ""
      }`
        .toLowerCase()
        .includes(arama.toLowerCase());

    return tarihUygun && aramaUygun;
  });

  function excelAktar() {
    if (filtreliKayitlar.length === 0) {
      alert("Excel'e aktarılacak faaliyet kaydı bulunamadı.");
      return;
    }

    const excelData = filtreliKayitlar.map((k, index) => ({
      No: index + 1,
      Tarih: k.activity_date,
      "Madde No": k.item_no,
      Faaliyet: k.activity_text,
      Kaydeden: k.created_by || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Faaliyet Kayıtları");
    XLSX.writeFile(workbook, "faaliyet_kayitlari.xlsx");
  }

  function mesajHazirla() {
    const gunlukKayitlar = kayitlar.filter(
      (k) => k.activity_date === selectedDate
    );

    if (gunlukKayitlar.length === 0) {
      alert("Seçilen tarihte kayıt bulunamadı.");
      return null;
    }

    let message = "GÜNLÜK FAALİYET RAPORU\n";
    message += "Tarih: " + selectedDate + "\n";
    message += "--------------------------------\n";

    gunlukKayitlar.forEach((k) => {
      message += `Madde ${k.item_no}: ${k.activity_text}\n`;
    });

    message += "--------------------------------\n";
    message += gunlukKayitlar[0]?.created_by || "";

    return message;
  }

  async function kisiyeWhatsappGonder() {
    const message = mesajHazirla();
    if (!message) return;

    const contact = contacts.find((c) => String(c.id) === selectedContactId);

    if (!contact) {
      alert("Lütfen WhatsApp kişisi seçiniz.");
      return;
    }

    await navigator.clipboard.writeText(message);

    const url = `https://wa.me/${contact.phone}?text=${encodeURIComponent(
      message
    )}`;

    window.open(url, "_blank");
  }

  async function grubaWhatsappGonder() {
    const message = mesajHazirla();
    if (!message) return;

    const group = groups.find((g) => String(g.id) === selectedGroupId);

    if (!group) {
      alert("Lütfen WhatsApp grubu seçiniz.");
      return;
    }

    await navigator.clipboard.writeText(message);
    window.open(group.link, "_blank");

    alert(
      "Mesaj panoya kopyalandı. Açılan WhatsApp grubuna Ctrl + V ile yapıştırabilirsiniz."
    );
  }

  async function kayitGuncelle(id: number, mevcutText: string) {
    const yeniText = prompt("Faaliyet metnini düzenleyin:", mevcutText);

    if (yeniText === null) return;

    if (yeniText.trim() === "") {
      alert("Faaliyet boş bırakılamaz.");
      return;
    }

    const { error } = await supabase
      .from("daily_activities")
      .update({
        activity_text: yeniText.trim(),
      })
      .eq("id", id);

    if (error) {
      alert("Güncelleme hatası: " + error.message);
      return;
    }

    alert("Kayıt güncellendi.");
    veriGetir();
  }

  async function kayitSil(id: number) {
    if (!confirm("Bu faaliyet kaydını silmek istiyor musunuz?")) return;

    const { error } = await supabase
      .from("daily_activities")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Silme hatası: " + error.message);
      return;
    }

    veriGetir();
  }

  return (
    <main className="min-h-screen bg-slate-100 flex">
      <Sidebar fullName="Barış Nevruz" role="Yönetici" />

      <section className="flex-1 p-4 md:p-8 overflow-x-auto">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 mb-6 text-slate-900">
          <h1 className="text-3xl font-bold text-slate-900">
            Günlük Faaliyet Kayıtları
          </h1>

          <p className="text-slate-600 mt-2">
            Faaliyetleri görüntüleyin, filtreleyin, Excel'e aktarın ve günlük
            WhatsApp raporu gönderin.
          </p>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 mb-6 text-slate-900">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="font-semibold text-slate-800">Tarih Seç</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3 mt-2"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-800">
                Tüm Kayıtlar
              </label>

              <button
                onClick={() => setTumKayitlariGoster(!tumKayitlariGoster)}
                className={
                  tumKayitlariGoster
                    ? "w-full bg-blue-600 text-white rounded-xl px-4 py-3 mt-2 font-semibold"
                    : "w-full bg-slate-700 text-white rounded-xl px-4 py-3 mt-2 font-semibold"
                }
              >
                {tumKayitlariGoster
                  ? "Tüm Kayıtlar Açık"
                  : "Sadece Seçili Tarih"}
              </button>
            </div>

            <div>
              <label className="font-semibold text-slate-800">
                WhatsApp Kişisi
              </label>
              <select
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3 mt-2"
              >
                <option value="">Kişi seçiniz</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.phone}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={kisiyeWhatsappGonder}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold mt-8 px-4 py-3"
            >
              Kişiye Gönder
            </button>

            <div>
              <label className="font-semibold text-slate-800">
                WhatsApp Grubu
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3 mt-2"
              >
                <option value="">Grup seçiniz</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.groupName}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={grubaWhatsappGonder}
              className="bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold mt-8 px-4 py-3"
            >
              Gruba Gönder
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 mb-6 text-slate-900">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Faaliyet, tarih, madde veya kaydeden ara..."
              className="bg-white border border-slate-300 rounded-xl px-4 py-3"
            />

            <input
              type="date"
              value={baslangicTarih}
              onChange={(e) => setBaslangicTarih(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-4 py-3"
            />

            <input
              type="date"
              value={bitisTarih}
              onChange={(e) => setBitisTarih(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-4 py-3"
            />

            <button
              onClick={excelAktar}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold px-4 py-3"
            >
              Excel&apos;e Aktar
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => {
                setArama("");
                setBaslangicTarih("");
                setBitisTarih("");
              }}
              className="bg-slate-700 hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-bold"
            >
              Filtreleri Temizle
            </button>

            <div className="bg-slate-100 border border-slate-200 px-5 py-3 rounded-xl font-semibold text-slate-700">
              Görünen Kayıt: {filtreliKayitlar.length}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 overflow-auto text-slate-900">
          <table className="w-full border border-slate-300 text-sm min-w-[1000px]">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="border border-slate-300 p-2">Tarih</th>
                <th className="border border-slate-300 p-2">Madde</th>
                <th className="border border-slate-300 p-2">Faaliyet</th>
                <th className="border border-slate-300 p-2">Kaydeden</th>
                <th className="border border-slate-300 p-2">İşlem</th>
              </tr>
            </thead>

            <tbody>
              {filtreliKayitlar.map((kayit) => (
                <tr key={kayit.id} className="bg-white text-slate-900">
                  <td className="border border-slate-300 p-2 text-center">
                    {kayit.activity_date}
                  </td>

                  <td className="border border-slate-300 p-2 text-center">
                    Madde {kayit.item_no}
                  </td>

                  <td className="border border-slate-300 p-2">
                    {kayit.activity_text}
                  </td>

                  <td className="border border-slate-300 p-2 text-center">
                    {kayit.created_by || "-"}
                  </td>

                  <td className="border border-slate-300 p-2 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() =>
                          kayitGuncelle(kayit.id, kayit.activity_text)
                        }
                        className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded-lg font-semibold"
                      >
                        Düzenle
                      </button>

                      <button
                        onClick={() => kayitSil(kayit.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg font-semibold"
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtreliKayitlar.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="border border-slate-300 p-4 text-center text-slate-500"
                  >
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}