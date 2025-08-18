import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useRouter } from 'next/router';


  const sections = [
  {
    title: 'Ready to Use Characters',
    desc: 'Choose from a library of high-quality 3D characters. From fantasy to sci-fi, all are rigged and ready.',
    image: '/ready-to-use-panel1.jpg',
    reverse: false,
  },
  {
    title: 'Automatic Rigging System',
    desc: 'Upload your custom models and let Chico auto-rig it with motion-ready skeletons.',
    image: '/automatic-chrachter-ringing-panel2.jpg',
    reverse: true,
  },
  {
    title: 'Motion Captured Animation',
    desc: 'Chico supports thousands of motion-captured actions. From dance to drama, it moves naturally.',
    image: '/motion-captured-animations-panel3.jpg',
    reverse: false,
  },
  {
    title: 'Real-Time AI Assistant',
    desc: 'Chico isn’t just animated — it’s smart. It listens, replies, and gestures in real time.',
    image: '/Floating Robot.jpg',
    reverse: true,
  },
  {
    title: 'Creative Freedom',
    desc: 'Blend AI, animation, and your imagination with Chico. A platform to experiment and build the future.',
    image: '/3.jpg',
    reverse: false,
  },
];

export default function Home() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !user) {
      // Use replace instead of push to avoid navigation history issues
      router.replace('/sign-up');
    }
  }, [isLoaded, user, router]);

  // Show loading while checking auth
  if (!isLoaded) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Don't render anything for unauthenticated users (will redirect)
  if (!user) {
    return null;
  }

  return (
    <>
      {/* Hero Section (Welcome + Buttons) */}
      <div className="hero-container">
        <div className="hero-overlay">
          <h1 className="hero-heading">Welcome back, {user.fullName || user.firstName || 'User'}!</h1>
          <p className="hero-desc">
            Chico is your personal AI companion that listens, learns, and chats just like a friend.
            Start your personalized journey or jump into a smart conversation now.
          </p>
          <div className="hero-buttons">
            <button className="hero-btn" onClick={() => router.push('/profile')}>
              Personalize Profile
            </button>
            <button className="hero-btn-outline" onClick={() => router.push('/chat')}>
              Start Chat
            </button>
          </div>
        </div>
      </div>

      {/* Dark Sections */}
      <div className="main-dark-wrapper">
        {sections.map((section, i) => (
          <div key={i} className={`dark-section ${section.reverse ? 'reverse' : ''}`}>
            <div className="text-block">
              <h2>{section.title}</h2>
              <p>{section.desc}</p>
            </div>
            <div className="img-block">
              <img src={section.image} alt={section.title} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}