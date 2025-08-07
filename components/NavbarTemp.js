import Link from "next/link";
import { useSession, signOut } from "next-auth/react"; // ✅ you already have this
import { useRouter } from "next/router";

export default function Navbar() {
  const { data: session } = useSession(); // ✅ This line was missing
  const router = useRouter();
  const onHome = router.pathname === "/";

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom px-3">
      <div className="container-fluid">
        <Link href="/" className="navbar-brand fs-4 fw-bold text-primary">
          Chico Robot
        </Link>

        <div className="collapse navbar-collapse">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            {session && session.user && (
              <>
                {!onHome && (
                  <li className="nav-item">
                    <Link href="/profile" className="nav-link">
                      My Profile
                    </Link>
                  </li>
                )}
                <li className="nav-item">
                  <Link href="/chat" className="nav-link">
                    Start Chat
                  </Link>
                </li>
                {session.user.role === "admin" && (
                  <li className="nav-item">
                    <Link href="/admin" className="nav-link">
                      Admin Panel
                    </Link>
                  </li>
                )}
                <li className="nav-item">
                  <button
                    className="btn text-danger fw-bold ms-3"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    Logout
                  </button>
                </li>
              </>
            )}
            {!session && (
              <>
                <li className="nav-item">
                  <Link href="/signup" className="nav-link">
                    Signup
                  </Link>
                </li>
                <li className="nav-item">
                  <Link href="/login" className="nav-link">
                    Login
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
