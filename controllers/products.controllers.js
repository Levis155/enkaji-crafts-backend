import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export const createProduct = async (req, res) => {
    try{
        const {name, description, price, originalPrice, image, category, specifications, packageContent} = req.body;
        const newProduct = await client.product.create({
            data: {
                name,
                description,
                price,
                originalPrice,
                image,
                category,
                specifications,
                packageContent
            }
        });

        res.status(201).json({newProduct})
    } catch(e) {
        res.status(500).json({
            message: "Something went wrong."
        })
    }
}