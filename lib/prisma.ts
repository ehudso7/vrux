import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Helper function to handle Prisma errors
export function handlePrismaError(error: any): { status: number; message: string } {
  if (error.code === 'P2002') {
    // Unique constraint violation
    const field = error.meta?.target?.[0] || 'field';
    return {
      status: 400,
      message: `${field} already exists`,
    };
  }
  
  if (error.code === 'P2003') {
    // Foreign key constraint violation
    return {
      status: 400,
      message: 'Invalid reference',
    };
  }
  
  if (error.code === 'P2025') {
    // Record not found
    return {
      status: 404,
      message: 'Record not found',
    };
  }
  
  // Default error
  return {
    status: 500,
    message: 'Database operation failed',
  };
}