# Category Debug Report — Data.xlsx

## All Unique Categories (Count per Sheet)

| Category | Count | Sheet(s) |
|----------|-------|----------|
| EQ-LC | 191 | Equity |
| EQ-FLX | 130 | Equity |
| EQ-THEMATIC | 103 | Equity |
| EQ-L&MC | 83 | Equity |
| EQ-MC | 75 | Equity |
| EQ-BANK | 72 | Equity |
| EQ-INTL | 66 | Equity |
| EQ-SC | 60 | Equity |
| EQ-ELSS | 55 | Equity |
| EQ-VAL | 40 | Equity |
| EQ-MLC | 39 | Equity |
| EQ-Consumption | 37 | Equity |
| EQ-IT | 33 | Equity |
| EQ-Pharma | 33 | Equity |
| EQ-INFRA | 27 | Equity |
| EQ-Manufacturing | 20 | Equity |
| EQ-TBC | 19 | Equity |
| EQ-SA&T | 17 | Equity |
| EQ-DIV Y | 13 | Equity |
| EQ-Innovation | 13 | Equity |
| EQ-PSU | 13 | Equity |
| EQ-T-ESG | 12 | Equity |
| EQ-Quant | 11 | Equity |
| EQ-MNC | 9 | Equity |
| EQ-Energy | 8 | Equity |
| Gold-Funds | 52 | Commodities |
| Silver-Funds | 33 | Commodities |
| DT-TM | 103 | Debt |
| DT-LIQ | 60 | Debt |
| DT-OVERNHT | 38 | Debt |
| DT-GL | 35 | Debt |
| DT-USD | 31 | Debt |
| DT-LD | 28 | Debt |
| DT-SD | 28 | Debt |
| DT-MM | 27 | Debt |
| DT-DB | 23 | Debt |
| DT-CB | 21 | Debt |
| DT-BK & PSU | 20 | Debt |
| DT-CR | 14 | Debt |
| DT-M to LD | 14 | Debt |
| DT-MD | 13 | Debt |
| DT-Floater | 12 | Debt |
| DT-LONG D | 11 | Debt |
| DT-Gilt 10Y CD | 9 | Debt |
| DT-OTH | 5 | Debt |
| HY-MAA | 51 | Hybrid |
| HY-AH | 45 | Hybrid |
| HY-DAA | 42 | Hybrid |
| HY-AR | 38 | Hybrid |
| HY-CH | 29 | Hybrid |
| HY-EQ S | 25 | Hybrid |
| HY-IPA | 21 | Hybrid |
| HY-BH | 5 | Hybrid |
| UNKNOWN | 66 | Equity, Debt, Hybrid |

## Category → Group Mapping (`detectCategoryGroup`)

### INDEX (detected by fund name)
Funds with names containing `index`, `nifty`, `sensex`, or `etf`.

### SECTORAL
EQ-BANK, EQ-IT, EQ-Pharma, EQ-INFRA, EQ-PSU, EQ-Energy, EQ-Consumption, EQ-THEMATIC, EQ-SA&T, EQ-TBC, EQ-Manufacturing, EQ-Innovation

### EQ-LC (Large Cap)
EQ-LC, EQ-DIV Y

### EQ-FLX (Flexi / Mid-Large / Value / Quant)
EQ-MLC, EQ-FLX, EQ-VAL, EQ-Quant

### EQ-L&MC (Large & Mid Cap)
EQ-L&MC

### EQ-MC (Mid Cap)
EQ-MC

### EQ-SC (Small Cap)
EQ-SC

### EQ-ELSS (ELSS / Tax Saver)
EQ-ELSS

### Groups NOT covered in any PROFILE_MAPPING:
- EQ-INTL (66 funds) — International funds are never recommended
- EQ-MNC (9 funds) — Never recommended
- EQ-T-ESG (12 funds) — Never recommended
- Gold-Funds (52), Silver-Funds (33) — Commodities never recommended
- All DT-* Debt categories — Only DT-SD is covered (via DT-SD group → Conservative profile)
- All HY-* Hybrid categories — HY-CH, HY-DAA, HY-AH are covered

### HY-CH (Conservative Hybrid)
HY-CH, HY-BH, HY-AR, HY-EQ S, HY-IPA

### HY-DAA (Dynamic Asset Allocation)
HY-DAA, HY-MAA

### HY-AH (Aggressive Hybrid)
HY-AH

### DT-SD (Short Duration & similar)
DT-SD, DT-LD, DT-MD, DT-CB, DT-BK & PSU, DT-Floater, DT-LIQ, DT-USD, DT-OVERNHT, DT-MM, DT-GL, DT-TM, DT-LONG D, DT-M to LD, DT-CR, DT-DB, DT-Gilt 10Y CD, DT-OTH

## Category Groups by Profile

### Conservative
- INDEX (35%)
- EQ-LC (35%)
- HY-CH (20%)
- DT-SD (10%)

### Moderate
- EQ-LC (30%)
- EQ-FLX (30%)
- HY-DAA (20%)
- HY-AH (20%)

### Growth
- EQ-FLX (30%)
- EQ-L&MC (25%)
- EQ-MC (25%)
- EQ-ELSS (20%)

### Aggressive
- EQ-MC (30%)
- EQ-SC (30%)
- SECTORAL (20%)
- EQ-FLX (20%)

## Notable Gaps
1. **Commodities (Gold, Silver)** — Not mapped to any profile
2. **International (EQ-INTL)** — 66 funds excluded
3. **EQ-T-ESG, EQ-MNC** — Small niches excluded
4. **Most Debt categories** — Only DT-SD group (short-duration) is used (Conservative only)
5. **EQ-DIV Y** — Mapped to EQ-LC group, OK (Conservative/Moderate)
