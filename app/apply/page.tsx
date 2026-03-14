"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { SCHOOL_LEVELS, CURRENT_YEAR } from "@/lib/constants";

interface Scholarship {
  id: number;
  name: string;
  description: string | null;
  amount: number;
  attachments: string;
  isActive: boolean;
}

export default function ApplyPage() {
  const router = useRouter();
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    studentName: "",
    birthDate: "",
    school: "",
    schoolLevel: "",
    grade: "",
    semester: "",
    year: String(CURRENT_YEAR),
    contact: "",
    scholarshipId: "",
    reason: "",
    recommenderName: "",
    recommenderTitle: "",
    recommenderPhone: "",
    recommenderComment: "",
  });

  useEffect(() => {
    fetch("/api/scholarships")
      .then((r) => r.json())
      .then((data) => setScholarships(data.filter((s: Scholarship) => s.isActive)));
  }, []);

  const selected = scholarships.find((s) => String(s.id) === form.scholarshipId);
  const needsRecommender = selected
    ? JSON.parse(selected.attachments || "[]").includes("추천서")
    : false;

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/apply/${data.id}?success=1`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">장학금 신청서</h1>
          <p className="text-gray-500 mt-2">해운대순복음교회 장학위원회</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-4">
            <CardHeader><CardTitle>신청자 정보</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>성명 *</Label>
                  <Input value={form.studentName} onChange={(e) => set("studentName", e.target.value)} required placeholder="홍길동" />
                </div>
                <div className="space-y-2">
                  <Label>생년월일 *</Label>
                  <Input type="date" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>학교명 *</Label>
                  <Input value={form.school} onChange={(e) => set("school", e.target.value)} required placeholder="○○초등학교" />
                </div>
                <div className="space-y-2">
                  <Label>학교 구분 *</Label>
                  <Select value={form.schoolLevel} onValueChange={(v) => set("schoolLevel", v ?? "")} required>
                    <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent>
                      {SCHOOL_LEVELS.map((l) => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>학년 *</Label>
                  <Input value={form.grade} onChange={(e) => set("grade", e.target.value)} required placeholder="1학년" />
                </div>
                <div className="space-y-2">
                  <Label>학기 *</Label>
                  <Select value={form.semester} onValueChange={(v) => set("semester", v ?? "")} required>
                    <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1학기</SelectItem>
                      <SelectItem value="2">2학기</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>년도 *</Label>
                  <Select value={form.year} onValueChange={(v) => set("year", v ?? "")} required>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}년</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>연락처 *</Label>
                <Input value={form.contact} onChange={(e) => set("contact", e.target.value)} required placeholder="010-0000-0000" />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-4">
            <CardHeader><CardTitle>장학금 선택</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>장학금 종류 *</Label>
                <Select value={form.scholarshipId} onValueChange={(v) => set("scholarshipId", v ?? "")} required>
                  <SelectTrigger><SelectValue placeholder="장학금을 선택하세요" /></SelectTrigger>
                  <SelectContent>
                    {scholarships.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name} {s.amount > 0 ? `(${s.amount.toLocaleString()}원)` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selected && (
                <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                  <p className="font-medium">{selected.description}</p>
                  <p className="mt-1">필요 서류: {JSON.parse(selected.attachments || "[]").join(", ")}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label>신청 사유 *</Label>
                <Textarea
                  value={form.reason}
                  onChange={(e) => set("reason", e.target.value)}
                  required
                  rows={5}
                  placeholder="장학금 신청 사유를 상세히 작성해주세요."
                />
              </div>
            </CardContent>
          </Card>

          {needsRecommender && (
            <Card className="mb-4">
              <CardHeader><CardTitle>추천서</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>추천인 성명</Label>
                    <Input value={form.recommenderName} onChange={(e) => set("recommenderName", e.target.value)} placeholder="홍길동" />
                  </div>
                  <div className="space-y-2">
                    <Label>추천인 직책</Label>
                    <Input value={form.recommenderTitle} onChange={(e) => set("recommenderTitle", e.target.value)} placeholder="집사, 권사 등" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>추천인 연락처</Label>
                  <Input value={form.recommenderPhone} onChange={(e) => set("recommenderPhone", e.target.value)} placeholder="010-0000-0000" />
                </div>
                <div className="space-y-2">
                  <Label>추천 내용</Label>
                  <Textarea
                    value={form.recommenderComment}
                    onChange={(e) => set("recommenderComment", e.target.value)}
                    rows={4}
                    placeholder="추천 사유를 작성해주세요."
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>
          )}

          <Separator className="my-4" />
          <p className="text-sm text-gray-500 mb-4 text-center">
            위와 같이 장학위원회에 장학금을 신청합니다.
          </p>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "제출 중..." : "신청서 제출"}
          </Button>
        </form>

        <div className="text-center mt-4">
          <a href="/admin" className="text-sm text-gray-400 hover:text-gray-600">관리자 페이지</a>
        </div>
      </div>
    </div>
  );
}
