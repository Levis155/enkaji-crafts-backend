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
      where: { id },
      include: {
        reviews: true, 
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const averageRatingResult = await client.review.aggregate({
      _avg: {
        rating: true,
      },
      where: {
        productId: id,
      },
    });

    res.status(200).json({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      inStock: product.inStock,
      category: product.category,
      description: product.description,
      specifications: product.specifications,
      packageContent: product.packageContent,
      averageRating: averageRatingResult._avg.rating || 0,
      reviews: product.reviews,
    });
  } catch (e) {
    console.error(e);
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

export const getSearchedProducts = async (req, res) => {
  try {
    const { query } = req.params;

    const searchedProducts = await client.product.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            category: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
    });

    res.status(200).json(searchedProducts);
  } catch (e) {
    res.status(500).json({ message: "Something went wrong." });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const allProducts = await client.product.findMany({include: {reviews:true}});

    const productsWithRatings = await Promise.all(
      allProducts.map(async (product) => {
        const avgRating = await client.review.aggregate({
          _avg: {
            rating: true,
          },
          where: {
            productId: product.id,
          },
        });

        return {
          ...product,
          averageRating: avgRating._avg.rating || 0,
        };
      })
    );

    res.status(200).json(productsWithRatings);
  } catch (e) {
    console.error(e);
    res.status(500).json({
      message: `Something went wrong:${e}`,
    });
  }
};
