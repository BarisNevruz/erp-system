"use client";
import Sidebar from "@/components/Sidebar";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

type ActivityRow = {
  text: string;
};

const emptyRows = () =>
  Array.from({ length: 25 }, () => ({
    text: "",
  }));

export default function DailyPage() {
  const [activityDate, setActivityDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [rows, setRows] = useState<ActivityRow[]>(emptyRows());
  const [status, setStatus] = useState("");

  function updateRow(index: number, value: string) {
    const updated = [...rows];
    updated[index].text = value;
    setRows(updated);
  }

  async function getLastItemNoForDate() {
    const { data, error } = await supabase
      .from("daily_activities")
      .select("item_no")
      .eq("activity_date", activityDate);

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      return 0;
    }

    const itemNumbers = data.map((r) => Number(r.item_no || 0));
    return Math.max(...itemNumbers);
  }

  async function saveActivities() {
    const filledRows = rows.filter((r) => r.text.trim() !== "");

    if (filledRows.length === 0) {
      alert("Kaydedilecek faaliyet yok.");
      return;
    }

    let lastItemNo = 0;

    try {
      lastItemNo = await getLastItemNoForDate();
      alert("Bulunan son madde no: " + lastItemNo);
    } catch (err: any) {
      alert("Son madde numarası alınamadı: " + err.message);
      return;
    }

    const records = filledRows.map((r, index) => ({
      activity_date: activityDate,
      item_no: lastItemNo + index + 1,
      activity_text: r.text.trim(),
      created_by: "Barış Nevruz",
    }));

    const { error } = await supabase
      .from("daily_activities")
      .insert(records);

    if (error) {
      alert("Kayıt hatası: " + error.message);
      return;
    }

    setStatus(
      `${records.length} adet faaliyet kaydedildi. Madde ${
        lastItemNo + 1
      } - Madde ${lastItemNo + records.length} arası eklendi.`
    );

    setRows(emptyRows());
  }

  async function prepareWhatsappMessage() {
    const { data: activities, error } = await supabase
      .from("daily_activities")
      .select("*")
      .eq("activity_date", activityDate)
      .order("item_no", { ascending: true });

    if (error) {
      alert("Faaliyetler alınamadı: " + error.message);
      return;
    }

    if (!activities || activities.length === 0) {
      alert("Bu tarih için kayıtlı faaliyet bulunamadı.");
      return;
    }

    const { data: groups } = await supabase
      .from("whatsapp_groups")
      .select("*")
      .eq("group_name", "Yönetim")
      .eq("active", true)
      .limit(1);

    const group = groups?.[0];

    if (!group?.link) {
      alert("Yönetim WhatsApp grup linki bulunamadı.");
      return;
    }

    let message = "GÜNLÜK FAALİYET RAPORU\n";
    message += "Tarih: " + activityDate + "\n";
    message += "--------------------------------\n";

    activities.forEach((r: any) => {
      message += `Madde ${r.item_no}: ${r.activity_text}\n`;
    });

    message += "--------------------------------\n";
    message += "Barış Nevruz";

    await navigator.clipboard.writeText(message);
    window.open(group.link, "_blank");

    alert(
      "WhatsApp mesajı panoya kopyalandı. Açılan gruba Ctrl + V ile yapıştırabilirsiniz."
    );
  }

  return (
  <main className="min-h-screen bg-slate-100 flex">
    <Sidebar
      fullName="Barış Nevruz"
      role="Yönetici"
    />

    <section className="flex-1 bg-slate-100 p-8 overflow-x-hidden">
    
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 mb-6 text-slate-900">
        <h1 className="text-3xl font-bold">
          Günlük Faaliyet Giriş Ekranı
        </h1>

        <p className="text-slate-600 mt-2">
          Günlük faaliyetleri kaydedin ve WhatsApp raporu hazırlayın.
        </p>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 mb-6 text-slate-900">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="font-semibold">Tarih</label>
            <input
              type="date"
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
              className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3 mt-2"
            />
          </div>

          <button
            onClick={saveActivities}
            className="bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold mt-8"
          >
            Günlük Faaliyet Kaydet
          </button>

          <button
            onClick={prepareWhatsappMessage}
            className="bg-emerald-600 hover:bg-emerald-700 rounded-xl font-semibold mt-8"
          >
            WhatsApp Raporu Hazırla
          </button>
        </div>

        {status && <p className="text-green-700 mt-4 font-semibold">{status}</p>}
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 overflow-auto text-slate-900">
        <table className="w-full border text-sm min-w-[1000px]">
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="border p-2 w-32">Madde</th>
              <th className="border p-2">Faaliyet</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, index) => (
              <tr key={index}>
                <td className="border p-2 text-center font-semibold">
                  Yeni Madde
                </td>

                <td className="border p-2">
                  <input
                    value={r.text}
                    onChange={(e) => updateRow(index, e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2"
                    placeholder="Faaliyet giriniz..."
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
         </div>
    </section>
  </main>
);
}