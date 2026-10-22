/**
 * Client-side Image Compression using HTML5 Canvas
 * Resizes camera photos to max 1600px dimension and compresses to JPEG ~80% quality.
 * Typical 5MB-12MB camera photos become 200KB-500KB without visible quality loss.
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1600,
  maxHeight: number = 1600,
  quality: number = 0.8
): Promise<File> {
  // If file is not an image or already smaller than 300KB, return as-is
  if (!file.type.startsWith("image/") || file.size <= 300 * 1024) {
    return file
  }

  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { width, height } = img

      // Scale down while maintaining aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }
      }

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        // Fallback to original file if canvas context is unavailable
        resolve(file)
        return
      }

      // Draw and export as JPEG
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file)
            return
          }

          const compressedFileName = file.name.replace(/\.[^/.]+$/, "") + ".jpg"
          const compressedFile = new File([blob], compressedFileName, {
            type: "image/jpeg",
            lastModified: Date.now(),
          })

          console.log(
            `[Image Compressed] Original: ${(file.size / 1024 / 1024).toFixed(2)} MB -> Compressed: ${(compressedFile.size / 1024).toFixed(0)} KB`
          )

          resolve(compressedFile)
        },
        "image/jpeg",
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(file)
    }

    img.src = objectUrl
  })
}
