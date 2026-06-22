import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Loader2, AlertTriangle, TrendingUp, TrendingDown, Minus, RefreshCw, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface HoldingData {
  fund_name: string;
  amc: string;
  folio_number?: string;
  units?: number | null;
  nav?: number | null;
  current_value?: number | null;
  cost_value?: number | null;
  category?: string;
}

interface ParsedPortfolio {
  investor_name?: string;
  holdings: HoldingData[];
  total_current_value?: number | null;
  total_cost_value?: number | null;
}

type HealthStatus = 'healthy' | 'moderate' | 'degrading';

function getHealthStatus(holding: HoldingData): HealthStatus {
  const cost = holding.cost_value ?? 0;
  const current = holding.current_value ?? 0;
  if (cost === 0) return 'moderate';
  const returnPct = ((current - cost) / cost) * 100;
  if (returnPct > 5) return 'healthy';
  if (returnPct >= -5) return 'moderate';
  return 'degrading';
}

function getOverallHealth(holdings: HoldingData[]): HealthStatus {
  const statuses = holdings.map(getHealthStatus);
  const degradingCount = statuses.filter(s => s === 'degrading').length;
  const healthyCount = statuses.filter(s => s === 'healthy').length;
  if (degradingCount > holdings.length * 0.4) return 'degrading';
  if (healthyCount > holdings.length * 0.5) return 'healthy';
  return 'moderate';
}

const HEALTH_CONFIG = {
  healthy: { label: 'Healthy', color: 'text-success', bg: 'bg-success/15', icon: TrendingUp, barColor: 'bg-success' },
  moderate: { label: 'Moderate', color: 'text-warning', bg: 'bg-warning/15', icon: Minus, barColor: 'bg-warning' },
  degrading: { label: 'Needs Attention', color: 'text-destructive', bg: 'bg-destructive/15', icon: TrendingDown, barColor: 'bg-destructive' },
};

async function extractTextFromPDF(file: File, password?: string): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const loadingParams: any = { data: arrayBuffer };
  if (password) {
    loadingParams.password = password;
  }
  
  console.log("PDF DECRYPTION: loading document...", { passwordProvided: !!password });
  const pdf = await pdfjsLib.getDocument(loadingParams).promise;
  console.log("PDF DECRYPTED SUCCESSFULLY? Y. Pages:", pdf.numPages);
  
  const pages: string[] = [];

  for (let i = 1; i <= Math.min(pdf.numPages, 30); i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    pages.push(pageText);
  }

  return pages.join('\n\n');
}

interface CAMSUploadProps {
  compact?: boolean;
  onDataLoaded?: (portfolio?: ParsedPortfolio) => void;
}


const AMC_MAP: Record<string, string> = {
  'axis': 'Axis', 'hdfc': 'HDFC', 'sbi': 'SBI', 'icici': 'ICICI Prudential',
  'nippon': 'Nippon India', 'kotak': 'Kotak Mahindra', 'uti': 'UTI',
  ' mirae': 'Mirae Asset', 'aditya birla': 'Aditya Birla Sun Life',
  'dsp': 'DSP', 'tata': 'Tata', 'quant': 'Quant', 'ppfas': 'PPFAS',
  'canara': 'Canara Robeco', 'motilal': 'Motilal Oswal', 'franklin': 'Franklin Templeton',
  'baroda': 'Baroda BNP Paribas', 'invesco': 'Invesco', 'edelweiss': 'Edelweiss',
  'sundaram': 'Sundaram', 'bandhan': 'Bandhan', 'white oak': 'White Oak Capital',
  'old bridge': 'Old Bridge', 'navi': 'Navi', 'groww': 'Groww',
};

function detectAmc(fundName: string): string {
  const lower = fundName.toLowerCase();
  for (const [key, val] of Object.entries(AMC_MAP)) {
    if (lower.includes(key)) return val;
  }
  return '';
}

/**
 * Parse modern CAMS/KFintech field-value format.
 * Looks for patterns like:
 *   Scheme Name: SBI Bluechip Fund - Direct Plan - Growth
 *   Unit Balance: 1000.000
 *   NAV: 50.00
 *   Current Value: 50000.00
 */
