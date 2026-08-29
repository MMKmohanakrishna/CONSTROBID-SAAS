const OPEN_QUOTATION_STATUSES = new Set([
  'PROJECT_PUBLISHED',
  'BIDDING_OPEN',
  'CLIENT_COMPARISON',
]);

export function isQuotationSubmissionOpen(status?: string | null): boolean {
  return Boolean(status && OPEN_QUOTATION_STATUSES.has(status));
}

export function getQuotationClosedMessage(): string {
  return 'Quotation is closed. A contractor has already been selected.';
}
