import {
  Utensils,
  Bus,
  GraduationCap,
  Home,
  ShoppingBag,
  Film,
  Repeat,
  HeartPulse,
  User,
  MoreHorizontal,
  Wallet,
  Briefcase,
  Award,
  ArrowLeftRight,
} from "lucide-react";

export const EXPENSE_CATEGORIES = [
  { key: "food", label: "Food", icon: Utensils },
  { key: "transport", label: "Transport", icon: Bus },
  { key: "university", label: "University", icon: GraduationCap },
  { key: "hostel", label: "Hostel/Rent", icon: Home },
  { key: "shopping", label: "Shopping", icon: ShoppingBag },
  { key: "entertainment", label: "Entertainment", icon: Film },
  { key: "subscriptions", label: "Subscriptions", icon: Repeat },
  { key: "health", label: "Health", icon: HeartPulse },
  { key: "personal", label: "Personal", icon: User },
  { key: "other_expense", label: "Other", icon: MoreHorizontal },
];

export const INCOME_CATEGORIES = [
  { key: "allowance", label: "Allowance", icon: Wallet },
  { key: "salary", label: "Salary", icon: Briefcase },
  { key: "scholarship", label: "Scholarship", icon: Award },
  { key: "transfer", label: "Transfer", icon: ArrowLeftRight },
  { key: "other_income", label: "Other", icon: MoreHorizontal },
];

export function categoryLabel(key, type) {
  const list = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return list.find((c) => c.key === key)?.label || key;
}
