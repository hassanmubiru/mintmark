import { NextApiRequest, NextApiResponse } from 'next';
import { create } from 'ipfs-http-client';
import formidable from 'formidable';
import fs from 'fs';

// Disable body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Initialize IPFS client
const ipfs = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: `Basic ${Buffer.from(
      `${process.env.IPFS_PROJECT_ID}:${process.env.IPFS_PROJECT_SECRET}`
    ).toString('base64')}`,
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      filter: ({ mimetype }) => {
        // Allow only image files
        return Boolean(mimetype && mimetype.includes('image'));
      },
    });

    const [fields, files] = await form.parse(req);
    const uploadedFiles = files.file;

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const results = [];

    for (const file of uploadedFiles) {
      if (!file.filepath) {
        continue;
      }

      try {
        // Read file
        const fileBuffer = fs.readFileSync(file.filepath);
        
        // Upload to IPFS
        const result = await ipfs.add(fileBuffer, {
          pin: true,
        });

        // Clean up temporary file
        fs.unlinkSync(file.filepath);

        results.push({
          originalName: file.originalFilename,
          mimetype: file.mimetype,
          size: file.size,
          ipfsHash: result.path,
          ipfsUrl: `ipfs://${result.path}`,
          gatewayUrl: `https://ipfs.io/ipfs/${result.path}`,
        });
      } catch (error) {
        console.error('Error uploading file to IPFS:', error);
        
        // Clean up temporary file
        if (file.filepath && fs.existsSync(file.filepath)) {
          fs.unlinkSync(file.filepath);
        }
        
        results.push({
          originalName: file.originalFilename,
          error: 'Failed to upload file to IPFS',
        });
      }
    }

    return res.status(200).json({
      success: true,
      files: results,
    });

  } catch (error) {
    console.error('Error in upload API:', error);
    return res.status(500).json({ error: 'Failed to upload files' });
  }
}
