import { Mail, PackageCheck, Phone, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";

const actions = [
  {
    href: "/registrations",
    icon: PackageCheck,
    title: "Register a Product",
    description: "Activate your warranty coverage by registering your purchase.",
    cta: "Get Started",
  },
  {
    href: "/warranty-policy",
    icon: ShieldCheck,
    title: "Warranty Policy",
    description: "Review coverage details, terms, and conditions.",
    cta: "View Policy",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10">
        {/* Hero */}
        <div className="relative h-56 w-full overflow-hidden rounded-xl bg-gradient-to-br from-secondary via-muted to-secondary sm:h-72">
          <div
            className="absolute inset-0 grid grid-cols-8 gap-2 p-6 opacity-40"
            aria-hidden="true"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className="rounded-full bg-primary/60" />
            ))}
          </div>
        </div>

        {/* Welcome headline + copy */}
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Welcome to the Pergola Cave Warranty Center
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Register your pergola and file warranty claims quickly and easily. We
            stand behind every product we sell.
          </p>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {actions.map(({ href, icon: Icon, title, description, cta }) => (
            <Link key={href} href={href}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex h-full flex-col">
                  <Icon className="mb-3 size-8 text-primary" strokeWidth={2} />
                  <div className="font-semibold text-foreground">{title}</div>
                  <p className="mt-1 flex-1 text-[13px] text-muted-foreground">
                    {description}
                  </p>
                  <span className="mt-3 text-[13px] font-semibold text-primary">
                    {cta} &rarr;
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Contact */}
        <Card>
          <CardContent className="flex flex-col gap-2">
            <div className="font-semibold text-foreground">Need Help?</div>
            <a
              href="tel:+15551234567"
              className="inline-flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <Phone className="size-4 text-muted-foreground" strokeWidth={2} />
              +1 (555) 123-4567
            </a>
            <a
              href="mailto:support@pergolacave.com"
              className="inline-flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <Mail className="size-4 text-muted-foreground" strokeWidth={2} />
              support@pergolacave.com
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
