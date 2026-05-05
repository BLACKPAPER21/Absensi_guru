const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    // Check if user already exists
    let admin = await prisma.user.findUnique({
      where: { email: 'admin@siguru.com' }
    });

    if (!admin) {
      console.log('Creating test admin user...');
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      admin = await prisma.user.create({
        data: {
          nip: 'ADMIN-001',
          name: 'System Admin',
          email: 'admin@siguru.com',
          password: hashedPassword,
          role: 'ADMIN',
          dept: 'IT'
        }
      });
      console.log('Test admin user created with password "admin123"');
    } else {
      console.log('Admin user already exists. Updating password to "admin123"...');
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      admin = await prisma.user.update({
        where: { email: 'admin@siguru.com' },
        data: { password: hashedPassword }
      });
    }

    // Create a test GURU user
    let guru = await prisma.user.findUnique({
      where: { email: 'guru@siguru.com' }
    });

    if (!guru) {
      console.log('Creating test guru user...');
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('guru123', salt);

      guru = await prisma.user.create({
        data: {
          nip: 'GURU-001',
          name: 'Budi Santoso (Guru)',
          email: 'guru@siguru.com',
          password: hashedPassword,
          role: 'GURU',
          dept: 'Matematika'
        }
      });
      console.log('Test guru user created with password "guru123"');
    } else {
      console.log('Guru user already exists.');
    }
    
    // Create a test KEPSEK user
    let kepsek = await prisma.user.findUnique({
      where: { email: 'kepsek@siguru.com' }
    });

    if (!kepsek) {
      console.log('Creating test kepsek user...');
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('kepsek123', salt);

      kepsek = await prisma.user.create({
        data: {
          nip: 'KEPSEK-001',
          name: 'Drs. H. Ahmad Dahlan, M.Pd.',
          email: 'kepsek@siguru.com',
          password: hashedPassword,
          role: 'KEPSEK',
          dept: 'Manajemen'
        }
      });
      console.log('Test kepsek user created with password "kepsek123"');
    } else {
      console.log('Kepsek user already exists.');
    }
    
    console.log('Successfully connected to database!');
    console.log('Admin user:', admin);
    console.log('Kepsek user:', kepsek);

  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
