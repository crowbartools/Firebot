import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" className="bg-primary-bg">
      <Head>
        <link
          rel="stylesheet"
          href="https://rsms.me/inter/inter.css"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
