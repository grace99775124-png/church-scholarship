import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { seedIfEmpty } from "@/lib/seed";
import { getSession } from "@/lib/auth";

export async function GET() {
  await seedIfEmpty();
  const scholarships = await prisma.scholarship.findMany({
    orderBy: { id: "asc" },
  });
  return NextResponse.json(scholarships);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  const { name, description, amount, attachments } = data;

  if (!name) return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });

  const scholarship = await prisma.scholarship.create({
    data: {
      name,
      description: description || null,
      amount: parseInt(amount) || 0,
      attachments: JSON.stringify(attachments || []),
    },
  });
  return NextResponse.json(scholarship, { status: 201 });
}
