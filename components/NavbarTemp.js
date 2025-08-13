import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function NavbarTemp() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // ✅ avoid SSR/CSR mismatch
  }, []);

  // Close menu on route change
  useEffect(() => {
    const handleRoute = () => setExpanded(false);
    router.events.on('routeChangeStart', handleRoute);
    return () => router.events.off('routeChangeStart', handleRoute);
  }, [router.events]);

  // While not mounted, render a minimal stable shell (no auth-dependent UI)
  if (!mounted) {
    return (
      <nav className="navbar navbar-expand-lg" style={{ background: 'linear-gradient(90deg,#0ea5e9,#38bdf8)' }}>
        <div className="container">
          <span className="navbar-brand text-white fw-bold">Chico Robot</span>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar navbar-expand-lg" style={{ background: 'linear-gradient(90deg,#0ea5e9,#38bdf8)' }}>
      <div className="container">
        <Link className="navbar-brand text-white fw-bold" href="/">
          Chico Robot
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setExpanded((v) => !v)}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className={`collapse navbar-collapse ${expanded ? 'show' : ''}`}>
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link text-white" href="/">Home</Link>
            </li>
             <li className="nav-item">
              <Link className="nav-link text-white" href="/chat">Chat</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white" href="/about">About</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white" href="/contact">Contact</Link>
            </li>
           
            {session?.user?.role === 'admin' && (
              <li className="nav-item">
                <Link className="nav-link text-white fw-semibold" href="/admin">Admin Panel</Link>
              </li>
            )}
            {session && (
              <li className="nav-item">
                <Link className="nav-link text-white" href="/profile">Profile</Link>
              </li>
            )}
          </ul>

          <div className="d-flex gap-2">
            {status === 'loading' ? null : session ? (
              <>
                <span className="text-white small me-2">
                  {session.user.name} {session.user.role === 'admin' ? '(admin)' : ''}
                </span>
                <button
                  className="btn btn-outline-light btn-sm"
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-light btn-sm" onClick={() => router.push('/signup')}>Sign Up</button>
                <button className="btn btn-outline-light btn-sm" onClick={() => signIn()}>Login</button>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .navbar-toggler { border: 1px solid rgba(255, 255, 255, 0.6); }
        .navbar-toggler-icon {
          background-image: url("data:image/svg+xml;charset=utf8,%3Csvg viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath stroke='rgba(255,255,255, 0.9)' stroke-width='2' stroke-linecap='round' d='M4 7h22M4 15h22M4 23h22'/%3E%3C/svg%3E");
        }
        .nav-link:hover { text-decoration: underline; }
      `}</style>
    </nav>
  );
}
