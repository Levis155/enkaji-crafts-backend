import { PrismaClient } from "@prisma/client";


const client = new PrismaClient();

export const addReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, reviewTitle, reviewAuthor, reviewBody, rating } =
      req.body;

    const product = await client.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const newReview = await client.review.create({
      data: {
        productId,
        userId,
        reviewAuthor,
        reviewTitle,
        reviewBody,
        rating,
      },
    });

    res.status(201).json(newReview);
  } catch (e) {
    console.log(e)
    res.status(500).json({ message: "Something went wrong." });
  }
};
