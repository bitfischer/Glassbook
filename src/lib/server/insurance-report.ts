/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

export const insuranceReportFieldIds = [
  'lensName',
  'vendor',
  'serialNumber',
  'purchasePrice'
] as const;

export type InsuranceReportField = (typeof insuranceReportFieldIds)[number];

export type InsuranceReportLens = {
  model: string;
  manufacturer: string;
  serialNumber: string | null;
  purchasePriceMinor: number | null;
  currency: string;
};

type ReportColumn = {
  id: InsuranceReportField;
  label: string;
  weight: number;
  value: (lens: InsuranceReportLens) => string;
};

const pageWidth = 595.28;
const pageHeight = 841.89;
const margin = 44;
const tableWidth = pageWidth - margin * 2;
const rowHeight = 25;

function formatPrice(lens: InsuranceReportLens): string {
  if (lens.purchasePriceMinor === null) return 'Not recorded';
  const amount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(lens.purchasePriceMinor / 100);
  return `${amount} ${lens.currency}`;
}

const reportColumns: ReportColumn[] = [
  { id: 'lensName', label: 'Lens name', weight: 1.3, value: (lens) => lens.model },
  { id: 'vendor', label: 'Vendor', weight: 1, value: (lens) => lens.manufacturer },
  {
    id: 'serialNumber',
    label: 'Serial number',
    weight: 1,
    value: (lens) => lens.serialNumber || 'Not recorded'
  },
  { id: 'purchasePrice', label: 'Purchase price', weight: 1, value: formatPrice }
];

export function selectedInsuranceReportFields(
  searchParams: URLSearchParams
): InsuranceReportField[] {
  if (!searchParams.has('fieldsConfigured')) return [...insuranceReportFieldIds];
  const requested = new Set(searchParams.getAll('field'));
  return insuranceReportFieldIds.filter((field) => requested.has(field));
}

function supportedText(text: string, font: PDFFont): string {
  return [...text]
    .map((character) => {
      try {
        font.encodeText(character);
        return character;
      } catch {
        return '?';
      }
    })
    .join('');
}

function fitText(text: string, font: PDFFont, size: number, width: number): string {
  const safe = supportedText(text, font);
  if (font.widthOfTextAtSize(safe, size) <= width) return safe;
  const suffix = '...';
  let fitted = safe;
  while (fitted && font.widthOfTextAtSize(fitted + suffix, size) > width) {
    fitted = fitted.slice(0, -1);
  }
  return fitted + suffix;
}

function drawReportHeading(
  page: PDFPage,
  regular: PDFFont,
  bold: PDFFont,
  generatedAt: Date,
  lensCount: number,
  continuation = false
): number {
  page.drawText('GLASSBOOK', {
    x: margin,
    y: pageHeight - margin,
    size: 9,
    font: bold,
    color: rgb(0.11, 0.41, 0.45)
  });
  page.drawText(continuation ? 'Insurance report - continued' : 'Insurance report', {
    x: margin,
    y: pageHeight - margin - 31,
    size: continuation ? 18 : 25,
    font: bold,
    color: rgb(0.09, 0.15, 0.23)
  });
  const date = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(generatedAt);
  page.drawText(`Generated ${date}  |  ${lensCount} ${lensCount === 1 ? 'lens' : 'lenses'}`, {
    x: margin,
    y: pageHeight - margin - 51,
    size: 9,
    font: regular,
    color: rgb(0.35, 0.39, 0.38)
  });
  return pageHeight - margin - 75;
}

