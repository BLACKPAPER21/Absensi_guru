const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const isValidTime = (timeStr) => /^\d{2}:\d{2}$/.test(timeStr) && (() => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
})();

exports.getTodaySchedule = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const currentDay = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const todaysSchedules = await prisma.classSchedule.findMany({
      where: {
        userId,
        dayOfWeek: currentDay,
        active: true
      },
      orderBy: [
        { startTime: 'asc' },
        { endTime: 'asc' }
      ]
    });

    let currentOrNextSchedule = null;
    let status = 'none';

    if (todaysSchedules.length > 0) {
      const ongoing = todaysSchedules.find((schedule) => {
        const start = timeToMinutes(schedule.startTime);
        const end = timeToMinutes(schedule.endTime);
        return currentMinutes >= start && currentMinutes <= end;
      });

      if (ongoing) {
        currentOrNextSchedule = ongoing;
        status = 'ongoing';
      } else {
        const next = todaysSchedules.find((schedule) => timeToMinutes(schedule.startTime) > currentMinutes);
        if (next) {
          currentOrNextSchedule = next;
          status = 'upcoming';
        } else {
          status = 'done';
        }
      }
    }

    res.status(200).json({
      dayName: DAY_NAMES[currentDay],
      currentTime: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      status,
      schedule: currentOrNextSchedule,
      todaysSchedules
    });
  } catch (error) {
    console.error('Get today schedule error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.getAllSchedules = async (req, res) => {
  try {
    const { userId } = req.query;

    const schedules = await prisma.classSchedule.findMany({
      where: userId ? { userId } : {},
      include: {
        user: {
          select: {
            id: true,
            name: true,
            nip: true,
            dept: true
          }
        }
      },
      orderBy: [
        { user: { name: 'asc' } },
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });

    res.status(200).json({ schedules });
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.createSchedule = async (req, res) => {
  try {
    const { userId, dayOfWeek, subject, room, startTime, endTime, expectedStudents, active } = req.body;

    if (!userId || dayOfWeek === undefined || !subject || !room || !startTime || !endTime) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const parsedDay = Number(dayOfWeek);
    if (Number.isNaN(parsedDay) || parsedDay < 0 || parsedDay > 6) {
      return res.status(400).json({ message: 'Day of week must be between 0 and 6' });
    }

    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      return res.status(400).json({ message: 'Invalid time format. Use HH:mm' });
    }

    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      return res.status(400).json({ message: 'End time must be later than start time' });
    }

    const schedule = await prisma.classSchedule.create({
      data: {
        userId,
        dayOfWeek: parsedDay,
        subject,
        room,
        startTime,
        endTime,
        expectedStudents: expectedStudents ? Number(expectedStudents) : 0,
        active: active !== undefined ? Boolean(active) : true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            nip: true,
            dept: true
          }
        }
      }
    });

    res.status(201).json({ message: 'Schedule created successfully', schedule });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, dayOfWeek, subject, room, startTime, endTime, expectedStudents, active } = req.body;

    const updateData = {};

    if (userId) updateData.userId = userId;
    if (dayOfWeek !== undefined) {
      const parsedDay = Number(dayOfWeek);
      if (Number.isNaN(parsedDay) || parsedDay < 0 || parsedDay > 6) {
        return res.status(400).json({ message: 'Day of week must be between 0 and 6' });
      }
      updateData.dayOfWeek = parsedDay;
    }
    if (subject) updateData.subject = subject;
    if (room) updateData.room = room;
    if (startTime) {
      if (!isValidTime(startTime)) {
        return res.status(400).json({ message: 'Invalid start time format. Use HH:mm' });
      }
      updateData.startTime = startTime;
    }
    if (endTime) {
      if (!isValidTime(endTime)) {
        return res.status(400).json({ message: 'Invalid end time format. Use HH:mm' });
      }
      updateData.endTime = endTime;
    }
    if (expectedStudents !== undefined) updateData.expectedStudents = Number(expectedStudents);
    if (active !== undefined) updateData.active = Boolean(active);

    if (updateData.startTime && updateData.endTime && timeToMinutes(updateData.endTime) <= timeToMinutes(updateData.startTime)) {
      return res.status(400).json({ message: 'End time must be later than start time' });
    }

    const schedule = await prisma.classSchedule.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            nip: true,
            dept: true
          }
        }
      }
    });

    res.status(200).json({ message: 'Schedule updated successfully', schedule });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.classSchedule.delete({
      where: { id }
    });

    res.status(200).json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
