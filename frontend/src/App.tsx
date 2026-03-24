import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useThemeStore } from './store/themeStore';
import InterviewDashboard from './components/InterviewDashboard';

function ThemeInitializer() {
    const { theme } = useThemeStore();
    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);
    return null;
}

function ToasterWithTheme() {
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                duration: 4000,
                style: {
                    background: isDark ? '#1e293b' : '#fff',
                    color: isDark ? '#f1f5f9' : '#1e293b',
                    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                    borderRadius: '12px',
                    padding: '12px 16px',
                },
                success: {
                    iconTheme: { primary: '#22c55e', secondary: isDark ? '#1e293b' : '#fff' },
                },
                error: {
                    iconTheme: { primary: '#ef4444', secondary: isDark ? '#1e293b' : '#fff' },
                },
            }}
        />
    );
}

function App() {
    return (
        <>
            <ThemeInitializer />
            <InterviewDashboard />
            <ToasterWithTheme />
        </>
    );
}

export default App;