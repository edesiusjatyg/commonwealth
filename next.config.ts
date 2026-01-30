import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactCompiler: true,
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 's2.coinmarketcap.com',
				pathname: '/static/img/coins/**',
			},
		],
	},
};

export default nextConfig;

