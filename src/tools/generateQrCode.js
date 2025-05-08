/**
 * YOURLS-MCP Tool: Generate QR code for a short URL
 */
import { z } from 'zod';

/**
 * Creates the generate QR code tool
 * 
 * @param {object} yourlsClient - YOURLS API client instance
 * @returns {object} MCP tool definition
 */
export default function createGenerateQrCodeTool(yourlsClient) {
  return {
    name: 'generate_qr_code',
    description: 'Generate a QR code for a shortened URL',
    inputSchema: {
      type: 'object',
      properties: {
        shorturl: {
          type: 'string',
          description: 'The short URL or keyword to generate a QR code for'
        },
        size: {
          type: 'number',
          description: 'QR code size in pixels (default: depends on plugin configuration)'
        },
        border: {
          type: 'number',
          description: 'Border width around the QR code (default: depends on plugin configuration)'
        },
        ecc: {
          type: 'string',
          description: 'Error correction level: L (low), M (medium), Q (quartile), or H (high)'
        },
        format: {
          type: 'string',
          description: 'Image format (e.g., png, jpg, svg)'
        }
      },
      required: ['shorturl']
    },
    execute: async ({ shorturl, size, border, ecc, format }) => {
      try {
        // Validate ecc if provided
        if (ecc && !['L', 'M', 'Q', 'H'].includes(ecc.toUpperCase())) {
          throw new Error('Error correction level must be one of: L, M, Q, H');
        }
        
        // Normalize ecc to uppercase
        if (ecc) {
          ecc = ecc.toUpperCase();
        }
        
        // Validate format if provided
        if (format && !['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(format.toLowerCase())) {
          throw new Error('Format must be one of: png, jpg, jpeg, gif, svg');
        }
        
        // Generate QR code
        const result = await yourlsClient.generateQrCode(shorturl, {
          size: size ? Number(size) : undefined,
          border: border ? Number(border) : undefined,
          ecc,
          format
        });
        
        if (result.status === 'success') {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'success',
                  shorturl: shorturl,
                  data: result.data,
                  contentType: result.contentType,
                  url: result.url
                })
              }
            ]
          };
        } else {
          throw new Error(result.message || 'Unknown error');
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                message: error.message,
                shorturl: shorturl
              })
            }
          ],
          isError: true
        };
      }
    }
  };
}