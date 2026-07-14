import type { CustomerOrderLineItem } from "@/app/api/demo/orders/route";
import { formatDate } from "@/lib/registration-status";

export type CoveragePresentation = {
  badgeLabel: string;
  badgeVariant: "success" | "warning" | "muted" | "info" | "destructive";
  detailText: string;
  detailColorClass: string;
  clickable: boolean;
};

export function getCoveragePresentation(lineItem: CustomerOrderLineItem): CoveragePresentation {
  const { coverageStatus, coverageMonths, coverageEnds } = lineItem;

  if (coverageStatus === "included") {
    return {
      badgeLabel: "Covered",
      badgeVariant: "success",
      detailText: coverageMonths ? `Covered · ${coverageMonths} months` : "Covered",
      detailColorClass: "text-(--pc-success-text)",
      clickable: true,
    };
  }

  if (coverageStatus === "registered") {
    return {
      badgeLabel: "Registered",
      badgeVariant: "info",
      detailText: "Already registered",
      detailColorClass: "text-(--pc-info-text)",
      clickable: false,
    };
  }

  if (coverageStatus === "expired") {
    return {
      badgeLabel: "Expired",
      badgeVariant: "warning",
      detailText: coverageEnds
        ? `Coverage expired${coverageMonths ? ` · Was ${coverageMonths} months` : ""} (ended ${formatDate(coverageEnds)})`
        : "Coverage expired",
      detailColorClass: "text-(--pc-warning-text)",
      clickable: true,
    };
  }

  if (coverageStatus === "excluded") {
    return {
      badgeLabel: "No Coverage",
      badgeVariant: "destructive",
      detailText: "No coverage · Excluded",
      detailColorClass: "text-destructive",
      clickable: false,
    };
  }

  // no_match — no warranty rule configured for this product at all, distinct
  // from an explicit exclusion.
  return {
    badgeLabel: "No Coverage",
    badgeVariant: "muted",
    detailText: "No warranty rule configured for this product",
    detailColorClass: "text-muted-foreground",
    clickable: false,
  };
}
