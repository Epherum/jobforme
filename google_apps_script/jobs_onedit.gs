// Google Apps Script for the "Jobs" tab.
//
// Features:
// - Adds a dropdown (data validation) for the Decision column.
// - When Decision becomes "APPLIED", sets decision_at timestamp once.
// - If Decision is cleared/changed away from "APPLIED", it clears decision_at.
//
// Install:
// 1) Open the Google Sheet
// 2) Extensions -> Apps Script
// 3) Paste this file
// 4) Run setupJobsSheet() once (authorize)
//
// Columns (1-indexed):
// A date_added
// B source
// C title
// D company
// E location
// F url
// G labels
// H decision
// I decision_at
// J notes

const TAB_NAME = 'Jobs';
const COL_DECISION = 8;
const COL_DECISION_AT = 9;

const DECISIONS = [
  'NEW',
  'SAVED',
  'APPLIED',
  'SKIPPED_NOT_A_FIT',
  'REJECTED',
  'ARCHIVED',
];

function setupJobsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(TAB_NAME);
  if (!sheet) throw new Error(`Missing tab: ${TAB_NAME}`);

  // Apply dropdown validation to a generous range.
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(DECISIONS, true)
    .setAllowInvalid(false)
    .build();

  sheet.getRange(2, COL_DECISION, sheet.getMaxRows() - 1, 1).setDataValidation(rule);
}

function onEdit(e) {
  const range = e.range;
  const sheet = range.getSheet();
  if (sheet.getName() !== TAB_NAME) return;
  if (range.getRow() < 2) return; // ignore header

  if (range.getColumn() === COL_DECISION) {
    const decision = String(range.getValue() || '').trim();
    const tsCell = sheet.getRange(range.getRow(), COL_DECISION_AT);

    if (decision === 'APPLIED') {
      if (!tsCell.getValue()) {
        tsCell.setValue(new Date());
      }
    } else {
      // Keep sheet clean. If you want to preserve timestamps even when changing your mind,
      // remove this block.
      tsCell.clearContent();
    }
  }
}
