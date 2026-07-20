import { pdf, DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";

export async function downloadPdf(element: ReactElement<DocumentProps>, filename: string): Promise<void> {
  const blob = await pdf(element).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
