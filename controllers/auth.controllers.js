import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

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

    const jwtPayload = {
      id: user.id,
      fullName: user.fullName,
    };

    const token = jwt.sign(jwtPayload, process.env.JWT_SECRET_KEY);

    res
      .status(200)
      .cookie("enkajiAuthToken", token, {
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
  } catch (e) {
    res
      .status(500)
      .json({ message: "Something went wrong. Please try again." });
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
      return res.status(400).json({ message: "Email not available in Google profile." });
    }


    const user = await client.user.findUnique({
      where: { emailAddress: email },
    });

    if (!user) {
      return res.status(401).json({ message: "No account found. Please register first." });
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