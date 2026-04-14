function doPost(e) {
  try {
    const sheetId = 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE';
    const sheetName = 'Reviews';

    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(sheetId);
    const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'submitted_at',
        'review_id',
        'reviewer',
        'date',
        'restaurant',
        'burger_type',
        'total',
        'best_with',
        'tie_notes',
        'scores_json'
      ]);
    }

    sheet.appendRow([
      new Date(),
      data.id || '',
      data.reviewer || '',
      data.date || '',
      data.restaurant || '',
      data.burgerType || '',
      data.total || 0,
      data.bestWith || '',
      data.tieNotes || '',
      JSON.stringify(data.scores || [])
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
