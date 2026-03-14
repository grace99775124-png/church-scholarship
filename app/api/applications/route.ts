import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { seedIfEmpty } from "@/lib/seed";
import { getSession } from "@/lib/auth";

// GET: 신청 목록 (관리자)
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await seedIfEmpty();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const year = searchParams.get("year");
  const semester = searchParams.get("semester");
  const schoolLevel = searchParams.get("schoolLevel");

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (year) where.year = parseInt(year);
  if (semester) where.semester = parseInt(semester);
  if (schoolLevel && schoolLevel !== "all") where.schoolLevel = schoolLevel;

  const applications = await prisma.application.findMany({
    where,
    include: { scholarship: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(applications);
}

// POST: 신청서 제출 (공개)
export async function POST(req: NextRequest) {
  await seedIfEmpty();
  const data = await req.json();

  const {
    studentName, birthDate, school, schoolLevel, grade,
    semester, year, contact, scholarshipId,
    reason, recommenderName, recommenderTitle,
    recommenderPhone, recommenderComment,
  } = data;

  if (!studentName || !birthDate || !school || !schoolLevel || !grade ||
      !semester || !year || !contact || !scholarshipId || !reason) {
    return NextResponse.json({ error: "필수 항목을 입력해주세요." }, { status: 400 });
  }

  const application = await prisma.application.create({
    data: {
      studentName, birthDate, school, schoolLevel, grade,
      semester: parseInt(semester),
      year: parseInt(year),
      contact,
      scholarshipId: parseInt(scholarshipId),
      reason,
      recommenderName: recommenderName || null,
      recommenderTitle: recommenderTitle || null,
      recommenderPhone: recommenderPhone || null,
      recommenderComment: recommenderComment || null,
    },
    include: { scholarship: true },
  });

  return NextResponse.json(application, { status: 201 });
}
