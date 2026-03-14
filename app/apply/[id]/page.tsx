"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STATUS_MAP } from "@/lib/constants";
import Link from "next/link";

interface Application {
  id: number;
  studentName: string;
  birthDate: string;
  school: string;
  schoolLevel: string;
  grade: string;
  semester: number;
  year: number;
  contact: string;
  reason: string;
  recommenderName: string | null;
  recommenderTitle: string | null;
  recommenderComment: string | null;
  status: string;
  statusNote: string | null;
  paidAmount: number | null;
  paidAt: string | null;
  createdAt: string;
  scholarship: { name: string; amount: number };
}

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "1";
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/applications/${id}`)
      .then((r) => r.json())
      .then((data) => { setApp(data); setLoading(false); });
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
  if (!app) return <div className="min-h-screen flex items-center justify-center">신청서를 찾을 수 없습니다.</div>;

  const statusInfo = STATUS_MAP[app.status] || { label: app.status, color: "bg-gray-100 text-gray-800" };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {isSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-green-800 text-center">
            <p className="font-semibold text-lg">신청서가 성공적으로 제출되었습니다!</p>
            <p className="text-sm mt-1">신청 번호: #{app.id}  |  이 페이지를 저장해두세요.</p>
          </div>
        )}

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">장학금 신청 현황</h1>
          <p className="text-gray-500 mt-1">신청 번호 #{app.id}</p>
        </div>

        <Card className="mb-4">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>처리 상태</CardTitle>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
          </CardHeader>
          {app.statusNote && (
            <CardContent>
              <p className="text-sm text-gray-600">메모: {app.statusNote}</p>
            </CardContent>
          )}
          {app.status === "paid" && app.paidAmount && (
            <CardContent>
              <p className="text-sm font-medium text-green-700">
                지급 금액: {app.paidAmount.toLocaleString()}원
                {app.paidAt && ` (${new Date(app.paidAt).toLocaleDateString("ko-KR")})`}
              </p>
            </CardContent>
          )}
        </Card>

        <Card className="mb-4">
          <CardHeader><CardTitle>신청자 정보</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-gray-500">성명</dt><dd className="font-medium">{app.studentName}</dd></div>
              <div><dt className="text-gray-500">생년월일</dt><dd className="font-medium">{app.birthDate}</dd></div>
              <div><dt className="text-gray-500">학교</dt><dd className="font-medium">{app.school} ({app.schoolLevel})</dd></div>
              <div><dt className="text-gray-500">학년/학기</dt><dd className="font-medium">{app.grade} / {app.year}년 {app.semester}학기</dd></div>
              <div><dt className="text-gray-500">연락처</dt><dd className="font-medium">{app.contact}</dd></div>
              <div><dt className="text-gray-500">장학금</dt><dd className="font-medium">{app.scholarship.name}</dd></div>
            </dl>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader><CardTitle>신청 사유</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{app.reason}</p>
          </CardContent>
        </Card>

        {app.recommenderName && (
          <Card className="mb-4">
            <CardHeader><CardTitle>추천서</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div><dt className="text-gray-500">추천인</dt><dd className="font-medium">{app.recommenderName}</dd></div>
                <div><dt className="text-gray-500">직책</dt><dd className="font-medium">{app.recommenderTitle}</dd></div>
              </dl>
              {app.recommenderComment && (
                <p className="text-sm whitespace-pre-wrap border-t pt-3">{app.recommenderComment}</p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="text-center mt-6 space-x-3">
          <Link href="/apply">
            <Button variant="outline">새 신청서 작성</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
