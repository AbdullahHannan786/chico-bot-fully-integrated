// pages/_app.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Toaster } from 'react-hot-toast';
import { SessionProvider } from 'next-auth/react';

import Navbar from '../components/NavbarTemp';
import Footer from '../components/Footer';

import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/globals.css';
import '../styles/footer.css';
import '../styles/profiles.css';
import '../styles/auth.css';
import '../styles/hero.css';
import '../styles/darkLanding.css';
import '../styles/navbar.css';

function Layout({ Component, pageProps }) {
  const router = useRouter();
  const hideChrome = ['/login', '/signup'].includes(router.pathname);

  useEffect(() => {
    // Bootstrap JS (collapse, dropdowns, etc.)
    import('bootstrap/dist/js/bootstrap.bundle.min.js');

    // Scroll‑reveal for elements with .reveal / .reveal-left / .reveal-right
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && e.target.classList.add('visible'));
      },
      { threshold: 0.15 }
    );
    const nodes = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    nodes.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      {!hideChrome && <Navbar />}
      <main>
        <Component {...pageProps} />
        <Toaster position="top-center" reverseOrder={false} toastOptions={{ duration: 4000 }} />
      </main>
      {!hideChrome && <Footer />}
    </>
  );
}

export default function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Layout Component={Component} pageProps={pageProps} />
    </SessionProvider>
  );
}
