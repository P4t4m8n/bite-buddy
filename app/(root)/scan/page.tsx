import BarcodeScanner from "@/components/scan/barcode-scanner";
import { PageHeader } from "@/components/page-header";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "סריקה" };

export default function ScanPage() {
  return (
    <>
      <PageHeader title="סריקה" description="סורקים ברקוד של מוצר עם המצלמה, או מקלידים אותו." />
      <BarcodeScanner />
    </>
  );
}
