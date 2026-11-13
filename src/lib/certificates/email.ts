import type { MailContent } from "@/lib/mail";
import { formatDate } from "@/lib/datetime";
import type { CertificateSnapshot } from "./pdf";
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
export function certificateEmail(c: CertificateSnapshot): MailContent {
  const paragraphs = [
    `Hello ${c.learnerName},`,
    "Congratulations on successfully completing your tutoring class!",
    "We are pleased to recognize your accomplishment in:",
    `Class/Subject: ${c.subjectName} (${c.classCode})`,
    `Tutor: ${c.tutorName}`,
    `Completion Date: ${formatDate(c.completedAt)}`,
    "Your Katuwang Certificate of Completion is attached to this email as a PDF file.",
    "You may also view and download your certificate through My Certificates in your Katuwang learner account.",
    "Thank you for being part of the Katuwang learning community.",
    "Best regards, The Katuwang Team",
  ];
  return { subject: "Katuwang - Your Certificate of Completion", text: paragraphs.join("\n\n"), html: `<div style="font-family:Arial,sans-serif;line-height:1.6">${paragraphs.map(p => `<p>${escape(p)}</p>`).join("")}</div>` };
}
