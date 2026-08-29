"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layout, Search, Building, Wallet, Briefcase, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import logoPng from "../../../assets/Logo-B&W.png";

/**
 * The contractor rail, for screens that live outside the dashboard's tab state.
 * The first three items route back into the dashboard tabs; Project Finance is
 * its own section.
 */
const NAV = [
  { id: "overview", label: "Dashboard Overview", short: "Overview", icon: Layout, href: "/contractor/dashboard?tab=overview" },
  { id: "browse", label: "Browse Open Projects", short: "Browse", icon: Search, href: "/contractor/dashboard?tab=browse" },
  { id: "active", label: "My Construction Works", short: "Active", icon: Building, href: "/contractor/dashboard?tab=active" },
  { id: "finance", label: "Project Finance", short: "Finance", icon: Wallet, href: "/contractor/finance" },
];

export default function ContractorSidebar({ active = "finance" }: { active?: string }) {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <>
      <aside className="hidden lg:flex w-64 bg-gradient-to-b from-primary via-primary to-primary text-white flex-col justify-between p-5 fixed top-0 bottom-0 left-0">
        <div className="space-y-8">
          <Link href="/" className="block">
            <img
              src={logoPng.src}
              alt="ConstroBID"
              className="mx-auto w-[210px] max-w-full object-contain"
            />
          </Link>

          <nav className="space-y-2">
            {NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => router.push(item.href)}
                className={`relative w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-semibold whitespace-nowrap overflow-hidden transition-all duration-300 ${
                  item.id === active
                    ? "bg-[#8E3A5A] text-white shadow-xl before:absolute before:left-0 before:top-3 before:bottom-3 before:w-1 before:rounded-r-full before:bg-[#F4C542]"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="space-y-4 pt-6 border-t border-white/10">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-secondary border border-primary">
              <Briefcase size={16} />
            </div>
            <div className="truncate">
              <span className="text-xs font-bold block truncate">
                {user?.profile?.profile?.companyName || "Contractor"}
              </span>
              <span className="text-[10px] text-gray-400 block truncate">{user?.email}</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full py-2.5 bg-white/10 text-xs font-bold rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={14} />
            Logout Account
          </button>
        </div>
      </aside>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-primary text-white border-t border-white flex justify-around py-3.5 z-40 shadow-2xl">
        {NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => router.push(item.href)}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
              item.id === active ? "text-secondary" : "text-white"
            }`}
          >
            <item.icon size={18} />
            {item.short}
          </button>
        ))}

        <button
          onClick={logout}
          className="flex flex-col items-center gap-1 text-[10px] font-bold text-white"
        >
          <LogOut size={18} />
          Logout
        </button>
      </nav>
    </>
  );
}
