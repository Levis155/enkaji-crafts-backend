import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export const addToCart = async (req, res) => {
  try {
    const { productId, userId } = req.body;

    const newCartItem = await client.cart.create({
      data: {
        productId,
        userId,
      },
    });

    res.status(201).json({ message: "Product added to cart successfully" });
  } catch (e) {
    res.status(500).json({ message: "Something went wrong." });
  }
};
