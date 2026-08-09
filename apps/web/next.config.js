/** @type {import('next').NextConfig} */
const nextConfig = {
  // The Services deployment serves bundled product assets directly. Its
  // multi-service route table does not expose Next's image optimizer route.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
