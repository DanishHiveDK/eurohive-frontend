"use client";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";

const navItems = {
  freelancer: [
    { href: "/dashboard", label: "Dashboard", icon: "🏠" },
    { href: "/projects", label: "Find Projects", icon: "🔍" },
    { href: "/contracts", label: "Contracts", icon: "📋" },
    { href: "/messages", label: "Messages", icon: "💬" },
    { href: "/profile", label: "Profile", icon: "👤" },
    { href: "/settings", label: "Settings", icon: "⚙️" },
  ],
  client: [
    { href: "/dashboard", label: "Dashboard", icon: "🏠" },
    { href: "/projects", label: "My Projects", icon: "📁" },
    { href: "/projects/new", label: "Post Project", icon: "✏️" },
    { href: "/freelancers", label: "Find Talent", icon: "🔍" },
    { href: "/contracts", label: "Contracts", icon: "📋" },
    { href: "/messages", label: "Messages", icon: "💬" },
    { href: "/profile", label: "Profile", icon: "👤" },
    { href: "/settings", label: "Settings", icon: "⚙️" },
  ],
  admin: [
    { href: "/dashboard", label: "Dashboard", icon: "🏠" },
    { href: "/admin", label: "Admin Panel", icon: "🛡️" },
    { href: "/settings", label: "Settings", icon: "⚙️" },
  ],
};

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-honey border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  const role = (session.user?.role || "client") as keyof typeof navItems;
  const items = navItems[role] || navItems.client;

  return (
    <div className="min-h-screen bg-cream">
      {/* Top Nav */}
      <header className="bg-midnight text-white h-14 flex items-center px-6 justify-between sticky top-0 z-50">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-honey rounded-md flex items-center justify-center text-midnight font-serif font-bold text-sm">E</div>
          <span className="font-serif font-bold text-base">Eurohive</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/60">{session.user?.email}</span>
          <div className="w-8 h-8 rounded-full bg-midnight-light flex items-center justify-center text-xs font-semibold text-honey">
            {session.user?.name?.[0] || "?"}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r border-cream-200 min-h-[calc(100vh-3.5rem)] sticky top-14 py-4 hidden md:block">
          <nav className="space-y-0.5 px-3">
            {items.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-honey/10 text-honey font-semibold"
                      : "text-midnight-300 hover:bg-cream-50 hover:text-midnight"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 max-w-5xl">
          {children}
        </main>
      </div>
    </div>
  );
}
