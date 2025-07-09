import { Router } from "express";
import {
  adminLogin,
  refreshAdminAccessToken,
  adminLogout,
  getDashboardStats,
  getAdminProducts,
  getAdminProduct,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  getAdminOrders,
  getAdminOrder,
  updateOrderStatus,
  getAdminUsers,
  getAdminUser,
  updateAdminUser,
  deleteAdminUser,
  getAdminReviews,
  deleteAdminReview,
  getSalesData,
  getTopProducts,
} from "../controllers/admin.controllers.js";
import verifyAdminUser from "../middleware/verifyAdminUser.js";

const router = Router();

router.route("/auth/login").post(adminLogin);
router.route("/auth/refresh").get(refreshAdminAccessToken)
router.route("/auth/logout").post(adminLogout)
router.route("/dashboard/stats").get(verifyAdminUser, getDashboardStats);
router
  .route("/products")
  .get(verifyAdminUser, getAdminProducts)
  .post(verifyAdminUser, createAdminProduct);
router
  .route("/products/:id")
  .get(verifyAdminUser, getAdminProduct)
  .put(verifyAdminUser, updateAdminProduct)
  .delete(verifyAdminUser, deleteAdminProduct);
router.route("/orders").get(verifyAdminUser, getAdminOrders);
router.route("/orders/:id").get(verifyAdminUser, getAdminOrder);
router.route("/orders/:id/status").put(verifyAdminUser, updateOrderStatus);
router.route("/users").get(verifyAdminUser, getAdminUsers);
router
  .route("/users/:id")
  .get(verifyAdminUser, getAdminUser)
  .put(verifyAdminUser, updateAdminUser)
  .delete(verifyAdminUser, deleteAdminUser);
router.route("/reviews").get(verifyAdminUser, getAdminReviews);
router.route("/reviews/:id").delete(verifyAdminUser, deleteAdminReview);
router.route("/analytics/sales").get(verifyAdminUser, getSalesData);
router.route("/analytics/top-products").get(verifyAdminUser, getTopProducts);

export default router;
