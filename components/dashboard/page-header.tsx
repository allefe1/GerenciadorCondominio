type PageHeaderProps = {
  roleLabel: string;
  title: string;
  subtitle?: string;
};

export function PageHeader({ roleLabel, title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">{roleLabel}</p>
      <h1 className="mt-1 text-2xl font-black">{title}</h1>
      {subtitle ? (
        <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>
      ) : null}
    </div>
  );
}