function parseFieldValueFormat(lines: string[]): ParsedPortfolio | null {
  const holdings: HoldingData[] = [];
  let currentFund: Partial<HoldingData> = {};
  let investorName = '';

  for (const line of lines) {
    // Detect investor name
    if (!investorName && line.match(/investor/i)) {
      const parts = line.split(/[:–-]/);
      if (parts.length > 1) investorName = parts[1].trim();
    }

    // Detect fund/scheme name
    const schemeMatch = line.match(/(?:Scheme\s*(?:Name)?|Scheme)\s*[:–-]\s*(.+)/i);
    const folioMatch = line.match(/(?:Folio|Folio\s*Number)\s*[:–-]\s*(\S+)/i);
    const isFundLine = schemeMatch || line.match(/[A-Z][a-zA-Z\s\-&,()]+(?:\s*-\s*(?:Direct|Regular)\s*Plan)/i);

    if (isFundLine && !schemeMatch && !line.match(/folio|unit|nav|value|cost|amount|balance|investor|date|page|email|phone|address|statement|account/i)) {
      const potentialName = line.replace(/^\d+\s+/, '').trim();
      if (potentialName.length > 10 && potentialName.match(/[A-Z][a-z]/) && !potentialName.match(/^\d/)) {
        if (currentFund.fund_name) holdings.push(currentFund as HoldingData);
        currentFund = { fund_name: potentialName, amc: detectAmc(potentialName) };
        continue;
      }
    }

    if (schemeMatch) {
      if (currentFund.fund_name) holdings.push(currentFund as HoldingData);
      currentFund = { fund_name: schemeMatch[1].trim(), amc: detectAmc(schemeMatch[1]) };
      continue;
    }

    if (folioMatch) {
      if (!currentFund.folio_number) {
        currentFund.folio_number = folioMatch[1].trim();
      }
    }

    if (currentFund.fund_name) {
      const unitMatch = line.match(/(?:Unit\s*Balance|Units|Units?)\s*[:–-]\s*([\d,]+\.?\d*)/i);
      const navMatch = line.match(/NAV\s*[:–-]\s*₹?\s*([\d,]+\.?\d*)/i);
      const currentValMatch = line.match(/(?:Current\s*Value|Value|Market\s*Value?)\s*[:–-]\s*₹?\s*([\d,]+\.?\d*)/i);
      const costValMatch = line.match(/(?:Cost\s*Value|Cost|Investment\s*Amount?)\s*[:–-]\s*₹?\s*([\d,]+\.?\d*)/i);
      const folioNumMatch = line.match(/(?:Folio|Folio\s*Number)\s*[:–-]\s*(\S+)/i);

      if (unitMatch) currentFund.units = parseFloat(unitMatch[1].replace(/,/g, ''));
      if (navMatch) currentFund.nav = parseFloat(navMatch[1].replace(/,/g, ''));
      if (currentValMatch) currentFund.current_value = parseFloat(currentValMatch[1].replace(/,/g, ''));
      if (costValMatch) currentFund.cost_value = parseFloat(costValMatch[1].replace(/,/g, ''));
      if (folioNumMatch && !currentFund.folio_number) currentFund.folio_number = folioNumMatch[1].trim();

      // Category detection
      if (line.match(/equity|hybrid|debt|liquid|ELSS|index|sector|gold|silver/i) && !currentFund.category) {
        const catMatch = line.match(/(Equity|Hybrid|Debt|Liquid|ELSS|Index|Sectoral|Gold|Silver)/i);
        if (catMatch) currentFund.category = catMatch[0];
      }
    }
  }
  if (currentFund.fund_name) holdings.push(currentFund as HoldingData);
  if (holdings.length === 0) return null;
  return {
    investor_name: investorName || undefined,
    holdings,
    total_current_value: holdings.reduce((s, h) => s + (h.current_value || 0), 0),
    total_cost_value: holdings.reduce((s, h) => s + (h.cost_value || 0), 0),
  };
}

/**
 * Parse older CAMS numbered-list format.
 * Lines look like:
 *   1. SBI Bluechip Fund - Direct Plan
 *   Folio: 12345678
 *   Units: 1000.000
 */
