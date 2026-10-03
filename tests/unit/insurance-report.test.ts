/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import {
  generateInsuranceReport,
  insuranceReportFieldIds,
  selectedInsuranceReportFields,
  type InsuranceReportLens
} from '../../src/lib/server/insurance-report';

const lens: InsuranceReportLens = {
  model: 'Planar 50mm f/1.4',
  manufacturer: 'Carl Zeiss',
  serialNumber: '1234567',
  purchasePriceMinor: 45999,
  currency: 'EUR'
};

describe('insurance report', () => {
  it('selects every field by default and accepts a configured subset', () => {
    expect(selectedInsuranceReportFields(new URLSearchParams())).toEqual(insuranceReportFieldIds);
    expect(
      selectedInsuranceReportFields(
        new URLSearchParams([
          ['fieldsConfigured', 'true'],
          ['field', 'lensName'],
          ['field', 'serialNumber'],
          ['field', 'unknown']
        ])
      )
    ).toEqual(['lensName', 'serialNumber']);
  });

  it('creates a titled PDF report', async () => {
    const bytes = await generateInsuranceReport(
      [lens],
      [...insuranceReportFieldIds],
      new Date('2026-08-02T10:00:00.000Z')
    );
    const report = await PDFDocument.load(bytes);

    expect(Buffer.from(bytes).subarray(0, 5).toString()).toBe('%PDF-');
    expect(report.getTitle()).toBe('Glassbook insurance report');
    expect(report.getPageCount()).toBe(1);
  });

  it('paginates a long catalogue and supports missing values', async () => {
    const lenses = Array.from({ length: 70 }, (_, index) => ({
      ...lens,
      model: `Lens ${index + 1}`,
      serialNumber: null,
      purchasePriceMinor: null
    }));
    const bytes = await generateInsuranceReport(lenses, ['lensName', 'purchasePrice']);
    const report = await PDFDocument.load(bytes);

    expect(report.getPageCount()).toBeGreaterThan(1);
  });

  it('rejects a report without selected fields', async () => {
    await expect(generateInsuranceReport([lens], [])).rejects.toThrow(
      'Select at least one report field.'
    );
  });
});
