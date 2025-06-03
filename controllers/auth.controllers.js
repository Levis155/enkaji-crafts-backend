import { PrismaClient } from "../generated/prisma/index.js";
import bcrypt from "bcryptjs";

const client = new PrismaClient()

export const register = async(req, res) => {
    try{
        const{fullName, emailAddress, phoneNumber, password} = req.body;

        const hashedPassword = await bcrypt.hash(password, 12)

        await client.user.create({data:{
            fullName,
            emailAddress,
            phoneNumber,
            password: hashedPassword,
        }})

        res.status(201).json({message:"User registered successfully."})
    } catch(e) {
        res.status(500).json({message: "Something went wrong. Please Try again."});
        console.log(e)
    }
}