function parseNumberedListFormat(lines: string[]): ParsedPortfolio | null {
  const holdings: HoldingData[] = [];
  let currentFund: Partial<HoldingData> = {};
  let investorName = '';

  const fundNameRegex = /^\d+\.\s+(.+)/;

  for (const line of lines) {
    // Detect investor name before first folio mention
    if (!investorName && line.match(/folio/i)) {
      const beforeFolio = lines.slice(0, lines.indexOf(line)).join(' ');
      const nameMatch = beforeFolio.match(/[A-Z][a-z]+ [A-Z][a-z]+/);
      if (nameMatch) investorName = nameMatch[0];
    }

    // Detect fund name: numbered items or lines with "Direct Plan" / "Regular Plan"
    const numMatch = line.match(fundNameRegex);
    const planMatch = line.match(/^(s\.\s+)?[A-Z][a-zA-Z\s\-&,()]+(?:\s*-\s*(?:Direct|Regular)\s*Plan)/);
    if (numMatch || planMatch) {
      if (currentFund.fund_name) holdings.push(currentFund as HoldingData);
      const raw = (numMatch?.[1] ?? line).trim();
      currentFund = { fund_name: raw, amc: detectAmc(raw) };
      continue;
    }

    // Folio number
    const folioLine = line.match(/folio\s*(?:no|number|#)?[:\s]*(\S+)/i);
    if (folioLine) {
      currentFund.folio_number = folioLine[1].trim();
      continue;
    }

    if (currentFund.fund_name) {
      const valMatch = line.match(/₹\s*([\d,]+\.?\d*)/);
      const unitMatch = line.match(/([\d,]+\.?\d*)\s*(?:units|unit)/i);
      const navMatch = line.match(/nav\s*[:\s]+₹?\s*([\d,]+\.?\d*)/i);
      const currentValMatch = line.match(/(?:current|market)\s*value\s*[:\s]+₹?\s*([\d,]+\.?\d*)/i);
      const costValMatch = line.match(/cost\s*(?:value)?\s*[:\s]+₹?\s*([\d,]+\.?\d*)/i);

      if (unitMatch) currentFund.units = parseFloat(unitMatch[1].replace(/,/g, ''));
      if (navMatch) currentFund.nav = parseFloat(navMatch[1].replace(/,/g, ''));
      if (currentValMatch) currentFund.current_value = parseFloat(currentValMatch[1].replace(/,/g, ''));
      if (costValMatch) currentFund.cost_value = parseFloat(costValMatch[1].replace(/,/g, ''));
      if (!currentFund.nav && valMatch && !currentFund.current_value) {
        currentFund.current_value = parseFloat(valMatch[1].replace(/,/g, ''));
      }

      if (line.match(/equity|hybrid|debt|liquid|ELSS|index|sector|gold|silver/i) && !currentFund.category) {
        const catMatch = line.match(/(Equity|Hybrid|Debt|Liquid|ELSS|Index|Sectoral|Gold|Silver)/i);
        if (catMatch) currentFund.category = catMatch[0];
      }
    }
  }
  if (currentFund.fund_name) holdings.push(currentFund as HoldingData);
  if (holdings.length === 0) return null;
  return {
    investor_name: investorName || undefined,
    holdings,
    total_current_value: holdings.reduce((s, h) => s + (h.current_value || 0), 0),
    total_cost_value: holdings.reduce((s, h) => s + (h.cost_value || 0), 0),
  };
}

/**
 * Format detection helper.
 * Returns the detected statement type string.
 */
function detectFormat(lines: string[]): string {
  const joined = lines.slice(0, 10).join(' ');
  if (joined.match(/CAMSCASWS/i)) {
    const verMatch = joined.match(/V(\d+\.\d+)/);
    return `CAMSCASWS V${verMatch?.[1] ?? '?'}`;
  }
  if (joined.match(/KFin Technologies|KFintech|KFINTECH/i)) return 'KFintech CAS';
  if (joined.match(/Consolidated Account Summary/i) && joined.match(/CAMS/i)) return 'CAMS CAS';
  if (joined.match(/CARES/i)) return 'CAMS CARES';
  return 'Unknown';
}

/**
 * Parse CAMSCASWS V3.x tabular format.
 *
 * pdf.js extracts the entire page as one line. The holdings table uses columns:
 *   Folio No. | Market Value (INR) | Scheme Name | Unit Balance | NAV Date | NAV | Registrar | ISIN | Cost Value (INR)
 *
 * Each holding row starts with a folio number (digits/digits, e.g. 910213587811/0).
 * Column values are separated by multiple spaces.
 */
function parseCAMSCASWSFormat(lines: string[]): ParsedPortfolio | null {
  // Rejoin — pdf.js dumps the whole page as one line
  const text = lines.join(' ');

  // --- Extract investor name ---
  let investorName = '';
  const emailNameMatch = text.match(/Email\s*Id\s*:\s*\S+\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
  if (emailNameMatch) investorName = emailNameMatch[1].trim();

  // --- Locate holdings table ---
  // Column header: "... Cost Value  (INR) ..."
  const HEADER_MARKER = 'Cost Value (INR)';
  const dataStart = text.search(/Cost\s+Value\s*\(INR\)/i);
  if (dataStart < 0) {
    console.log("FAIL: table header '" + HEADER_MARKER + "' not found");
    return null;
  }
  const dataSection = text.slice(dataStart);

  console.log("=== CAMSCASWS DATA SECTION ===");
  console.log(dataSection);
  console.log("=== END CAMSCASWS DATA SECTION ===");

  // --- Find all folio numbers (table row markers) ---
  // Folio pattern: long digits / short digits, e.g. 910213587811/0 or 10247591/19
  // Require at least 4 digits before / to avoid matching dates like 20/10/2019
  const folioRegex = /(\d{4,})\/(\d{1,2})/g;
  const folioPositions: { folio: string; start: number }[] = [];
  let fMatch;
  while ((fMatch = folioRegex.exec(dataSection)) !== null) {
    folioPositions.push({
      folio: fMatch[1] + '/' + fMatch[2],
      start: fMatch.index + fMatch[0].length,
    });
  }

  if (folioPositions.length === 0) {
    console.log("FAIL: no folio numbers found in data section");
    return null;
  }
  console.log("ROWS DETECTED (folio count): " + folioPositions.length);

  // --- Parse each holding ---
  const holdings: HoldingData[] = [];

  for (let i = 0; i < folioPositions.length; i++) {
    const folio = folioPositions[i].folio;
    const segStart = folioPositions[i].start;
    const segEnd = i < folioPositions.length - 1
      ? folioPositions[i + 1].start - folioPositions[i + 1].folio.length - 1
      : dataSection.length;

    const segment = dataSection.slice(segStart, segEnd).trim();
    if (!segment) {
      console.log("Row " + (i + 1) + " (" + folio + "): empty segment, skipped");
      continue;
    }

    // --- Field 1: Market Value (first number with 2 decimal places, may include commas) ---
    const mvMatch = segment.match(/^([\d,]+\.\d{2})\s+/);
    if (!mvMatch) {
      console.log("Row " + (i + 1) + " (" + folio + "): market value not found");
      console.log("  segment start: " + segment.slice(0, 80));
      continue;
    }
    const marketValue = parseFloat(mvMatch[1].replace(/,/g, ''));
    let rest = segment.slice(mvMatch[0].length);

    // --- Fields 2-3: Unit Balance + NAV Date ---
    // Unit balance is a number with 3 decimal places, followed by a date like 19-Feb-2026
    const unitDateMatch = rest.match(/([\d,]+\.\d{3})\s+(\d{2}-[A-Z][a-z]{2}-\d{4})/);
    if (!unitDateMatch) {
      console.log("Row " + (i + 1) + " (" + folio + "): unit balance / NAV date not found");
      console.log("  rest: " + rest.slice(0, 150));
      continue;
    }
    const units = parseFloat(unitDateMatch[1].replace(/,/g, ''));
    const navDate = unitDateMatch[2];
    const schemeName = rest.slice(0, unitDateMatch.index).trim();
    rest = rest.slice(unitDateMatch.index + unitDateMatch[0].length).trim();

    // --- Field 4: NAV (number after the date) ---
    const navMatch = rest.match(/^([\d,]+\.?\d*)\s+/);
    if (!navMatch) {
      console.log("Row " + (i + 1) + " (" + folio + "): NAV not found after date " + navDate);
      console.log("  rest: " + rest.slice(0, 80));
      continue;
    }
    const nav = parseFloat(navMatch[1].replace(/,/g, ''));
    rest = rest.slice(navMatch[0].length);

    // --- Field 5: Registrar (word like KFINTECH, CAMS) ---
    const regMatch = rest.match(/^(\w+)\s+/);
    if (!regMatch) {
      console.log("Row " + (i + 1) + " (" + folio + "): registrar not found");
      continue;
    }
    rest = rest.slice(regMatch[0].length);

    // --- Field 6: ISIN (non-whitespace token) ---
    const isinMatch = rest.match(/^(\S+)\s+/);
    if (!isinMatch) {
      console.log("Row " + (i + 1) + " (" + folio + "): ISIN not found");
      continue;
    }
    const isin = isinMatch[1];
    rest = rest.slice(isinMatch[0].length);

    // --- Field 7: Cost Value (number with 3 decimal places) ---
    const costMatch = rest.match(/^([\d,]+\.\d{3})/);
    if (!costMatch) {
      console.log("Row " + (i + 1) + " (" + folio + "): cost value not found");
      console.log("  after ISIN: " + rest.slice(0, 80));
      continue;
    }
    const costValue = parseFloat(costMatch[1].replace(/,/g, ''));

    // --- Clean scheme name ---
    // Remove leading scheme code like "128CFGPG - " or "HLSHFCRG - "
    const cleanName = schemeName.replace(/^\S+\s+-\s+/, '').trim();
    const amc = detectAmc(cleanName);

    const holding: HoldingData = {
      fund_name: cleanName,
      amc,
      folio_number: folio,
      units,
      nav,
      current_value: marketValue,
      cost_value: costValue,
    };
    holdings.push(holding);

    console.log("Holding Parsed:", JSON.stringify({
      schemeName: cleanName,
      amc,
      folioNumber: folio,
      units,
      nav,
      marketValue,
      costValue,
      isin,
    }));
  }

  if (holdings.length === 0) {
    console.log("FAIL: row parsing produced zero holdings. Trying fallback extraction...");
    return fallbackCAMSCASWSExtract(text, investorName);
  }

  const totalValue = holdings.reduce((s, h) => s + (h.current_value || 0), 0);
  console.log("EXTRACTED HOLDINGS COUNT: " + holdings.length);
  console.log("TOTAL PORTFOLIO VALUE: ₹" + Math.round(totalValue).toLocaleString());
  console.log("FIRST 5 HOLDINGS:", JSON.stringify(holdings.slice(0, 5), null, 2));

  return {
    investor_name: investorName || undefined,
    holdings,
    total_current_value: totalValue,
    total_cost_value: holdings.reduce((s, h) => s + (h.cost_value || 0), 0),
  };
}

/**
 * Fallback extraction for CAMSCASWS when structured table parsing fails.
 * Scans the text for scheme names ending with "Direct Plan" / "Regular Plan" / "Growth" / "IDCW"
 * and tries to collect nearby unit/value fields.
 */
function fallbackCAMSCASWSExtract(text: string, investorName: string): ParsedPortfolio | null {
  console.log("FALLBACK: scanning for scheme names...");

  // Find all scheme-name-like segments: text containing " - " and ending with plan/growth keywords
  const schemeRegex = /([A-Z][A-Za-z0-9\s&-]+(?:Direct Plan|Regular Plan|Growth|IDCW)[^.]*?)(?=\s{2,}|$)/g;
  const holdings: HoldingData[] = [];
  let sMatch;

  while ((sMatch = schemeRegex.exec(text)) !== null) {
    const raw = sMatch[1].trim();
    console.log("FALLBACK candidate:", raw.slice(0, 120));

    // Try to find folio before this scheme name
    const beforeText = text.slice(Math.max(0, sMatch.index - 100), sMatch.index);
    const folioBefore = beforeText.match(/(\d{4,}\/\d{1,2})/);
    const folio = folioBefore ? folioBefore[1] : undefined;

    // Clean scheme name
    const schemeName = raw.replace(/^\S+\s+-\s+/, '').trim();
    if (schemeName.length < 10) continue;

    // Try to extract nearby numbers as units and value
    const afterText = text.slice(sMatch.index + sMatch[0].length, sMatch.index + sMatch[0].length + 200);
    const unitMatch = afterText.match(/([\d,]+\.\d{3})/);
    const valueMatch = afterText.match(/([\d,]+\.\d{2})/);

    const amc = detectAmc(schemeName);
    const holding: HoldingData = {
      fund_name: schemeName,
      amc,
      folio_number: folio,
      units: unitMatch ? parseFloat(unitMatch[1].replace(/,/g, '')) : undefined,
      current_value: valueMatch ? parseFloat(valueMatch[1].replace(/,/g, '')) : undefined,
    };
    holdings.push(holding);

    console.log("FALLBACK holding:", JSON.stringify({
      schemeName, amc, folio,
      units: holding.units,
      value: holding.current_value,
    }));
  }

  if (holdings.length === 0) return null;

  console.log("FALLBACK EXTRACTED COUNT: " + holdings.length);
  return {
    investor_name: investorName || undefined,
    holdings,
    total_current_value: holdings.reduce((s, h) => s + (h.current_value || 0), 0),
    total_cost_value: holdings.reduce((s, h) => s + (h.cost_value || 0), 0),
  };
}

/**
 * Fallback parser: if every other parser fails, search the entire text for
 * known fund name patterns and extract whatever data is nearby.
 */
function parseFallbackFormat(lines: string[]): ParsedPortfolio | null {
  const holdings: HoldingData[] = [];
  let currentFund: Partial<HoldingData> = {};
  let investorName = '';

  // Try to find investor name
  for (const line of lines) {
    if (!investorName) {
      const invMatch = line.match(/Investor\s*[:–-]\s*(.+)/i);
      if (invMatch) { investorName = invMatch[1].trim(); }
      const nameLine = line.match(/^([A-Z][a-z]+\s+[A-Z][a-z]+)\s*(?:PAN|Email)/i);
      if (nameLine && !line.match(/Mutual|Fund|AMC|Scheme|Folio/i)) { investorName = nameLine[1]; }
    }
  }

  // Detect fund-like lines
  const fundKeywords = /Direct Plan|Regular Plan|Growth|IDCW|Dividend/i;

  for (const line of lines) {
    // Lines containing "Direct Plan" or "Regular Plan" are almost certainly fund names
    if (fundKeywords.test(line) && line.length > 15 && !line.match(/folio|AMC|unit|nav|value|cost|balance|investor/i)) {
      // Try to extract the fund name
      let name = line.replace(/^\d+\s*\.?\s*/, '').trim();
      // Remove known field prefixes
      name = name.replace(/^Scheme\s*(?:Name)?\s*[:–-]\s*/i, '').trim();
      name = name.replace(/^AMC\s*[:–-]\s*/i, '').trim();
      if (name.length > 15) {
        if (currentFund.fund_name) holdings.push(currentFund as HoldingData);
        currentFund = { fund_name: name, amc: detectAmc(name) };
        continue;
      }
    }

    // Folio number
    const folioMatch = line.match(/(?:Folio|Folio\s*(?:Number|No)?)\s*[:–-]\s*(\S+)/i);
    if (folioMatch) {
      currentFund.folio_number = folioMatch[1].trim();
    }

    if (currentFund.fund_name) {
      const unitMatch = line.match(/(?:Unit\s*Balance|Units?|Balance)\s*[:–-]\s*([\d,]+\.?\d*)/i);
      const navMatch = line.match(/NAV\s*[:–-]\s*₹?\s*([\d,]+\.?\d*)/i);
      const currentValMatch = line.match(/(?:Current\s*Value|Market\s*Value|Value)\s*[:–-]\s*₹?\s*([\d,]+\.?\d*)/i);
      const costValMatch = line.match(/(?:Cost\s*Value|Cost|Investment\s*Amount)\s*[:–-]\s*₹?\s*([\d,]+\.?\d*)/i);

      if (unitMatch) currentFund.units = parseFloat(unitMatch[1].replace(/,/g, ''));
      if (navMatch) currentFund.nav = parseFloat(navMatch[1].replace(/,/g, ''));
      if (currentValMatch) currentFund.current_value = parseFloat(currentValMatch[1].replace(/,/g, ''));
      if (costValMatch) currentFund.cost_value = parseFloat(costValMatch[1].replace(/,/g, ''));
      if (!currentFund.nav && !currentFund.current_value) {
        const valMatch = line.match(/₹\s*([\d,]+\.?\d*)/);
        if (valMatch) currentFund.current_value = parseFloat(valMatch[1].replace(/,/g, ''));
      }
    }
  }
  if (currentFund.fund_name) holdings.push(currentFund as HoldingData);
  if (holdings.length === 0) return null;
  return {
    investor_name: investorName || undefined,
    holdings,
    total_current_value: holdings.reduce((s, h) => s + (h.current_value || 0), 0),
    total_cost_value: holdings.reduce((s, h) => s + (h.cost_value || 0), 0),
  };
}

function parseCamsText(text: string): ParsedPortfolio | null {
  try {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const format = detectFormat(lines);
    console.log("FORMAT DETECTED: " + format);

    let result: ParsedPortfolio | null = null;
    let parserUsed = 'none';

    // Try CAMSCASWS format first (V3.x latest CAMS — tabular layout on single line)
    if (format.startsWith('CAMSCASWS') || format.startsWith('CAMS CAS')) {
      parserUsed = 'CAMSCASWS V3.x tabular';
      result = parseCAMSCASWSFormat(lines);
      console.log("PARSER BRANCH: " + parserUsed + (result ? ' -> SUCCESS' : ' -> no match'));
      if (result) {
        printFinalReport(format, parserUsed, result);
        return result;
      }
    }

    // Try modern field-value format (KFintech, generic field-value)
    parserUsed = 'field-value';
    result = parseFieldValueFormat(lines);
    console.log("PARSER BRANCH: " + parserUsed + (result ? ' -> SUCCESS' : ' -> no match'));
    if (result) {
      printFinalReport(format, parserUsed, result);
      return result;
    }

    // Try numbered-list format (older CAMS)
    parserUsed = 'numbered-list';
    result = parseNumberedListFormat(lines);
    console.log("PARSER BRANCH: " + parserUsed + (result ? ' -> SUCCESS' : ' -> no match'));
    if (result) {
      printFinalReport(format, parserUsed, result);
      return result;
    }

    // Never give up — try the fallback
    parserUsed = 'fallback (scheme-name scan)';
    result = parseFallbackFormat(lines);
    console.log("PARSER BRANCH: " + parserUsed + (result ? ' -> SUCCESS' : ' -> no match'));
    if (result) {
      printFinalReport(format, parserUsed, result);
      return result;
    }

    console.warn("PARSER: all strategies failed. Final report:");
    console.warn("FORMAT DETECTED: " + format);
    console.warn("PARSER USED: " + parserUsed);
    console.warn("ROWS DETECTED: 0");
    console.warn("HOLDINGS EXTRACTED: 0");
    console.warn("TOTAL VALUE: ₹0");
    return null;
  } catch (err) {
    console.error("PARSER: exception", err);
    return null;
  }
}

function printFinalReport(format: string, parserUsed: string, result: ParsedPortfolio): void {
  const totalValue = result.total_current_value ?? result.holdings.reduce((s, h) => s + (h.current_value || 0), 0);
  console.log("=== FINAL REPORT ===");
  console.log("FORMAT DETECTED: " + format);
  console.log("PARSER USED: " + parserUsed);
  console.log("ROWS DETECTED: " + result.holdings.length);
  console.log("HOLDINGS EXTRACTED: " + result.holdings.length);
  console.log("TOTAL VALUE: ₹" + Math.round(totalValue).toLocaleString());
  if (result.holdings.length > 0) {
    console.log("FIRST 5 HOLDINGS:");
    result.holdings.slice(0, 5).forEach((h, i) => {
      console.log("  " + (i + 1) + ". " + h.fund_name + " | AMC: " + h.amc + " | Units: " + (h.units ?? 'N/A') + " | Value: ₹" + Math.round(h.current_value ?? 0).toLocaleString());
    });
  }
  console.log("=== END REPORT ===");
}

export function CAMSUpload({ compact = false, onDataLoaded }: CAMSUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [portfolio, setPortfolio] = useState<ParsedPortfolio | null>(null);
  const [expandedFund, setExpandedFund] = useState<number | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [pdfPassword, setPdfPassword] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processPDF = useCallback(async (file: File, password?: string) => {
    setIsProcessing(true);
    setPortfolio(null);

    try {
      console.log("PDF UPLOADED", { name: file.name, size: file.size, type: file.type });
      console.log("PDF DECRYPTED - password provided:", !!password);

      toast.info('Extracting text from PDF...');
      const textContent = await extractTextFromPDF(file, password);

      console.log("PDF TEXT LENGTH", textContent.length);
      console.log("PDF PREVIEW", textContent.slice(0, 1000));

      if (textContent.length < 50) {
        console.log("EXTRACTION FAILED - text too short");
        toast.error('Could not extract text from PDF. It may be image-based.');
        setIsProcessing(false);
        return;
      }

      toast.info('Analyzing portfolio...');
      const parsed = parseCamsText(textContent);

      console.log("EXTRACTED HOLDINGS", parsed?.holdings ?? []);
      console.log("PARSED PORTFOLIO", parsed);

      if (!parsed || parsed.holdings.length === 0) {
        console.warn("PARSE RESULT: no holdings found");
        toast.error('No holdings found. Please check if it\'s a valid CAMS statement.');
        setIsProcessing(false);
        return;
      }

      setPortfolio(parsed);
      onDataLoaded?.(parsed);
      setNeedsPassword(false);
      setPendingFile(null);
      setPdfPassword('');
      toast.success(`Found ${parsed.holdings.length} fund(s) in your portfolio`);
    } catch (err: any) {
      console.error('CAMS parse error:', err);
      // Check if it's a password error
      if (err.message?.includes('password') || err.name === 'PasswordException') {
        setNeedsPassword(true);
        setPendingFile(file);
        setIsProcessing(false);
        toast.error('This PDF is password-protected. Please enter the password.');
        return;
      }
      toast.error(err.message || 'Failed to parse document');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please upload a PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Max 10MB.');
      return;
    }

    await processPDF(file);
  }, [processPDF]);

  const handlePasswordSubmit = async () => {
    if (!pendingFile || !pdfPassword) return;
    await processPDF(pendingFile, pdfPassword);
  };

  const reset = () => {
    setPortfolio(null);
    setExpandedFund(null);
    setNeedsPassword(false);
    setPdfPassword('');
    setPendingFile(null);
  };

  // Password prompt UI
  if (needsPassword) {
    return (
      <Card className="glass-card">
        <CardContent className="py-10 flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Password Required</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            This CAMS statement is password-protected. Please enter the PDF password to continue.
          </p>
          <div className="flex gap-2 w-full max-w-xs">
            <input
              type="password"
              value={pdfPassword}
              onChange={(e) => setPdfPassword(e.target.value)}
              placeholder="Enter PDF password"
              className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            />
            <Button onClick={handlePasswordSubmit} disabled={isProcessing || !pdfPassword} size="sm">
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Unlock'}
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="mt-3 text-muted-foreground" onClick={reset}>
            Cancel
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Compact button mode - shown in portfolio tab header when user has manual portfolio items
  if (compact && !portfolio) {
    return (
      <label className="cursor-pointer">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="hidden"
          disabled={isProcessing}
        />
        <Button asChild size="sm" disabled={isProcessing}>
          <span>
            {isProcessing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Upload CAMS
              </>
            )}
          </span>
        </Button>
      </label>
    );
  }

  // Full upload UI - shown when portfolio is empty
  if (!portfolio && !compact) {
    return (
      <Card className="glass-card">
        <CardContent className="py-10 flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Upload CAMS Statement</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            Upload your CAMS Consolidated Account Statement (PDF) to analyze your portfolio health, 
            get fund-level insights, and find better alternatives for underperforming funds.
          </p>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isProcessing}
            />
            <Button asChild disabled={isProcessing}>
              <span>
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CAMS PDF
                  </>
                )}
              </span>
            </Button>
          </label>
        </CardContent>
      </Card>
    );
  }

  if (!portfolio) return null;

  // Portfolio results view
  const overall = getOverallHealth(portfolio.holdings);
  const overallConfig = HEALTH_CONFIG[overall];
  const totalCurrent = portfolio.total_current_value ?? portfolio.holdings.reduce((s, h) => s + (h.current_value ?? 0), 0);
  const totalCost = portfolio.total_cost_value ?? portfolio.holdings.reduce((s, h) => s + (h.cost_value ?? 0), 0);
  const totalReturn = totalCost > 0 ? ((totalCurrent - totalCost) / totalCost) * 100 : 0;

  // More realistic projections using category-based expected returns
  const annualizedReturn = totalCost > 0 ? totalReturn / 100 : 0;
  const conservativeGrowth = Math.max(0.06, Math.min(annualizedReturn * 0.7, 0.14));
  const baseGrowth = Math.max(0.08, Math.min(annualizedReturn * 0.85, 0.16));
  const proj1Y = totalCurrent * (1 + conservativeGrowth);
  const proj3Y = totalCurrent * Math.pow(1 + baseGrowth, 3);
  const proj5Y = totalCurrent * Math.pow(1 + baseGrowth, 5);

  // Find replacement suggestions for degrading funds
  const degradingHoldings = portfolio.holdings.filter(h => getHealthStatus(h) === 'degrading');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {portfolio.investor_name && (
            <p className="text-sm text-muted-foreground">Portfolio of <span className="text-foreground font-medium">{portfolio.investor_name}</span></p>
          )}
          <h3 className="text-lg font-semibold">{portfolio.holdings.length} Fund(s) Found</h3>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Upload New
        </Button>
      </div>

      {/* Health-o-Meter */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="py-6">
          <div className="flex items-center gap-4 mb-5">
            <div className={cn('h-16 w-16 rounded-2xl flex items-center justify-center', overallConfig.bg)}>
              <overallConfig.icon className={cn('h-8 w-8', overallConfig.color)} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Portfolio Health-o-Meter</p>
              <p className={cn('text-3xl font-bold', overallConfig.color)}>{overallConfig.label}</p>
            </div>
          </div>
          {/* Health bar with percentages */}
          <div className="space-y-2">
            <div className="flex gap-1 h-4 rounded-full overflow-hidden bg-muted/30">
              {(['healthy', 'moderate', 'degrading'] as HealthStatus[]).map(status => {
                const count = portfolio.holdings.filter(h => getHealthStatus(h) === status).length;
                const pct = (count / portfolio.holdings.length) * 100;
                return pct > 0 ? (
                  <div key={status} className={cn('h-full rounded-full transition-all', HEALTH_CONFIG[status].barColor)} style={{ width: `${pct}%` }} />
                ) : null;
              })}
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-success" /> Healthy ({portfolio.holdings.filter(h => getHealthStatus(h) === 'healthy').length})</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-warning" /> Moderate ({portfolio.holdings.filter(h => getHealthStatus(h) === 'moderate').length})</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-destructive" /> Needs Attention ({portfolio.holdings.filter(h => getHealthStatus(h) === 'degrading').length})</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="glass-card">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total Investment</p>
            <p className="text-lg font-bold">₹{Math.round(totalCost).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Current Value</p>
            <p className={cn('text-lg font-bold', totalReturn >= 0 ? 'text-success' : 'text-destructive')}>₹{Math.round(totalCurrent).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Expected (3Y)</p>
            <p className="text-lg font-bold text-foreground">₹{Math.round(proj3Y).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Expected (5Y)</p>
            <p className="text-lg font-bold text-foreground">₹{Math.round(proj5Y).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Individual Fund Holdings */}
      <div className="space-y-3">
        {portfolio.holdings.map((holding, idx) => {
          const status = getHealthStatus(holding);
          const config = HEALTH_CONFIG[status];
          const returnPct = (holding.cost_value && holding.cost_value > 0) 
            ? ((holding.current_value ?? 0) - holding.cost_value) / holding.cost_value * 100 
            : null;
          const isExpanded = expandedFund === idx;

          return (
            <Card key={idx} className="glass-card">
              <CardContent className="py-4">
                <div 
                  className="flex items-start justify-between gap-3 cursor-pointer"
                  onClick={() => setExpandedFund(isExpanded ? null : idx)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm text-foreground truncate">{holding.fund_name}</h4>
                      <Badge variant="outline" className={cn('text-[10px] shrink-0 border-0', config.bg, config.color)}>
                        {config.label}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>{holding.amc}</span>
                      {holding.category && <span>• {holding.category}</span>}
                      {returnPct != null && (
                        <span className={cn(returnPct >= 0 ? 'text-success' : 'text-destructive')}>
                          {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {holding.current_value != null && (
                      <span className="text-sm font-semibold text-foreground whitespace-nowrap">₹{Math.round(holding.current_value).toLocaleString()}</span>
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border/30 space-y-2 text-xs">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {holding.units != null && <div><span className="text-muted-foreground">Units:</span> <span className="font-medium">{holding.units.toFixed(3)}</span></div>}
                      {holding.nav != null && <div><span className="text-muted-foreground">NAV:</span> <span className="font-medium">₹{holding.nav.toFixed(2)}</span></div>}
                      {holding.cost_value != null && <div><span className="text-muted-foreground">Cost:</span> <span className="font-medium">₹{Math.round(holding.cost_value).toLocaleString()}</span></div>}
                      {holding.folio_number && <div><span className="text-muted-foreground">Folio:</span> <span className="font-medium">{holding.folio_number}</span></div>}
                    </div>
                    {status === 'degrading' && (
                      <div className="mt-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-destructive font-medium mb-1">⚠️ This fund is underperforming</p>
                        <p className="text-muted-foreground mb-2">Consider switching to a better-performing fund in the same {holding.category || 'category'}.</p>
                        <p className="text-foreground font-medium mb-1">Suggested Replacements:</p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                          <li>Use the AI tab → ask "Best {holding.category || 'fund'} alternatives"</li>
                          <li>Check the All Funds tab for top performers in this category</li>
                          <li>Look for funds with higher Sharpe ratio and lower expense</li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-warning/10 border-warning/30">
        <CardContent className="py-3 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <strong className="text-warning">Disclaimer:</strong> Health analysis is based on cost vs current value from the CAMS statement. 
            Projections use conservative estimates (6-16% annual growth capped) and are not guaranteed. Consult a financial advisor before making changes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
