import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { PostHogProvider } from 'posthog-js/react'

const options = {
    api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
    ui_host: 'https://us.posthog.com'
}

const root = createRoot(document.getElementById("root")!);
root.render(
    <PostHogProvider
        apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
        options={options}
    >
        <App />
    </PostHogProvider>
);
