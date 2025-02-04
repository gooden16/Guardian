React TypeScript application for managing volunteer shifts.

Core Components:
- App.tsx: Main router setup with protected routes for shifts, profile, and admin
- Layout.tsx: Navigation layout with conditional admin access
- ShiftBoard.tsx: Main shift management interface
- Profile.tsx: User profile management
- Admin.tsx: Administrative dashboard

Key Features:
- Authentication using Supabase
- Role-based access (L1, L2, Team Leaders, Admins)
- Shift signup system with different rules for Team Leaders
- Profile management with avatar uploads
- Hebrew text support
- Real-time messaging in shifts

Notable Implementation Details:
- Uses Tailwind for styling
- Lucide for icons
- Implements proper type safety with TypeScript
- Handles file uploads and image management
- Uses React Router for navigation
- Has robust error handling
