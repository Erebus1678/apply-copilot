type Props = {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
};

export function PageHeading({ eyebrow, title, children }: Props) {
  return (
    <header className="flex flex-col gap-2">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      {children && <p className="text-muted-foreground max-w-2xl text-pretty">{children}</p>}
    </header>
  );
}
