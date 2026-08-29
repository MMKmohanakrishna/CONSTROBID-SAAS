"use client";

/**
 * Report generation for Project Finance, built on the jsPDF and xlsx packages
 * the app already ships. See the note in the Phase 4 handover: the PRD called
 * for server-side Puppeteer, which is a heavier dependency than this needs.
 */

const money = (value: number) => `Rs ${Number(value || 0).toLocaleString("en-IN")}`;

const shortDate = (value: any) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "";

function downloadFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const safeName = (value: string) => String(value || "project").replace(/[^\w\-]+/g, "_");

/**
 * Cloudinary serves images with permissive CORS, but a single unreachable photo
 * must not lose the contractor their whole report — so a failed fetch is
 * skipped rather than thrown.
 */
async function toDataUrl(url: string): Promise<{ data: string; width: number; height: number } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const blob = await response.blob();

    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const size = await new Promise<{ width: number; height: number }>((resolve) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => resolve({ width: 0, height: 0 });
      image.src = data;
    });

    if (!size.width || !size.height) return null;

    return { data, ...size };
  } catch {
    return null;
  }
}

/** One daily log as a client-ready site report, photos included. */
export async function exportDailyLogPdf(log: any, project: any, contractorName?: string) {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 44;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Header
  doc.setFillColor(112, 21, 58);
  doc.rect(0, 0, pageWidth, 76, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text("Site Report", margin, 34);
  doc.setFontSize(10);
  doc.text(project?.name || "Project", margin, 54);
  doc.text(shortDate(log.date), pageWidth - margin, 54, { align: "right" });

  y = 110;
  doc.setTextColor(30, 30, 30);

  // Project facts
  doc.setFontSize(9);
  const facts = [
    ["Contractor", contractorName || "-"],
    ["Client", project?.clientName || "-"],
    ["Location", project?.location || "-"],
  ];

  facts.forEach(([label, value]) => {
    doc.setTextColor(120, 120, 120);
    doc.text(String(label), margin, y);
    doc.setTextColor(30, 30, 30);
    doc.text(String(value), margin + 90, y);
    y += 16;
  });

  y += 10;

  // Costs
  doc.setDrawColor(225, 225, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 22;

  doc.setFontSize(11);
  doc.text("Day summary", margin, y);
  y += 18;

  doc.setFontSize(10);
  const summary = [
    ["Workers on site", String(log.workers || 0)],
    ["Labour cost", money(log.labourCost)],
    ["Material cost", money(log.materialCost)],
    ["Total for the day", money(Number(log.labourCost || 0) + Number(log.materialCost || 0))],
  ];

  summary.forEach(([label, value], index) => {
    const bold = index === summary.length - 1;
    doc.setTextColor(bold ? 30 : 110, bold ? 30 : 110, bold ? 30 : 110);
    doc.text(String(label), margin, y);
    doc.setTextColor(30, 30, 30);
    doc.text(String(value), pageWidth - margin, y, { align: "right" });
    y += 16;
  });

  if (log.mode || log.poNumber) {
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(9);
    doc.text(
      [log.mode ? `Paid by ${log.mode}` : "", log.poNumber ? `PO ${log.poNumber}` : ""]
        .filter(Boolean)
        .join("   ·   "),
      margin,
      y
    );
    y += 16;
  }

  y += 8;
  doc.setDrawColor(225, 225, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 22;

  // Work done
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.text("Work done", margin, y);
  y += 16;

  doc.setFontSize(10);
  const workLines = doc.splitTextToSize(String(log.workDone || "-"), contentWidth);
  workLines.forEach((line: string) => {
    ensureSpace(14);
    doc.text(line, margin, y);
    y += 14;
  });

  if (log.notes) {
    y += 10;
    ensureSpace(30);
    doc.setFontSize(11);
    doc.text("Notes", margin, y);
    y += 16;
    doc.setFontSize(10);
    doc.splitTextToSize(String(log.notes), contentWidth).forEach((line: string) => {
      ensureSpace(14);
      doc.text(line, margin, y);
      y += 14;
    });
  }

  // Photos, two per row, aspect ratio preserved
  const photos: string[] = Array.isArray(log.photos) ? log.photos : [];

  if (photos.length > 0) {
    y += 18;
    ensureSpace(30);
    doc.setFontSize(11);
    doc.text(`Site photos (${photos.length})`, margin, y);
    y += 16;

    const gap = 12;
    const cellWidth = (contentWidth - gap) / 2;
    let column = 0;
    let rowHeight = 0;
    let skipped = 0;

    for (const photo of photos) {
      const image = await toDataUrl(photo);

      if (!image) {
        skipped += 1;
        continue;
      }

      const height = (image.height / image.width) * cellWidth;

      if (column === 0) {
        ensureSpace(height + gap);
        rowHeight = height;
      }

      const x = margin + column * (cellWidth + gap);

      try {
        doc.addImage(image.data, x, y, cellWidth, height, undefined, "FAST");
      } catch {
        skipped += 1;
      }

      rowHeight = Math.max(rowHeight, height);

      if (column === 1) {
        y += rowHeight + gap;
        column = 0;
        rowHeight = 0;
      } else {
        column = 1;
      }
    }

    if (column === 1) y += rowHeight + gap;

    if (skipped > 0) {
      ensureSpace(16);
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`${skipped} photo(s) could not be included in this report.`, margin, y);
      y += 14;
    }
  }

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Generated by ConstroBID", margin, pageHeight - 24);
    doc.text(`Page ${page} of ${pages}`, pageWidth - margin, pageHeight - 24, { align: "right" });
  }

  doc.save(`${safeName(project?.name)}_site_report_${shortDate(log.date).replace(/\s+/g, "_")}.pdf`);
}

/** The whole project as a workbook: one sheet per record type. */
export async function exportProjectExcel(data: {
  project: any;
  materials: any[];
  labour: any[];
  logs: any[];
  payments: any[];
  pnl: any;
}) {
  const xlsx = await import("xlsx");
  const { project, materials, labour, logs, payments, pnl } = data;

  const workbook = xlsx.utils.book_new();

  const addSheet = (name: string, rows: any[]) => {
    const sheet = xlsx.utils.json_to_sheet(rows.length ? rows : [{ "No records": "" }]);
    xlsx.utils.book_append_sheet(workbook, sheet, name);
  };

  addSheet("Summary", [
    { Field: "Project", Value: project?.name || "" },
    { Field: "Client", Value: project?.clientName || "" },
    { Field: "Location", Value: project?.location || "" },
    { Field: "Status", Value: project?.status || "" },
    { Field: "Contract value", Value: pnl?.contractValue ?? 0 },
    { Field: "Received", Value: pnl?.received ?? 0 },
    { Field: "Outstanding", Value: pnl?.outstanding ?? 0 },
    { Field: "Material paid", Value: pnl?.material?.paid ?? 0 },
    { Field: "Labour paid", Value: pnl?.labour?.paid ?? 0 },
    { Field: "Total spent", Value: pnl?.spent ?? 0 },
    { Field: "Gross profit", Value: pnl?.grossProfit ?? 0 },
  ]);

  addSheet(
    "Materials",
    materials.map((item) => ({
      Name: item.name,
      Quantity: item.quantity || "",
      Supplier: item.supplier || "",
      "PO number": item.poNumber || "",
      Budget: item.budget || 0,
      Paid: item.paid || 0,
      Balance: Math.max(0, Number(item.budget || 0) - Number(item.paid || 0)),
      Status: item.status,
    }))
  );

  addSheet(
    "Material payments",
    materials.flatMap((item) =>
      (item.updates || []).map((update: any) => ({
        Material: item.name,
        Date: shortDate(update.date),
        Paid: update.paidAdded || 0,
        "Budget added": update.budgetAdded || 0,
        Mode: update.mode || "",
        Note: update.note || "",
      }))
    )
  );

  addSheet(
    "Labour",
    labour.map((item) => ({
      Name: item.name,
      Trade: item.trade || "",
      Workers: item.workers || 0,
      Contact: item.contact || "",
      Budget: item.budget || 0,
      Paid: item.paid || 0,
      Balance: Math.max(0, Number(item.budget || 0) - Number(item.paid || 0)),
      Status: item.status,
    }))
  );

  addSheet(
    "Labour payments",
    labour.flatMap((item) =>
      (item.updates || []).map((update: any) => ({
        Labour: item.name,
        Date: shortDate(update.date),
        Paid: update.paidAdded || 0,
        "Budget added": update.budgetAdded || 0,
        Mode: update.mode || "",
        Note: update.note || "",
      }))
    )
  );

  addSheet(
    "Daily logs",
    logs.map((log) => ({
      Date: shortDate(log.date),
      "Work done": log.workDone || "",
      Workers: log.workers || 0,
      "Labour cost": log.labourCost || 0,
      "Material cost": log.materialCost || 0,
      Mode: log.mode || "",
      "PO number": log.poNumber || "",
      Notes: log.notes || "",
      Photos: (log.photos || []).length,
    }))
  );

  addSheet(
    "Client payments",
    payments.map((payment) => ({
      Date: shortDate(payment.date),
      Amount: payment.amount || 0,
      Mode: payment.mode || "",
      Note: payment.note || "",
    }))
  );

  const blob = new Blob([xlsx.write(workbook, { bookType: "xlsx", type: "array" })], {
    type: "application/octet-stream",
  });

  downloadFile(blob, `${safeName(project?.name)}_finance.xlsx`);
}
