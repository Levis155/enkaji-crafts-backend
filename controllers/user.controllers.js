import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const client = new PrismaClient();

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      fullName,
      emailAddress,
      phoneNumber,
      county,
      town,
      password,
      oldPassword,
    } = req.body;

    const user = await client.user.findUnique({
      where: { id: userId },
    });


    const updatedFields = {};

    if (fullName) updatedFields.fullName = fullName;
    if (emailAddress) updatedFields.emailAddress = emailAddress;
    if (phoneNumber) updatedFields.phoneNumber = phoneNumber;
    if (county) updatedFields.county = county;
    if (town) updatedFields.town = town;

    if (password) {
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Old password is incorrect." });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      updatedFields.password = hashedPassword;
    }

    const updatedUser = await client.user.update({
      where: { id: userId },
      data: updatedFields,
    });

    res.status(200).json({
      fullName: updatedUser.fullName,
      emailAddress: updatedUser.emailAddress,
      phoneNumber: updatedUser.phoneNumber,
      county: updatedUser.county,
      town: updatedUser.town,
      shippingCharge: updatedUser.shippingCharge,
    });
  } catch (e) {
    console.error("Update user error:", e);
    res.status(500).json({ message: "Something went wrong." });
  }
};
