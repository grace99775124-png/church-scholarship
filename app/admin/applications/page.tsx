"use client";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUS_MAP, SCHOOL_LEVELS, CURRENT_YEAR } from "@/lib/constants";

interface Application {
  id: number;
  studentName: string;
  school: string;
  schoolLevel: string;
  grade: string;
  semester: number;
  year: number;
  contact: string;
  status: string;
  createdAt: string;
  scholarship: { name: string };
}

export default function ApplicationsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const status = searchParams.get("status") || "all";
  const year = searchParams.get("year") || String(CURRENT_YEAR);
  const semester = searchParams.get("semester") || "all";
  const schoolLevel = searchParams.get("schoolLevel") || "all";

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (year) params.set("year", year);
    if (semester !== "all") params.set("semester", semester);
    if (schoolLevel !== "all") params.set("schoolLevel", schoolLevel);
    fetch(`/api/applications?${params}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((data) => { setApplications(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [status, year, semester, schoolLevel]);

  useEffect(() => { load(); }, [load]);

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "") params.delete(key);
    else params.set(key, value);
    router.push(`/admin/applications?${params}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">신청 목록</h1>
        <span className="text-gray-500 text-sm">총 {applications.length}건</span>
      </div>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3">
            <Select value={status} onValueChange={(v) => setFilter("status", v ?? "all")}>
              <SelectTrigger className="w-32"><SelectValue placeholder="상태" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                {Object.entries(STATUS_MAP).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={year} onValueChange={(v) => setFilter("year", v ?? "")}>
              <SelectTrigger className="w-28"><SelectValue placeholder="년도" /></SelectTrigger>
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

            <Select value={schoolLevel} onValueChange={(v) => setFilter("schoolLevel", v ?? "all")}>
              <SelectTrigger className="w-32"><SelectValue placeholder="학교 구분" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 학교</SelectItem>
                {SCHOOL_LEVELS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-gray-400">로딩 중...</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12 text-gray-400">신청 내역이 없습니다.</div>
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
                <th className="px-4 py-3 text-left font-medium text-gray-500">상태</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">신청일</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500"></th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => {
                const s = STATUS_MAP[app.status] || { label: app.status, color: "bg-gray-100 text-gray-800" };
                return (
                  <tr key={app.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400">{app.id}</td>
                    <td className="px-4 py-3 font-medium">{app.studentName}</td>
                    <td className="px-4 py-3 text-gray-600">{app.school} {app.grade}</td>
                    <td className="px-4 py-3 text-gray-600">{app.scholarship.name}</td>
                    <td className="px-4 py-3 text-gray-600">{app.year}년 {app.semester}학기</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(app.createdAt).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/applications/${app.id}`}>
                        <Button size="sm" variant="outline">상세</Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
