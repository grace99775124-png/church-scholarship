import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [total, pending, approved, rejected, paid] = await Promise.all([
      prisma.application.count(),
      prisma.application.count({ where: { status: "pending" } }),
      prisma.application.count({ where: { status: "approved" } }),
      prisma.application.count({ where: { status: "rejected" } }),
      prisma.application.count({ where: { status: "paid" } }),
    ]);

    const paidApps = await prisma.application.findMany({
      where: { status: "paid", paidAmount: { not: null } },
      select: { paidAmount: true },
    });
    const totalPaid = paidApps.reduce((sum, a) => sum + (a.paidAmount || 0), 0);

    const byLevel = await prisma.application.groupBy({
      by: ["schoolLevel"],
      _count: { id: true },
    });

    const byScholarship = await prisma.application.groupBy({
      by: ["scholarshipId"],
      _count: { id: true },
    });

    const scholarships = await prisma.scholarship.findMany();
    const scholarshipMap = Object.fromEntries(scholarships.map((s) => [s.id, s.name]));

    return NextResponse.json({
      total, pending, approved, rejected, paid, totalPaid,
      byLevel: byLevel.map((b) => ({ level: b.schoolLevel, count: b._count.id })),
      byScholarship: byScholarship.map((b) => ({
        name: scholarshipMap[b.scholarshipId] || "알 수 없음",
        count: b._count.id,
      })),
    });
  } catch (err) {
    console.error("[/api/stats] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
