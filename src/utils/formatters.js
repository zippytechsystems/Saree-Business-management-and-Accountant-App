/**
 * Indian Rupee (₹) currency formatter
 */
export function formatCurrency(amount) {
  const num = Number(amount ?? 0);
  if (isNaN(num)) return '₹ 0';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
  }).format(num);
}

/**
 * Format YYYY-MM-DD to readable date
 */
export function formatDate(dateStr) {
  if (!dateStr) return '--';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIndex = Number(parts[1]) - 1;
    const day = parts[2];
    const date = new Date(year, monthIndex, day);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  }
  return dateStr;
}

/**
 * Local today date in YYYY-MM-DD
 */
export function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Local current month in YYYY-MM
 */
export function getCurrentMonthString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Format YYYY-MM to readable month (e.g. "September 2026")
 */
export function formatMonth(monthStr) {
  if (!monthStr) return '--';
  const parts = monthStr.split('-');
  if (parts.length === 2) {
    const year = Number(parts[0]);
    const monthIndex = Number(parts[1]) - 1;
    const date = new Date(year, monthIndex, 1);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
      });
    }
  }
  return monthStr;
}

