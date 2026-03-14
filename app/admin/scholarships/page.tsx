"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Scholarship {
  id: number;
  name: string;
  description: string | null;
  amount: number;
  attachments: string;
  isActive: boolean;
}

const ATTACHMENT_OPTIONS = ["대학입학증명서", "재학증명서", "성적증명서", "추천서"];

export default function ScholarshipsPage() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Scholarship | null>(null);
  const [form, setForm] = useState({ name: "", description: "", amount: "", attachments: [] as string[] });
  const [saving, setSaving] = useState(false);

  function load() {
    fetch("/api/scholarships").then((r) => r.json()).then(setScholarships);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditTarget(null);
    setForm({ name: "", description: "", amount: "", attachments: [] });
    setOpen(true);
  }

  function openEdit(s: Scholarship) {
    setEditTarget(s);
    setForm({
      name: s.name,
      description: s.description || "",
      amount: String(s.amount),
      attachments: JSON.parse(s.attachments || "[]"),
    });
    setOpen(true);
  }

  function toggleAttachment(att: string) {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.includes(att)
        ? prev.attachments.filter((a) => a !== att)
        : [...prev.attachments, att],
    }));
  }

  async function handleSave() {
    setSaving(true);
    const url = editTarget ? `/api/scholarships/${editTarget.id}` : "/api/scholarships";
    const method = editTarget ? "PATCH" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    load();
    setOpen(false);
    setSaving(false);
  }

  async function toggleActive(s: Scholarship) {
    await fetch(`/api/scholarships/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !s.isActive }),
    });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">장학금 관리</h1>
        <Button onClick={openNew}>+ 장학금 추가</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {scholarships.map((s) => (
          <Card key={s.id} className={s.isActive ? "" : "opacity-60"}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{s.name}</CardTitle>
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {s.isActive ? "활성" : "비활성"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {s.description && <p className="text-gray-600">{s.description}</p>}
              <p className="font-medium">{s.amount > 0 ? `${s.amount.toLocaleString()}원` : "금액 미정"}</p>
              <p className="text-gray-500">
                필요 서류: {JSON.parse(s.attachments || "[]").join(", ") || "없음"}
              </p>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(s)}>수정</Button>
                <Button size="sm" variant="outline" onClick={() => toggleActive(s)}>
                  {s.isActive ? "비활성화" : "활성화"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? "장학금 수정" : "장학금 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>장학금 이름 *</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>설명</Label>
              <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>지급 금액 (원)</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} placeholder="300000" />
            </div>
            <div className="space-y-2">
              <Label>필요 서류</Label>
              <div className="flex flex-wrap gap-2">
                {ATTACHMENT_OPTIONS.map((att) => (
                  <button
                    key={att}
                    type="button"
                    onClick={() => toggleAttachment(att)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      form.attachments.includes(att)
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
                    }`}
                  >
                    {att}
                  </button>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving || !form.name}>
              {saving ? "저장 중..." : "저장"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
