import Link from "next/link";

export default function QuickLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex h-11 items-center justify-center gap-2 rounded-xl border border-foreground/15 text-sm font-medium hover:bg-foreground/5"
    >
      {icon}
      {children}
    </Link>
  );
}
