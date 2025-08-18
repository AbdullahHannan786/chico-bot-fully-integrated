import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <>
      <style jsx>{`
        .desktop-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        
        .signup-card {
          width: 100%;
          max-width: 450px;
          margin: 0 auto;
          border-radius: 12px;
          border: none;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(10px);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
        }
        
        .card-body {
          padding: 2.5rem;
        }
        
        .header-section {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .header-title {
          color: #1e3c72;
          font-weight: bold;
          font-size: 1.75rem;
          margin-bottom: 0.75rem;
        }
        
        .header-subtitle {
          color: #6c757d;
          font-size: 1rem;
          margin-bottom: 0;
        }
        
        /* Desktop styles (769px and above) */
        @media (min-width: 769px) {
          .desktop-container {
            padding: 3rem;
          }
          
          .signup-card {
            max-width: 500px;
            transform: scale(0.95);
            transition: transform 0.3s ease;
          }
          
          .signup-card:hover {
            transform: scale(1);
          }
          
          .card-body {
            padding: 3rem;
          }
          
          .header-title {
            font-size: 2rem;
          }
          
          .header-subtitle {
            font-size: 1.1rem;
          }
        }
        
        /* Tablet styles */
        @media (min-width: 577px) and (max-width: 768px) {
          .desktop-container {
            padding: 2rem;
          }
          
          .signup-card {
            max-width: 480px;
          }
          
          .card-body {
            padding: 2rem;
          }
        }
        
        /* Mobile styles (576px and below) */
        @media (max-width: 576px) {
          .desktop-container {
            padding: 5px;
            align-items: flex-start;
            padding-top: 2vh;
            padding-bottom: 2vh;
          }
          
          .signup-card {
            max-width: 100%;
            margin: 0;
            border-radius: 8px;
            min-height: auto;
            transform: none;
          }
          
          .signup-card:hover {
            transform: none;
          }
          
          .card-body {
            padding: 1rem;
            padding-bottom: 1.5rem;
          }
          
          .header-section {
            margin-bottom: 1.5rem;
          }
          
          .header-title {
            font-size: 1.3rem;
          }
          
          .header-subtitle {
            font-size: 0.85rem;
          }
        }
        
        @media (max-width: 400px) {
          .desktop-container {
            padding: 2px;
            padding-top: 1vh;
            padding-bottom: 2vh;
          }
          
          .signup-card {
            border-radius: 4px;
            min-height: auto;
            transform: none;
          }
          
          .signup-card:hover {
            transform: none;
          }
          
          .card-body {
            padding: 0.75rem;
            padding-bottom: 1.25rem;
          }
          
          .header-section {
            margin-bottom: 1rem;
          }
        }
      `}</style>
      
      <div className="desktop-container">
        <div className="signup-card">
          <div className="card-body">
            <div className="header-section">
              <h2 className="header-title">Join Chico Chat!</h2>
              <p className="header-subtitle">Create your account to start chatting</p>
            </div>
            <SignUp 
              appearance={{
                elements: {
                  formButtonPrimary: "btn btn-primary w-100 py-2 fw-semibold",
                  socialButtonsBlockButton: "btn btn-outline-secondary w-100 mb-2 py-2",
                  formFieldInput: "form-control py-2",
                  card: "border-0 bg-transparent shadow-none",
                  headerTitle: "d-none",
                  headerSubtitle: "d-none",
                  socialButtonsBlockButtonText: "fw-semibold",
                  formFieldLabel: "form-label fw-semibold text-dark",
                  footerActionLink: "text-primary fw-semibold text-decoration-none",
                  formFieldInputShowPasswordButton: "btn btn-outline-secondary",
                  formFieldRow: "mb-3",
                  dividerLine: "bg-secondary",
                  dividerText: "text-muted small",
                  socialButtonsProviderIcon: "me-2",
                  footer: "mt-4 pt-3 border-top",
                  footerAction: "text-center",
                  footerActionText: "text-dark fw-normal",
                  footerActionLink: "text-primary fw-semibold text-decoration-none ms-1"
                },
                layout: {
                  socialButtonsPlacement: "top"
                },
                variables: {
                  colorPrimary: "#1e3c72",
                  colorBackground: "transparent",
                  colorInputBackground: "#ffffff",
                  colorInputText: "#000000",
                  colorText: "#000000",
                  colorTextSecondary: "#6c757d",
                  borderRadius: "6px",
                  spacingUnit: "0.75rem"
                }
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
