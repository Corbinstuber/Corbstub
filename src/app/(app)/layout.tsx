import Link from "next/link";
import { Wind, FolderOpen, Settings, LayoutDashboard } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-56 bg-slate-900 text-slate-100 flex flex-col shrink-0">
        <div className="px-4 py-5 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Wind className="h-6 w-6 text-blue-400" />
            <span className="font-bold text-lg tracking-tight">CorbStub</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">AHU Design Tool</p>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          <NavItem href="/projects" icon={<FolderOpen className="h-4 w-4" />} label="Projects" />
          <NavItem href="/admin/sections" icon={<Settings className="h-4 w-4" />} label="Admin" />
        </nav>

        <div className="px-4 py-3 border-t border-slate-700 text-xs text-slate-500">
          v0.1.0 — Sprint 1
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-slate-50">{children}</main>
    </div>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}
