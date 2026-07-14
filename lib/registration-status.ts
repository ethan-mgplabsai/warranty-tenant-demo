import { differenceInCalendarDays, format, parseISO } from "date-fns";

import type { CustomerRegistration } from "@/app/api/demo/registrations/route";

const NEARING_EXPIRATION_THRESHOLD_DAYS = 45;

export type StatusPresentation = {
  badgeLabel: string;
  badgeVariant: "success" | "warning" | "muted" | "info";
  barColorClass: string;
  footerText: string;
  footerColorClass: string;
  coveragePercent: number;
  clickable: boolean;
  faded: boolean;
};

export function formatDate(iso: string): string {
  return format(parseISO(iso), "MMM d, yyyy");
}

export function getStatusPresentation(registration: CustomerRegistration): StatusPresentation {
  const { status, coverageStarts, coverageEnds, createdAt } = registration;
  const today = new Date();

  if (status === "active") {
    if (!coverageEnds) {
      return {
        badgeLabel: "Active",
        badgeVariant: "success",
        barColorClass: "bg-(--pc-success-text)",
        footerText: `Registered ${formatDate(createdAt)}`,
        footerColorClass: "text-muted-foreground",
        coveragePercent: 10,
        clickable: true,
        faded: false,
      };
    }

    const start = parseISO(coverageStarts);
    const end = parseISO(coverageEnds);
    const totalDays = Math.max(1, differenceInCalendarDays(end, start));
    const elapsedDays = differenceInCalendarDays(today, start);
    const percent = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));
    const daysRemaining = differenceInCalendarDays(end, today);
    const nearingExpiration = daysRemaining >= 0 && daysRemaining <= NEARING_EXPIRATION_THRESHOLD_DAYS;

    return {
      badgeLabel: "Active",
      badgeVariant: "success",
      barColorClass: nearingExpiration ? "bg-(--pc-warning-text)" : "bg-(--pc-success-text)",
      footerText: nearingExpiration
        ? `Expires in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`
        : `Registered ${formatDate(createdAt)}`,
      footerColorClass: nearingExpiration ? "text-(--pc-warning-text)" : "text-muted-foreground",
      coveragePercent: percent,
      clickable: true,
      faded: false,
    };
  }

  if (status === "replaced") {
    return {
      badgeLabel: "Replaced",
      badgeVariant: "info",
      barColorClass: "bg-muted-foreground/40",
      footerText: registration.parentId
        ? `Replaced via claim ${registration.parentId}`
        : "Replaced via claim",
      footerColorClass: "text-(--pc-info-text)",
      coveragePercent: 100,
      clickable: false,
      faded: true,
    };
  }

  // expired, voided, rejected all read the same way for display purposes
  const label = status === "expired" ? "Expired" : status === "voided" ? "Voided" : "Rejected";
  return {
    badgeLabel: label,
    badgeVariant: "muted",
    barColorClass: "bg-muted-foreground/40",
    footerText: coverageEnds ? `Expired ${formatDate(coverageEnds)}` : "No longer active",
    footerColorClass: "text-muted-foreground",
    coveragePercent: 100,
    clickable: false,
    faded: true,
  };
}