function drawTableHeader(
  page: PDFPage,
  columns: Array<ReportColumn & { x: number; width: number }>,
  indexWidth: number,
  bold: PDFFont,
  y: number
): number {
  page.drawRectangle({
    x: margin,
    y: y - rowHeight,
    width: tableWidth,
    height: rowHeight,
    color: rgb(0.09, 0.15, 0.23)
  });
  page.drawText('#', {
    x: margin + 8,
    y: y - 16,
    size: 8,
    font: bold,
    color: rgb(1, 1, 1)
  });
  for (const column of columns) {
    page.drawText(fitText(column.label, bold, 8, column.width - 12), {
      x: column.x + 6,
      y: y - 16,
      size: 8,
      font: bold,
      color: rgb(1, 1, 1)
    });
  }
  page.drawLine({
    start: { x: margin + indexWidth, y },
    end: { x: margin + indexWidth, y: y - rowHeight },
    thickness: 0.5,
    color: rgb(1, 1, 1)
  });
  return y - rowHeight;
}

export async function generateInsuranceReport(
  lenses: InsuranceReportLens[],
  fields: InsuranceReportField[],
  generatedAt = new Date()
): Promise<Uint8Array> {
  if (!fields.length) throw new Error('Select at least one report field.');

  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  document.setTitle('Glassbook insurance report');
  document.setAuthor('Glassbook');
  document.setCreator('Glassbook');
  document.setProducer('Glassbook');
  document.setCreationDate(generatedAt);
  document.setModificationDate(generatedAt);

  const selectedColumns = fields.map((field) =>
    reportColumns.find((column) => column.id === field)!
  );
  const indexWidth = 28;
  const columnsWidth = tableWidth - indexWidth;
  const totalWeight = selectedColumns.reduce((total, column) => total + column.weight, 0);
  let nextX = margin + indexWidth;
  const columns = selectedColumns.map((column) => {
    const width = (columnsWidth * column.weight) / totalWeight;
    const positioned = { ...column, x: nextX, width };
    nextX += width;
    return positioned;
  });

  let page = document.addPage([pageWidth, pageHeight]);
  let y = drawReportHeading(page, regular, bold, generatedAt, lenses.length);
  y = drawTableHeader(page, columns, indexWidth, bold, y);

  for (const [index, lens] of lenses.entries()) {
    if (y - rowHeight < margin + 18) {
      page = document.addPage([pageWidth, pageHeight]);
      y = drawReportHeading(page, regular, bold, generatedAt, lenses.length, true);
      y = drawTableHeader(page, columns, indexWidth, bold, y);
    }

    if (index % 2 === 0) {
      page.drawRectangle({
        x: margin,
        y: y - rowHeight,
        width: tableWidth,
        height: rowHeight,
        color: rgb(0.96, 0.95, 0.92)
      });
    }
    page.drawText(String(index + 1), {
      x: margin + 8,
      y: y - 16,
      size: 8,
      font: regular,
      color: rgb(0.35, 0.39, 0.38)
    });
    for (const column of columns) {
      page.drawText(fitText(column.value(lens), regular, 8, column.width - 12), {
        x: column.x + 6,
        y: y - 16,
        size: 8,
        font: regular,
        color: rgb(0.09, 0.15, 0.23)
      });
      page.drawLine({
        start: { x: column.x, y },
        end: { x: column.x, y: y - rowHeight },
        thickness: 0.35,
        color: rgb(0.84, 0.82, 0.78)
      });
    }
    page.drawLine({
      start: { x: margin, y: y - rowHeight },
      end: { x: margin + tableWidth, y: y - rowHeight },
      thickness: 0.35,
      color: rgb(0.84, 0.82, 0.78)
    });
    y -= rowHeight;
  }

  if (!lenses.length) {
    page.drawText('No lenses are currently in the catalogue.', {
      x: margin + 8,
      y: y - 19,
      size: 9,
      font: regular,
      color: rgb(0.35, 0.39, 0.38)
    });
  }

  const pages = document.getPages();
  for (const [index, reportPage] of pages.entries()) {
    const footer = `Glassbook insurance report  |  Page ${index + 1} of ${pages.length}`;
    reportPage.drawText(footer, {
      x: pageWidth - margin - regular.widthOfTextAtSize(footer, 8),
      y: 23,
      size: 8,
      font: regular,
      color: rgb(0.45, 0.46, 0.43)
    });
  }

  return document.save();
}
