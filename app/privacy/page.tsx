import type { Metadata } from "next";
import LegalDocument from "@/app/legal-document";
import { readLegalDocument } from "@/lib/legal-documents";

export const metadata: Metadata = {
  title: "プライバシーポリシー | 漂流瓶",
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="プライバシーポリシー"
      englishTitle="PRIVACY POLICY"
      content={readLegalDocument("privacy")}
    />
  );
}
