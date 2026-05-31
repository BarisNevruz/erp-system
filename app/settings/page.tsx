"use client";
import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const POSTA_GRUPLARI = [
  "Yönetim",
  "Üretim",
  "Kalite",
  "Proje",
  "Satınalma",
  "Planlama",
  "Sevkiyat",
  "Dış Ticaret",
  "Depo",
];

const ROLLER = [
  "Yönetici",
  "Mühendis",
  "Operatör",
  "Kalite",
  "Görüntüleyici",
];

type Person = {
  id: number;
  name: string;
  department: string;
  mailGroup: string;
  active: boolean;
};

type MailGroup = {
  id: number;
  groupName: string;
  toMail: string;
  ccMail: string;
  active: boolean;
};

type Holiday = {
  id: number;
  date: string;
  description: string;
  active: boolean;
};

type WhatsAppGroup = {
  id: number;
  groupName: string;
  link: string;
  active: boolean;
};

type WhatsAppContact = {
  id: number;
  name: string;
  phone: string;
  active: boolean;
};

type UserProfile = {
  id: number;
  email: string;
  full_name: string;
  role: string;
  active: boolean;
};

export default function SettingsPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [mailGroups, setMailGroups] = useState<MailGroup[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [whatsappGroups, setWhatsappGroups] = useState<WhatsAppGroup[]>([]);
  const [whatsappContacts, setWhatsappContacts] = useState<WhatsAppContact[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);

  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [personMailGroup, setPersonMailGroup] = useState("Yönetim");

  const [groupName, setGroupName] = useState("Yönetim");
  const [toMail, setToMail] = useState("");
  const [ccMail, setCcMail] = useState("");

  const [holidayDate, setHolidayDate] = useState("");
  const [holidayDesc, setHolidayDesc] = useState("");

  const [waGroupName, setWaGroupName] = useState("Yönetim");
  const [waLink, setWaLink] = useState("");

  const [waContactName, setWaContactName] = useState("");
  const [waContactPhone, setWaContactPhone] = useState("");

  const [userEmail, setUserEmail] = useState("");
  const [userFullName, setUserFullName] = useState("");
  const [userRole, setUserRole] = useState("Operatör");

  useEffect(() => {
    setPeople(JSON.parse(localStorage.getItem("erp_people") || "[]"));
    setMailGroups(JSON.parse(localStorage.getItem("erp_mail_groups") || "[]"));
    setHolidays(JSON.parse(localStorage.getItem("erp_holidays") || "[]"));
    setWhatsappGroups(JSON.parse(localStorage.getItem("erp_whatsapp_groups") || "[]"));
    setWhatsappContacts(JSON.parse(localStorage.getItem("erp_whatsapp_contacts") || "[]"));
    loadUsers();
  }, []);

  async function loadUsers() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name", { ascending: true });

    if (error) {
      alert("Kullanıcılar alınamadı: " + error.message);
      return;
    }

    setUsers(data || []);
  }

  async function addUser() {
    if (!userEmail || !userFullName || !userRole) {
      alert("Ad soyad, e-posta ve rol zorunludur.");
      return;
    }

    const { error } = await supabase.from("profiles").insert([
      {
        email: userEmail,
        full_name: userFullName,
        role: userRole,
        active: true,
      },
    ]);

    if (error) {
      alert("Kullanıcı ekleme hatası: " + error.message);
      return;
    }

    setUserEmail("");
    setUserFullName("");
    setUserRole("Operatör");
    loadUsers();
  }

  async function updateUserRole(id: number, role: string) {
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", id);

    if (error) {
      alert("Rol güncelleme hatası: " + error.message);
      return;
    }

    loadUsers();
  }

  async function toggleUserActive(id: number, active: boolean) {
    const { error } = await supabase
      .from("profiles")
      .update({ active: !active })
      .eq("id", id);

    if (error) {
      alert("Durum güncelleme hatası: " + error.message);
      return;
    }

    loadUsers();
  }

  function savePeople(list: Person[]) {
    setPeople(list);
    localStorage.setItem("erp_people", JSON.stringify(list));
  }

  function saveMailGroups(list: MailGroup[]) {
    setMailGroups(list);
    localStorage.setItem("erp_mail_groups", JSON.stringify(list));
  }

  function saveHolidays(list: Holiday[]) {
    setHolidays(list);
    localStorage.setItem("erp_holidays", JSON.stringify(list));
  }

  function saveWhatsAppGroups(list: WhatsAppGroup[]) {
    setWhatsappGroups(list);
    localStorage.setItem("erp_whatsapp_groups", JSON.stringify(list));
  }

  function saveWhatsAppContacts(list: WhatsAppContact[]) {
    setWhatsappContacts(list);
    localStorage.setItem("erp_whatsapp_contacts", JSON.stringify(list));
  }

  function addPerson() {
    if (!name || !department) {
      alert("Kişi adı ve birim zorunludur.");
      return;
    }

    savePeople([
      ...people,
      {
        id: Date.now(),
        name,
        department,
        mailGroup: personMailGroup,
        active: true,
      },
    ]);

    setName("");
    setDepartment("");
    setPersonMailGroup("Yönetim");
  }

  function addMailGroup() {
    if (!groupName || !toMail) {
      alert("Mail grubu ve TO mail zorunludur.");
      return;
    }

    saveMailGroups([
      ...mailGroups,
      {
        id: Date.now(),
        groupName,
        toMail,
        ccMail,
        active: true,
      },
    ]);

    setGroupName("Yönetim");
    setToMail("");
    setCcMail("");
  }

  function addHoliday() {
    if (!holidayDate || !holidayDesc) {
      alert("Tatil tarihi ve açıklama zorunludur.");
      return;
    }

    saveHolidays([
      ...holidays,
      {
        id: Date.now(),
        date: holidayDate,
        description: holidayDesc,
        active: true,
      },
    ]);

    setHolidayDate("");
    setHolidayDesc("");
  }

  function addWhatsAppGroup() {
    if (!waGroupName || !waLink) {
      alert("WhatsApp grup adı ve link zorunludur.");
      return;
    }

    saveWhatsAppGroups([
      ...whatsappGroups,
      {
        id: Date.now(),
        groupName: waGroupName,
        link: waLink,
        active: true,
      },
    ]);

    setWaGroupName("Yönetim");
    setWaLink("");
  }

  function addWhatsAppContact() {
    if (!waContactName || !waContactPhone) {
      alert("İsim ve telefon numarası zorunludur.");
      return;
    }

    const cleanPhone = waContactPhone.replace(/\D/g, "");

    saveWhatsAppContacts([
      ...whatsappContacts,
      {
        id: Date.now(),
        name: waContactName,
        phone: cleanPhone,
        active: true,
      },
    ]);

    setWaContactName("");
    setWaContactPhone("");
  }

  return (
  <main className="min-h-screen bg-slate-100 flex">
    <Sidebar
      fullName="Barış Nevruz"
      role="Yönetici"
    />

    <section className="flex-1 p-8 overflow-x-hidden">
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 mb-6 text-slate-900">
        <h1 className="text-3xl font-bold">Ayarlar</h1>
        <p className="text-slate-600 mt-2">
          Sistem kullanıcıları, WhatsApp, mail ve genel ayarlar.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        <Panel title="Kullanıcı Yönetimi" wide>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <input value={userFullName} onChange={(e) => setUserFullName(e.target.value)} placeholder="Ad Soyad" className="input" />
            <input value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="E-posta" className="input" />

            <select value={userRole} onChange={(e) => setUserRole(e.target.value)} className="input">
              {ROLLER.map((r) => <option key={r}>{r}</option>)}
            </select>

            <button onClick={addUser} className="btn-blue">Kullanıcı Ekle</button>
          </div>

          <Table headers={["Ad Soyad", "E-posta", "Rol", "Durum", "İşlem"]}>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="td">{u.full_name}</td>
                <td className="td">{u.email}</td>
                <td className="td">
                  <select value={u.role} onChange={(e) => updateUserRole(u.id, e.target.value)} className="input">
                    {ROLLER.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </td>
                <td className="td text-center">{u.active ? "Aktif" : "Pasif"}</td>
                <td className="td text-center">
                  <button
                    onClick={() => toggleUserActive(u.id, u.active)}
                    className={u.active ? "btn-red" : "btn-green"}
                  >
                    {u.active ? "Pasif Yap" : "Aktif Yap"}
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        </Panel>

        <Panel title="Kişi Listesi">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Kişi adı" className="input" />
            <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Birim" className="input" />

            <select value={personMailGroup} onChange={(e) => setPersonMailGroup(e.target.value)} className="input">
              {POSTA_GRUPLARI.map((g) => <option key={g}>{g}</option>)}
            </select>

            <button onClick={addPerson} className="btn-blue">Ekle</button>
          </div>

          <Table headers={["Kişi", "Birim", "Mail Grubu", "İşlem"]}>
            {people.map((p) => (
              <tr key={p.id}>
                <td className="td">{p.name}</td>
                <td className="td">{p.department}</td>
                <td className="td">{p.mailGroup}</td>
                <td className="td text-center">
                  <button onClick={() => savePeople(people.filter((x) => x.id !== p.id))} className="btn-red">Sil</button>
                </td>
              </tr>
            ))}
          </Table>
        </Panel>

        <Panel title="Mail Grupları">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <select value={groupName} onChange={(e) => setGroupName(e.target.value)} className="input">
              {POSTA_GRUPLARI.map((g) => <option key={g}>{g}</option>)}
            </select>

            <input value={toMail} onChange={(e) => setToMail(e.target.value)} placeholder="TO Mail" className="input" />
            <input value={ccMail} onChange={(e) => setCcMail(e.target.value)} placeholder="CC Mail" className="input" />
            <button onClick={addMailGroup} className="btn-blue">Ekle</button>
          </div>

          <Table headers={["Grup", "TO", "CC", "İşlem"]}>
            {mailGroups.map((g) => (
              <tr key={g.id}>
                <td className="td">{g.groupName}</td>
                <td className="td">{g.toMail}</td>
                <td className="td">{g.ccMail}</td>
                <td className="td text-center">
                  <button onClick={() => saveMailGroups(mailGroups.filter((x) => x.id !== g.id))} className="btn-red">Sil</button>
                </td>
              </tr>
            ))}
          </Table>
        </Panel>

        <Panel title="Resmi Tatiller">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <input type="date" value={holidayDate} onChange={(e) => setHolidayDate(e.target.value)} className="input" />
            <input value={holidayDesc} onChange={(e) => setHolidayDesc(e.target.value)} placeholder="Açıklama" className="input" />
            <button onClick={addHoliday} className="btn-blue">Ekle</button>
          </div>

          <Table headers={["Tarih", "Açıklama", "İşlem"]}>
            {holidays.map((h) => (
              <tr key={h.id}>
                <td className="td">{h.date}</td>
                <td className="td">{h.description}</td>
                <td className="td text-center">
                  <button onClick={() => saveHolidays(holidays.filter((x) => x.id !== h.id))} className="btn-red">Sil</button>
                </td>
              </tr>
            ))}
          </Table>
        </Panel>

        <Panel title="WhatsApp Grupları">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <select value={waGroupName} onChange={(e) => setWaGroupName(e.target.value)} className="input">
              {POSTA_GRUPLARI.map((g) => <option key={g}>{g}</option>)}
            </select>

            <input value={waLink} onChange={(e) => setWaLink(e.target.value)} placeholder="WhatsApp grup linki" className="input" />
            <button onClick={addWhatsAppGroup} className="btn-blue">Ekle</button>
          </div>

          <Table headers={["Grup", "Link", "İşlem"]}>
            {whatsappGroups.map((w) => (
              <tr key={w.id}>
                <td className="td">{w.groupName}</td>
                <td className="td">{w.link ? "Var" : "Yok"}</td>
                <td className="td text-center">
                  <button onClick={() => saveWhatsAppGroups(whatsappGroups.filter((x) => x.id !== w.id))} className="btn-red">Sil</button>
                </td>
              </tr>
            ))}
          </Table>
        </Panel>

        <Panel title="WhatsApp Kişileri / Telefon Numaraları">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <input value={waContactName} onChange={(e) => setWaContactName(e.target.value)} placeholder="İsim" className="input" />
            <input value={waContactPhone} onChange={(e) => setWaContactPhone(e.target.value)} placeholder="905321234567" className="input" />
            <button onClick={addWhatsAppContact} className="btn-blue">Ekle</button>
          </div>

          <Table headers={["İsim", "Telefon", "Durum", "İşlem"]}>
            {whatsappContacts.map((c) => (
              <tr key={c.id}>
                <td className="td">{c.name}</td>
                <td className="td">{c.phone}</td>
                <td className="td text-center">{c.active ? "Aktif" : "Pasif"}</td>
                <td className="td text-center">
                  <button onClick={() => saveWhatsAppContacts(whatsappContacts.filter((x) => x.id !== c.id))} className="btn-red">Sil</button>
                </td>
              </tr>
            ))}
          </Table>
        </Panel>
      </div>
      </section>
    </main>
  );
}

function Panel({ title, children, wide }: any) {
  return (
    <div className={`bg-white border border-slate-200 shadow-sm rounded-2xl p-6 text-slate-900 ${wide ? "xl:col-span-2" : ""}`}>
      <h2 className="text-xl font-bold mb-4 text-slate-900">{title}</h2>
      {children}
    </div>
  );
}

function Table({ headers, children }: any) {
  return (
    <table className="w-full border border-slate-300 text-sm text-slate-900">
      <thead className="bg-slate-800 text-white">
        <tr>
          {headers.map((h: string) => (
            <th key={h} className="border border-slate-300 p-2">
              {h}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>{children}</tbody>
    </table>
  );
}