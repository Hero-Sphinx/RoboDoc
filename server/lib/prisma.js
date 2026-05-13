const { PrismaClient } = require('@prisma/client');

// This single instance handles the connection for your whole app
const prisma = new PrismaClient();

module.exports = prisma; 