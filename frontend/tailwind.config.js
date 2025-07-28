/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#eff6ff',
                    500: '#3b82f6',
                    600: '#2563eb',
                },
            },
            animation: {
                'bounce-slow': 'bounce 2s infinite',
            }
        },
    },
    plugins: [],
    safelist: [
        'bg-blue-500',
        'bg-green-500',
        'bg-purple-500',
        'bg-red-500',
        'bg-orange-500',
        'bg-yellow-500',
        'text-white',
        'rounded-lg',
        'rounded-xl',
        'shadow-lg',
        'p-4',
        'p-6',
        'mb-4',
        'mb-6',
        'flex',
        'items-center',
        'justify-center',
        'gap-2',
        'gap-3',
        'gap-4',
        'transition-all',
        'hover:scale-105',
        'animate-pulse',
        'animate-bounce',
    ]
}