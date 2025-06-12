import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export const addItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const { wishlist } = req.body;

    await client.wishlist.deleteMany({
      where: { userId },
    });

    const wishlistItems = wishlist.map((item) => ({
      name: item.name,
      price: item.price,
      originalPrice: item.originalPrice,
      image: item.image,
      inStock: item.inStock,
      productId: item.id,
      userId,
    }));

    if (wishlistItems.length > 0) {
      await client.wishlist.createMany({
        data: wishlistItems,
      });
    }

    res.status(201).json({ message: "Wishlist updated successfully." });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Something went wrong." });
  }
};

export const getItems = async (req, res) => {
  try {
    const userId = req.user.id;

    const wishlist = await client.wishlist.findMany({
      where: {
        userId,
      },
      select: {
        productId: true,
        name: true,
        image: true,
        price: true,
        originalPrice: true,
        inStock: true,
      },
    });

    res.status(200).json({
      wishlist,
    });
  } catch (e) {
    res.status(500).json({ message: "Something went wrong." });
  }
};
