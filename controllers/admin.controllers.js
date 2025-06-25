import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const client = new PrismaClient();

export const adminLogin = async (req, res) => {
  try {
    const { emailAddress, password } = req.body;

    const user = await client.user.findUnique({
      where: { emailAddress },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Access denied. Admin privileges required." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const payload = {
      userId: user.id,
      isAdmin: user.isAdmin,
    };

    const adminAccessToken = jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: "15m" });;
    const adminRefreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET_KEY, { expiresIn: "7d" });;

    res
      .status(200)
      .cookie("enkajiAdminAccessToken", adminAccessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 15 * 60 * 1000,
      })
      .cookie("enkajiAdminRefreshToken", adminRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        id: user.id,
        fullName: user.fullName,
        emailAddress: user.emailAddress,
        isAdmin: user.isAdmin,
      });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const refreshAdminAccessToken = async (req, res) => {
  try {
    const adminRefreshToken = req.cookies.enkajiAdminRefreshToken;

    if (!adminRefreshToken) {
      return res.status(401).json({ message: "No refresh token provided." });
    }

    const decoded = jwt.verify(adminRefreshToken, process.env.JWT_REFRESH_SECRET_KEY);
    const user = await client.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || user.adminRefreshToken !== adminRefreshToken) {
      return res.status(403).json({ message: "Invalid refresh token." });
    }

    const newAdminAccessToken = jwt.sign({ id: user.id, isAdmin: user.isAdmin }, process.env.JWT_SECRET_KEY, { expiresIn: "15m" });

    res
      .cookie("enkajiAdminAccessToken", newAdminAccessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 15 * 60 * 1000,
      })
      .json({ message: "Access token refreshed." });

  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired refresh token." });
  }
};

