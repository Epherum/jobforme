// Cleanup helper for the "Jobs_Today" tab.
//
// Goal: remove rows whose Title matches one of your negative terms.
//
// Safer workflow:
// - Start with dryRun=true to preview matches in Logs.
// - Then set dryRun=false to actually delete.
//
// Columns in Jobs_Today (from your sheet export):
// A source
// B labels
// C title
// D company
// E location
// F date_added
// G url
// H decision
// I notes

const JOBS_TODAY_TAB = 'Jobs_Today';
const JOBS_TODAY_COL_TITLE = 3;

// For Jobs_Today we split "bad" titles into:
// - too senior: keep row but set Decision to a short tag
// - delete: remove row entirely

const DECISION_TOO_SENIOR = 'OVERSENIOR'; // short + explicit
const JOBS_TODAY_COL_DECISION = 8;

// Case-insensitive regex patterns.
const TOO_SENIOR_PATTERNS = [
  '\\bexecutive\\b',
  '\\bdirector\\b',
  '\\bdirecteur\\b',
  '\\bdirectrice\\b',
  '\\bvp\\b',
  '\\bvice\\s+president\\b',
  '\\bhead\\s+of\\b',
  '\\bchief\\b',
  '\\bc\\-level\\b',
  '\\bprincipal\\b',
  '\\bstaff\\b',
  '\\blead\\b',
  '\\bsenior\\b',
  '\\bsr\\b',
  '\\bconfirmé\\b',
  '\\bconfirmée\\b',
];

const DELETE_TITLE_PATTERNS = [
  // Sales-heavy pipeline roles
  'sales\\s+development\\s+representative',
  'business\\s+development\\s+representative',
  '\\bsdr\\b',
  '\\bbdr\\b',

  // Retail / cashier / service / logistics
  '\\bcaissier\\b',
  '\\bcaisse\\b',
  '\\bcashier\\b',
  '\\blivreur\\b',
  '\\bcoursier\\b',
  '\\bchauffeur\\b',
  '\\bpréparateur\\b',
  '\\bpreparateur\\b',

  // Non-software engineering / electrical
  'électricit',
  'electricit',
  'electri(?:c|que)',
  '\\bcfo\\b',
  '\\bcfa\\b',
  'génie\\s+civil',
  'genie\\s+civil',
  'revit',
  'coffrage',
  'ferraillage',

  // Manufacturing/industrial/quality
  'manufactur',
  'industrialisation',
  'maintenance\\s+industrielle',
  'maintenance',
  'assemblage',
  'contrôleur\\s+qualité',
  'controleur\\s+qualite',

  // QA/testing
  '\\bqa\\b',
  'test(\\b|eur|euse)',
  'fonctionnel(?:le)?',

  // Accounting/HR/marketing/product/video
  'comptab',
  'finance\\b',
  'ressources\\s+humaines',
  '\\brh\\b',
  'marketing\\b',
  'chef\\s+de\\s+produit',
  'product\\s+manager',
  'video\\s+editor',
  'monteur\\s+vid(?:é|e)o',
];

function purgeJobsTodayNotAFitByTitle() {
  const dryRun = true; // flip to false to write/delete

  const reSenior = new RegExp(TOO_SENIOR_PATTERNS.map(p => `(?:${p})`).join('|'), 'i');
  const reDelete = new RegExp(DELETE_TITLE_PATTERNS.map(p => `(?:${p})`).join('|'), 'i');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(JOBS_TODAY_TAB);
  if (!sh) throw new Error(`Missing tab: ${JOBS_TODAY_TAB}`);

  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 2) {
    Logger.log('No rows to process.');
    return;
  }

  const values = sh.getRange(1, 1, lastRow, lastCol).getValues();

  // Collect actions (1-indexed sheet rows), skip header.
  const toSenior = [];
  const toDelete = [];

  for (let r = 2; r <= lastRow; r++) {
    const title = String(values[r - 1][JOBS_TODAY_COL_TITLE - 1] || '').trim();
    if (!title) continue;

    if (reSenior.test(title)) {
      toSenior.push({ row: r, title });
      continue;
    }

    if (reDelete.test(title)) {
      toDelete.push({ row: r, title });
      continue;
    }
  }

  Logger.log(`Too-senior matches: ${toSenior.length}`);
  toSenior.slice(0, 30).forEach(m => Logger.log(`[OVERSENIOR] #${m.row}: ${m.title}`));

  Logger.log(`Delete matches: ${toDelete.length}`);
  toDelete.slice(0, 30).forEach(m => Logger.log(`[DELETE] #${m.row}: ${m.title}`));

  if (dryRun) {
    Logger.log('Dry run ON. Set dryRun=false to apply changes.');
    return;
  }

  // 1) Mark too-senior rows by setting Decision, but do not override a non-empty decision.
  toSenior.forEach(m => {
    const cell = sh.getRange(m.row, JOBS_TODAY_COL_DECISION);
    const cur = String(cell.getValue() || '').trim();
    if (!cur || cur === 'NEW') {
      cell.setValue(DECISION_TOO_SENIOR);
    }
  });

  // 2) Delete rows from bottom to top so row numbers stay valid.
  toDelete.sort((a, b) => b.row - a.row);
  toDelete.forEach(m => sh.deleteRow(m.row));

  Logger.log(`Marked OVERSENIOR=${toSenior.length}, Deleted=${toDelete.length}.`);
}
