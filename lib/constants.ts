export const SCHOOL_LEVELS = [
  { value: "초등학교", label: "초등학교" },
  { value: "중학교", label: "중학교" },
  { value: "고등학교", label: "고등학교" },
  { value: "대학교", label: "대학교" },
  { value: "대학원", label: "대학원" },
];

export const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "검토중", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "승인", color: "bg-blue-100 text-blue-800" },
  rejected: { label: "반려", color: "bg-red-100 text-red-800" },
  paid: { label: "지급완료", color: "bg-green-100 text-green-800" },
};

export const CURRENT_YEAR = new Date().getFullYear();
