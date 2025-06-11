import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" className="h-full">
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Apply dark mode class from localStorage before page renders
              try {
                const theme = localStorage.getItem('theme') || 'light';
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {
                // Handle localStorage access errors
              }
            `,
          }}
        />
      </Head>
      <body className="h-full bg-white dark:bg-gray-950 text-gray-900 dark:text-white antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}