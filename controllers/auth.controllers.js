import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateTokens.js";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";
import { addMinutes, isAfter } from "date-fns";
import { sendPasswordResetEmail } from "../utils/sendEmail.js";

const client = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const register = async (req, res) => {
  try {
    const { fullName, emailAddress, phoneNumber, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 12);

    await client.user.create({
      data: {
        fullName,
        emailAddress,
        phoneNumber,
        password: hashedPassword,
      },
    });

    res.status(201).json({ message: "User registered successfully." });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Something went wrong. Please try again." });
    console.log(e);
  }
};

export const login = async (req, res) => {
  try {
    const { emailAddress, password } = req.body;

    const user = await client.user.findFirst({
      where: {
        emailAddress,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Wrong login credentials." });
    }

    const theyMatch = await bcrypt.compare(password, user.password);

    if (!theyMatch) {
      return res.status(401).json({ message: "Wrong login credentials." });
    }

    const payload = {
      id: user.id,
      fullName: user.fullName,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await client.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    res
      .cookie("enkajiAuthToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 15 * 60 * 1000,
      })
      .cookie("enkajiRefreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        fullName: user.fullName,
        emailAddress: user.emailAddress,
        phoneNumber: user.phoneNumber,
        county: user.county,
        town: user.town,
        shippingCharge: user.shippingCharge,
        isAdmin: user.isAdmin,
      });

  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Something went wrong." });
  }
};

export const googleLogin = async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    if (!email) {
      return res
        .status(400)
        .json({ message: "Email not available in Google profile." });
    }

    const user = await client.user.findUnique({
      where: { emailAddress: email },
    });

    if (!user) {
      return res
        .status(401)
        .json({ message: "No account found. Please register first." });
    }

    const jwtPayload = {
      id: user.id,
      fullName: user.fullName,
    };

    const authToken = jwt.sign(jwtPayload, process.env.JWT_SECRET_KEY);

    res
      .status(200)
      .cookie("enkajiAuthToken", authToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      })
      .json({
        fullName: user.fullName,
        emailAddress: user.emailAddress,
        phoneNumber: user.phoneNumber,
        county: user.county,
        town: user.town,
        shippingCharge: user.shippingCharge,
        isAdmin: user.isAdmin,
      });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(401).json({ message: "Google login failed. Please try again." });
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.enkajiRefreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided." });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET_KEY);
    const user = await client.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token." });
    }

    const newAccessToken = generateAccessToken({ id: user.id, fullName: user.fullName });

    res
      .cookie("enkajiAuthToken", newAccessToken, {
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


export const forgotPassword = async (req, res) => {
  const { emailAddress } = req.body;

  const user = await client.user.findUnique({ where: { emailAddress } });
  if (!user) return res.status(404).json({ message: "User not found" });

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiry = addMinutes(new Date(), 15);

  await client.user.update({
    where: { emailAddress },
    data: { resetToken, resetTokenExpiry },
  });

  const resetLink = `${process.env.PASSWORD_RESET_URL}/${resetToken}`;

  await sendPasswordResetEmail({
    to: user.emailAddress,
    name: user.fullName,
    resetLink,
  });

  res.status(200).json({ message: "Password reset link sent to email." });
};

export const resetPassword = async (req, res) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  const user = await client.user.findFirst({
    where: { resetToken },
  });

  if (
    !user ||
    !user.resetTokenExpiry ||
    isAfter(new Date(), user.resetTokenExpiry)
  ) {
    return res.status(400).json({ message: "Token is invalid or expired." });
  }

  const hashed = await bcrypt.hash(password, 12);

  await client.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  res.status(200).json({ message: "Password reset successful." });
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.enkajiRefreshToken;

    if (!refreshToken) return res.sendStatus(204); 

    await client.user.updateMany({
      where: { refreshToken },
      data: { refreshToken: null },
    });

    res
      .clearCookie("enkajiAuthToken", {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      })
      .clearCookie("enkajiRefreshToken", {
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
