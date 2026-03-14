import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const data = await req.json();
  const { name, description, amount, attachments, isActive } = data;

  const scholarship = await prisma.scholarship.update({
    where: { id: parseInt(id) },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(amount !== undefined && { amount: parseInt(amount) }),
      ...(attachments !== undefined && { attachments: JSON.stringify(attachments) }),
      ...(isActive !== undefined && { isActive }),
    },
  });
  return NextResponse.json(scholarship);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.scholarship.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}
