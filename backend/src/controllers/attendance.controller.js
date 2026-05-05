const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Helper to get today's date at midnight for querying
const getTodayDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

exports.checkIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lat, lng } = req.body;
    
    // Multer places the file in req.file
    if (!req.file) {
      return res.status(400).json({ message: 'Photo is required for check-in' });
    }

    const photoUrl = `/uploads/attendance/${req.file.filename}`;
    const today = getTodayDate();
    const now = new Date();

    // Check if already checked in today
    const existingRecord = await prisma.attendance.findFirst({
      where: {
        userId: userId,
        date: today
      }
    });

    if (existingRecord) {
      return res.status(400).json({ message: 'You have already checked in today' });
    }

    // Simple status logic: Late if after 07:30 AM
    const lateThreshold = new Date();
    lateThreshold.setHours(7, 30, 0, 0);
    const status = now > lateThreshold ? 'TERLAMBAT' : 'HADIR';

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        date: today,
        checkIn: now,
        status,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        photoIn: photoUrl
      }
    });

    res.status(201).json({
      message: 'Check-in successful',
      attendance
    });

  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Photo is required for check-out' });
    }

    const photoUrl = `/uploads/attendance/${req.file.filename}`;
    const today = getTodayDate();
    const now = new Date();

    // Find today's record
    const existingRecord = await prisma.attendance.findFirst({
      where: {
        userId: userId,
        date: today
      }
    });

    if (!existingRecord) {
      return res.status(400).json({ message: 'You have not checked in today yet' });
    }

    if (existingRecord.checkOut) {
      return res.status(400).json({ message: 'You have already checked out today' });
    }

    const updatedAttendance = await prisma.attendance.update({
      where: { id: existingRecord.id },
      data: {
        checkOut: now,
        photoOut: photoUrl
      }
    });

    res.status(200).json({
      message: 'Check-out successful',
      attendance: updatedAttendance
    });

  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const history = await prisma.attendance.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 30 // Last 30 days
    });

    res.status(200).json({ history });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getTodayAdmin = async (req, res) => {
  try {
    const today = getTodayDate();
    
    const records = await prisma.attendance.findMany({
      where: { date: today },
      orderBy: { checkIn: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            nip: true,
            dept: true
          }
        }
      }
    });

    res.status(200).json({ records });
  } catch (error) {
    console.error('Get today admin error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getMonthlyStats = async (req, res) => {
  try {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Get all attendance for this month
    const records = await prisma.attendance.findMany({
      where: { 
        date: {
          gte: firstDayOfMonth
        }
      }
    });

    // Calculate stats
    const totalRecords = records.length;
    const hadir = records.filter(r => r.status === 'HADIR').length;
    const terlambat = records.filter(r => r.status === 'TERLAMBAT').length;
    const onTimePercentage = totalRecords > 0 ? Math.round((hadir / totalRecords) * 100) : 100;

    // Get active teachers count
    const totalTeachers = await prisma.user.count({
      where: { role: 'GURU' }
    });

    res.status(200).json({
      stats: {
        totalRecords,
        hadir,
        terlambat,
        onTimePercentage,
        totalTeachers
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
