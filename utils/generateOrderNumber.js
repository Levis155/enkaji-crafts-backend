import { PrismaClient } from "@prisma/client";
import { format } from "date-fns";

const prisma = new PrismaClient();

export const generateOrderNumber = async () => {

  const today = format(new Date(), "yyyyMMdd");


  const startOfDay = new Date(`${today.slice(0, 4)}-${today.slice(4, 6)}-${today.slice(6, 8)}T00:00:00.000Z`);

  const countToday = await prisma.order.count({
    where: {
      createdAt: {
        gte: startOfDay,
      },
    },
  });

  const sequence = String(countToday + 1).padStart(4, "0"); 
  return `ENK-${today}-${sequence}`;
};