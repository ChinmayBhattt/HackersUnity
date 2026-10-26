import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});


async function main() {
  console.log('Testing Cloudinary configuration...');
  console.log('Cloud name:', cloudinary.config().cloud_name);
  console.log('API Key:', cloudinary.config().api_key);

  try {
    const pingResult = await cloudinary.api.ping();
    console.log('Cloudinary Ping Result:', pingResult);

    // Test a sample 1x1 pixel upload (valid PNG)
    const samplePixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    console.log('Uploading sample test image...');
    const uploadResult = await cloudinary.uploader.upload(samplePixel, {
      folder: 'hackers-unity/test',
      public_id: 'connection_test',
      overwrite: true,
    });

    console.log('Upload successful!');
    console.log('URL:', uploadResult.secure_url);
    console.log('Public ID:', uploadResult.public_id);

    // Clean up
    console.log('Cleaning up test image...');
    const destroyResult = await cloudinary.uploader.destroy(uploadResult.public_id);
    console.log('Delete result:', destroyResult);

    console.log('\nAll Cloudinary tests PASSED successfully!');
  } catch (err: any) {
    console.error('Cloudinary test FAILED:', err);
    process.exit(1);
  }
}

main();
