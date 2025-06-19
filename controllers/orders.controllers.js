import { PrismaClient } from "@prisma/client";
import axios from "axios";

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

    await client.order.create({
      data: {
        userId,
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

    res
      .status(200)
      .json({
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
  const status = ResultCode === 0 ? "success" : "failed";
  const isPaid = ResultCode === 0 ? true : false;

  await client.order.update({
    where: { checkoutRequestId: CheckoutRequestID },
    data: {
      status,
      isPaid,
      paidAt: new Date(),
      resultDesc: ResultDesc,
      updatedAt: new Date(),
    },
  });

  res.status(200).json("ok");
}

export const receivePaymentStatus = async (req, res) => {
  const order = await client.order.findUnique({
    where: { checkoutRequestId: req.params.checkoutRequestId },
    select: { status: true, resultDesc: true },
  });

  if (!order) return res.status(404).json({ message: "Not found" });

  res.json(order); // { status: 'pending' | 'success' | 'failed', resultDesc: '...' }
}

export const getOrdersByUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await client.order.findMany({
      where: {
        userId,
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
