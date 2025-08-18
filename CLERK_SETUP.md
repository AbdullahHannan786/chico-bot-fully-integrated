# Clerk Authentication Setup Guide

This project has been migrated from NextAuth to Clerk for enhanced social media and Google authentication.

## 🚀 Quick Setup

### 1. Create a Clerk Account
1. Go to [https://clerk.com](https://clerk.com)
2. Sign up for a free account
3. Create a new application

### 2. Configure Environment Variables
Create or update your `.env.local` file with the following:

```env
# Clerk Authentication Keys (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# Clerk URLs (Optional - defaults provided)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/chat
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/chat

# MongoDB (Existing)
MONGODB_URI=your_mongodb_connection_string
```

### 3. Configure Social Providers in Clerk Dashboard

#### Google OAuth Setup:
1. In your Clerk Dashboard, go to "User & Authentication" > "Social Connections"
2. Enable Google
3. Add your Google OAuth credentials:
   - Client ID: Get from [Google Cloud Console](https://console.cloud.google.com/)
   - Client Secret: From the same OAuth 2.0 client

#### Facebook OAuth Setup:
1. Enable Facebook in Clerk Dashboard
2. Add your Facebook App credentials:
   - App ID: From [Facebook Developers](https://developers.facebook.com/)
   - App Secret: From the same Facebook App

#### Other Social Providers:
Clerk supports many providers out of the box:
- GitHub
- Discord
- Twitter/X
- LinkedIn
- Apple
- Microsoft
- And many more...

### 4. User Roles (Admin Access)
To set admin roles:
1. Go to Clerk Dashboard > Users
2. Click on a user
3. Go to "Metadata" tab
4. Add to "Public metadata":
```json
{
  "role": "admin"
}
```

## 🔧 Migration Changes

### ✅ What's been updated:
- Replaced NextAuth with Clerk authentication
- Updated all components to use Clerk hooks
- Created new sign-in/sign-up pages with social providers
- Added middleware for route protection
- Maintained all existing functionality and design

### 🔄 New Authentication Flow:
- `/sign-in` - Sign in with email/password or social providers
- `/sign-up` - Register with email/password or social providers
- Automatic redirection to `/chat` after authentication
- Protected routes: `/chat`, `/profile`, `/admin`

### 📱 Social Login Features:
- **One-click social login** with Google, Facebook, etc.
- **Seamless user experience** - no need to create passwords
- **Profile auto-population** from social providers
- **Secure OAuth flows** handled by Clerk

## 🎯 Benefits of Clerk:

1. **Enhanced Security**: Enterprise-grade security with built-in protections
2. **Social Authentication**: Easy setup for Google, Facebook, GitHub, etc.
3. **Better UX**: Modern, responsive authentication UI
4. **User Management**: Comprehensive user dashboard and management
5. **Session Management**: Automatic token refresh and session handling
6. **Customizable**: Highly customizable appearance and behavior

## 🛠️ Development

```bash
# Install dependencies (already done)
npm install @clerk/nextjs

# Start development server
npm run dev
```

## 📋 Testing Checklist

- [ ] Sign up with email/password works
- [ ] Sign in with email/password works
- [ ] Google OAuth sign-in works
- [ ] Facebook OAuth sign-in works
- [ ] Chat page loads after authentication
- [ ] Profile page works with user data
- [ ] Admin panel works for admin users
- [ ] Voice controls work in chat
- [ ] Logout functionality works
- [ ] Route protection works (redirects to sign-in)

## 🆘 Troubleshooting

### Common Issues:

1. **Environment Variables**: Make sure all Clerk keys are properly set
2. **OAuth Redirect URLs**: In Google/Facebook console, add your domain
3. **Admin Access**: Set role metadata in Clerk dashboard
4. **CORS Issues**: Check allowed origins in social provider settings

### Still using NextAuth?
If you see any NextAuth references, they should be removed. This project now uses Clerk exclusively.

---

Your chat application now supports modern social authentication! 🎉
