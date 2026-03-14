import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const application = await prisma.application.findUnique({
    where: { id: parseInt(id) },
    include: { scholarship: true },
  });
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(application);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const data = await req.json();
  const { status, statusNote, paidAmount } = data;

  const updateData: Record<string, unknown> = {};
  if (status) {
    updateData.status = status;
    updateData.reviewedAt = new Date();
    updateData.reviewedBy = session.username;
  }
  if (statusNote !== undefined) updateData.statusNote = statusNote;
  if (paidAmount !== undefined) {
    updateData.paidAmount = paidAmount;
    updateData.paidAt = new Date();
  }

  const application = await prisma.application.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: { scholarship: true },
  });

  return NextResponse.json(application);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.application.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}
