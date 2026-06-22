import { BadRequestException } from '@nestjs/common';

export function monthRange(month?: string): { start: Date; end: Date } {
  // month = "YYYY-MM"; defaults to the current month (UTC)
  const now = new Date();
  const [y, m] = month
    ? month.split('-').map(Number)
    : [now.getUTCFullYear(), now.getUTCMonth() + 1];
  if (!y || !m || m < 1 || m > 12)
    throw new BadRequestException('month must be YYYY-MM');
  return {
    start: new Date(Date.UTC(y, m - 1, 1)),
    end: new Date(Date.UTC(y, m, 1)),
  };
}
