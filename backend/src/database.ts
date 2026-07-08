import { PrismaClient } from '@prisma/client';

// Inicializa o cliente do Prisma que usaremos para fazer as consultas (queries)
const prisma = new PrismaClient();

export default prisma;