"use client";

import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/lib/supabase";

type Decision = {
  id: string;
  meetingDate: string;
  meetingType: string;
  meetingPlace: string;
  decision: string;
  responsible: string;
  department: string;
  priority: string;
  deadline: string;
  status: string;
  managerNote: string;
  createdAt: string;
};

type MailGroup = {
  id: string;
  group_name: string;
  to_mail: string;
  cc_mail: string;
  active: boolean;
};

type FormState = {
  meetingDate: string;
  meetingType: string;
  meetingPlace: string;
  decision: string;
  responsible: string;
  department: string;
  priority: string;
  deadline: string;
  status: string;
  managerNote: string;
};

type MailPreview = {
  title: string;
  subject: string;
  bodyHtml: string;
  to: string;
  cc: string;
};

const emptyForm = (): FormState => ({
  meetingDate: new Date().toISOString().split("T")[0],
  meetingType: "Genel Toplantı",
  meetingPlace: "",
  decision: "",
  responsible: "",
  department: "",
  priority: "Normal",
  deadline: "",
  status: "Bekliyor",
  managerNote: "",
});

export default function DecisionRecordsPage() {
  const [records, setRecords] = useState<Decision[]>([]);
  const [mailGroups, setMailGroups] = useState<MailGroup[]>([]);
  const [mailContacts, setMailContacts] = useState<any[]>([]);
const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [selectedMailGroup, setSelectedMailGroup] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tümü");
  const today = new Date().toISOString().split("T")[0];
const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split("T")[0];

const [startDateFilter, setStartDateFilter] = useState(lastWeek);
const [endDateFilter, setEndDateFilter] = useState(today);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mailPreview, setMailPreview] = useState<MailPreview | null>(null);

  useEffect(() => {
  loadRecords();
  loadMailGroups();
  loadMailContacts();
}, []);

  async function loadRecords() {
    const { data, error } = await supabase
      .from("meeting_decisions")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      alert("Veri okuma hatası: " + error.message);
      return;
    }

    const mapped = (data || []).map((r: any) => ({
      id: r.id,
      meetingDate: r.toplanti_tarihi || "",
      meetingType: r.toplanti_turu || "",
      meetingPlace: r.toplanti_yeri || "",
      decision: r.karar_maddesi || "",
      responsible: r.sorumlu_kisi || "",
      department: r.birim || "",
      priority: r.oncelik || "Normal",
      deadline: r.termin_tarihi || "",
      status: r.durum || "Bekliyor",
      managerNote: r.yonetici_notu || "",
      createdAt: r.created_at || "",
    }));

    setRecords(mapped);
  }

  async function loadMailGroups() {
    const { data, error } = await supabase
      .from("mail_groups")
      .select("*")
      .eq("active", true)
      .order("group_name", { ascending: true });

    if (error) {
      alert("Mail grupları okunamadı: " + error.message);
      return;
    }

    setMailGroups(data || []);

    if (data && data.length > 0) {
      setSelectedMailGroup(data[0].group_name);
    }
  }
async function loadMailContacts() {
  const { data } = await supabase
    .from("mail_contacts")
    .select("*")
    .eq("active", true)
    .order("name", { ascending: true });

  setMailContacts(data || []);
}

