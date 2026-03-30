'use client';
import ExcelJS from 'exceljs';

export const exportChargesReportToExcel = async (
  data: any[],
  reportType: string,
  startDate?: string,
  endDate?: string
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Charges Report');

  // Title Rows
  worksheet.mergeCells('A1:H1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'AL NASAR BASHEER LOGISTICS';
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: 'center' };

  worksheet.mergeCells('A2:H2');
  const subtitleCell = worksheet.getCell('A2');
  subtitleCell.value = `${reportType} REPORT`;
  subtitleCell.font = { bold: true, size: 14 };
  subtitleCell.alignment = { horizontal: 'center' };

  worksheet.mergeCells('A3:H3');
  worksheet.getCell('A3').value = `Period: ${startDate || 'Start'} to ${endDate || 'End'}`;
  worksheet.getCell('A3').alignment = { horizontal: 'center' };

  // Headers
  const headerRow = worksheet.addRow(['Charges No', 'Charge Name', 'Date', 'Order No', 'Vehicle No', 'Amount (PKR)', 'Received (PKR)', 'Pending (PKR)']);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Data
  let totalAmount = 0;
  let totalReceived = 0;
  let totalPending = 0;

  data.forEach((row) => {
    const r = worksheet.addRow([
      row.chargeNo,
      row.chargeName,
      row.date,
      row.orderNo,
      row.vehicleNo,
      row.amount || 0,
      row.received || 0,
      row.pending || 0
    ]);
    r.getCell(6).numFmt = '#,##0.00';
    r.getCell(7).numFmt = '#,##0.00';
    r.getCell(8).numFmt = '#,##0.00';

    totalAmount += row.amount || 0;
    totalReceived += row.received || 0;
    totalPending += row.pending || 0;
  });

  // Add totals row
  const totalsRow = worksheet.addRow(['', '', '', '', 'Total', totalAmount, totalReceived, totalPending]);
  totalsRow.font = { bold: true };
  totalsRow.getCell(6).numFmt = '#,##0.00';
  totalsRow.getCell(7).numFmt = '#,##0.00';
  totalsRow.getCell(8).numFmt = '#,##0.00';
  totalsRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
  });

  worksheet.getColumn(1).width = 15;
  worksheet.getColumn(2).width = 25;
  worksheet.getColumn(3).width = 15;
  worksheet.getColumn(4).width = 15;
  worksheet.getColumn(5).width = 15;
  worksheet.getColumn(6).width = 18;
  worksheet.getColumn(7).width = 18;
  worksheet.getColumn(8).width = 18;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Charges_Report_${new Date().getTime()}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};
