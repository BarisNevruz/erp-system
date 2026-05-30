"use client";
import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type MailContact = {
  id: string;
  name: string;
  email: string;
  active: boolean;
};

export default function MailSettingsPage() {
  const [contacts, setContacts] = useState<MailContact[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    getContacts();
  }, []);

  async function getContacts() {
    const { data, error } = await supabase
      .from("mail_contacts")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      alert("Mail listesi alınamadı: " + error.message);
      return;
    }

    setContacts(data || []);
  }

  async function addContact() {
    if (!name.trim() || !email.trim()) {
      alert("Ad ve mail adresi zorunludur.");
      return;
    }

    const { error } = await supabase.from("mail_contacts").insert({
      name: name.trim(),
      email: email.trim(),
      active: true,
    });

    if (error) {
      alert("Kayıt hatası: " + error.message);
      return;
    }

    setName("");
    setEmail("");
    getContacts();
  }

  async function toggleActive(contact: MailContact) {
    const { error } = await supabase
      .from("mail_contacts")
      .update({ active: !contact.active })
      .eq("id", contact.id);

    if (error) {
      alert("Güncelleme hatası: " + error.message);
      return;
    }

    getContacts();
  }

  async function deleteContact(id: string) {
    if (!confirm("Bu mail kaydını silmek istiyor musunuz?")) return;

    const { error } = await supabase
      .from("mail_contacts")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Silme hatası: " + error.message);
      return;
    }

    getContacts();
  }

 return (
  <main className="min-h-screen bg-slate-100 flex">
    <Sidebar
      fullName="Barış Nevruz"
      role="Yönetici"
    />

    <section className="flex-1 p-8 overflow-x-hidden">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-3xl font-bold text-white">
          Mail Ayarları
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Kişi adı"
            className="border rounded-xl px-4 py-3"
          />

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Mail adresi"
            className="border rounded-xl px-4 py-3"
          />

          <button
            onClick={addContact}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
          >
            Mail Ekle
          </button>
        </div>

        <table className="w-full mt-8 border-collapse text-sm">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="p-3 text-left">Ad</th>
              <th className="p-3 text-left">Mail</th>
              <th className="p-3 text-center">Durum</th>
              <th className="p-3 text-center">İşlem</th>
            </tr>
          </thead>

          <tbody>
            {contacts.map((c) => (
              <tr key={c.id} className="border-b">
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.email}</td>
                <td className="p-3 text-center">
                  {c.active ? "Aktif" : "Pasif"}
                </td>
                <td className="p-3 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => toggleActive(c)}
                      className="bg-yellow-500 px-3 py-1 rounded-lg"
                    >
                      Aktif/Pasif
                    </button>

                    <button
                      onClick={() => deleteContact(c.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded-lg"
                    >
                      Sil
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {contacts.length === 0 && (
              <tr>
                <td colSpan={4} className="p-5 text-center text-slate-300">
                  Kayıtlı mail adresi yok.
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