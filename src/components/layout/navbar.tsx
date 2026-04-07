"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui";
import {
  Search, Briefcase, MessageSquare, Bell, LayoutDashboard, Users
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/freelancers", label: "Find Talent", icon: Users },
  { href: "/projects", label: "Projects", icon: Briefcase },
  { href: "/messages", label: "Messages", icon: MessageSquare, badge: 2 },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-cream-200">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-honey to-honey-300 flex items-center justify-center shadow-sm">
              <span className="text-sm font-extrabold text-midnight font-serif">
                E
              </span>
            </div>
            <span className="text-lg font-bold tracking-tight text-midnight font-serif">
              Eurohive
            </span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors",
                    isActive
                      ? "bg-honey/10 text-midnight font-semibold"
                      : "text-midnight-300 hover:text-midnight hover:bg-cream-100"
                  )}
                >
                  <item.icon size={15} />
                  {item.label}
                  {item.badge && (
                    <span className="w-4 h-4 rounded-full bg-error text-white text-[9px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <button className="w-8 h-8 rounded-lg bg-cream-100 flex items-center justify-center text-midnight-300 hover:text-midnight transition-colors">
            <Search size={15} />
          </button>

          {/* Notifications */}
          <button className="relative w-8 h-8 rounded-lg bg-cream-100 flex items-center justify-center text-midnight-300 hover:text-midnight transition-colors">
            <Bell size={15} />
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-error text-white text-[8px] font-bold flex items-center justify-center border-2 border-white">
              3
            </span>
          </button>

          {/* Profile */}
          <Link href="/settings" className="flex items-center gap-2">
            <Avatar name="Marcus Hoffmann" size="sm" />
          </Link>
        </div>
      </div>
    </header>
  );
}
