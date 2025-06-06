import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const { userId } = req.body;

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

export const incrementItemQuantity = async (req, res) => {
  try {
    const { cartId } = req.params;

    const updatedProduct = await client.cart.update({
      where: { id: cartId },
      data: {
        quantity: {
          increment: 1,
        },
      },
    });

    res.status(200).json({ updatedProduct });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Something went wrong." });
  }
};

export const decrementItemQuantity = async (req, res) => {
  try {
    const { cartId } = req.params;

    const updatedProduct = await client.cart.update({
      where: { id: cartId },
      data: {
        quantity: {
          decrement: 1,
        },
      },
    });

    res.status(200).json({ updatedProduct });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Something went wrong." });
  }
};
