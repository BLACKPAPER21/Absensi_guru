const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Get all teachers
exports.getTeachers = async (req, res) => {
  try {
    const teachers = await prisma.user.findMany({
      where: { role: 'GURU' },
      select: {
        id: true,
        nip: true,
        name: true,
        email: true,
        dept: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    });
    res.status(200).json({ teachers });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create a new teacher
exports.createTeacher = async (req, res) => {
  try {
    const { nip, name, email, password, dept } = req.body;

    // Check if email or NIP exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { nip }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email or NIP already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newTeacher = await prisma.user.create({
      data: {
        nip,
        name,
        email,
        password: hashedPassword,
        role: 'GURU',
        dept
      },
      select: {
        id: true,
        nip: true,
        name: true,
        dept: true
      }
    });

    res.status(201).json({ message: 'Teacher created successfully', teacher: newTeacher });
  } catch (error) {
    console.error('Error creating teacher:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update a teacher
exports.updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { nip, name, email, dept, password } = req.body;

    const dataToUpdate = { nip, name, email, dept };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.password = await bcrypt.hash(password, salt);
    }

    const updatedTeacher = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        nip: true,
        name: true,
        email: true,
        dept: true
      }
    });

    res.status(200).json({ message: 'Teacher updated successfully', teacher: updatedTeacher });
  } catch (error) {
    console.error('Error updating teacher:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete a teacher
exports.deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete related records first (cascade manual)
    await prisma.attendance.deleteMany({ where: { userId: id } });
    await prisma.leaveRequest.deleteMany({ where: { userId: id } });

    await prisma.user.delete({
      where: { id }
    });

    res.status(200).json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
