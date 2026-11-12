import { readFileSync } from "node:fs";
import { join } from "node:path";

export type LegalDocumentName = "terms" | "privacy";

export function readLegalDocument(name: LegalDocumentName): string {
  return readFileSync(join(process.cwd(), "content", `${name}.txt`), "utf8");
}
