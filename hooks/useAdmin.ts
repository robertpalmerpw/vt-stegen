import { useState, useEffect } from 'react';

const ADMIN_KEY = 'pingis_admin_auth';

export const useAdmin = () => {
 const [isAdmin, setIsAdmin] = useState<boolean>(() => {
 return !!localStorage.getItem(ADMIN_KEY);
 });

 useEffect(() => {
 const handleStorage = () => {
 setIsAdmin(!!localStorage.getItem(ADMIN_KEY));
 };

 // Lyssna på ändringar både från andra flikar och samma flik
 window.addEventListener('storage', handleStorage);
 window.addEventListener('admin-auth-change', handleStorage);

 return () => {
 window.removeEventListener('storage', handleStorage);
 window.removeEventListener('admin-auth-change', handleStorage);
 };
 }, []);

 const verifyPassword = (password: string): boolean => {
 const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD;

 // Kontrollera att lösenordet matchar miljövariabeln
 // Vi kollar även att env-variabeln existerar
 if (correctPassword && password === correctPassword) {
 localStorage.setItem(ADMIN_KEY, 'true');
 window.dispatchEvent(new Event('admin-auth-change'));
 return true;
 }
 return false;
 };

 const logout = () => {
 localStorage.removeItem(ADMIN_KEY);
 window.dispatchEvent(new Event('admin-auth-change'));
 };

 return { isAdmin, verifyPassword, logout };
};
