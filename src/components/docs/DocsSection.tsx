import { cn } from "@/lib/utils";

interface DocsSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function DocsSection({ id, title, children, className }: DocsSectionProps) {
  return (
    <section id={id} className={cn("scroll-mt-24 mb-16", className)}>
      <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-border">{title}</h2>
      <div className="space-y-6 text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
