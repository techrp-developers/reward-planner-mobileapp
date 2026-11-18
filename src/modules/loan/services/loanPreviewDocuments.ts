import { generatePDF } from 'react-native-html-to-pdf';
import Share from 'react-native-share';

// Preview exports deliberately exclude PAN, addresses and uploaded files.
export async function sharePreviewDocument(
  title: string,
  rows: [string, string][],
) {
  const escape = (value: string) =>
    value.replace(
      /[&<>"']/g,
      char =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        }[char]!),
    );
  const html = `<html><head><meta charset="utf-8"/><style>body{font-family:Arial;padding:35px;color:#302037}h1{color:#4c2d56}aside{padding:16px;background:#f0e7f6;line-height:1.6}table{width:100%;border-collapse:collapse;margin-top:28px}td{padding:14px;border-bottom:1px solid #ebe2f0}td:last-child{text-align:right}footer{margin-top:35px;font-size:11px;color:#88778f}</style></head><body><h1>RP Personal Loan</h1><h2>${escape(
    title,
  )}</h2><aside>SAMPLE — FOR UI PREVIEW ONLY<br/>This is not a lender agreement, payment receipt, account statement or legally valid NOC. No loan, signature, mandate, transfer or payment has been created.</aside><table>${rows
    .map(
      ([label, value]) =>
        `<tr><td>${escape(label)}</td><td>${escape(value)}</td></tr>`,
    )
    .join('')}</table><footer>Generated ${escape(
    new Date().toLocaleDateString('en-IN'),
  )} · Illustrative terms only. Final documents must be issued by the lender.</footer></body></html>`;
  const file = await generatePDF({
    html,
    fileName: `RP-Loan-SAMPLE-${Date.now()}`,
    width: 595,
    height: 842,
  });
  if (!file.filePath) {
    throw new Error('Could not generate preview PDF. Please try again.');
  }
  await Share.open({
    url: file.filePath.startsWith('file://')
      ? file.filePath
      : `file://${file.filePath}`,
    type: 'application/pdf',
    title: `Sample ${title}`,
    failOnCancel: false,
  });
}
