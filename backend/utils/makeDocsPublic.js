import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const makeAllPublic = async () => {
  let total = 0;

  // Try both 'upload' and 'authenticated' types, and both image/raw resource types
  for (const type of ['upload', 'authenticated']) {
    for (const resource_type of ['image', 'raw']) {
      try {
        const result = await cloudinary.api.resources({
          type,
          resource_type,
          prefix: 'bus-pass-documents',
          max_results: 100,
        });

        for (const resource of result.resources) {
          try {
            await cloudinary.uploader.explicit(resource.public_id, {
              type,
              resource_type,
              access_control: [{ access_type: 'anonymous' }],
            });
            console.log(`✅ Made public [${type}/${resource_type}]: ${resource.public_id}`);
            total++;
          } catch (err) {
            console.error(`❌ Failed: ${resource.public_id}`, err.message);
          }
        }
      } catch (err) {
        // ignore if no resources of this type
      }
    }
  }

  console.log(`\nDone! ${total} files made public.`);
};

makeAllPublic().catch(console.error);
