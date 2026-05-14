const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { createClient } = require('@supabase/supabase-js');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Initialize Supabase Storage Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Helper to get today's date at midnight for querying
const getTodayDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// Helper to convert HH:mm string to seconds for comparison
const timeStringToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper to get current time in minutes since midnight
const getCurrentMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

exports.checkIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lat, lng } = req.body;

    // Multer places the file in req.file.buffer
    if (!req.file) {
      return res.status(400).json({ message: 'Photo is required for check-in' });
    }

    let photoUrl = '';
    if (supabase) {
      const fileName = `checkin/${userId}-${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('photos')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return res.status(500).json({ message: 'Failed to upload photo to storage' });
      }

      const { data: publicData } = supabase.storage.from('photos').getPublicUrl(fileName);
      photoUrl = publicData.publicUrl;
    } else {
      console.warn("Supabase credentials missing, photo not uploaded.");
      photoUrl = "https://via.placeholder.com/150"; // Fallback if no credentials
    }
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

    // Get attendance config from database
    let config = await prisma.attendanceConfig.findFirst();

    // If no config exists, create default one
    if (!config) {
      config = await prisma.attendanceConfig.create({
        data: {
          lateThresholdTime: '07:30',
          updatedBy: 'system'
        }
      });
    }

    // Compare current time with late threshold
    const currentMinutes = getCurrentMinutes();
    const thresholdMinutes = timeStringToMinutes(config.lateThresholdTime);
    const status = currentMinutes > thresholdMinutes ? 'TERLAMBAT' : 'HADIR';

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

    let photoUrl = '';
    if (supabase) {
      const fileName = `checkout/${userId}-${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('photos')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return res.status(500).json({ message: 'Failed to upload photo to storage' });
      }

      const { data: publicData } = supabase.storage.from('photos').getPublicUrl(fileName);
      photoUrl = publicData.publicUrl;
    } else {
      photoUrl = "https://via.placeholder.com/150";
    }
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

    // Get attendance config to check if early checkout
    let config = await prisma.attendanceConfig.findFirst();
    if (!config) {
      config = await prisma.attendanceConfig.create({
        data: {
          lateThresholdTime: '07:30',
          checkOutThresholdTime: '16:00',
          updatedBy: 'system'
        }
      });
    }

    // Check if checkout is early (before threshold)
    const currentMinutes = getCurrentMinutes();
    const thresholdMinutes = timeStringToMinutes(config.checkOutThresholdTime);
    const isEarlyCheckOut = currentMinutes < thresholdMinutes;

    const updatedAttendance = await prisma.attendance.update({
      where: { id: existingRecord.id },
      data: {
        checkOut: now,
        photoOut: photoUrl
      }
    });

    res.status(200).json({
      message: 'Check-out successful',
      attendance: updatedAttendance,
      info: {
        isEarlyCheckOut,
        checkOutThreshold: config.checkOutThresholdTime,
        warning: isEarlyCheckOut ? `Anda pulang lebih awal dari jam ${config.checkOutThresholdTime}` : null
      }
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

exports.getConfig = async (req, res) => {
  try {
    let config = await prisma.attendanceConfig.findFirst();

    // If no config exists, create default one
    if (!config) {
      config = await prisma.attendanceConfig.create({
        data: {
          lateThresholdTime: '07:30',
          checkOutThresholdTime: '16:00',
          updatedBy: 'system'
        }
      });
    }

    res.status(200).json({
      config: {
        id: config.id,
        lateThresholdTime: config.lateThresholdTime,
        checkOutThresholdTime: config.checkOutThresholdTime,
        updatedAt: config.updatedAt
      }
    });
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.updateConfig = async (req, res) => {
  try {
    const { lateThresholdTime, checkOutThresholdTime } = req.body;
    const adminId = req.user.id;

    // Validate time format HH:mm
    if (lateThresholdTime && !/^\d{2}:\d{2}$/.test(lateThresholdTime)) {
      return res.status(400).json({ message: 'Invalid late threshold time format. Use HH:mm (e.g., 07:30)' });
    }

    if (checkOutThresholdTime && !/^\d{2}:\d{2}$/.test(checkOutThresholdTime)) {
      return res.status(400).json({ message: 'Invalid check-out threshold time format. Use HH:mm (e.g., 16:00)' });
    }

    // Validate hours and minutes are valid
    if (lateThresholdTime) {
      const [hours, minutes] = lateThresholdTime.split(':').map(Number);
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return res.status(400).json({ message: 'Invalid late threshold time. Hours: 0-23, Minutes: 0-59' });
      }
    }

    if (checkOutThresholdTime) {
      const [hours, minutes] = checkOutThresholdTime.split(':').map(Number);
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return res.status(400).json({ message: 'Invalid check-out threshold time. Hours: 0-23, Minutes: 0-59' });
      }
    }

    let config = await prisma.attendanceConfig.findFirst();

    const updateData = { updatedBy: adminId, updatedAt: new Date() };
    if (lateThresholdTime) updateData.lateThresholdTime = lateThresholdTime;
    if (checkOutThresholdTime) updateData.checkOutThresholdTime = checkOutThresholdTime;

    if (!config) {
      // Create if doesn't exist
      config = await prisma.attendanceConfig.create({
        data: {
          lateThresholdTime: lateThresholdTime || '07:30',
          checkOutThresholdTime: checkOutThresholdTime || '16:00',
          updatedBy: adminId
        }
      });
    } else {
      // Update existing
      config = await prisma.attendanceConfig.update({
        where: { id: config.id },
        data: updateData
      });
    }

    res.status(200).json({
      message: 'Attendance config updated successfully',
      config: {
        id: config.id,
        lateThresholdTime: config.lateThresholdTime,
        checkOutThresholdTime: config.checkOutThresholdTime,
        updatedBy: config.updatedBy,
        updatedAt: config.updatedAt,
      }
    });
  } catch (error) {
    console.error('Error updating attendance config:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
