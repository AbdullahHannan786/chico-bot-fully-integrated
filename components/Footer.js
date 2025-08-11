import Link from "next/link";



export default function Footer() {
  return (
    <footer className="bg-dark text-white text-center text-lg-start ">
      {/* <div className="container p-4">
        <div className="row"> */}
          {/* About */}
          {/* <div className="col-lg-6 col-md-12 mb-4 mb-md-0">
            <h5 className="text-uppercase">My Practice Web</h5>
            <p>
              This is a practice project built with Next.js and Bootstrap. You can modify and expand this footer as needed.
            </p>
          </div> */}

          {/* Links */}
          {/* <div className="col-lg-3 col-md-6 mb-4 mb-md-0">
            <h5 className="text-uppercase">Links</h5>
            <ul className="list-unstyled mb-0">
              <li><Link href="/" className="text-white">Home</Link></li>
              <li><Link href="/about" className="text-white">About</Link></li>
             
              <li><Link href="/contact" className="text-white">Contact</Link></li>
            </ul>
          </div> */}

          {/* Social */}
          {/* <div className="col-lg-3 col-md-6 mb-4 mb-md-0">
            <h5 className="text-uppercase">Follow Us</h5>
            <ul className="list-unstyled mb-0">
              <li><Link href="https://www.facebook.com/profile.php?id=61550927590212&mibextid=rS40aB7S9Ucbxw6v" target="_blank"  className="text-white">Facebook</Link></li>
              <li><Link href="https://www.instagram.com/aqhannan?igsh=MTIwbnNtZzZ2NXV5ZQ%3D%3D&utm_source=qr" target="_blank" className="text-white">Instagram</Link></li>
              <li><Link href="https://www.linkedin.com/in/abdullah-qaseem-0a127a243?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app" target="_blank" className="text-white">LinkedIn</Link></li>
            </ul>
          </div>
        </div> */}
      {/* </div> */}

      {/* Copyright */}
      <div className="text-center p-3 bg-secondary">
        © {new Date().getFullYear()} My Practice App. All rights reserved.
      </div>
    </footer>
  );
}
