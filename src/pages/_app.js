import Head from 'next/head';
import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './globals.css';

function MyApp({ Component, pageProps }) {
  const pageTitle = 'EngToolkit UI';
  const pageDescription = 'PM2 Processes Dashboard';

  useEffect(() => {
    document.title = pageTitle;
    const metaDescription = document.createElement('meta');
    metaDescription.name = 'description';
    metaDescription.content = pageDescription;
    document.head.appendChild(metaDescription);
  }, []);

  return (
    <>
      <ToastContainer autoClose={2000} />
        <Head />

        <Component {...pageProps} />
    </>
  );
}

export default MyApp;
