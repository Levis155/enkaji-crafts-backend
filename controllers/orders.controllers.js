import { PrismaClient } from "@prisma/client";


const client = new PrismaClient();

export const makeOrder = async (req, res) => {
  try {
    const { totalPrice, town, county, orderItems } = req.body;
    const userId = req.user.id;

    const newOrder = await client.order.create({
      data: {
        userId,
        totalPrice,
        town,
        county,
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

export const getOrdersByUser = async (req, res) => {
  try {
    const userId  = req.user.id;

    const orders = await client.order.findMany({
      where: {
        userId,
      },
      include: {
        orderItems: true,
        user: true
      }
    });

    res.status(200).json(orders);
  } catch (e) {
    res.status(500).json({ message: "Something went wrong." });
  }
};
