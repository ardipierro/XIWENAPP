/**
 * @fileoverview Image compression utility (without external libraries)
 * @module utils/imageCompression
 */

/**
 * Compress an image file using Canvas API
 * @param {File} file - Image file to compress
 * @param {Object} options - Compression options
 * @param {number} options.maxSizeMB - Maximum size in MB (default: 1)
 * @param {number} options.maxWidthOrHeight - Max dimension (default: 1920)
 * @param {number} options.quality - Compression quality 0-1 (default: 0.8)
 * @returns {Promise<File>} Compressed image file
 */
export async function compressImage(file, options = {}) {
  const {
    maxSizeMB = 1,
    maxWidthOrHeight = 1920,
    quality = 0.8
  } = options;

  // Only compress images
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // Don't compress if already small
  const fileSizeMB = file.size / 1024 / 1024;
  if (fileSizeMB < maxSizeMB) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;

        if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
          if (width > height) {
            height = Math.round((height * maxWidthOrHeight) / width);
            width = maxWidthOrHeight;
          } else {
            width = Math.round((width * maxWidthOrHeight) / height);
            height = maxWidthOrHeight;
          }
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas toBlob failed'));
              return;
            }

            // Create new file from blob
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });

            // Check if compression was successful
            if (compressedFile.size < file.size) {
              resolve(compressedFile);
            } else {
              // If compressed file is larger, return original
              resolve(file);
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default {
  compressImage,
  formatFileSize
};
