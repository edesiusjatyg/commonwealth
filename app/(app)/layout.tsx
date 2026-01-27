export default function ActionsLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <div className="container w-full">{children}</div>;
}
