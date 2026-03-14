"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENT_YEAR } from "@/lib/constants";

interface Application {
  id: number;
  studentName: string;
  school: string;
  schoolLevel: string;
  grade: string;
  semester: number;
  year: number;
  status: string;
  paidAmount: number | null;
  paidAt: string | null;
  createdAt: string;
  scholarship: { name: string; amount: number };
}

export default function PaymentsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const year = searchParams.get("year") || String(CURRENT_YEAR);
  const semester = searchParams.get("semester") || "all";

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (year) params.set("year", year);
    if (semester !== "all") params.set("semester", semester);
    fetch(`/api/applications?${params}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((data) => {
        setApplications(data.filter((a: Application) => ["approved", "paid"].includes(a.status)));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [year, semester]);

  useEffect(() => { load(); }, [load]);

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete(key);
    else params.set(key, value);
    router.push(`/admin/payments?${params}`);
  }

  const totalApproved = applications.filter((a) => a.status === "approved").length;
  const totalPaid = applications.filter((a) => a.status === "paid").length;
  const totalAmount = applications
    .filter((a) => a.status === "paid")
    .reduce((sum, a) => sum + (a.paidAmount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">지급 관리</h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-sm text-gray-500 mb-1">승인 대기</p>
            <p className="text-2xl font-bold text-blue-600">{totalApproved}건</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-sm text-gray-500 mb-1">지급 완료</p>
            <p className="text-2xl font-bold text-green-600">{totalPaid}건</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-sm text-gray-500 mb-1">총 지급액</p>
            <p className="text-2xl font-bold text-green-700">{totalAmount.toLocaleString()}원</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3">
            <Select value={year} onValueChange={(v) => setFilter("year", v ?? "")}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}년</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={semester} onValueChange={(v) => setFilter("semester", v ?? "all")}>
              <SelectTrigger className="w-28"><SelectValue placeholder="학기" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 학기</SelectItem>
                <SelectItem value="1">1학기</SelectItem>
                <SelectItem value="2">2학기</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-gray-400">로딩 중...</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12 text-gray-400">승인 또는 지급완료 신청이 없습니다.</div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">#</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">신청자</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">학교/학년</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">장학금</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">학기</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">지급금액</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">지급일</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">상태</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500"></th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{app.id}</td>
                  <td className="px-4 py-3 font-medium">{app.studentName}</td>
                  <td className="px-4 py-3 text-gray-600">{app.school} {app.grade}</td>
                  <td className="px-4 py-3 text-gray-600">{app.scholarship.name}</td>
                  <td className="px-4 py-3 text-gray-600">{app.year}년 {app.semester}학기</td>
                  <td className="px-4 py-3 font-medium">
                    {app.status === "paid" && app.paidAmount
                      ? `${app.paidAmount.toLocaleString()}원`
                      : `${app.scholarship.amount.toLocaleString()}원 예정`}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {app.paidAt ? new Date(app.paidAt).toLocaleDateString("ko-KR") : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      app.status === "paid"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {app.status === "paid" ? "지급완료" : "승인"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/applications/${app.id}`}>
                      <Button size="sm" variant="outline">처리</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
