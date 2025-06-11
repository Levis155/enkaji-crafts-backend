import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export const makeOrder = async (req, res) => {
  try {
    const {
      totalPrice,
      orderItems,
    } = req.body;
    const userId = req.user.id;

    const newOrder = await client.order.create({
      data: {
        userId,
        totalPrice,
        orderItems: {
          create: orderItems,
        },
      },
      include: {
        orderItems: true,
      },
    });

    res.status(201).json(newOrder);
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Something went wrong." });
  }
};
