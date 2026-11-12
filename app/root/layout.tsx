export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <main className="flex-1 p-4">{children}</main>
    </>
  );
}
