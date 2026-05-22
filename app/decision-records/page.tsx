"use client";

import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/lib/supabase";

type Decision = {
  id: number;
  meetingDate: string;
  meetingNo: string;
  meetingType: string;
  meetingPlace: string;
  generalNote: string;
  decision: string;
  responsible: string;
  department: string;
  priority: string;
  startDate: string;
  deadline: string;
  status: string;
  managerNote: string;
  mailGroup: string;
  createdAt: string;
  mailSent: boolean;
  completedAt?: string;
};

export default function DecisionRecordsPage() {
  const [records, setRecords] = useState<Decision[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tümü");

  useEffect(() => {
    loadRecords();
  }, []);

  async function loadRecords() {
    const { data, error } = await supabase
      .from("decisions")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      alert("Veri okuma hatası: " + error.message);
      return;
    }

    const mapped = (data || []).map((r: any) => ({
      id: r.id,
      meetingDate: r.meeting_date,
      meetingNo: r.meeting_no,
      meetingType: r.meeting_type,
      meetingPlace: r.meeting_place,
      generalNote: r.general_note,
      decision: r.decision,
      responsible: r.responsible,
      department: r.department,
      priority: r.priority,
      startDate: r.start_date,
      deadline: r.deadline,
      status: r.status,
      managerNote: r.manager_note,
      mailGroup: r.mail_group,
      createdAt: r.created_at,
      mailSent: r.mail_sent,
      completedAt: r.completed_at,
    }));

    setRecords(mapped);
  }

  function isLate(d: Decision) {
    if (!d.deadline) return false;
    if (d.status === "Tamamlandı" || d.status === "İptal")
      return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadline = new Date(d.deadline);
    deadline.setHours(0, 0, 0, 0);

    return deadline < today;
  }

  function getLateDays(d: Decision) {
    if (!isLate(d)) return 0;

    const today = new Date();
    const deadline = new Date(d.deadline);

    const diff =
      today.getTime() - deadline.getTime();

    return Math.floor(
      diff / (1000 * 60 * 60 * 24)
    );
  }

  async function updateStatus(
    id: number,
    newStatus: string
  ) {
    const completedAt =
      newStatus === "Tamamlandı"
        ? new Date().toLocaleDateString("tr-TR")
        : null;

    const { error } = await supabase
      .from("decisions")
      .update({
        status: newStatus,
        completed_at: completedAt,
      })
      .eq("id", id);

    if (error) {
      alert("Durum güncelleme hatası");
      return;
    }

    loadRecords();
  }

  async function updateManagerNote(
    id: number,
    note: string
  ) {
    await supabase
      .from("decisions")
      .update({
        manager_note: note,
      })
      .eq("id", id);
  }

  async function deleteRecord(id: number) {
    if (
      !confirm(
        "Bu karar kaydını silmek istiyor musunuz?"
      )
    )
      return;

    const { error } = await supabase
      .from("decisions")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Silme hatası");
      return;
    }

    loadRecords();
  }

  async function sendLateTaskMail() {
    const lateRecords = records.filter((r) =>
      isLate(r)
    );

    if (lateRecords.length === 0) {
      alert("Geciken görev bulunamadı.");
      return;
    }

    const { data: groups } = await supabase
      .from("mail_groups")
      .select("*")
      .eq("group_name", "Yönetim")
      .eq("active", true)
      .limit(1);

    const group = groups?.[0];

    if (!group?.to_mail) {
      alert("Yönetim mail grubu bulunamadı.");
      return;
    }

    const rowsHtml = lateRecords
      .map(
        (r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${r.decision}</td>
        <td>${r.responsible}</td>
        <td>${r.department}</td>
        <td>${r.deadline}</td>
        <td style="color:red;font-weight:bold">
          ${getLateDays(r)} gün
        </td>
      </tr>
    `
      )
      .join("");

    const body = `
      <h2 style="color:#990000">
        Geciken Toplantı Kararları
      </h2>

      <table border="1" cellpadding="7" cellspacing="0"
      style="border-collapse:collapse;width:100%">

        <thead>
          <tr style="background:#1F4E78;color:white">
            <th>No</th>
            <th>Karar</th>
            <th>Sorumlu</th>
            <th>Birim</th>
            <th>Termin</th>
            <th>Gecikme</th>
          </tr>
        </thead>

        <tbody>
          ${rowsHtml}
        </tbody>

      </table>

      <br/>

      <p>
        Lütfen aksiyon durumlarını güncelleyiniz.
      </p>
    `;

    const res = await fetch("/api/send-mail", {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        to: group.to_mail,
        cc: group.cc_mail || "",
        subject:
          "Geciken Toplantı Kararları",
        body,
      }),
    });

    if (!res.ok) {
      alert("Mail gönderilemedi.");
      return;
    }

    alert("Geciken görev maili gönderildi.");
  }

  function createPdfReport() {
    const doc = new jsPDF();

    doc.setFontSize(16);

    doc.text(
      "Baris Nevruz - Toplanti Karar Raporu",
      14,
      18
    );

    autoTable(doc, {
      startY: 30,
      head: [[
        "No",
        "Karar",
        "Sorumlu",
        "Birim",
        "Termin",
        "Durum",
      ]],
      body: filteredRecords.map(
        (r, i) => [
          i + 1,
          r.decision,
          r.responsible,
          r.department,
          r.deadline,
          r.status,
        ]
      ),
    });

    doc.save(
      "toplanti_karar_raporu.pdf"
    );
  }

  const filteredRecords = records.filter(
    (r) => {
      const text = `
        ${r.decision}
        ${r.responsible}
        ${r.department}
        ${r.meetingNo}
      `.toLowerCase();

      const searchMatch =
        text.includes(search.toLowerCase());

      let statusMatch = true;

      if (statusFilter === "Geciken") {
        statusMatch = isLate(r);
      } else if (statusFilter !== "Tümü") {
        statusMatch =
          r.status === statusFilter;
      }

      return searchMatch && statusMatch;
    }
  );

  return (
    <main className="min-h-screen bg-slate-900 text-white p-8">

      <div className="bg-slate-800 rounded-2xl p-6 mb-6">

        <h1 className="text-3xl font-bold">
          Karar Kayıtları
        </h1>

      </div>

      <div className="bg-slate-800 rounded-2xl p-6 mb-6">

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Ara..."
            className="bg-slate-700 border border-slate-600 rounded-xl px-4 py-3"
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="bg-slate-700 border border-slate-600 rounded-xl px-4 py-3"
          >
            <option>Tümü</option>
            <option>Bekliyor</option>
            <option>Devam Ediyor</option>
            <option>Tamamlandı</option>
            <option>İptal</option>
            <option>Geciken</option>
          </select>

          <button
            onClick={loadRecords}
            className="bg-blue-600 rounded-xl font-semibold"
          >
            Listeyi Yenile
          </button>

          <button
            onClick={createPdfReport}
            className="bg-red-600 rounded-xl font-semibold"
          >
            PDF Rapor
          </button>

          <button
            onClick={sendLateTaskMail}
            className="bg-orange-600 rounded-xl font-semibold"
          >
            Gecikenleri Mail Gönder
          </button>

        </div>

      </div>

      <div className="bg-slate-800 rounded-2xl p-6 overflow-auto">

        <table className="w-full border text-sm min-w-[1800px]">

          <thead className="bg-slate-950">

            <tr>
              <th className="border p-2">No</th>
              <th className="border p-2">Karar</th>
              <th className="border p-2">Sorumlu</th>
              <th className="border p-2">Birim</th>
              <th className="border p-2">Termin</th>
              <th className="border p-2">Gecikme</th>
              <th className="border p-2">Durum</th>
              <th className="border p-2">Not</th>
              <th className="border p-2">İşlem</th>
            </tr>

          </thead>

          <tbody>

            {filteredRecords.map((r, i) => {

              const lateStatus = isLate(r);

              return (
                <tr
                  key={r.id}
                  className={
                    lateStatus
                      ? "bg-red-900/30"
                      : ""
                  }
                >

                  <td className="border p-2">
                    {i + 1}
                  </td>

                  <td className="border p-2">
                    {r.decision}
                  </td>

                  <td className="border p-2">
                    {r.responsible}
                  </td>

                  <td className="border p-2">
                    {r.department}
                  </td>

                  <td className="border p-2">
                    {r.deadline}
                  </td>

                  <td className="border p-2">
                    {lateStatus
                      ? `${getLateDays(r)} gün`
                      : "-"}
                  </td>

                  <td className="border p-2">

                    <select
                      value={r.status}
                      onChange={(e) =>
                        updateStatus(
                          r.id,
                          e.target.value
                        )
                      }
                      className="bg-slate-700 border border-slate-600 rounded-lg px-2 py-1"
                    >
                      <option>Bekliyor</option>
                      <option>Devam Ediyor</option>
                      <option>Tamamlandı</option>
                      <option>İptal</option>
                    </select>

                  </td>

                  <td className="border p-2">

                    <input
                      value={
                        r.managerNote || ""
                      }
                      onChange={(e) =>
                        updateManagerNote(
                          r.id,
                          e.target.value
                        )
                      }
                      className="bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 w-full"
                    />

                  </td>

                  <td className="border p-2 text-center">

                    <button
                      onClick={() =>
                        deleteRecord(r.id)
                      }
                      className="bg-red-600 px-3 py-1 rounded-lg"
                    >
                      Sil
                    </button>

                  </td>

                </tr>
              );
            })}

          </tbody>

        </table>

      </div>

    </main>
  );
}