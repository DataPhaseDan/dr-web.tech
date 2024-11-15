import type { PageProps } from "$fresh/server.ts";

export default function App({ Component }: PageProps) {
	return (
		<html lang="de">
			<head>
				<title>Daniel Renner - Web & Software Engineer</title>
				<meta
					name="description"
					content="Web & Software Engineer"
				/>
				<meta charSet="utf-8" />
				<meta name="viewport" content="initial-scale=1.0, width=device-width" />
				<link rel="manifest" href="/manifest.json" />
				<link rel="icon" type="image/x-icon" sizes="16x16" href="/favicon.ico" />
				<link rel="icon" type="image/x-icon" sizes="32x32" href="/favicon.ico" />
				<link rel="icon" type="image/x-icon" sizes="64x64" href="/favicon.ico" />
				<link rel="shortcut icon" href="/favicon.ico" />
				<link rel="apple-touch-icon" href="/favicon.ico" />
				<meta name="theme-color" content="#000000" />
				<link rel="stylesheet" href="/styles.css" />
			</head>
			<body>
				<div class="max-w-xl my-5 mx-auto lg:mx-2 sm:mx-1 text-sm text-white font-plex leading-none tracking-wide md:my-3">
					<Component />
				</div>
			</body>
		</html>
	);
}
