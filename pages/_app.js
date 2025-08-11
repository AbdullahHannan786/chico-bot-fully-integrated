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
import '../styles/navbar.css'

function AuthWrapper({ Component, pageProps }) {
  const router = useRouter();
  const isPublicRoute = ["/login", "/signup",].includes(router.pathname);

  return (
    <>
      {!isPublicRoute && <Navbar />}
      <main className="main-wrapper">
        <Component {...pageProps} />
        <Toaster position="top-center" reverseOrder={false} toastOptions={{ duration: 4000 }} />
      </main>
      {!isPublicRoute && <Footer />}
    </>
  );
}

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  useEffect(() => {
    require('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  return (
    <SessionProvider session={session}>
      <AuthWrapper Component={Component} pageProps={pageProps} />
    </SessionProvider>
  );
}

export default MyApp;