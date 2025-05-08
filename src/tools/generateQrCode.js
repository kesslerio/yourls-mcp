/**
 * YOURLS-MCP Tool: Generate QR code for a short URL
 */
import { z } from 'zod';
import { createMcpResponse } from '../utils.js';

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
        // Validate size if provided
        if (size !== undefined) {
          const sizeNum = Number(size);
          if (isNaN(sizeNum) || sizeNum <= 0) {
            throw new Error('Size must be a positive number');
          }
          
          // Add upper limit check for QR code size
          if (sizeNum > 1000) {
            throw new Error('QR code size cannot exceed 1000 pixels for performance reasons');
          }
        }
        
        // Validate border if provided
        if (border !== undefined) {
          const borderNum = Number(border);
          if (isNaN(borderNum) || borderNum < 0) {
            throw new Error('Border must be a non-negative number');
          }
        }
        
        // Validate ecc if provided
        if (ecc && !['L', 'M', 'Q', 'H'].includes(ecc.toUpperCase())) {
          throw new Error(`Error correction level '${ecc}' is not supported. Must be one of: L (low), M (medium), Q (quartile), or H (high)`);
        }
        
        // Normalize ecc to uppercase
        if (ecc) {
          ecc = ecc.toUpperCase();
        }
        
        // Validate format if provided
        if (format && !['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(format.toLowerCase())) {
          throw new Error(`Format '${format}' is not supported. Must be one of: png, jpg, jpeg, gif, svg`);
        }
        
        // Define MIME type mapping to ensure consistency
        const formatToMimeType = {
          'png': 'image/png',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'svg': 'image/svg+xml',
          'gif': 'image/gif'
        };
        
        // Generate QR code
        const result = await yourlsClient.generateQrCode(shorturl, {
          size: size !== undefined ? Number(size) : undefined,
          border: border !== undefined ? Number(border) : undefined,
          ecc,
          format
        });
        
        if (result.status === 'success') {
          return createMcpResponse(true, {
            shorturl: shorturl,
            data: result.data,
            contentType: result.contentType,
            url: result.url,
            config: result.config
          });
        } else {
          throw new Error(result.message || 'Unknown error');
        }
      } catch (error) {
        return createMcpResponse(false, {
          message: error.message,
          shorturl: shorturl
        });
      }
    }
  };
}