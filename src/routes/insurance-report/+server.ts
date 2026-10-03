/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { error } from '@sveltejs/kit';
import {
  generateInsuranceReport,
  selectedInsuranceReportFields
} from '$lib/server/insurance-report';
import { listLenses } from '$lib/server/lenses';

export const GET = async ({ url }) => {
  const fields = selectedInsuranceReportFields(url.searchParams);
  if (!fields.length) throw error(400, 'Select at least one field for the insurance report.');

  const generatedAt = new Date();
  const lenses = listLenses(new URLSearchParams({ sort: 'name' }));
  const report = await generateInsuranceReport(lenses, fields, generatedAt);
  const date = generatedAt.toISOString().slice(0, 10);

  return new Response(Buffer.from(report), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="glassbook-insurance-report-${date}.pdf"`,
      'Cache-Control': 'no-store'
    }
  });
};
