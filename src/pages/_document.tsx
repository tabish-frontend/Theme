import type { ComponentProps, ComponentType, FC, ReactElement } from 'react';
import type { AppType } from 'next/app';
import type { DocumentContext, DocumentProps } from 'next/document';
import Document, { Head, Html, Main, NextScript } from 'next/document';
import createEmotionServer from '@emotion/server/create-instance';

import { createEmotionCache } from 'src/utils/create-emotion-cache';

import type { CustomAppProps } from './_app';

const Favicon: FC = () => (
  <>
    <link
      rel="icon"
      href="/favicon.ico"
    />
    <link
      rel="icon"
      type="image/png"
      sizes="16x16"
      href="/favicon-16x16.png"
    />
    <link
      rel="icon"
      type="image/png"
      sizes="32x32"
      href="/favicon-32x32.png"
    />
    <link
      rel="apple-touch-icon"
      sizes="180x180"
      href="/apple-touch-icon.png"
    />
  </>
);

const Fonts: FC = () => (
  <>
    <link
      rel="preconnect"
      href="https://fonts.gstatic.com"
    />
    <link
      rel="preconnect"
      href="https://fonts.googleapis.com"
    />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap"
    />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300;400&display=swap"
    />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700&display=swap"
    />
  </>
);

const Vendors: FC = () => (
  <>
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.6.0/slick.min.css"
    />
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.6.0/slick-theme.min.css"
    />
  </>
);

interface CustomDocumentProps extends DocumentProps {
  emotionStyleTags: ReactElement[];
}

const CustomDocument = ({ emotionStyleTags }: CustomDocumentProps) => {
  return (
    <Html lang="en">
      <Head>
        <Favicon />
        <Fonts />
        <Vendors />
        <meta
          name="emotion-insertion-point"
          content=""
        />
        {emotionStyleTags}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
};

CustomDocument.getInitialProps = async (ctx: DocumentContext) => {
  const originalRenderPage = ctx.renderPage;
  const cache = createEmotionCache();
  const { extractCriticalToChunks } = createEmotionServer(cache);

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App: ComponentType<ComponentProps<AppType> & CustomAppProps>) =>
        function EnhanceApp(props) {
          return (
            <App
              emotionCache={cache}
              {...props}
            />
          );
        }
    });

  const initialProps = await Document.getInitialProps(ctx);
  const emotionStyles = extractCriticalToChunks(initialProps.html);
  const emotionStyleTags = emotionStyles.styles.map((style) => (
    <style
      data-emotion={`${style.key} ${style.ids.join(' ')}`}
      key={style.key}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: style.css }}
    />
  ));

  return {
    ...initialProps,
    emotionStyleTags
  };
};

export default CustomDocument;
