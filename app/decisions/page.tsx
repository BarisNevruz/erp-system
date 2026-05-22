"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type DecisionRow = {
  no: number;
  decision: string;
  responsible: string;
  department: string;
  priority: string;
  startDate: string;
  deadline: string;
  status: string;
  managerNote: string;
  mailGroup: string;
};

type MailGroup = {
  id: number;
  groupName: string;
  toMail?: string;
  ccMail?: string;
  active?: boolean;
};

const emptyRows = () =>
  Array.from({ length: 10 }, (_, i) => ({
    no: i + 1,
    decision: "",
    responsible: "",
    department: "",
    priority: "Normal",
    startDate: "",
    deadline: "",
    status: "Bekliyor",
    managerNote: "",
    mailGroup: "Yönetim",
  }));

export default function DecisionsPage() {
  const [groups, setGroups] = useState<MailGroup[]>([]);
  const [rows, setRows] = useState<DecisionRow[]>(emptyRows());

  const [meetingDate, setMeetingDate] = useState("");
  const [meetingNo, setMeetingNo] = useState("");
  const [meetingType, setMeetingType] = useState("Yönetim");
  const [meetingPlace, setMeetingPlace] = useState("");
  const [generalNote, setGeneralNote] = useState("");
  const [statusText, setStatusText] = useState("");

  useEffect(() => {
    const savedGroups = JSON.parse(localStorage.getItem("erp_mail_groups") || "[]");
    const activeGroups = savedGroups.filter((g: MailGroup) => g.active !== false);
    setGroups(activeGroups);

    const now = new Date();
    setMeetingNo(
      "TK-" +
        now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, "0") +
        now.getDate().toString().padStart(2, "0") +
        "-" +
        now.getHours().toString().padStart(2, "0") +
        now.getMinutes().toString().padStart(2, "0")
    );

    setMeetingDate(now.toISOString().split("T")[0]);
  }, []);

  function updateRow(index: number, field: keyof DecisionRow, value: string) {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    setRows(updated);
  }

  function getFilledRows() {
    return rows.filter(
      (r) => r.decision.trim() !== "" && r.responsible.trim() !== ""
    );
  }

  

    
