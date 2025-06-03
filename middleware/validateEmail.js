import { PrismaClient } from "../generated/prisma/index.js"

const client = new PrismaClient();

const validateEmail = async (req, res, next) => {
    const {emailAddress} = req.body;
    
    const user = await client.user.findFirst({where:{
        emailAddress
    }})

    if(user) {
        return res.status(400).json({
            message: "Email is already in use."
        })
    }

    next();
}

export default validateEmail;