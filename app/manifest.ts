import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pixo - Professional Image Editing',
    short_name: 'Pixo',
    description: 'Remove backgrounds, retouch, crop, and export in seconds. Pixo runs entirely in your browser — your images never leave your machine.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/pixo-logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/pixo-logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
