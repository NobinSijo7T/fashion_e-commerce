const withPWA = require("next-pwa");

const nextConfig = {
  i18n: {
    locales: ["en", "my"],
    defaultLocale: "en",
  },
  reactStrictMode: true,
  compiler: {
    removeConsole: true,
  },
  images: {
    domains: ["robohash.org", "res.cloudinary.com", "i.ibb.co"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

module.exports = withPWA({
  dest: "public",
  register: "",
  skipWaiting: false,
})(nextConfig);
