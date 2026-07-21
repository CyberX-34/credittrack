const { PrismaClient } = require('@prisma/client')
const { Pool } = require('pg')
const { PrismaPg } = require('@prisma/adapter-pg')
const bcrypt = require('bcrypt')

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

async function main() {
  const adminUsername = 'admin'
  const adminPassword = process.env.ADMIN_PASSWORD || 'CreditTrack_Admin!2026'
  
  // Check if admin already exists
  const existingUser = await prisma.user.findUnique({
    where: { username: adminUsername }
  })
  
  if (existingUser) {
    console.log('Admin user already exists.')
    return
  }
  
  const password_hash = await bcrypt.hash(adminPassword, 10)
  
  const user = await prisma.user.create({
    data: {
      username: adminUsername,
      password_hash,
      role: 'ADMIN',
      adminProfile: {
        create: {
          name: 'Super Admin'
        }
      }
    }
  })
  
  console.log(`Created admin user: ${user.username} with password: ${adminPassword}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
