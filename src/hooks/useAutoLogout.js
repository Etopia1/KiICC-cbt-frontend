import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';
import toast from 'react-hot-toast';

const INACTIVITY_MS = 20 * 60 * 1000; // 20 minutes
const WARNING_MS    = 60 * 1000;       // warn 60 s before

export const useAutoLogout = (enabled = true) => {
    const dispatch  = useDispatch();
    const timerRef  = useRef(null);
    const warnRef   = useRef(null);
    const toastRef  = useRef(null);

    const doLogout = useCallback(() => {
        toast.dismiss(toastRef.current);
        dispatch(logout());
        window.location.href = '/#/login';
    }, [dispatch]);

    const resetTimer = useCallback(() => {
        clearTimeout(timerRef.current);
        clearTimeout(warnRef.current);
        toast.dismiss(toastRef.current);

        // Warning at (INACTIVITY_MS - WARNING_MS)
        warnRef.current = setTimeout(() => {
            toastRef.current = toast('⏰ You will be logged out in 60 seconds due to inactivity.', {
                duration: WARNING_MS,
                icon: '⚠️'
            });
        }, INACTIVITY_MS - WARNING_MS);

        // Actual logout
        timerRef.current = setTimeout(doLogout, INACTIVITY_MS);
    }, [doLogout]);

    useEffect(() => {
        if (!enabled) return;

        const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
        events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
        resetTimer(); // start immediately

        return () => {
            events.forEach(e => window.removeEventListener(e, resetTimer));
            clearTimeout(timerRef.current);
            clearTimeout(warnRef.current);
        };
    }, [enabled, resetTimer]);
};
