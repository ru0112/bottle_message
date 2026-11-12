import type { Metadata } from "next";
import LegalDocument from "@/app/legal-document";
import { readLegalDocument } from "@/lib/legal-documents";

export const metadata: Metadata = {
  title: "利用規約 | 漂流瓶",
};

export default function TermsPage() {
  return (
    <LegalDocument
      title="利用規約"
      englishTitle="TERMS OF SERVICE"
      content={readLegalDocument("terms")}
    />
  );
}
