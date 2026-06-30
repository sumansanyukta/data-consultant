interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="font-serif text-2xl text-text-primary">{title}</h1>
      {subtitle && (
        <p className="text-sm text-text-muted mt-1">{subtitle}</p>
      )}
    </div>
  );
}
