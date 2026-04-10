import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: 'bus-pass-documents',
    resource_type: 'auto',
    type: 'upload',
    access_mode: 'public',
    public_id: `${file.fieldname}-${Date.now()}`,
    allowed_formats: ['pdf', 'jpg', 'jpeg', 'png'],
  }),
});

export const upload = multer({ storage });
export { cloudinary };