export const adminLogout = async (req, res) => {
  try {
    const adminRefreshToken = req.cookies.enkajiAdminRefreshToken;

    if (!adminRefreshToken) return res.sendStatus(204); 

    await client.user.updateMany({
      where: { adminRefreshToken },
      data: { adminRefreshToken: null },
    });

    res
      .clearCookie("enkajiAdminAccessToken", {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      })
      .clearCookie("enkajiAdminRefreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      })
      .json({ message: "Logged out successfully." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Logout failed." });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      outOfStockProducts,
    ] = await Promise.all([
      client.user.count({ where: { isDeleted: false } }),
      client.product.count(),
      client.order.count(),
      client.order.aggregate({
        _sum: { totalPrice: true },
        where: {
          status: { in: ["delivered", "processed", "shipped"] },
          isPaid: true,
        },
      }),
      client.order.count({ where: { status: "pending" } }),
      client.order.count({ where: { status: "delivered" } }),
      client.order.count({ where: { status: "failed" } }),
      client.product.count({ where: { inStock: false } }),
    ]);

    res.status(200).json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      outOfStockProducts,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getAdminProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { category: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [products, total] = await Promise.all([
      client.product.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
        include: { reviews: true },
      }),
      client.product.count({ where }),
    ]);

    const productsWithRatings = await Promise.all(
      products.map(async (product) => {
        const avgRating = await client.review.aggregate({
          _avg: { rating: true },
          where: { productId: product.id },
        });
        return {
          ...product,
          averageRating: avgRating._avg.rating || 0,
        };
      })
    );

    res.status(200).json({
      data: productsWithRatings,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get admin products error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getAdminProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await client.product.findUnique({
      where: { id },
      include: { reviews: { include: { user: true } } },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const avgRating = await client.review.aggregate({
      _avg: { rating: true },
      where: { productId: id },
    });

    res.status(200).json({
      ...product,
      averageRating: avgRating._avg.rating || 0,
    });
  } catch (error) {
    console.error("Get admin product error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const createAdminProduct = async (req, res) => {
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
      inStock = true,
    } = req.body;

    const product = await client.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        image,
        category,
        specifications,
        packageContent,
        inStock,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("Create admin product error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateAdminProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      originalPrice,
      image,
      category,
      specifications,
      packageContent,
      inStock,
    } = req.body;

    const product = await client.product.update({
      where: { id },
      data: {
        name,
        description,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        image,
        category,
        specifications,
        packageContent,
        inStock,
      },
    });

    res.status(200).json(product);
  } catch (error) {
    console.error("Update admin product error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteAdminProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await client.product.delete({
      where: { id },
    });

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete admin product error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getAdminOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { orderNumber: { equals: parseInt(search) || 0 } },
          { user: { fullName: { contains: search, mode: "insensitive" } } },
          { user: { emailAddress: { contains: search, mode: "insensitive" } } },
        ],
      }),
    };

    const [orders, total] = await Promise.all([
      client.order.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: true,
          orderItems: { include: { product: true } },
        },
      }),
      client.order.count({ where }),
    ]);

    res.status(200).json({
      data: orders,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get admin orders error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getAdminOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await client.order.findUnique({
      where: { id },
      include: {
        user: true,
        orderItems: { include: { product: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error("Get admin order error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updateData = { status };

    if (status === "delivered") {
      updateData.deliveredAt = new Date();
    }

    const order = await client.order.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
        orderItems: { include: { product: true } },
      },
    });

    res.status(200).json(order);
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getAdminUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { emailAddress: { contains: search, mode: "insensitive" } },
          { phoneNumber: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      client.user.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          fullName: true,
          emailAddress: true,
          phoneNumber: true,
          county: true,
          town: true,
          shippingCharge: true,
          isAdmin: true,
          createdAt: true,
          updatedAt: true,
          isDeleted: true,
        },
      }),
      client.user.count({ where }),
    ]);

    res.status(200).json({
      data: users,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get admin users error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getAdminUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await client.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        emailAddress: true,
        phoneNumber: true,
        county: true,
        town: true,
        shippingCharge: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
        isDeleted: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Get admin user error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateAdminUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      emailAddress,
      phoneNumber,
      county,
      town,
      shippingCharge,
      isAdmin,
    } = req.body;

    const user = await client.user.update({
      where: { id },
      data: {
        fullName,
        emailAddress,
        phoneNumber,
        county,
        town,
        shippingCharge: parseFloat(shippingCharge),
        isAdmin,
      },
      select: {
        id: true,
        fullName: true,
        emailAddress: true,
        phoneNumber: true,
        county: true,
        town: true,
        shippingCharge: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
        isDeleted: true,
      },
    });

    res.status(200).json(user);
  } catch (error) {
    console.error("Update admin user error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteAdminUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await client.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isAdmin) {
      return res.status(403).json({ message: "Cannot delete admin users" });
    }

    await client.user.update({
      where: { id },
      data: { isDeleted: true },
    });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete admin user error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getAdminReviews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { reviewTitle: { contains: search, mode: "insensitive" } },
            { reviewBody: { contains: search, mode: "insensitive" } },
            { reviewAuthor: { contains: search, mode: "insensitive" } },
            { product: { name: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {};

    const [reviews, total] = await Promise.all([
      client.review.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: true,
          product: true,
        },
      }),
      client.review.count({ where }),
    ]);

    res.status(200).json({
      data: reviews,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get admin reviews error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteAdminReview = async (req, res) => {
  try {
    const { id } = req.params;

    await client.review.delete({
      where: { id },
    });

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete admin review error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getSalesData = async (req, res) => {
  try {
    const { period = "30d" } = req.query;
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await client.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: "delivered",
        isPaid: true,
      },
      select: {
        createdAt: true,
        totalPrice: true,
      },
    });

    const salesByDate = {};
    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split("T")[0];
      if (!salesByDate[date]) {
        salesByDate[date] = { date, revenue: 0, orders: 0 };
      }
      salesByDate[date].revenue += order.totalPrice;
      salesByDate[date].orders += 1;
    });

    const salesData = Object.values(salesByDate).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    res.status(200).json(salesData);
  } catch (error) {
    console.error("Get sales data error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getTopProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topProducts = await client.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      _count: { _all: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: parseInt(limit),
    });

    const productsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await client.product.findUnique({
          where: { id: item.productId },
          select: { name: true, image: true, price: true },
        });
        return {
          name: product?.name || "Unknown Product",
          sales: item._sum.quantity || 0,
          orders: item._count._all || 0,
          image: product?.image,
          price: product?.price,
        };
      })
    );

    res.status(200).json(productsWithDetails);
  } catch (error) {
    console.error("Get top products error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
