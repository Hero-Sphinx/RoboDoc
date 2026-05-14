const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'doctor@hhpp.com';

  const updatedUser = await prisma.user.update({
    where: { email: adminEmail },
    data: { role: 'ADMIN' },
  });

  console.log(`🚀 Success! ${updatedUser.name} is now the Medical Director (ADMIN).`);
}

main()
  .catch((e) => {
    console.error("Error: Make sure the user exists before running update.", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());