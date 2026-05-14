const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

exports.generateMonthlyReport = async (req, res) => {
  try {
    const { month } = req.query; // format: 'YYYY-MM'
    
    if (!month) {
      return res.status(400).json({ message: 'Month parameter (YYYY-MM) is required' });
    }

    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr);
    const monthIndex = parseInt(monthStr) - 1; // 0-indexed for JS Date

    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59);

    // Fetch teachers
    const teachers = await prisma.user.findMany({
      where: { role: 'GURU' },
      select: { id: true, name: true, nip: true, dept: true },
      orderBy: { name: 'asc' }
    });

    // Fetch attendance records for the month
    const attendances = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Fetch approved leaves for the month
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          { startDate: { lte: endDate, gte: startDate } },
          { endDate: { lte: endDate, gte: startDate } },
          { startDate: { lte: startDate }, endDate: { gte: endDate } }
        ]
      }
    });

    // Create Excel Workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SIGURU System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(`Rekap Absensi ${month}`);

    // Headers
    sheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'NIP', key: 'nip', width: 15 },
      { header: 'Nama Guru', key: 'name', width: 25 },
      { header: 'Departemen', key: 'dept', width: 20 },
      { header: 'Hadir', key: 'hadir', width: 10 },
      { header: 'Terlambat', key: 'terlambat', width: 12 },
      { header: 'Sakit', key: 'sakit', width: 10 },
      { header: 'Izin Dinas', key: 'dinas', width: 12 },
      { header: 'Cuti', key: 'cuti', width: 10 },
      { header: 'Total Kehadiran (%)', key: 'percentage', width: 20 },
    ];

    // Style headers
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' }
    };

    const daysInMonth = endDate.getDate();

    // Fill data
    teachers.forEach((teacher, index) => {
      // Calculate attendance stats
      const teacherAttendances = attendances.filter(a => a.userId === teacher.id);
      const hadir = teacherAttendances.filter(a => a.status === 'HADIR').length;
      const terlambat = teacherAttendances.filter(a => a.status === 'TERLAMBAT').length;

      // Calculate leave days inside this month
      let sakit = 0, dinas = 0, cuti = 0;
      
      const teacherLeaves = leaves.filter(l => l.userId === teacher.id);
      teacherLeaves.forEach(leave => {
        // Calculate overlap days in the current month
        const overlapStart = leave.startDate > startDate ? leave.startDate : startDate;
        const overlapEnd = leave.endDate < endDate ? leave.endDate : endDate;
        
        if (overlapStart <= overlapEnd) {
          const diffTime = Math.abs(overlapEnd - overlapStart);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both ends
          
          if (leave.type === 'SAKIT') sakit += diffDays;
          else if (leave.type === 'DINAS') dinas += diffDays;
          else if (leave.type === 'CUTI' || leave.type === 'PERSONAL') cuti += diffDays;
        }
      });

      // Simple working days approximation (exclude weekends? For MVP, we just use total days or standard 22 days)
      const workDays = 22; // Approximation
      const totalPresent = hadir + terlambat;
      const percentage = Math.min(Math.round((totalPresent / workDays) * 100), 100);

      sheet.addRow({
        no: index + 1,
        nip: teacher.nip,
        name: teacher.name,
        dept: teacher.dept || '-',
        hadir,
        terlambat,
        sakit,
        dinas,
        cuti,
        percentage: `${percentage}%`
      });
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Rekap_Absensi_${month}.xlsx"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error generating report:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Internal server error while generating report' });
    }
  }
};

const PDFDocument = require('pdfkit-table');

