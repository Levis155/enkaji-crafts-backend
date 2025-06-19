import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from "../utils/sendEmail.js";
import { generateOrderNumber } from "../utils/generateOrderNumber.js";

const client = new PrismaClient();

export const payAndPlaceOrder = async (req, res) => {
  try {
    const { totalPrice, phoneNumber, town, county, orderItems } = req.body;
    const userId = req.user.id;
    const accessToken = req.accessToken;
    const shortCode = process.env.BUSINESS_SHORT_CODE;
    const passkey = process.env.PASSKEY;

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, "")
      .slice(0, 14);
    const password = Buffer.from(shortCode + passkey + timestamp).toString(
      "base64"
    );
    const fullPhone = `254${phoneNumber.slice(1)}`;

    const mpesaResponse = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: totalPrice,
        PartyA: fullPhone,
        PartyB: shortCode,
        PhoneNumber: fullPhone,
        CallBackURL: process.env.CALLBACK_URL,
        AccountReference: fullPhone,
        TransactionDesc: "Order Payment",
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const { MerchantRequestID, CheckoutRequestID } = mpesaResponse.data;
    const orderNumber = await generateOrderNumber();

    await client.order.create({
      data: {
        userId,
        orderNumber,
        totalPrice,
        town,
        county,
        checkoutRequestId: CheckoutRequestID,
        merchantRequestId: MerchantRequestID,
        orderItems: {
          create: orderItems,
        },
      },
      include: {
        orderItems: true,
      },
    });

    res.status(200).json({
      message: "STK push initiated.",
      checkoutRequestId: CheckoutRequestID,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Something went wrong." });
  }
};

export const updatePaymentStatus = async (req, res) => {
  const stkCallback = req.body.Body?.stkCallback;
  if (!stkCallback)
    return res.status(400).json({ message: "Invalid callback" });

  const { CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;
  const isPaid = ResultCode === 0;
  const status = isPaid ? "processed" : "failed";

  const order = await client.order.update({
    where: { checkoutRequestId: CheckoutRequestID },
    data: {
      status,
      isPaid,
      paidAt: new Date(),
      resultDesc: ResultDesc,
    },
    include: { user: true },
  });

  if (isPaid) {
    const { user, orderNumber, totalPrice, county, town } = order;

    // Send confirmation to user
    await sendOrderConfirmationEmail({
      to: user.emailAddress,
      name: user.fullName,
      orderNumber,
      total: totalPrice,
    });

    // Send notification to admin
    await sendAdminOrderNotification({
      name: user.fullName,
      email: user.emailAddress,
      phone: user.phoneNumber,
      orderNumber,
      total: totalPrice,
      address: `${county}, ${town}`,
    });

    console.log(`Email sent to customer and admin for order #${orderNumber}`);
  }

  res.status(200).json("ok");
};

export const receivePaymentStatus = async (req, res) => {
  const order = await client.order.findUnique({
    where: { checkoutRequestId: req.params.checkoutRequestId },
    select: { status: true, resultDesc: true },
  });

  if (!order) return res.status(404).json({ message: "Not found" });

  res.json(order);
};

export const getOrdersByUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await client.order.findMany({
      where: {
        userId,
        status: {
          notIn: ["pending", "failed"],
        },
      },
      include: {
        orderItems: true,
        user: true,
      },
    });

    res.status(200).json(orders);
  } catch (e) {
    res.status(500).json({ message: "Something went wrong." });
  }
};

export const modifyOrderDetails = async (req, res) => {
  try {
    const { status, isPaid, paidAt } = req.body;
    const { orderId } = req.params;

    const updatedFields = {};

    if (status) updatedFields.status = status;
    if (isPaid) updatedFields.isPaid = isPaid;
    if (paidAt) updatedFields.paidAt = paidAt;

    const updatedOrder = await client.order.update({
      where: {
        id: orderId,
      },
      data: updatedFields,
    });

    res.status(200).json({ updatedOrder });
  } catch (e) {
    res.status(500).json({ message: "Something went wrong." });
  }
};
