const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const backupPath = path.join(__dirname, 'mysql-data-backup.json');
  const { triageRecords, users } = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

  for (const user of users) {
    await prisma.user.create({
      data: { ...user, createdAt: new Date(user.createdAt) },
    });
  }
  console.log(`Restored ${users.length} users`);

  for (const record of triageRecords) {
    await prisma.triageRecord.create({
      data: { ...record, createdAt: new Date(record.createdAt) },
    });
  }
  console.log(`Restored ${triageRecords.length} triage records`);

  // Explicit ids were used above, so bump each table's auto-increment
  // sequence past the max restored id - otherwise the next INSERT without
  // an explicit id would collide with a restored row.
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"User"', 'id'), COALESCE((SELECT MAX(id) FROM "User"), 1))`
  );
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"TriageRecord"', 'id'), COALESCE((SELECT MAX(id) FROM "TriageRecord"), 1))`
  );
  console.log('Sequences resynced');
}

main()
  .catch((e) => {
    console.error('Restore failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
