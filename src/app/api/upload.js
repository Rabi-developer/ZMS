// pages/api/upload.js
import { v2 as cloudinary } from 'cloudinary';
import { IncomingForm } from 'formidable';
import fs from 'fs';

cloudinary.config({
  cloud_name: 'dyowbkn3s',
  api_key: '866797964998797',
  api_secret: 'Nv3vUMBrJj8fjf1oKAHhwuN0f-Y',
});

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const form = new IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Upload failed' });

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    const result = await cloudinary.uploader.upload(file.filepath, {
      folder: 'booking_orders',  // Optional: Organize in folder
      resource_type: 'auto',     // Handles image/pdf
    });

    fs.unlinkSync(file.filepath);  // Clean up temp file

    res.status(200).json({ url: result.secure_url });
  });
}