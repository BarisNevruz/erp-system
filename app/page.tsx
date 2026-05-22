import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  FileText,
  MessageCircle,
  Settings,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 flex">
      <aside className="w-72 bg-slate-900 text-white min-h-screen p-5">
        <h1 className="text-2xl font-bold">Barış Nevruz</h1>
        <p className="text-slate-300 text-sm mt-1">Yönetim Paneli</p>

        <nav className="mt-8 space-y-2">
          <MenuLink href="/dashboard" icon={<BarChart3 size={20} />} text="Dashboard" />
          <MenuLink href="/meeting" icon={<CalendarDays size={20} />} text="Toplantı Karar Girişi" />
          <MenuLink href="/decision-records" icon={<ClipboardList size={20} />} text="Karar Listesi" />
          <MenuLink href="/daily" icon={<FileText size={20} />} text="Günlük Faaliyet Girişi" />
          <MenuLink href="/activity-records" icon={<MessageCircle size={20} />} text="Faaliyet Kayıtları / WhatsApp" />
          <MenuLink href="/settings" icon={<Settings size={20} />} text="Ayarlar" />
        </nav>
      </aside>

      <section className="flex-1 p-8">
        <div className="bg-white rounded-2xl shadow p-8">
          <h2 className="text-4xl font-bold text-slate-800">
            Barış Nevruz Yönetim Paneli
          </h2>

          <p className="text-slate-500 mt-2 text-lg">
            Toplantı kararları, görev takibi, günlük faaliyet ve WhatsApp rapor sistemi
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
            <HomeCard title="Dashboard" desc="Canlı KPI ve yönetim özeti" href="/dashboard" />
            <HomeCard title="Toplantı Karar Girişi" desc="Yeni karar kaydı oluştur" href="/meeting" />
            <HomeCard title="Karar Listesi" desc="Tüm kararları görüntüle" href="/decision-records" />
            <HomeCard title="Günlük Faaliyet Girişi" desc="Günlük faaliyetleri kaydet" href="/daily" />
            <HomeCard title="Faaliyet Kayıtları" desc="Tarihe göre WhatsApp raporu gönder" href="/activity-records" />
            <HomeCard title="Ayarlar" desc="Kişi, mail, grup ve sistem ayarları" href="/settings" />
          </div>
        </div>
      </section>
    </main>
  );
}

function MenuLink({
  href,
  icon,
  text,
}: {
  href: string;
  icon: ReactNode;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition"
    >
      {icon}
      <span>{text}</span>
    </Link>
  );
}

function HomeCard({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-slate-50 border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition"
    >
      <h3 className="text-xl font-bold text-slate-800">{title}</h3>
      <p className="text-slate-500 mt-2">{desc}</p>
    </Link>
  );
}