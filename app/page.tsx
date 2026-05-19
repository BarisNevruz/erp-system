import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  FileText,
  MessageCircle,
  Settings,
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 flex">
      <aside className="w-72 bg-slate-900 text-white min-h-screen p-5">
        <h1 className="text-2xl font-bold">Barış Nevruz</h1>
        <p className="text-slate-300 text-sm mt-1">Yönetim Paneli</p>

        <nav className="mt-8 space-y-2">
          <MenuLink href="/dashboard" icon={<BarChart3 size={20} />} text="Dashboard" />
          <MenuLink href="/meeting" icon={<CalendarDays size={20} />} text="Toplantı Karar Girişi" />
          <MenuLink href="/decisions" icon={<ClipboardList size={20} />} text="Karar Listesi" />
          <MenuLink href="#" icon={<FileText size={20} />} text="Günlük Faaliyet" />
          <MenuLink href="#" icon={<MessageCircle size={20} />} text="WhatsApp / Mail" />
          <MenuLink href="#" icon={<Settings size={20} />} text="Ayarlar" />
        </nav>
      </aside>

      <section className="flex-1 p-8">
        <div className="bg-white rounded-2xl shadow p-8">
          <h2 className="text-4xl font-bold text-slate-800">
            Barış Nevruz Yönetim Paneli
          </h2>

          <p className="text-slate-500 mt-2 text-lg">
            Toplantı kararları, görev takibi ve yönetim dashboard sistemi
          </p>

          <div className="grid grid-cols-3 gap-5 mt-8">
            <HomeCard title="Dashboard" desc="Canlı KPI ve yönetim özeti" href="/dashboard" />
            <HomeCard title="Toplantı Karar Girişi" desc="Yeni karar kaydı oluştur" href="/meeting" />
            <HomeCard title="Karar Listesi" desc="Tüm kayıtları görüntüle" href="/decisions" />
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
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800"
    >
      {icon}
      <span>{text}</span>
    </a>
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
    <a
      href={href}
      className="bg-slate-50 border border-slate-200 rounded-2xl p-6 hover:shadow-lg"
    >
      <h3 className="text-xl font-bold text-slate-800">{title}</h3>
      <p className="text-slate-500 mt-2">{desc}</p>
    </a>
  );
}