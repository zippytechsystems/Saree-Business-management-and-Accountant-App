import * as reportService from '../services/reportService.js';

console.log('--- TESTING REPORT MONTHS ---');

// 1. Current month (2026-09)
const repCurrent = reportService.generateMonthlyReportData('2026-09');
console.log(`Current Month (2026-09): Sales=${repCurrent.sales.records.length} records (₹${repCurrent.sales.monthly_total_sales}), Expenses=${repCurrent.expenses.records.length} records (₹${repCurrent.expenses.monthly_total_expenses})`);

// 2. Previous month (2026-08)
const repPrev = reportService.generateMonthlyReportData('2026-08');
console.log(`Previous Month (2026-08): Sales=${repPrev.sales.records.length} records (₹${repPrev.sales.monthly_total_sales}), Expenses=${repPrev.expenses.records.length} records (₹${repPrev.expenses.monthly_total_expenses})`);

// 3. Empty month (2025-01)
const repEmpty = reportService.generateMonthlyReportData('2025-01');
console.log(`Empty Month (2025-01): Sales=${repEmpty.sales.records.length} records (₹${repEmpty.sales.monthly_total_sales}), Expenses=${repEmpty.expenses.records.length} records (₹${repEmpty.expenses.monthly_total_expenses})`);
console.log(`Empty Month Calculations: Turnover=${repEmpty.calculations.monthly_turnover}, Net=${repEmpty.calculations.monthly_net_balance}`);

// Verify CSV output on empty month
const csvEmpty = reportService.formatReportAsCsv(repEmpty);
console.log('Empty Month CSV generated successfully, length:', csvEmpty.length);
