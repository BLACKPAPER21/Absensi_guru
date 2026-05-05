const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Submit a new leave request (Guru)
exports.submitRequest = async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body;
    const userId = req.user.id;
    let attachmentPath = null;

    if (req.file) {
      attachmentPath = `/uploads/leaves/${req.file.filename}`;
    }

    if (!type || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        attachment: attachmentPath,
        status: 'PENDING'
      }
    });

    res.status(201).json({ message: 'Leave request submitted successfully', leaveRequest });
  } catch (error) {
    console.error('Submit leave error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get personal leave requests (Guru)
exports.getMyRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await prisma.leaveRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ requests });
  } catch (error) {
    console.error('Get my leave requests error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all leave requests (Admin)
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await prisma.leaveRequest.findMany({
      orderBy: { createdAt: 'desc' },
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

    res.status(200).json({ requests });
  } catch (error) {
    console.error('Get all leave requests error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update leave request status (Admin)
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await prisma.leaveRequest.update({
      where: { id },
      data: { 
        status,
        adminNote: adminNote || null
      }
    });

    res.status(200).json({ message: `Leave request ${status.toLowerCase()}`, request });
  } catch (error) {
    console.error('Update leave status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