async function saveAllDecisions() {
  const filledRows = getFilledRows();

  if (filledRows.length === 0) {
    alert("Kaydedilecek karar bulunamadı.");
    return;
  }

  const newRecords = filledRows.map((r) => ({
    meeting_date: meetingDate,
    meeting_no: meetingNo,
    meeting_type: meetingType,
    meeting_place: meetingPlace,
    general_note: generalNote,

    decision: r.decision,
    responsible: r.responsible,
    department: r.department,
    priority: r.priority,
    start_date: r.startDate,
    deadline: r.deadline,
    status: r.status,
    manager_note: r.managerNote,
    mail_group: r.mailGroup,
    mail_sent: false,
  }));

  const { error } = await supabase
    .from("decisions")
    .insert(newRecords);

  if (error) {
    alert("Supabase kayıt hatası: " + error.message);
    return;
  }

  setStatusText(
    `${newRecords.length} adet karar Supabase veritabanına kaydedildi.`
  );

  setRows(emptyRows());
}
  async function sendMeetingMail() {
    const filledRows = getFilledRows();

    if (filledRows.length === 0) {
      alert("Gönderilecek karar bulunamadı.");
      return;
    }

    const allGroups: MailGroup[] = JSON.parse(
      localStorage.getItem("erp_mail_groups") || "[]"
    );

    const selectedGroupName = filledRows[0].mailGroup;

    const groupDetail = allGroups.find(
      (g) => g.groupName === selectedGroupName && g.active !== false
    );

    if (!groupDetail?.toMail) {
      alert("Seçilen mail grubu için TO mail bulunamadı.");
      return;
    }

    const rowsHtml = filledRows
      .map(
        (r, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${r.decision}</td>
          <td>${r.responsible}</td>
          <td>${r.department}</td>
          <td>${r.priority}</td>
          <td>${r.startDate}</td>
          <td>${r.deadline}</td>
          <td>${r.status}</td>
          <td>${r.managerNote}</td>
          <td>${r.mailGroup}</td>
        </tr>
      `
      )
      .join("");

    const body = `
      <html>
      <body style="font-family:Calibri,Arial;font-size:11pt;color:#1f2937">
        <div style="background:#1F4E78;color:white;padding:14px 18px;font-size:18pt;font-weight:bold">
          TOPLANTI KARARLARI
        </div>

        <p>Sayın Yetkili,</p>
        <p>Gerçekleştirilen toplantıda alınan kararlar ve sorumlu aksiyonlar aşağıda bilginize sunulmuştur.</p>

        <p>
          <b>Toplantı No:</b> ${meetingNo}<br/>
          <b>Toplantı Tarihi:</b> ${meetingDate}<br/>
          <b>Toplantı Türü:</b> ${meetingType}<br/>
          <b>Toplantı Yeri:</b> ${meetingPlace}<br/>
          <b>Genel Not:</b> ${generalNote}
        </p>

        <table border="1" cellpadding="7" cellspacing="0" style="border-collapse:collapse;width:100%">
          <thead>
            <tr style="background:#1F4E78;color:white;font-weight:bold;text-align:center">
              <th>No</th>
              <th>Karar Maddesi</th>
              <th>Sorumlu Kişi</th>
              <th>Birim</th>
              <th>Öncelik</th>
              <th>Başlangıç</th>
              <th>Termin</th>
              <th>Durum</th>
              <th>Yönetici Notu</th>
              <th>Mail Grubu</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>

        <br/>
        <p style="color:#1F4E78;font-weight:bold">
          Aksiyonların termin tarihlerine uygun şekilde takip edilmesi rica olunur.
        </p>

        <p>Bilgilerinize sunarız.</p>
      </body>
      </html>
    `;

    const res = await fetch("/api/send-mail", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: groupDetail.toMail,
        cc: groupDetail.ccMail || "",
        subject: `Toplantı Kararları - ${meetingNo}`,
        body,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert("Mail gönderilemedi: " + data.error);
      return;
    }

    saveAllDecisions();
    setRows(emptyRows());
    alert("Toplantı kararları tek mail olarak gönderildi ve kayıt altına alındı.");
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="bg-white rounded-2xl shadow p-8 mb-6">
        <h1 className="text-3xl font-bold mb-8">Toplantı Karar Giriş Ekranı</h1>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="font-semibold text-white">Toplantı Tarihi</label>
            <input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} className="w-full border rounded-xl px-4 py-3 mt-2" />
          </div>

          <div>
            <label className="font-semibold text-white">Toplantı No</label>
            <input value={meetingNo} onChange={(e) => setMeetingNo(e.target.value)} className="w-full border rounded-xl px-4 py-3 mt-2" />
          </div>

          <div>
            <label className="font-semibold text-white">Toplantı Türü</label>
            <select value={meetingType} onChange={(e) => setMeetingType(e.target.value)} className="w-full border rounded-xl px-4 py-3 mt-2">
              <option>Yönetim</option>
              <option>Üretim</option>
              <option>Kalite</option>
              <option>Sevkiyat</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-white">Toplantı Yeri</label>
            <input value={meetingPlace} onChange={(e) => setMeetingPlace(e.target.value)} className="w-full border rounded-xl px-4 py-3 mt-2" />
          </div>

          <div>
            <label className="font-semibold text-white">Genel Not</label>
            <input value={generalNote} onChange={(e) => setGeneralNote(e.target.value)} className="w-full border rounded-xl px-4 py-3 mt-2" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 overflow-auto">
        <h2 className="text-2xl font-bold mb-6">Kararlar</h2>

        <table className="w-full border text-sm min-w-[1900px]">
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="border p-2">No</th>
              <th className="border p-2">Karar Maddesi</th>
              <th className="border p-2">Sorumlu Kişi</th>
              <th className="border p-2">Birim</th>
              <th className="border p-2">Öncelik</th>
              <th className="border p-2">Başlangıç</th>
              <th className="border p-2">Termin</th>
              <th className="border p-2">Durum</th>
              <th className="border p-2">Yönetici Notu</th>
              <th className="border p-2">Mail Grubu</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td className="border p-2 text-center">{row.no}</td>

                <td className="border p-2">
                  <input value={row.decision} onChange={(e) => updateRow(index, "decision", e.target.value)} className="w-full p-2 border rounded" />
                </td>

                <td className="border p-2">
                  <input value={row.responsible} onChange={(e) => updateRow(index, "responsible", e.target.value)} className="w-full p-2 border rounded" />
                </td>

                <td className="border p-2">
                  <input value={row.department} onChange={(e) => updateRow(index, "department", e.target.value)} className="w-full p-2 border rounded" />
                </td>

                <td className="border p-2">
                  <select value={row.priority} onChange={(e) => updateRow(index, "priority", e.target.value)} className="w-full p-2 border rounded">
                    <option>Normal</option>
                    <option>Yüksek</option>
                    <option>Kritik</option>
                  </select>
                </td>

                <td className="border p-2">
                  <input type="date" value={row.startDate} onChange={(e) => updateRow(index, "startDate", e.target.value)} className="w-full p-2 border rounded" />
                </td>

                <td className="border p-2">
                  <input type="date" value={row.deadline} onChange={(e) => updateRow(index, "deadline", e.target.value)} className="w-full p-2 border rounded" />
                </td>

                <td className="border p-2">
                  <select value={row.status} onChange={(e) => updateRow(index, "status", e.target.value)} className="w-full p-2 border rounded">
                    <option>Bekliyor</option>
                    <option>Devam Ediyor</option>
                    <option>Tamamlandı</option>
                    <option>İptal</option>
                  </select>
                </td>

                <td className="border p-2">
                  <input value={row.managerNote} onChange={(e) => updateRow(index, "managerNote", e.target.value)} className="w-full p-2 border rounded" />
                </td>

                <td className="border p-2">
                  <select value={row.mailGroup} onChange={(e) => updateRow(index, "mailGroup", e.target.value)} className="w-full p-2 border rounded">
                    {groups.map((g) => (
                      <option key={g.id}>{g.groupName}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex gap-4">
          <button onClick={saveAllDecisions} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold text-white">
            Toplu Kaydet
          </button>

          <button onClick={sendMeetingMail} className="mt-6 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-semibold text-white">
            Toplantı Kararlarını Mail Gönder
          </button>
        </div>

        {statusText && <p className="mt-4 text-sm text-slate-300">{statusText}</p>}
      </div>
    </main>
  );
}