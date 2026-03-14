"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  recommenderPhone: string | null;
  recommenderComment: string | null;
  status: string;
  statusNote: string | null;
  paidAmount: number | null;
  paidAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  scholarship: { name: string; amount: number; description: string | null };
}

export default function ApplicationDetailAdmin() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [app, setApp] = useState<Application | null>(null);
  const [status, setStatus] = useState<string>("");
  const [statusNote, setStatusNote] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/api/applications/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setApp(data);
        setStatus(data.status);
        setStatusNote(data.statusNote || "");
        setPaidAmount(data.paidAmount ? String(data.paidAmount) : String(data.scholarship.amount || ""));
      });
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setMessage("");
    const body: Record<string, unknown> = { status, statusNote };
    if (status === "paid" && paidAmount) body.paidAmount = parseInt(paidAmount);
    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated = await res.json();
      setApp(updated);
      setMessage("저장되었습니다.");
    } else {
      setMessage("저장 실패");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await fetch(`/api/applications/${id}`, { method: "DELETE" });
    router.push("/admin/applications");
  }

  if (!app) return <div className="text-center py-20 text-gray-400">로딩 중...</div>;

  const s = STATUS_MAP[app.status] || { label: app.status, color: "bg-gray-100 text-gray-800" };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/applications">
          <Button variant="outline" size="sm">← 목록</Button>
        </Link>
        <h1 className="text-2xl font-bold">신청서 #{app.id}</h1>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${s.color}`}>{s.label}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>신청자 정보</CardTitle></CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">성명</dt><dd className="font-medium">{app.studentName}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">생년월일</dt><dd>{app.birthDate}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">학교</dt><dd>{app.school} ({app.schoolLevel})</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">학년</dt><dd>{app.grade}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">학기</dt><dd>{app.year}년 {app.semester}학기</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">연락처</dt><dd>{app.contact}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">장학금</dt><dd>{app.scholarship.name}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">신청일</dt><dd>{new Date(app.createdAt).toLocaleDateString("ko-KR")}</dd></div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>처리 관리</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>상태 변경</Label>
              <Select value={status} onValueChange={(v) => setStatus(v ?? "")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_MAP).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {status === "paid" && (
              <div className="space-y-1.5">
                <Label>지급 금액 (원)</Label>
                <Input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="300000"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>메모</Label>
              <Textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                rows={2}
                placeholder="처리 메모 (선택)"
              />
            </div>
            {message && <p className={`text-sm ${message.includes("실패") ? "text-red-600" : "text-green-600"}`}>{message}</p>}
            <Button onClick={handleSave} className="w-full" disabled={saving}>
              {saving ? "저장 중..." : "저장"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>신청 사유</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{app.reason}</p>
        </CardContent>
      </Card>

      {app.recommenderName && (
        <Card>
          <CardHeader><CardTitle>추천서</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div><dt className="text-gray-500">추천인</dt><dd className="font-medium">{app.recommenderName}</dd></div>
              <div><dt className="text-gray-500">직책</dt><dd className="font-medium">{app.recommenderTitle}</dd></div>
              {app.recommenderPhone && (
                <div><dt className="text-gray-500">연락처</dt><dd>{app.recommenderPhone}</dd></div>
              )}
            </dl>
            {app.recommenderComment && (
              <p className="text-sm whitespace-pre-wrap border-t pt-3">{app.recommenderComment}</p>
            )}
          </CardContent>
        </Card>
      )}

      {app.reviewedBy && (
        <p className="text-xs text-gray-400">
          처리: {app.reviewedBy} · {app.reviewedAt && new Date(app.reviewedAt).toLocaleString("ko-KR")}
        </p>
      )}

      <div className="pt-2">
        <Button variant="destructive" size="sm" onClick={handleDelete}>신청서 삭제</Button>
      </div>
    </div>
  );
}
