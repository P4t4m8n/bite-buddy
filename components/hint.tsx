/** A short centred message for empty lists and search hints. */
export default function Hint({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-sm text-foreground/60">{children}</p>;
}
