import * as XLSX from 'xlsx';
import { MutualFund } from '@/types/mutualFund';

function safeNum(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  if (s === '' || s === '--' || s === 'NA') return null;
  const n = parseFloat(s.replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

function safeStr(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

function excelSerialToDate(serial: number): number | null {
  if (serial < 10000 || serial > 100000) return null;
  const epoch = Date.UTC(1899, 11, 30);
  return epoch + serial * 86400000;
}

function parseLaunch(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return excelSerialToDate(val);
  const s = String(val).trim();
  if (!s) return null;
  const n = parseInt(s);
  if (!isNaN(n) && n > 10000 && n < 100000) return excelSerialToDate(n);
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.getTime();
}

let cachedFunds: MutualFund[] | null = null;
let loadPromise: Promise<MutualFund[]> | null = null;

async function parseWorkbook(): Promise<MutualFund[]> {
  try {
    const resp = await fetch('/data/Data.xlsx');
    const buf = await resp.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const funds: MutualFund[] = [];
    let idCounter = 1;

    const eqData = XLSX.utils.sheet_to_json<any>(wb.Sheets['Equity'], { defval: '' });
    const dtData = XLSX.utils.sheet_to_json<any>(wb.Sheets['Debt'], { defval: '' });
    const hyData = XLSX.utils.sheet_to_json<any>(wb.Sheets['Hybrid'], { defval: '' });
    const cmData = XLSX.utils.sheet_to_json<any>(wb.Sheets['Commodities'], { defval: '' });

    for (const row of eqData) {
      const name = safeStr(row['Funds']);
      if (!name) continue;
      funds.push({
        id: `EQ-${idCounter++}`,
        name,
        category: safeStr(row['Category']),
        amc: name.includes(' - ') ? name.split(' - ')[0].trim() : name.split(' ').slice(0, 2).join(' '),
        nav: safeNum(row['Latest NAV']) ?? 0,
        aum: safeNum(row['Net Assets (Cr)']) ?? 0,
        expenseRatio: safeNum(row['Expense Ratio (%)']) ?? 0,
        cagr1Y: safeNum(row['1 Yr Ret (%)']) ?? 0,
        cagr3Y: safeNum(row['3 Yr Ret (%)']) ?? 0,
        cagr5Y: safeNum(row['5 Yr Ret (%)']) ?? 0,
        volatility: safeNum(row['Standard Deviation']) ?? 0,
        sharpeRatio: safeNum(row['Sharpe Ratio']) ?? 0,
        beta: safeNum(row['Beta']) ?? 0,
        alpha: safeNum(row['Alpha']) ?? 0,
        rank: 0,
        strengthBadge: 'Balanced',
        riskLevel: 'Moderate',
        minInvestment: safeNum(row['Minimum Investment']) ?? 500,
        exitLoad: safeStr(row['Exit Load (Period)']),
        benchmark: '',
        launch: parseLaunch(row['Launch']),
        marketCap: safeNum(row['Market Cap']),
        latestNav: safeNum(row['Latest NAV']),
        previousNav: safeNum(row['Previous NAV']),
        high52W: safeNum(row['52-Week High NAV']),
        low52W: safeNum(row['52-Week Low NAV']),
        turnover: safeNum(row['Turnover']),
        stdDev: safeNum(row['Standard Deviation']),
        sortinoRatio: safeNum(row['Sortino Ratio']),
        fundManager: safeStr(row['Fund Manager (Tenure)']),
        ret1W: safeNum(row['1 Wk Ret (%)']),
        ret1M: safeNum(row['1 Mth Ret (%)']),
        ret3M: safeNum(row['3 Mth Ret (%)']),
        ret6M: safeNum(row['6 Mth Ret (%)']),
        ret1Y: safeNum(row['1 Yr Ret (%)']),
        ret3Y: safeNum(row['3 Yr Ret (%)']),
        ret5Y: safeNum(row['5 Yr Ret (%)']),
        ret10Y: safeNum(row['10 Yr Ret (%)']),
      });
    }

    for (const row of dtData) {
      const name = safeStr(row['Funds']);
      if (!name) continue;
      funds.push({
        id: `DT-${idCounter++}`,
        name,
        category: safeStr(row['Category']),
        amc: name.includes(' - ') ? name.split(' - ')[0].trim() : name.split(' ').slice(0, 2).join(' '),
        nav: safeNum(row['Latest NAV']) ?? 0,
        aum: safeNum(row['Net Assets (Cr)']) ?? 0,
        expenseRatio: safeNum(row['Expense Ratio (%)']) ?? 0,
        cagr1Y: safeNum(row['1 Yr Ret (%)']) ?? 0,
        cagr3Y: safeNum(row['3 Yr Ret (%)']) ?? 0,
        cagr5Y: safeNum(row['5 Yr Ret (%)']) ?? 0,
        volatility: safeNum(row['Standard Deviation']) ?? 0,
        sharpeRatio: safeNum(row['Sharpe Ratio']) ?? 0,
        beta: safeNum(row['Beta']) ?? 0,
        alpha: safeNum(row['Alpha']) ?? 0,
        rank: 0,
        strengthBadge: 'Balanced',
        riskLevel: 'Low',
        minInvestment: safeNum(row['Minimum Investment']) ?? 5000,
        exitLoad: safeStr(row['Exit Load (Period)']),
        benchmark: '',
        launch: parseLaunch(row['Launch']),
        latestNav: safeNum(row['Latest NAV']),
        previousNav: safeNum(row['Previous NAV']),
        high52W: safeNum(row['52-Week High NAV']),
        low52W: safeNum(row['52-Week Low NAV']),
        stdDev: safeNum(row['Standard Deviation']),
        sortinoRatio: safeNum(row['Sortino Ratio']),
        fundManager: safeStr(row['Fund Manager (Tenure)']),
        avgCreditQuality: safeStr(row['Avg. Credit Quality']),
        avgMaturity: safeNum(row['Avg. Maturity (Yrs)']),
        ytm: safeNum(row['Yield to Maturity (%)']),
        ret1W: safeNum(row['1 Wk Ret (%)']),
        ret1M: safeNum(row['1 Mth Ret (%)']),
        ret3M: safeNum(row['3 Mth Ret (%)']),
        ret6M: safeNum(row['6 Mth Ret (%)']),
        ret1Y: safeNum(row['1 Yr Ret (%)']),
        ret3Y: safeNum(row['3 Yr Ret (%)']),
        ret5Y: safeNum(row['5 Yr Ret (%)']),
        ret10Y: safeNum(row['10 Yr Ret (%)']),
      });
    }

    for (const row of hyData) {
      const name = safeStr(row['Funds']);
      if (!name) continue;
      funds.push({
        id: `HY-${idCounter++}`,
        name,
        category: safeStr(row['Category']),
        amc: name.includes(' - ') ? name.split(' - ')[0].trim() : name.split(' ').slice(0, 2).join(' '),
        nav: safeNum(row['Latest --V']) ?? safeNum(row['Latest NAV']) ?? 0,
        aum: safeNum(row['Net Assets (Cr)']) ?? 0,
        expenseRatio: safeNum(row['Expense Ratio (%)']) ?? 0,
        cagr1Y: safeNum(row['1 Yr Ret (%)']) ?? 0,
        cagr3Y: safeNum(row['3 Yr Ret (%)']) ?? 0,
        cagr5Y: safeNum(row['5 Yr Ret (%)']) ?? 0,
        volatility: safeNum(row['Standard Deviation']) ?? 0,
        sharpeRatio: safeNum(row['Sharpe Ratio']) ?? 0,
        beta: safeNum(row['Beta']) ?? 0,
        alpha: safeNum(row['Alpha']) ?? 0,
        rank: 0,
        strengthBadge: 'Balanced',
        riskLevel: 'Moderate',
        minInvestment: safeNum(row['Minimum Investment']) ?? 500,
        exitLoad: safeStr(row['Exit Load (Period)']),
        benchmark: '',
        launch: parseLaunch(row['Launch']),
        marketCap: safeNum(row['Market Cap']),
        latestNav: safeNum(row['Latest --V']) ?? safeNum(row['Latest NAV']),
        previousNav: safeNum(row['Previous --V']) ?? safeNum(row['Previous NAV']),
        high52W: safeNum(row['52-Week High --V']) ?? safeNum(row['52-Week High NAV']),
        low52W: safeNum(row['52-Week Low --V']) ?? safeNum(row['52-Week Low NAV']),
        stdDev: safeNum(row['Standard Deviation']),
        sortinoRatio: safeNum(row['Sortino Ratio']),
        fundManager: safeStr(row['Fund Ma--ger (Tenure)']) || safeStr(row['Fund Manager (Tenure)']),
        avgCreditQuality: safeStr(row['Avg. Credit Quality']),
        avgMaturity: safeNum(row['Avg. Maturity (Yrs)']),
        ytm: safeNum(row['Yield to Maturity (%)']),
        ret1W: safeNum(row['1 Wk Ret (%)']),
        ret1M: safeNum(row['1 Mth Ret (%)']),
        ret3M: safeNum(row['3 Mth Ret (%)']),
        ret6M: safeNum(row['6 Mth Ret (%)']),
        ret1Y: safeNum(row['1 Yr Ret (%)']),
        ret3Y: safeNum(row['3 Yr Ret (%)']),
        ret5Y: safeNum(row['5 Yr Ret (%)']),
        ret10Y: safeNum(row['10 Yr Ret (%)']),
      });
    }

    for (const row of cmData) {
      const name = safeStr(row['Funds']);
      if (!name) continue;
      funds.push({
        id: `CM-${idCounter++}`,
        name,
        category: safeStr(row['Category']),
        amc: name.includes(' - ') ? name.split(' - ')[0].trim() : name.split(' ').slice(0, 2).join(' '),
        nav: safeNum(row['Latest NAV']) ?? 0,
        aum: safeNum(row['Net Assets (Cr)']) ?? 0,
        expenseRatio: safeNum(row['Expense Ratio (%)']) ?? 0,
        cagr1Y: safeNum(row['1 Yr Ret (%)']) ?? 0,
        cagr3Y: safeNum(row['3 Yr Ret (%)']) ?? 0,
        cagr5Y: safeNum(row['5 Yr Ret (%)']) ?? 0,
        volatility: safeNum(row['Standard Deviation']) ?? 0,
        sharpeRatio: safeNum(row['Sharpe Ratio']) ?? 0,
        beta: safeNum(row['Beta']) ?? 0,
        alpha: safeNum(row['Alpha']) ?? 0,
        rank: 0,
        strengthBadge: 'Balanced',
        riskLevel: 'Moderate',
        minInvestment: safeNum(row['Minimum Investment']) ?? 500,
        exitLoad: safeStr(row['Exit Load (Period)']),
        benchmark: '',
        launch: parseLaunch(row['Launch']),
        latestNav: safeNum(row['Latest NAV']),
        previousNav: safeNum(row['Previous NAV']),
        high52W: safeNum(row['52-Week High NAV']),
        low52W: safeNum(row['52-Week Low NAV']),
        turnover: safeNum(row['Turnover']),
        stdDev: safeNum(row['Standard Deviation']),
        sortinoRatio: safeNum(row['Sortino Ratio']),
        fundManager: safeStr(row['Fund Manager (Tenure)']),
        ret1W: safeNum(row['1 Wk Ret (%)']),
        ret1M: safeNum(row['1 Mth Ret (%)']),
        ret3M: safeNum(row['3 Mth Ret (%)']),
        ret6M: safeNum(row['6 Mth Ret (%)']),
        ret1Y: safeNum(row['1 Yr Ret (%)']),
        ret3Y: safeNum(row['3 Yr Ret (%)']),
        ret5Y: safeNum(row['5 Yr Ret (%)']),
        ret10Y: safeNum(row['10 Yr Ret (%)']),
      });
    }

    cachedFunds = funds;
    console.log(`Workbook loaded: ${funds.length} funds`);
    return funds;
  } catch (err) {
    console.error('Failed to load workbook:', err);
    cachedFunds = [];
    return [];
  }
}

export async function getWorkbookFunds(): Promise<MutualFund[]> {
  if (cachedFunds) return cachedFunds;
  if (loadPromise) return loadPromise;
  loadPromise = parseWorkbook();
  const result = await loadPromise;
  loadPromise = null;
  return result;
}

export function clearWorkbookCache(): void {
  cachedFunds = null;
  loadPromise = null;
}
