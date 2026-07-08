import { PrismaClient } from '@prisma/client';

// Initializes the Prisma client used to run queries
const prisma = new PrismaClient();

export default prisma;