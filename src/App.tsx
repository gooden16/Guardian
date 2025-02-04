import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthProvider } from './context/AuthProvider';
import { RequireAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Admin } from './pages/Admin';
import { ShiftBoard } from './pages/ShiftBoard';
import { Profile } from './pages/Profile';
import { CompleteProfile } from './pages/CompleteProfile';

function App() {
 return (
   <AuthProvider>
     <BrowserRouter>
       <Routes>
         <Route path="/login" element={<Login />} />
         <Route path="/complete-profile" element={<CompleteProfile />} />
         
         {/* Protected Routes */}
         <Route element={<RequireAuth><Layout /></RequireAuth>}>
           {/* Redirect root to shifts */}
           <Route index element={<Navigate to="/shifts" replace />} />
           
           {/* Main routes */}
           <Route path="/shifts" element={<ShiftBoard />} />
           <Route path="/profile" element={<Profile />} />
           <Route path="/admin" element={<Admin />} />
         </Route>

         {/* Catch all - redirect to shifts */}
         <Route path="*" element={<Navigate to="/shifts" replace />} />
       </Routes>
     </BrowserRouter>
   </AuthProvider>
 );
}

export default App;
