import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function NavbarTemp() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const isAuthenticated = !!session?.user;

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.replace('/login');
  };

  const toggleNavbar = () => {
    setIsOpen(!isOpen);

    // Auto close after 5 seconds
    setTimeout(() => setIsOpen(false), 5000);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm px-4 py-2">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold text-primary" href="/">
          Chico Robot
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          onClick={toggleNavbar}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`}>
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            {isAuthenticated && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" href="/profile">My Profile</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" href="/chat">Start Chat</Link>
                </li>
                <li className="nav-item">
                  <button
                    className="nav-link text-danger fw-bold border-0 bg-transparent"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
