"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AdminNav({ username }: { username: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: "/admin", label: "대시보드" },
    { href: "/admin/applications", label: "신청 목록" },
    { href: "/admin/scholarships", label: "장학금 관리" },
    { href: "/admin/payments", label: "지급 관리" },
  ];

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <header className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-gray-900">장학금 관리</span>
          <nav className="flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  pathname === l.href
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{username}</span>
          <Button variant="outline" size="sm" onClick={logout}>로그아웃</Button>
        </div>
      </div>
    </header>
  );
}
