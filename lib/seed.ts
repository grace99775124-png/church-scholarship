import { prisma } from "./db";

export async function seedIfEmpty() {
  const count = await prisma.scholarship.count();
  if (count > 0) return;

  await prisma.scholarship.createMany({
    data: [
      {
        name: "바나바 장학금",
        description: "성적 우수 장학금",
        amount: 300000,
        attachments: JSON.stringify(["성적증명서"]),
        isActive: true,
      },
      {
        name: "여호수아 장학금",
        description: "대학 입학 축하 장학금",
        amount: 500000,
        attachments: JSON.stringify(["대학입학증명서", "추천서"]),
        isActive: true,
      },
      {
        name: "빌립 장학금",
        description: "생활 지원 장학금",
        amount: 200000,
        attachments: JSON.stringify(["추천서"]),
        isActive: true,
      },
      {
        name: "특별 장학금",
        description: "특별 사정 지원 장학금",
        amount: 400000,
        attachments: JSON.stringify(["추천서"]),
        isActive: true,
      },
    ],
  });
}
