function doPost(e) {
  try {
    const sheetId = 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE';
    const sheetName = 'Reviews';

    const data = JSON.parse(e.postData.contents);
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    const sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'submitted_at',
        'review_id',
        'reviewer',
        'date',
        'restaurant',
        'burger_name',
        'best_with',
        'tie_notes',
        'total',
        'scores_json'
      ]);
    }

    sheet.appendRow([
      new Date(),
      data.id || '',
      data.reviewer || '',
      data.date || '',
      data.restaurant || '',
      data.burgerName || '',
      data.bestWith || '',
      data.tieNotes || '',
      data.total || 0,
      JSON.stringify(data.scores || [])
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
