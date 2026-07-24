"use client";

import UploadModal from "@/components/UploadModal";
import { useRouter } from "next/navigation";

export default function UploadPdfPage() {
  const router = useRouter();

  return <UploadModal isOpen={true} onClose={() => router.back()} />;
}
