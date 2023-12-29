import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html id="root" lang="en">
      <Head>
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      </Head>
      <body className="h-full bg-primary-bg">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
