export type ClaimStatusPresentation = {
  badgeLabel: string;
  badgeVariant: "success" | "warning" | "muted" | "info" | "destructive";
  description: string;
};

export function getClaimStatusPresentation(status: string): ClaimStatusPresentation {
  switch (status) {
    case "submitted":
      return { badgeLabel: "Submitted", badgeVariant: "muted", description: "Filed, waiting to be reviewed." };
    case "in_review":
      return { badgeLabel: "In Review", badgeVariant: "info", description: "Being reviewed by the warranty team." };
    case "info_requested":
      return {
        badgeLabel: "Info Requested",
        badgeVariant: "warning",
        description: "The team needs more details from you.",
      };
    case "escalated":
      return { badgeLabel: "Escalated", badgeVariant: "warning", description: "Under further internal review." };
    case "approved":
      return { badgeLabel: "Approved", badgeVariant: "success", description: "Approved for resolution." };
    case "rejected":
      return { badgeLabel: "Rejected", badgeVariant: "muted", description: "Not approved for coverage." };
    default:
      return { badgeLabel: status, badgeVariant: "muted", description: "" };
  }
}

export function isClaimOpen(status: string): boolean {
  return status !== "approved" && status !== "rejected";
}
