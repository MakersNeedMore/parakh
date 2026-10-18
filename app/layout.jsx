import './globals.css';
export const metadata = {
  title: {
    default: 'Parakh • Deepfake Face Detection System',
    template: '%s | Parakh'
  },
  description: 'Parakh is a specialized AI platform engineered to detect deepfake pictures, morphed faces, and synthetic or AI-manipulated video frames using binary classification and FaceForensics++ benchmarks.',
  applicationName: 'Parakh',
  authors: [
    { name: 'Aditya Verma' },
    { name: 'Charvi Goyal' },
    { name: 'Agrima Tripathi' },
    { name: 'Anurag Verma' },
    { name: 'Nishu Kumari' },
    { name: 'Shivang Saxena' },
    { name: 'Tanu Thakur' },
    { name: 'Yash Gupta' }
  ],
  creator: 'MnM Developers',
  publisher: 'Pixpect / Parakh',
  keywords: [
    'deepfake detection',
    'deepfake face detection system',
    'AI generated image detector',
    'synthetic media verification',
    'morphed picture detector',
    'FaceForensics++',
    'binary classification deepfake',
    'temporal frame aggregation',
    'attention heatmaps',
    'facial forgery detection',
    'deepfake video analysis',
    'Parakh',
    'Pixpect',
    'Parakh AI',
    'Pixpect AI',
    'MnM Developers',
    'FaceSwap detection',
    'Face2Face detection',
    'NeuralTextures detection'
  ],
  metadataBase: new URL('https://parakh.xyz'),
  alternates: {
    canonical: 'https://parakh.xyz',
    languages: {
      'en-US': 'https://parakh.xyz'
    }
  },
  openGraph: {
    title: 'Parakh • Deepfake Face Detection System',
    description: 'Specialized platform detecting deepfake pictures, morphed images, and synthetic or AI-manipulated video frames using binary classification and FaceForensics++ benchmarks.',
    url: 'https://parakh.xyz',
    siteName: 'Parakh',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/assets/long logo darkkkk.png',
        width: 1236,
        height: 379,
        alt: 'Parakh Deepfake Face Detection System'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Parakh • Deepfake Face Detection System',
    description: 'Specialized platform detecting deepfake pictures, morphed images, and synthetic or AI-manipulated video frames.',
    images: ['/assets/long logo darkkkk.png']
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  icons: {
    icon: [
      { url: '/assets/logo white bg transparent.png', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    shortcut: '/assets/logo white bg transparent.png',
    apple: '/assets/logo white bg transparent.png'
  }
};
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://parakh.xyz/#website',
      'url': 'https://parakh.xyz',
      'name': 'Parakh',
      'alternateName': ['Pixpect', 'Parakh AI', 'Pixpect AI'],
      'description': 'Advanced Deepfake Face Detection and Synthetic Media Verification System.',
      'publisher': {
        '@id': 'https://parakh.xyz/#organization'
      },
      'inLanguage': 'en-US'
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://parakh.xyz/#software',
      'name': 'Parakh Deepfake Detection Platform',
      'applicationCategory': 'SecurityApplication',
      'operatingSystem': 'Web, Cloud',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'description': 'Binary classification model engineered to distinguish authentic from manipulated faces in images and video frames, benchmarked on FaceForensics++.',
      'featureList': [
        'Binary Classification with Confidence Scoring',
        'Temporal Frame Aggregation for MP4 Video Streams',
        'Attention Heatmaps for Spatial Forgery Localization',
        'Robustness Testing Against JPEG Compression and Blur'
      ],
      'creator': {
        '@id': 'https://parakh.xyz/#organization'
      }
    },
    {
      '@type': 'Organization',
      '@id': 'https://parakh.xyz/#organization',
      'name': 'MnM Developers',
      'url': 'https://parakh.xyz',
      'logo': 'https://parakh.xyz/assets/mnm-logo.png',
      'member': [
        { '@type': 'Person', 'name': 'Aditya Verma', 'jobTitle': 'AI/ML & Backend' },
        { '@type': 'Person', 'name': 'Charvi Goyal', 'jobTitle': 'Data Science & Database' },
        { '@type': 'Person', 'name': 'Agrima Tripathi', 'jobTitle': 'Technical Writer' },
        { '@type': 'Person', 'name': 'Anurag Verma', 'jobTitle': 'Frontend Developer' },
        { '@type': 'Person', 'name': 'Nishu Kumari', 'jobTitle': 'Frontend Developer' },
        { '@type': 'Person', 'name': 'Shivang Saxena', 'jobTitle': 'Backend & Auth' },
        { '@type': 'Person', 'name': 'Tanu Thakur', 'jobTitle': 'Backend, Database & Auth' },
        { '@type': 'Person', 'name': 'Yash Gupta', 'jobTitle': 'Frontend Developer' }
      ]
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://parakh.xyz/#faq',
      'mainEntity': [
        {
          '@type': 'Question',
          'name': 'What is Parakh?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Parakh is an AI-powered deepfake face detection platform developed under the Pixpect brand by the MnM developer group. It detects forged, morphed, and synthetic media across images and video frames.'
          }
        },
        {
          '@type': 'Question',
          'name': 'How does the deepfake detection model work?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'The platform applies a binary classification deep learning model to evaluate facial regions, combined with a temporal frame aggregation engine that scans video sequences to identify suspicious segments.'
          }
        },
        {
          '@type': 'Question',
          'name': 'Which datasets and forgery techniques are benchmarked?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Parakh benchmarks on the FaceForensics++ dataset across key manipulation methodologies: FaceSwap, Face2Face, Deepfakes, and NeuralTextures.'
          }
        },
        {
          '@type': 'Question',
          'name': 'Who are the creators of Parakh?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Parakh is created by MnM Developers: Aditya Verma, Charvi Goyal, Agrima Tripathi, Anurag Verma, Nishu Kumari, Shivang Saxena, Tanu Thakur, and Yash Gupta.'
          }
        }
      ]
    }
  ]
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/assets/logo white bg transparent.png" type="image/png" />
        <link rel="shortcut icon" href="/assets/logo white bg transparent.png" type="image/png" />
        <link rel="apple-touch-icon" href="/assets/logo white bg transparent.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
