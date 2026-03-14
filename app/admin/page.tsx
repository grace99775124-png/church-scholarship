"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  paid: number;
  totalPaid: number;
  byLevel: { level: string; count: number }[];
  byScholarship: { name: string; count: number }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json();
      })
      .then(setStats)
      .catch(() => {});
  }, []);

  if (!stats) return <div className="text-center py-20 text-gray-400">로딩 중...</div>;

  const summaryCards = [
    { label: "전체 신청", value: stats.total, color: "text-gray-900", href: "/admin/applications" },
    { label: "검토중", value: stats.pending, color: "text-yellow-600", href: "/admin/applications?status=pending" },
    { label: "승인", value: stats.approved, color: "text-blue-600", href: "/admin/applications?status=approved" },
    { label: "지급완료", value: stats.paid, color: "text-green-600", href: "/admin/payments" },
    { label: "반려", value: stats.rejected, color: "text-red-600", href: "/admin/applications?status=rejected" },
    { label: "총 지급액", value: `${stats.totalPaid.toLocaleString()}원`, color: "text-green-700", href: "/admin/payments" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">대시보드</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryCards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-sm text-gray-500 mb-1">{c.label}</p>
                <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>학교 구분별 신청 현황</CardTitle></CardHeader>
          <CardContent>
            {stats.byLevel.length === 0 ? (
              <p className="text-gray-400 text-sm">데이터 없음</p>
            ) : (
              <div className="space-y-2">
                {stats.byLevel.map((b) => (
                  <div key={b.level} className="flex justify-between items-center">
                    <span className="text-sm">{b.level}</span>
                    <span className="font-medium">{b.count}건</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>장학금 종류별 신청 현황</CardTitle></CardHeader>
          <CardContent>
            {stats.byScholarship.length === 0 ? (
              <p className="text-gray-400 text-sm">데이터 없음</p>
            ) : (
              <div className="space-y-2">
                {stats.byScholarship.map((b) => (
                  <div key={b.name} className="flex justify-between items-center">
                    <span className="text-sm">{b.name}</span>
                    <span className="font-medium">{b.count}건</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Link href="/apply" target="_blank">
          <Card className="hover:shadow-md transition-shadow cursor-pointer px-4 py-3">
            <p className="text-sm font-medium">신청서 작성 페이지 열기 →</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
