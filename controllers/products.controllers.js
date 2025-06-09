import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      originalPrice,
      image,
      category,
      specifications,
      packageContent,
    } = req.body;
    const newProduct = await client.product.create({
      data: {
        name,
        description,
        price,
        originalPrice,
        image,
        category,
        specifications,
        packageContent,
      },
    });

    res.status(201).json({ newProduct });
  } catch (e) {
    res.status(500).json({
      message: "Something went wrong.",
    });
  }
};

export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await client.product.findFirst({
      where: {
        id,
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    res.status(200).json(product);
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Something went wrong." });
  }
};

export const getSimilarProducts = async (req, res) => {
  try {
    const { category } = req.params;

    const similarProducts = await client.product.findMany({
      where: {
        category,
      },
    });

    if (similarProducts.length === 0) {
      return res.status(404).json({ message: "Category not found." });
    }

    res.status(200).json(similarProducts);
  } catch (e) {
    res.status(500).json({ message: "Something went wrong." });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const allProducts = await client.product.findMany({
      select: {
        id: true,
        image: true,
        name: true,
        price: true,
        originalPrice: true,
        inStock: true,
        reviews: {
          select: {
            rating: true,
            text: true,
          },
        },
      },
    });

    res.status(200).json(allProducts);
  } catch (e) {
    res.status(500).json({
      message: `Something went wrong.`,
    });
  }
};
