import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const client = new PrismaClient();

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
      });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Something went wrong. Please try again." });
  }
};
