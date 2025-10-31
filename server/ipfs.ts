import CryptoJS from "crypto-js";

interface PinataUploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

interface IPFSUploadResult {
  cid: string;
  hash: string;
  url: string;
}

class PinataService {
  private apiKey: string;
  private apiSecret: string;
  private jwt: string;
  private gatewayUrl = "https://gateway.pinata.cloud/ipfs/";

  constructor() {
    this.apiKey = process.env.PINATA_API_KEY || "";
    this.apiSecret = process.env.PINATA_API_SECRET || "";
    this.jwt = process.env.PINATA_JWT || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJoZWFsdGhndWFyZCIsIm5hbWUiOiJoZWFsdGhndWFyZCIsImVtYWlsIjoiaGVhbHRoZ3VhcmRAZXhhbXBsZS5jb20ifSwiZXhwIjoxNzM1Njg5NjAwfQ.TYZqgYQwHfpKn7eYemQb1YxX6MxYG8Z1v1x2MEjH8zY";

    if (!this.jwt) {
      console.warn("PINATA_JWT not configured. IPFS uploads will fail.");
    }
  }

  async uploadFile(fileData: string, fileName: string, metadata?: Record<string, any>): Promise<IPFSUploadResult> {
    try {
      // Calculate file hash for integrity verification
      const fileHash = CryptoJS.SHA256(fileData).toString();

      // Convert base64 to buffer if needed
      let buffer: Buffer;
      if (fileData.startsWith('data:')) {
        // Extract base64 data from data URL
        const base64Data = fileData.split(',')[1];
        buffer = Buffer.from(base64Data, 'base64');
      } else {
        buffer = Buffer.from(fileData);
      }

      // Create form data
      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      formData.append('file', buffer, fileName);

      // Add metadata if provided
      const pinataMetadata = {
        name: fileName,
        keyvalues: metadata || {}
      };
      formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

      // Upload to Pinata
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.jwt}`,
          ...formData.getHeaders(),
        },
        body: formData as any,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pinata upload failed: ${response.status} - ${errorText}`);
      }

      const result: PinataUploadResponse = await response.json();

      return {
        cid: result.IpfsHash,
        hash: fileHash,
        url: `${this.gatewayUrl}${result.IpfsHash}`,
      };
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw new Error(`Failed to upload file to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async uploadJSON(data: any, fileName: string): Promise<IPFSUploadResult> {
    try {
      const jsonString = JSON.stringify(data);
      const fileHash = CryptoJS.SHA256(jsonString).toString();

      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pinataContent: data,
          pinataMetadata: {
            name: fileName,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pinata JSON upload failed: ${response.status} - ${errorText}`);
      }

      const result: PinataUploadResponse = await response.json();

      return {
        cid: result.IpfsHash,
        hash: fileHash,
        url: `${this.gatewayUrl}${result.IpfsHash}`,
      };
    } catch (error) {
      console.error('Error uploading JSON to IPFS:', error);
      throw new Error(`Failed to upload JSON to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getFile(cid: string): Promise<string> {
    try {
      const response = await fetch(`${this.gatewayUrl}${cid}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch file from IPFS: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error fetching from IPFS:', error);
      throw new Error(`Failed to fetch file from IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getCIDUrl(cid: string): string {
    return `${this.gatewayUrl}${cid}`;
  }
}

export const ipfsService = new PinataService();
export type { IPFSUploadResult };
