import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
import { getMe, logout as logoutApi } from '../services/api';
const INACTIVITY_MS = 10 * 60 * 1000; // 10 minutes
const AuthContext = createContext(null);
const TAB_KEY = 'pb_tab_auth';
export function AuthProvider({ children }) {
    const [user, setUserState] = useState(null);
    const [viewingChild, setViewingChild] = useState(null);
    const [loading, setLoading] = useState(true);
    function setUser(u) {
        if (u)
            sessionStorage.setItem(TAB_KEY, '1');
        else
            sessionStorage.removeItem(TAB_KEY);
        setUserState(u);
    }
    useEffect(() => {
        if (!sessionStorage.getItem(TAB_KEY)) {
            setLoading(false);
            return;
        }
        getMe()
            .then((res) => setUserState(res.data))
            .catch(() => { setUserState(null); sessionStorage.removeItem(TAB_KEY); })
            .finally(() => setLoading(false));
    }, []);
    // Inactivity timer: logout after 10 minutes with no user interaction
    useEffect(() => {
        if (!user)
            return;
        let timer;
        function reset() {
            clearTimeout(timer);
            timer = setTimeout(async () => {
                try {
                    await logoutApi();
                }
                catch { /* ignore */ }
                setUser(null);
            }, INACTIVITY_MS);
        }
        const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
        reset();
        return () => {
            clearTimeout(timer);
            events.forEach((e) => window.removeEventListener(e, reset));
        };
    }, [user?.id]);
    return (_jsx(AuthContext.Provider, { value: { user, viewingChild, setUser, setViewingChild, loading }, children: children }));
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
