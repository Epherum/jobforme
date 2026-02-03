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

// Edit this list freely. These are case-insensitive regex patterns.
const NEGATIVE_TITLE_PATTERNS = [
  // Seniority/leadership
  '\\bexecutive\\b',
  '\\bdirector\\b',
  '\\bdirecteur\\b',
  '\\bdirectrice\\b',
  '\\bsenior\\b',
  '\\bsr\\b',
  '\\bhead\\s+of\\b',
  '\\bvp\\b',

  // Retail / cashier
  '\\bcaissier\\b',
  '\\bcaisse\\b',
  '\\bcashier\\b',
  '\\bvendeur\\b',
  '\\bvendeuse\\b',

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

  // Manufacturing/quality
  'assemblage',
  'contrôleur\\s+qualité',
  'controleur\\s+qualite',
  '\\bqualité\\b',
  '\\bqualite\\b',

  // QA (if you want)
  '\\bqa\\b',
  'fonctionnel(?:le)?',
];

function purgeJobsTodayNotAFitByTitle() {
  const dryRun = true; // flip to false to delete

  const re = new RegExp(NEGATIVE_TITLE_PATTERNS.map(p => `(?:${p})`).join('|'), 'i');

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

  // Collect matching row indices (1-indexed sheet rows), skip header.
  const matches = [];
  for (let r = 2; r <= lastRow; r++) {
    const title = String(values[r - 1][JOBS_TODAY_COL_TITLE - 1] || '').trim();
    if (!title) continue;
    if (re.test(title)) {
      matches.push({ row: r, title });
    }
  }

  Logger.log(`Matches: ${matches.length}`);
  matches.slice(0, 50).forEach(m => Logger.log(`#${m.row}: ${m.title}`));
  if (matches.length > 50) Logger.log('… (more omitted)');

  if (dryRun) {
    Logger.log('Dry run ON. Set dryRun=false to delete these rows.');
    return;
  }

  // Delete from bottom to top so row numbers stay valid.
  matches.sort((a, b) => b.row - a.row);
  matches.forEach(m => sh.deleteRow(m.row));

  Logger.log(`Deleted ${matches.length} rows.`);
}
