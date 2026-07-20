import React from "react";

interface DashboardSectionProps {
  title: string;
  children: React.ReactNode;
}

export function DashboardSection({ title, children }: DashboardSectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-wide text-[var(--text-primary)]">
        {title}
      </h2>
      {children}
    </section>
  );
}
