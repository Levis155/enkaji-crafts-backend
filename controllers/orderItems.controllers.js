import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export const updateOrderItem = async (req, res) => {
    try{
        const { orderItemId } = req.params;

        const orderItem = await client.orderItem.findUnique({
            where: {id: orderItemId}
        })

        if(!orderItem) {
            return res.status(404).json({message: "Order item not found."})
        }

        const updatedOrderItem = await client.orderItem.update({
            where:{
                id: orderItemId,
            },
            data: {
                isReviewed: true,
            }
        })

        res.status(200).json(updatedOrderItem)
    } catch(e) {
        res.status(500).json({message: "Something went wrong."})
    }
}