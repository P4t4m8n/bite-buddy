import { BottomNav } from "@/components/bottom-nav";
import { TopBar } from "@/components/top-bar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <TopBar />
      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-6 pb-28">{children}</main>
      <BottomNav />
    </>
  );
}
