import type { NextApiRequest, NextApiResponse } from 'next'
var cloudinary = require('cloudinary').v2


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

type Data = {
    name: string
}
 
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {

    if (req.method === "POST") {
        let fileStr: string = req.body.data;
        let uploadResponse: any;

        try {
            uploadResponse = await cloudinary.uploader.upload_large(
                fileStr,
                {
                    resource_type: "auto",
                    chunk_size: 6000000,
                    timeout: 60000
                }
            );
            console.log(uploadResponse)
        } catch (err) {
            console.log(err)

        }
        res.status(200).json({ name: "" + uploadResponse.secure_url })
    }
}
