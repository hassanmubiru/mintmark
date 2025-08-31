import { NextApiRequest, NextApiResponse } from 'next';
import { create } from 'ipfs-http-client';

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
  if (req.method === 'POST') {
    // Upload metadata to IPFS
    try {
      const { metadata } = req.body;

      if (!metadata) {
        return res.status(400).json({ error: 'Metadata is required' });
      }

      // Upload metadata to IPFS
      const result = await ipfs.add(JSON.stringify(metadata));
      const ipfsHash = result.path;

      return res.status(200).json({
        success: true,
        ipfsHash,
        ipfsUrl: `ipfs://${ipfsHash}`,
        gatewayUrl: `https://ipfs.io/ipfs/${ipfsHash}`,
      });
    } catch (error) {
      console.error('Error uploading metadata to IPFS:', error);
      return res.status(500).json({ error: 'Failed to upload metadata to IPFS' });
    }
  } else if (req.method === 'GET') {
    // Retrieve metadata from IPFS
    try {
      const { hash } = req.query;

      if (!hash) {
        return res.status(400).json({ error: 'IPFS hash is required' });
      }

      // Fetch metadata from IPFS
      const chunks = [];
      for await (const chunk of ipfs.cat(hash as string)) {
        chunks.push(chunk);
      }
      
      const metadata = JSON.parse(Buffer.concat(chunks).toString());

      return res.status(200).json({
        success: true,
        metadata,
        ipfsHash: hash,
      });
    } catch (error) {
      console.error('Error retrieving metadata from IPFS:', error);
      return res.status(500).json({ error: 'Failed to retrieve metadata from IPFS' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
