"use client";
import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
  const [kayitlar, setKayitlar] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);

  const [selectedContactId, setSelectedContactId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");

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

  const filtreliKayitlar = kayitlar.filter(
    (k) => k.activity_date === selectedDate
  );

  function mesajHazirla() {
    if (filtreliKayitlar.length === 0) {
      alert("Seçilen tarihte kayıt bulunamadı.");
      return null;
    }

    let message = "GÜNLÜK FAALİYET RAPORU\n";
    message += "Tarih: " + selectedDate + "\n";
    message += "--------------------------------\n";

    filtreliKayitlar.forEach((k) => {
      message += `Madde ${k.item_no}: ${k.activity_text}\n`;
    });

    message += "--------------------------------\n";
    message += filtreliKayitlar[0]?.created_by || "";

    return message;
  }

  async function kisiyeWhatsappGonder() {
    const message = mesajHazirla();
    if (!message) return;

    const contact = contacts.find(
      (c) => String(c.id) === selectedContactId
    );

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

    const group = groups.find(
      (g) => String(g.id) === selectedGroupId
    );

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
    <Sidebar
      fullName="Barış Nevruz"
      role="Yönetici"
    />

    <section className="flex-1 p-8 overflow-x-hidden">
    
      <div className="bg-slate-800 rounded-2xl p-8 mb-6">
        <h1 className="text-3xl font-bold">
          Günlük Faaliyet Kayıtları
        </h1>

        <p className="text-slate-300 mt-2">
          Tarihe göre faaliyetleri görüntüleyin ve WhatsApp üzerinden gönderin.
        </p>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="font-semibold">Tarih Seç</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 mt-2"
            />
          </div>

          <div>
            <label className="font-semibold">WhatsApp Kişisi</label>
            <select
              value={selectedContactId}
              onChange={(e) => setSelectedContactId(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 mt-2"
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
            className="bg-emerald-600 hover:bg-emerald-700 rounded-xl font-semibold mt-8"
          >
            Kişiye Gönder
          </button>

          <div>
            <label className="font-semibold">WhatsApp Grubu</label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 mt-2"
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
            className="bg-green-700 hover:bg-green-800 rounded-xl font-semibold mt-8"
          >
            Gruba Gönder
          </button>
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 overflow-auto">
        <table className="w-full border text-sm min-w-[1000px]">
          <thead className="bg-slate-950">
            <tr>
              <th className="border p-2">Tarih</th>
              <th className="border p-2">Madde</th>
              <th className="border p-2">Faaliyet</th>
              <th className="border p-2">Kaydeden</th>
              <th className="border p-2">İşlem</th>
            </tr>
          </thead>

          <tbody>
            {filtreliKayitlar.map((kayit) => (
              <tr key={kayit.id}>
                <td className="border p-2 text-center">
                  {kayit.activity_date}
                </td>

                <td className="border p-2 text-center">
                  Madde {kayit.item_no}
                </td>

                <td className="border p-2">
                  {kayit.activity_text}
                </td>

                <td className="border p-2 text-center">
                  {kayit.created_by}
                </td>

                <td className="border p-2 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() =>
                        kayitGuncelle(
                          kayit.id,
                          kayit.activity_text
                        )
                      }
                      className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded-lg font-semibold"
                    >
                      Düzenle
                    </button>

                    <button
                      onClick={() => kayitSil(kayit.id)}
                      className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg"
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
                  className="border p-4 text-center text-slate-400"
                >
                  Seçilen tarihte kayıt bulunamadı.
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