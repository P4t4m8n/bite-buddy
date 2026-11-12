type PageHeaderProps = {
  title: string;
  description?: string;
  /** e.g. a "new" button, shown at the end of the title row. */
  action?: React.ReactNode;
};
export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 text-sm text-foreground/60">{description}</p> : null}
      </div>
      {action}
    </header>
  );
}
