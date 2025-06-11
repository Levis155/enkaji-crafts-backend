import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export const updateUserProfile = async (req, res) => {
  const id = req.user.id;

  const forbiddenFields = ["id", "isAdmin", "createdAt", "updatedAt"];

  const updateData = {};

  for (const key in req.body) {
    const value = req.body[key];

    if (
      !forbiddenFields.includes(key) &&
      value !== null &&
      value !== undefined &&
      !(typeof value === "string" && value.trim() === "")
    ) {
      updateData[key] = value;
    }
  }

  try {
    const updatedUser = await client.user.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json(updatedUser);
  } catch (e) {
    res.status(500).json({ message: "Something went wrong." });
  }
};