exports.generateMonthlyReportPDF = async (req, res) => {
  try {
    const { month } = req.query; // format: 'YYYY-MM'
    
    if (!month) {
      return res.status(400).json({ message: 'Month parameter (YYYY-MM) is required' });
    }

    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr);
    const monthIndex = parseInt(monthStr) - 1;

    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59);

    // Fetch data
    const teachers = await prisma.user.findMany({
      where: { role: 'GURU' },
      select: { id: true, name: true, nip: true, dept: true },
      orderBy: { name: 'asc' }
    });

    const attendances = await prisma.attendance.findMany({
      where: { date: { gte: startDate, lte: endDate } }
    });

    const leaves = await prisma.leaveRequest.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          { startDate: { lte: endDate, gte: startDate } },
          { endDate: { lte: endDate, gte: startDate } },
          { startDate: { lte: startDate }, endDate: { gte: endDate } }
        ]
      }
    });

    // Process data
    const tableData = teachers.map((teacher, index) => {
      const teacherAttendances = attendances.filter(a => a.userId === teacher.id);
      const hadir = teacherAttendances.filter(a => a.status === 'HADIR').length;
      const terlambat = teacherAttendances.filter(a => a.status === 'TERLAMBAT').length;

      let sakit = 0, dinas = 0, cuti = 0;
      const teacherLeaves = leaves.filter(l => l.userId === teacher.id);
      teacherLeaves.forEach(leave => {
        const overlapStart = leave.startDate > startDate ? leave.startDate : startDate;
        const overlapEnd = leave.endDate < endDate ? leave.endDate : endDate;
        if (overlapStart <= overlapEnd) {
          const diffDays = Math.ceil(Math.abs(overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1;
          if (leave.type === 'SAKIT') sakit += diffDays;
          else if (leave.type === 'DINAS') dinas += diffDays;
          else cuti += diffDays;
        }
      });

      const percentage = Math.min(Math.round(((hadir + terlambat) / 22) * 100), 100);

      return [
        (index + 1).toString(),
        teacher.nip,
        teacher.name,
        teacher.dept || '-',
        hadir.toString(),
        terlambat.toString(),
        sakit.toString(),
        dinas.toString(),
        cuti.toString(),
        `${percentage}%`
      ];
    });

    // Generate PDF
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Rekap_Absensi_${month}.pdf"`);
    
    doc.pipe(res);

    doc.fontSize(20).text(`Rekapitulasi Absensi Guru`, { align: 'center' });
    doc.fontSize(12).text(`Periode: ${month}`, { align: 'center' });
    doc.moveDown(2);

    const table = {
      headers: ['No', 'NIP', 'Nama', 'Dept', 'Hadir', 'Telat', 'Sakit', 'Dinas', 'Cuti', '%'],
      rows: tableData
    };

    await doc.table(table, {
      prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
      prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
        doc.font('Helvetica').fontSize(10);
      },
    });

    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Internal server error while generating PDF' });
    }
  }
};

exports.getRecentReports = async (req, res) => {
  try {
    // Get all attendance records, extract unique months
    const attendances = await prisma.attendance.findMany({
      select: { date: true }
    });

    // Extract unique months from attendance data
    const monthsSet = new Set();
    attendances.forEach(a => {
      if (a.date) {
        const year = a.date.getFullYear();
        const month = String(a.date.getMonth() + 1).padStart(2, '0');
        monthsSet.add(`${year}-${month}`);
      }
    });

    // Convert to sorted array (most recent first) and limit to 12 months
    const months = Array.from(monthsSet).sort().reverse().slice(0, 12);

    // Also add current month if not already in list
    const currentMonth = new Date();
    const currentMonthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
    if (!months.includes(currentMonthStr)) {
      months.unshift(currentMonthStr);
    }

    // Format for display (with month names)
    const reportsWithNames = months.map(monthStr => {
      const [year, monthNum] = monthStr.split('-');
      const date = new Date(year, parseInt(monthNum) - 1);
      const monthName = date.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
      
      return {
        month: monthStr,
        monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        canDownloadPdf: true,
        canDownloadExcel: true
      };
    });

    res.status(200).json({
      reports: reportsWithNames
    });
  } catch (error) {
    console.error('Error getting recent reports:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