function toggleContact(email: string) {
  setSelectedContacts((prev) =>
    prev.includes(email)
      ? prev.filter((x) => x !== email)
      : [...prev, email]
  );
}
  function updateForm(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function getSelectedGroup() {
    return mailGroups.find((g) => g.group_name === selectedMailGroup);
  }

  function isLate(d: Decision) {
    if (!d.deadline) return false;
    if (d.status === "Tamamlandı" || d.status === "İptal") return false;

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

    return Math.floor(
      (today.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  function getStatusClass(status: string, late: boolean) {
    if (late) return "bg-red-100 text-red-700 border-red-300 font-bold";
    if (status === "Tamamlandı")
      return "bg-green-100 text-green-700 border-green-300 font-bold";
    if (status === "Devam Ediyor")
      return "bg-blue-100 text-blue-700 border-blue-300 font-bold";
    if (status === "İptal")
      return "bg-slate-200 text-slate-700 border-slate-300 font-bold";

    return "bg-yellow-100 text-yellow-700 border-yellow-300 font-bold";
  }

  function getPriorityClass(priority: string) {
    if (priority === "Kritik")
      return "bg-red-100 text-red-700 border-red-300 font-bold";
    if (priority === "Yüksek")
      return "bg-orange-100 text-orange-700 border-orange-300 font-bold";
    if (priority === "Normal")
      return "bg-blue-100 text-blue-700 border-blue-300 font-bold";
    if (priority === "Düşük")
      return "bg-slate-100 text-slate-700 border-slate-300 font-bold";

    return "bg-white text-slate-900 border-slate-300";
  }
function getMailPriorityStyle(priority: string) {
  if (priority === "Kritik")
    return "background:#fee2e2;color:#991b1b;font-weight:bold;";
  if (priority === "Yüksek")
    return "background:#ffedd5;color:#9a3412;font-weight:bold;";
  if (priority === "Normal")
    return "background:#dbeafe;color:#1e40af;font-weight:bold;";
  if (priority === "Düşük")
    return "background:#f1f5f9;color:#334155;font-weight:bold;";
  return "";
}

function getMailStatusStyle(status: string, late: boolean) {
  if (late)
    return "background:#fee2e2;color:#991b1b;font-weight:bold;";
  if (status === "Tamamlandı")
    return "background:#dcfce7;color:#166534;font-weight:bold;";
  if (status === "Devam Ediyor")
    return "background:#dbeafe;color:#1e40af;font-weight:bold;";
  if (status === "İptal")
    return "background:#e2e8f0;color:#334155;font-weight:bold;";
  return "background:#fef9c3;color:#854d0e;font-weight:bold;";
}
  async function saveDecision() {
    if (!form.decision.trim()) {
      alert("Karar maddesi boş olamaz.");
      return;
    }

    const payload = {
      toplanti_tarihi: form.meetingDate,
      toplanti_turu: form.meetingType,
      toplanti_yeri: form.meetingPlace,
      karar_maddesi: form.decision,
      sorumlu_kisi: form.responsible,
      birim: form.department,
      oncelik: form.priority,
      termin_tarihi: form.deadline || null,
      durum: form.status,
      yonetici_notu: form.managerNote,
    };

    if (editingId) {
      const { error } = await supabase
        .from("meeting_decisions")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        alert("Güncelleme hatası: " + error.message);
        return;
      }

      alert("Karar güncellendi.");
    } else {
      const { error } = await supabase.from("meeting_decisions").insert(payload);

      if (error) {
        alert("Kayıt hatası: " + error.message);
        return;
      }

      alert("Karar en alta eklendi.");
    }

    setForm(emptyForm());
    setEditingId(null);
    loadRecords();
  }

  function startEdit(r: Decision) {
    setEditingId(r.id);

    setForm({
      meetingDate: r.meetingDate || new Date().toISOString().split("T")[0],
      meetingType: r.meetingType || "Genel Toplantı",
      meetingPlace: r.meetingPlace || "",
      decision: r.decision || "",
      responsible: r.responsible || "",
      department: r.department || "",
      priority: r.priority || "Normal",
      deadline: r.deadline || "",
      status: r.status || "Bekliyor",
      managerNote: r.managerNote || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm());
  }

  async function updateStatus(id: string, newStatus: string) {
    const { error } = await supabase
      .from("meeting_decisions")
      .update({ durum: newStatus })
      .eq("id", id);

    if (error) {
      alert("Durum güncelleme hatası");
      return;
    }

    loadRecords();
  }

  async function updateManagerNote(id: string, note: string) {
    await supabase
      .from("meeting_decisions")
      .update({ yonetici_notu: note })
      .eq("id", id);

    loadRecords();
  }

  async function deleteRecord(id: string) {
    if (!confirm("Bu karar kaydını silmek istiyor musunuz?")) return;

    const { error } = await supabase
      .from("meeting_decisions")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Silme hatası");
      return;
    }

    loadRecords();
  }

  function prepareAllDecisionMail() {
    const group = getSelectedGroup();

    if (!group?.to_mail) {
      alert("Mail grubu seçilmedi veya mail adresi yok.");
      return;
    }

    if (filteredRecords.length === 0) {
      alert("Mail gönderilecek karar bulunamadı.");
      return;
    }

    const rowsHtml = filteredRecords
  .map((r, i) => {
    const late = isLate(r);

    return `
      <tr>
        <td>${i + 1}</td>
        <td>${r.meetingDate || "-"}</td>
        <td>${r.decision || "-"}</td>
        <td>${r.responsible || "-"}</td>
        <td>${r.department || "-"}</td>
        <td style="${getMailPriorityStyle(r.priority)}">${r.priority || "-"}</td>
        <td>${r.deadline || "-"}</td>
        <td style="${getMailStatusStyle(r.status, late)}">
          ${late ? "Gecikti" : r.status || "-"}
        </td>
        <td>${r.managerNote || "-"}</td>
      </tr>
    `;
  })
  .join("");

    const bodyHtml = `
      <h2 style="color:#1F4E78">Toplantı Kararları</h2>
      <table border="1" cellpadding="7" cellspacing="0"
      style="border-collapse:collapse;width:100%;font-family:Arial;font-size:13px">
        <thead>
          <tr style="background:#1F4E78;color:white">
            <th>No</th>
            <th>Toplantı Tarihi</th>
            <th>Karar</th>
            <th>Sorumlu</th>
            <th>Birim</th>
            <th>Öncelik</th>
            <th>Termin</th>
            <th>Durum</th>
            <th>Not</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <br/>
      <p>Lütfen toplantı kararları ile ilgili aksiyonları takip ediniz.</p>
    `;

    setMailPreview({
      title: "Toplantı Kararları Mail Önizleme",
      subject: "Toplantı Kararları",
      bodyHtml,
      to: group.to_mail,
      cc: group.cc_mail || "",
    });
  }

  function prepareLateTaskMail() {
    const group = getSelectedGroup();

    if (!group?.to_mail) {
      alert("Mail grubu seçilmedi veya mail adresi yok.");
      return;
    }

    const lateRecords = records.filter((r) => isLate(r));

    if (lateRecords.length === 0) {
      alert("Geciken görev bulunamadı.");
      return;
    }

    const rowsHtml = lateRecords
  .map(
    (r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${r.decision || "-"}</td>
        <td>${r.responsible || "-"}</td>
        <td>${r.department || "-"}</td>
        <td style="${getMailPriorityStyle(r.priority)}">${r.priority || "-"}</td>
        <td>${r.deadline || "-"}</td>
        <td style="background:#fee2e2;color:#991b1b;font-weight:bold">
          Gecikti - ${getLateDays(r)} gün
        </td>
      </tr>
    `
  )
  .join("");

    const bodyHtml = `
      <h2 style="color:#990000">Geciken Toplantı Kararları</h2>
      <table border="1" cellpadding="7" cellspacing="0"
      style="border-collapse:collapse;width:100%;font-family:Arial;font-size:13px">
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
        <tbody>${rowsHtml}</tbody>
      </table>
      <br/>
      <p>Lütfen aksiyon durumlarını güncelleyiniz.</p>
    `;

    setMailPreview({
      title: "Geciken Kararlar Mail Önizleme",
      subject: "Geciken Toplantı Kararları",
      bodyHtml,
      to: group.to_mail,
      cc: group.cc_mail || "",
    });
  }

  async function sendMailDirect() {
    if (!mailPreview) return;

    const res = await fetch("/api/send-mail", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to:
  selectedContacts.length > 0
    ? selectedContacts.join(";")
    : mailPreview.to,
        cc: mailPreview.cc,
        subject: mailPreview.subject,
        body: mailPreview.bodyHtml,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "Mail gönderilemedi.");
      return;
    }

    alert("Mail başarıyla gönderildi.");
    setMailPreview(null);
  }

  async function sendWhatsappAll() {
  if (filteredRecords.length === 0) {
    alert("WhatsApp gönderilecek karar bulunamadı.");
    return;
  }

  const text = filteredRecords
    .map(
      (r, i) =>
        `${i + 1}) ${r.decision || "-"}\nSorumlu: ${r.responsible || "-"}\nBirim: ${
          r.department || "-"
        }\nÖncelik: ${r.priority || "-"}\nTermin: ${
          r.deadline || "-"
        }\nDurum: ${r.status || "-"}`
    )
    .join("\n\n");

  await navigator.clipboard.writeText("TOPLANTI KARARLARI\n\n" + text);

  alert("Kararlar panoya kopyalandı. WhatsApp açılınca mesaj alanına yapıştır.");

  window.open("https://web.whatsapp.com/", "_blank");
}

async function sendWhatsappLate() {
  const lateRecords = records.filter((r) => isLate(r));

  if (lateRecords.length === 0) {
    alert("Geciken karar bulunamadı.");
    return;
  }

  const text = lateRecords
    .map(
      (r, i) =>
        `${i + 1}) ${r.decision || "-"}\nSorumlu: ${r.responsible || "-"}\nBirim: ${
          r.department || "-"
        }\nÖncelik: ${r.priority || "-"}\nTermin: ${
          r.deadline || "-"
        }\nGecikme: ${getLateDays(r)} gün`
    )
    .join("\n\n");

  await navigator.clipboard.writeText("GECİKEN TOPLANTI KARARLARI\n\n" + text);

  alert("Geciken kararlar panoya kopyalandı. WhatsApp açılınca mesaj alanına yapıştır.");

  window.open("https://web.whatsapp.com/", "_blank");
}

  function createPdfReport() {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Baris Nevruz - Toplanti Karar Raporu", 14, 18);

    autoTable(doc, {
      startY: 30,
      head: [["No", "Karar", "Sorumlu", "Birim", "Termin", "Durum"]],
      body: filteredRecords.map((r, i) => [
        i + 1,
        r.decision,
        r.responsible,
        r.department,
        r.deadline,
        r.status,
      ]),
    });

    doc.save("toplanti_karar_raporu.pdf");
  }

  const filteredRecords = records.filter((r) => {
    const text = `
      ${r.decision}
      ${r.responsible}
      ${r.department}
      ${r.meetingType}
      ${r.meetingPlace}
      ${r.priority}
    `.toLowerCase();

    const searchMatch = text.includes(search.toLowerCase());

let statusMatch = true;

if (statusFilter === "Geciken") {
  statusMatch = isLate(r);
} else if (statusFilter !== "Tümü") {
  statusMatch = r.status === statusFilter;
}

let dateMatch = true;

if (startDateFilter && r.meetingDate) {
  dateMatch = dateMatch && r.meetingDate >= startDateFilter;
}

if (endDateFilter && r.meetingDate) {
  dateMatch = dateMatch && r.meetingDate <= endDateFilter;
}

return searchMatch && statusMatch && dateMatch;
  });

  return (
    <main className="min-h-screen bg-slate-100 flex">
      <Sidebar fullName="Barış Nevruz" role="Yönetici" />

      <section className="flex-1 p-8 overflow-x-hidden">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6 text-slate-900">
          <h1 className="text-3xl font-bold text-slate-900">
            Karar Kayıtları
          </h1>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6 text-slate-900">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? "Karar Düzenle" : "Yeni Karar Ekle"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="date"
              value={form.meetingDate}
              onChange={(e) => updateForm("meetingDate", e.target.value)}
              className="bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3"
            />

            <input
              value={form.meetingType}
              onChange={(e) => updateForm("meetingType", e.target.value)}
              placeholder="Toplantı Türü"
              className="bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3"
            />

            <input
              value={form.meetingPlace}
              onChange={(e) => updateForm("meetingPlace", e.target.value)}
              placeholder="Toplantı Yeri"
              className="bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3"
            />

            <input
              type="date"
              value={form.deadline}
              onChange={(e) => updateForm("deadline", e.target.value)}
              className="bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3"
            />

            <textarea
              value={form.decision}
              onChange={(e) => updateForm("decision", e.target.value)}
              placeholder="Karar Maddesi"
              className="md:col-span-4 bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3 min-h-[90px]"
            />

            <input
              value={form.responsible}
              onChange={(e) => updateForm("responsible", e.target.value)}
              placeholder="Sorumlu Kişi"
              className="bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3"
            />

            <input
              value={form.department}
              onChange={(e) => updateForm("department", e.target.value)}
              placeholder="Birim"
              className="bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3"
            />

            <select
              value={form.priority}
              onChange={(e) => updateForm("priority", e.target.value)}
              className={`border rounded-xl px-4 py-3 ${getPriorityClass(
                form.priority
              )}`}
            >
              <option>Düşük</option>
              <option>Normal</option>
              <option>Yüksek</option>
              <option>Kritik</option>
            </select>

            <select
              value={form.status}
              onChange={(e) => updateForm("status", e.target.value)}
              className={`border rounded-xl px-4 py-3 ${getStatusClass(
                form.status,
                false
              )}`}
            >
              <option>Bekliyor</option>
              <option>Devam Ediyor</option>
              <option>Tamamlandı</option>
              <option>İptal</option>
            </select>

            <input
              value={form.managerNote}
              onChange={(e) => updateForm("managerNote", e.target.value)}
              placeholder="Yönetici Notu"
              className="md:col-span-4 bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3"
            />
          </div>

          <div className="flex gap-3 mt-5">
            <button
              onClick={saveDecision}
              className="bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold px-6 py-3"
            >
              {editingId ? "Güncelle" : "En Alta Ekle"}
            </button>

            {editingId && (
              <button
                onClick={cancelEdit}
                className="bg-slate-500 hover:bg-slate-600 text-white rounded-xl font-semibold px-6 py-3"
              >
                Vazgeç
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-9 gap-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ara..."
              className="bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3"
            >
              <option>Tümü</option>
              <option>Bekliyor</option>
              <option>Devam Ediyor</option>
              <option>Tamamlandı</option>
              <option>İptal</option>
              <option>Geciken</option>
            </select>

            <select
              value={selectedMailGroup}
              onChange={(e) => setSelectedMailGroup(e.target.value)}
              className="bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3"
            >
              {mailGroups.length === 0 && <option>Mail grubu yok</option>}

              {mailGroups.map((g) => (
                <option key={g.id} value={g.group_name}>
                  {g.group_name}
                </option>
              ))}
            </select>
<input
  type="date"
  value={startDateFilter}
  onChange={(e) => setStartDateFilter(e.target.value)}
  className="bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3"
/>

<input
  type="date"
  value={endDateFilter}
  onChange={(e) => setEndDateFilter(e.target.value)}
  className="bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3"
/>
            <button
              onClick={loadRecords}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold px-4 py-3"
            >
              Yenile
            </button>

            <button
              onClick={createPdfReport}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold px-4 py-3"
            >
              PDF
            </button>

            <button
              onClick={prepareAllDecisionMail}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold px-4 py-3"
            >
              Karar Mail
            </button>

            <button
              onClick={prepareLateTaskMail}
              className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold px-4 py-3"
            >
              Geciken Mail
            </button>

            <button
              onClick={sendWhatsappAll}
              className="bg-green-700 hover:bg-green-800 text-white rounded-xl font-semibold px-4 py-3"
            >
              Karar WhatsApp
            </button>

            <button
              onClick={sendWhatsappLate}
              className="bg-lime-700 hover:bg-lime-800 text-white rounded-xl font-semibold px-4 py-3"
            >
              Geciken WhatsApp
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-x-auto text-slate-900">
          <table className="w-full table-fixed border border-slate-300 text-sm">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="border border-slate-300 p-2 w-12">No</th>
                <th className="border border-slate-300 p-2 w-[30%]">Karar</th>
                <th className="border border-slate-300 p-2 w-32">Sorumlu</th>
                <th className="border border-slate-300 p-2 w-28">Birim</th>
                <th className="border border-slate-300 p-2 w-24">Öncelik</th>
                <th className="border border-slate-300 p-2 w-24">Termin</th>
                <th className="border border-slate-300 p-2 w-20">Gecikme</th>
                <th className="border border-slate-300 p-2 w-32">Durum</th>
                <th className="border border-slate-300 p-2 w-44">Not</th>
                <th className="border border-slate-300 p-2 w-36">İşlem</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.map((r, i) => {
                const lateStatus = isLate(r);

                return (
                  <tr
                    key={r.id}
                    className={lateStatus ? "bg-red-50" : "bg-white"}
                  >
                    <td className="border border-slate-300 p-2 text-center font-bold">
                      {i + 1}
                    </td>

                    <td className="border border-slate-300 p-2 align-top">
                      <div
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          lineHeight: "1.25rem",
                        }}
                        title={r.decision}
                      >
                        {r.decision}
                      </div>
                    </td>

                    <td className="border border-slate-300 p-2 whitespace-normal break-words">
                      {r.responsible}
                    </td>

                    <td className="border border-slate-300 p-2 whitespace-normal break-words">
                      {r.department}
                    </td>

                    <td className="border border-slate-300 p-2 text-center">
                      <span
                        className={`inline-block border rounded-lg px-3 py-1 ${getPriorityClass(
                          r.priority
                        )}`}
                      >
                        {r.priority}
                      </span>
                    </td>

                    <td className="border border-slate-300 p-2">
                      {r.deadline}
                    </td>

                    <td className="border border-slate-300 p-2 font-bold text-red-700">
                      {lateStatus ? `${getLateDays(r)} gün` : "-"}
                    </td>

                    <td className="border border-slate-300 p-2">
                      <select
                        value={r.status}
                        onChange={(e) => updateStatus(r.id, e.target.value)}
                        className={`border rounded-lg px-2 py-1 ${getStatusClass(
                          r.status,
                          lateStatus
                        )}`}
                      >
                        <option>Bekliyor</option>
                        <option>Devam Ediyor</option>
                        <option>Tamamlandı</option>
                        <option>İptal</option>
                      </select>
                    </td>

                    <td className="border border-slate-300 p-2">
                      <input
                        defaultValue={r.managerNote || ""}
                        onBlur={(e) => updateManagerNote(r.id, e.target.value)}
                        className="bg-white border border-slate-300 text-slate-900 rounded-lg px-2 py-1 w-full min-w-0"
                      />
                    </td>

                    <td className="border border-slate-300 p-2 text-center">
                      <div className="flex flex-wrap gap-2 justify-center">
                        <button
                          onClick={() => startEdit(r)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-lg text-xs"
                        >
                          Düzenle
                        </button>

                        <button
                          onClick={() => deleteRecord(r.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-lg text-xs"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRecords.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="border border-slate-300 p-6 text-center text-slate-500"
                  >
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {mailPreview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-auto p-6 text-slate-900">
              <h2 className="text-2xl font-bold mb-4">{mailPreview.title}</h2>

              <div className="grid grid-cols-1 gap-3 mb-4">
                <input
  value={mailPreview.to}
  onChange={(e) =>
    setMailPreview({ ...mailPreview, to: e.target.value })
  }
  className="border border-slate-300 rounded-xl px-4 py-3"
  placeholder="TO"
/>

<div className="border border-slate-300 rounded-xl p-3 max-h-48 overflow-auto">
  <p className="font-bold mb-2">
    Kayıtlı Mail Adresleri
  </p>

  {mailContacts.map((c) => (
    <label
      key={c.id}
      className="flex gap-2 items-center mb-2"
    >
      <input
        type="checkbox"
        checked={selectedContacts.includes(c.email)}
        onChange={() => toggleContact(c.email)}
      />

      <span>
        {c.name} - {c.email}
      </span>
    </label>
  ))}

  {mailContacts.length === 0 && (
    <p className="text-slate-500">
      Kayıtlı mail adresi yok.
    </p>
  )}
</div>
                  
                

                <input
                  value={mailPreview.cc}
                  onChange={(e) =>
                    setMailPreview({ ...mailPreview, cc: e.target.value })
                  }
                  className="border border-slate-300 rounded-xl px-4 py-3"
                  placeholder="CC"
                />

                <input
                  value={mailPreview.subject}
                  onChange={(e) =>
                    setMailPreview({
                      ...mailPreview,
                      subject: e.target.value,
                    })
                  }
                  className="border border-slate-300 rounded-xl px-4 py-3"
                  placeholder="Konu"
                />
              </div>

              <div
                className="border border-slate-300 rounded-xl p-4 bg-slate-50 mb-5"
                dangerouslySetInnerHTML={{ __html: mailPreview.bodyHtml }}
              />

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setMailPreview(null)}
                  className="bg-slate-500 hover:bg-slate-600 text-white rounded-xl px-6 py-3 font-semibold"
                >
                  Vazgeç
                </button>

                <button
                  onClick={sendMailDirect}
                  className="bg-blue-700 hover:bg-blue-800 text-white rounded-xl px-6 py-3 font-semibold"
                >
                  Maili Gönder
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}