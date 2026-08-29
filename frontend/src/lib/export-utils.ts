export interface AttendanceExportRow {
  date: string;
  day: string;
  checkIn: string;
  checkOut: string;
  workingHours: string;
  status: string;
  markedBy: string;
}

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function buildRows(records: any[]) {
  return records.map((record, index) => ({
    '#': index + 1,
    Date: record.attendanceDate
      ? new Date(record.attendanceDate).toLocaleDateString('en-GB')
      : '--',
    Day: record.attendanceDate
      ? new Date(record.attendanceDate).toLocaleDateString('en-GB', { weekday: 'long' })
      : '--',
    'Check In': record.checkInTime
      ? new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '--',
    'Check Out': record.checkOutTime
      ? new Date(record.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '--',
    'Working Hours': typeof record.workingHours === 'number'
      ? `${record.workingHours.toFixed(2)} h`
      : '--',
    Status: record.status || 'UNKNOWN',
    'Marked By': record.markedBy || 'System',
  }));
}

export async function exportAttendanceCsv(records: any[], projectName: string) {
  const rows = buildRows(records);
  if (!rows.length) {
    return;
  }

  const columns = Object.keys(rows[0]) as Array<keyof (typeof rows)[number]>;

const csvData = [
  columns.join(','),
  ...rows.map((row) =>
    columns
      .map((column) => {
        const value = String(row[column] ?? '');
        return `"${value.replace(/"/g, '""')}"`;
      })
      .join(',')
  ),
].join('\r\n');

  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, `${projectName.replace(/\s+/g, '_')}_attendance.csv`);
}

export async function exportAttendanceExcel(records: any[], projectName: string) {
  const xlsx = await import('xlsx');
  const rows = buildRows(records);

  const worksheet = xlsx.utils.json_to_sheet(rows);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Attendance');

  const workbookBlob = new Blob([xlsx.write(workbook, { bookType: 'xlsx', type: 'array' })], {
    type: 'application/octet-stream',
  });

  downloadFile(workbookBlob, `${projectName.replace(/\s+/g, '_')}_attendance.xlsx`);
}

export async function exportAttendancePdf(records: any[], projectName: string) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const title = `${projectName} Attendance History`;

  doc.setFontSize(16);
  doc.text(title, 40, 40);
  doc.setFontSize(10);
  const startX = 40;
  let y = 70;
  const lineHeight = 18;
  const maxWidth = 760;

  const headers = ['#', 'Date', 'Day', 'Check In', 'Check Out', 'Working Hours', 'Status', 'Marked By'];
  const columnWidths = [25, 75, 90, 75, 75, 95, 90, 180];

  const drawRow = (cells: string[]) => {
    let x = startX;
    cells.forEach((cell, index) => {
      doc.text(cell, x, y);
      x += columnWidths[index] || 80;
    });
    y += lineHeight;
  };

  drawRow(headers);
  doc.setLineWidth(0.5);
  doc.line(startX, y - 12, startX + maxWidth, y - 12);

  records.forEach((record, index) => {
    if (y > 540) {
      doc.addPage();
      y = 40;
    }
    const row = [
      String(index + 1),
      record.attendanceDate ? new Date(record.attendanceDate).toLocaleDateString('en-GB') : '--',
      record.attendanceDate ? new Date(record.attendanceDate).toLocaleDateString('en-GB', { weekday: 'short' }) : '--',
      record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--',
      record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--',
      typeof record.workingHours === 'number' ? `${record.workingHours.toFixed(2)} h` : '--',
      record.status || '--',
      String(record.markedBy || 'System'),
    ];
    drawRow(row);
  });

  doc.save(`${projectName.replace(/\s+/g, '_')}_attendance.pdf`);
}
