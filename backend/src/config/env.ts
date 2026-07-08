import dotenv from 'dotenv';
dotenv.config();

export const env = {
  jwtSecret: process.env.JWT_SECRET as string,
  databaseUrl: process.env.DATABASE_URL as string,
};