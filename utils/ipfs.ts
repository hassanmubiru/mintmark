import { create as ipfsHttpClient, IPFSHTTPClient } from 'ipfs-http-client';

export interface IPFSConfig {
  projectId?: string;
  projectSecret?: string;
  gatewayUrl?: string;
}

export interface IPFSUploadResult {
  cid: string;
  url: string;
  size: number;
}

class IPFSService {
  private client: IPFSHTTPClient | null = null;
  private gatewayUrl: string;

  constructor(config: IPFSConfig = {}) {
    this.gatewayUrl = config.gatewayUrl || 'https://ipfs.io/ipfs/';
    this.initializeClient(config);
  }

  private initializeClient(config: IPFSConfig) {
    try {
      if (config.projectId && config.projectSecret) {
        // Using Infura IPFS
        const auth = 'Basic ' + Buffer.from(config.projectId + ':' + config.projectSecret).toString('base64');
        this.client = ipfsHttpClient({
          host: 'ipfs.infura.io',
          port: 5001,
          protocol: 'https',
          headers: {
            authorization: auth,
          },
        });
      } else {
        // Using public IPFS gateway (less reliable for uploads)
        this.client = ipfsHttpClient({
          host: 'ipfs.infura.io',
          port: 5001,
          protocol: 'https',
        });
      }
    } catch (error) {
      console.warn('Failed to initialize IPFS client:', error);
      this.client = null;
    }
  }

  /**
   * Upload a file to IPFS
   * @param file File object or Buffer
   * @param filename Optional filename
   * @returns Promise with upload result
   */
  async uploadFile(file: File | Buffer, filename?: string): Promise<IPFSUploadResult> {
    if (!this.client) {
      throw new Error('IPFS client not initialized');
    }

    try {
      let fileData: Buffer;
      let name = filename;

      if (file instanceof File) {
        fileData = Buffer.from(await file.arrayBuffer());
        name = name || file.name;
      } else {
        fileData = file;
        name = name || 'unnamed-file';
      }

      const result = await this.client.add({
        content: fileData,
        path: name,
      });

      return {
        cid: result.cid.toString(),
        url: this.getGatewayUrl(result.cid.toString()),
        size: result.size,
      };
    } catch (error) {
      console.error('IPFS upload failed:', error);
      throw new Error(`Failed to upload file to IPFS: ${error}`);
    }
  }

  /**
   * Upload JSON metadata to IPFS
   * @param metadata Object to be stored as JSON
   * @param filename Optional filename
   * @returns Promise with upload result
   */
  async uploadJSON(metadata: any, filename?: string): Promise<IPFSUploadResult> {
    const jsonString = JSON.stringify(metadata, null, 2);
    const buffer = Buffer.from(jsonString, 'utf-8');
    const name = filename || 'metadata.json';

    return this.uploadFile(buffer, name);
  }

  /**
   * Upload multiple files to IPFS
   * @param files Array of files or buffers with optional names
   * @returns Promise with array of upload results
   */
  async uploadMultipleFiles(
    files: Array<{ file: File | Buffer; name?: string }>
  ): Promise<IPFSUploadResult[]> {
    if (!this.client) {
      throw new Error('IPFS client not initialized');
    }

    try {
      const uploads = [];
      for (const { file, name } of files) {
        uploads.push(this.uploadFile(file, name));
      }

      return Promise.all(uploads);
    } catch (error) {
      console.error('Multiple IPFS upload failed:', error);
      throw new Error(`Failed to upload multiple files to IPFS: ${error}`);
    }
  }

  /**
   * Retrieve content from IPFS
   * @param cid IPFS content identifier
   * @returns Promise with file content as Uint8Array
   */
  async getFile(cid: string): Promise<Uint8Array> {
    if (!this.client) {
      throw new Error('IPFS client not initialized');
    }

    try {
      const chunks = [];
      for await (const chunk of this.client.cat(cid)) {
        chunks.push(chunk);
      }
      
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      
      return result;
    } catch (error) {
      console.error('IPFS retrieval failed:', error);
      throw new Error(`Failed to retrieve file from IPFS: ${error}`);
    }
  }

  /**
   * Retrieve JSON metadata from IPFS
   * @param cid IPFS content identifier
   * @returns Promise with parsed JSON object
   */
  async getJSON(cid: string): Promise<any> {
    try {
      const data = await this.getFile(cid);
      const jsonString = new TextDecoder().decode(data);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('IPFS JSON retrieval failed:', error);
      throw new Error(`Failed to retrieve JSON from IPFS: ${error}`);
    }
  }

  /**
   * Get IPFS gateway URL for a given CID
   * @param cid IPFS content identifier
   * @returns Gateway URL string
   */
  getGatewayUrl(cid: string): string {
    return `${this.gatewayUrl}${cid}`;
  }

  /**
   * Pin content to IPFS (if using a pinning service)
   * @param cid IPFS content identifier
   * @returns Promise indicating success
   */
  async pinContent(cid: string): Promise<void> {
    if (!this.client) {
      throw new Error('IPFS client not initialized');
    }

    try {
      await this.client.pin.add(cid);
    } catch (error) {
      console.warn('IPFS pinning failed (this may be expected for some services):', error);
    }
  }

  /**
   * Check if content exists on IPFS
   * @param cid IPFS content identifier
   * @returns Promise with boolean indicating existence
   */
  async exists(cid: string): Promise<boolean> {
    try {
      await this.getFile(cid);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get content stats from IPFS
   * @param cid IPFS content identifier
   * @returns Promise with stat information
   */
  async stat(cid: string): Promise<any> {
    if (!this.client) {
      throw new Error('IPFS client not initialized');
    }

    try {
      // Try to get file to check if it exists
      await this.getFile(cid);
      return { exists: true, cid };
    } catch (error) {
      console.error('IPFS stat failed:', error);
      throw new Error(`Failed to get stats for IPFS content: ${error}`);
    }
  }
}

// Create default IPFS service instance
const defaultConfig: IPFSConfig = {
  projectId: process.env.IPFS_PROJECT_ID,
  projectSecret: process.env.IPFS_PROJECT_SECRET,
  gatewayUrl: process.env.IPFS_GATEWAY_URL,
};

export const ipfsService = new IPFSService(defaultConfig);

// Utility functions for common operations
export const uploadToIPFS = async (file: File | Buffer, filename?: string): Promise<IPFSUploadResult> => {
  return ipfsService.uploadFile(file, filename);
};

export const uploadJSONToIPFS = async (metadata: any, filename?: string): Promise<IPFSUploadResult> => {
  return ipfsService.uploadJSON(metadata, filename);
};

export const getFromIPFS = async (cid: string): Promise<Uint8Array> => {
  return ipfsService.getFile(cid);
};

export const getJSONFromIPFS = async (cid: string): Promise<any> => {
  return ipfsService.getJSON(cid);
};

export const getIPFSUrl = (cid: string): string => {
  return ipfsService.getGatewayUrl(cid);
};

export { IPFSService };
