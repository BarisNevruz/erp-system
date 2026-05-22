"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type ActivityRow = {
  itemNo: number;
  text: string;
};

const emptyRows = () =>
  Array.from({ length: 25 }, (_, i) => ({
    itemNo: i + 1,
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

  async function saveActivities() {
    const filledRows = rows.filter((r) => r.text.trim() !== "");

    if (filledRows.length === 0) {
      alert("Kaydedilecek faaliyet yok.");
      return;
    }

    const records = filledRows.map((r) => ({
      activity_date: activityDate,
      item_no: r.itemNo,
      activity_text: r.text,
      created_by: "Barış Nevruz",
    }));

    const { error } = await supabase
      .from("daily_activities")
      .insert(records);

    if (error) {
      alert("Kayıt hatası: " + error.message);
      return;
    }

    setStatus(`${records.length} adet faaliyet kaydedildi.`);
    setRows(emptyRows());
  }

  async function prepareWhatsappMessage() {
    const filledRows = rows.filter((r) => r.text.trim() !== "");

    if (filledRows.length === 0) {
      alert("WhatsApp için faaliyet bulunamadı.");
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

    filledRows.forEach((r) => {
      message += `Madde ${r.itemNo}: ${r.text}\n`;
    });

    message += "--------------------------------\n";
    message += "Barış Nevruz";

    await navigator.clipboard.writeText(message);
    window.open(group.link, "_blank");

    alert("WhatsApp mesajı panoya kopyalandı. Açılan gruba Ctrl + V ile yapıştırabilirsiniz.");
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white p-8">
      <div className="bg-slate-800 rounded-2xl p-8 mb-6">
        <h1 className="text-3xl font-bold">
          Günlük Faaliyet Giriş Ekranı
        </h1>

        <p className="text-slate-300 mt-2">
          Günlük faaliyetleri kaydedin ve WhatsApp raporu hazırlayın.
        </p>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="font-semibold">Tarih</label>
            <input
              type="date"
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 mt-2"
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

        {status && (
          <p className="text-slate-300 mt-4">
            {status}
          </p>
        )}
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 overflow-auto">
        <table className="w-full border text-sm min-w-[1000px]">
          <thead className="bg-slate-950">
            <tr>
              <th className="border p-2 w-32">Madde</th>
              <th className="border p-2">Faaliyet</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, index) => (
              <tr key={r.itemNo}>
                <td className="border p-2 text-center font-semibold">
                  Madde {r.itemNo}
                </td>

                <td className="border p-2">
                  <input
                    value={r.text}
                    onChange={(e) => updateRow(index, e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2"
                    placeholder="Faaliyet giriniz..."
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}