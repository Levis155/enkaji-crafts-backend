import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();


export const addItems = async (req, res) => {
    try{
        const userId = req.user.id;
        const { cart } = req.body;

        await client.cart.deleteMany({
            where: { userId }
        });

        const cartItems = cart.map(item => ({
            name: item.name,
            price: item.price,
            originalPrice: item.originalPrice,
            image: item.image,
            inStock: item.inStock,
            quantity: item.quantity,
            productId: item.id,
            userId
        }));

        if (cartItems.length > 0) {
            await client.cart.createMany({
                data: cartItems
            });
        }

        res.status(201).json({ message: "Cart updated successfully." });
    } catch(e) {
        console.log(e)
        res.status(500).json({message: "Something went wrong."})
    }
};

export const getItems = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await client.cart.findMany({
      where: {
        userId,
      },
      select: {
        productId: true,
        name:true,
        image:true,
        price: true,
        originalPrice: true,
        quantity: true,
        inStock: true,
      }
    });

    res.status(200).json(
      {cart});
  } catch (e) {
    res.status(500).json({ message: "Something went wrong." });
  }
};
