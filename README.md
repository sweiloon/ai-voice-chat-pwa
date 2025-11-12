# Resonance - AI Voice Chat PWA

A Progressive Web App (PWA) that combines AI voice assistant capabilities with N8N workflow automation. Interact with AI through voice or text, and trigger complex N8N workflows through natural conversation.

## Features

### AI Chat Assistant
- **Voice Input**: Speech recognition for hands-free interaction
- **Text-to-Speech**: AI responses with customizable voice and rate
- **Multiple AI Providers**: Support for OpenAI, Anthropic, and mock mode
- **Session Management**: Save and manage conversation history
- **Data Export/Import**: Backup and restore chat data

### N8N Workflow Integration
- **Workflow Triggering**: Execute N8N workflows via voice or text commands
- **Cloud & Self-Hosted**: Support for both N8N Cloud and self-hosted instances
- **Connection Testing**: Validate N8N instance connectivity
- **Workflow Management**: Browse and interact with active workflows
- **CORS Proxy**: Built-in proxy for handling cross-origin requests

### Progressive Web App
- **Offline Support**: Service worker for offline functionality
- **Mobile Optimized**: Native app-like experience on mobile devices
- **Responsive Design**: Adaptive UI for desktop, tablet, and mobile
- **Fixed Navigation**: Persistent bottom navigation and headers
- **Dark Mode**: System-aware light/dark theme support

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand with IndexedDB persistence
- **UI Components**: Radix UI primitives
- **Speech**: Web Speech API for STT/TTS
- **PWA**: Vite PWA plugin with Workbox
- **Routing**: React Router v7

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- N8N instance (cloud or self-hosted) for workflow features

### Installation

1. Clone the repository:
```bash
git clone https://github.com/sweiloon/ai-voice-chat-pwa.git
cd ai-voice-chat-pwa
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (optional):
```bash
# Create .env file for API keys if not using settings UI
echo "VITE_OPENAI_KEY=your_key_here" > .env
echo "VITE_ANTHROPIC_KEY=your_key_here" >> .env
```

### Development

Run the development server:
```bash
npm run dev
```

Run the N8N CORS proxy (for local development):
```bash
npm run dev:proxy
```

The app will be available at `http://localhost:5173`

### Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## N8N Setup

### N8N Cloud

1. Get your workspace URL: `https://yourworkspace.app.n8n.cloud`
2. Generate an API key in N8N Settings → API
3. Enter credentials in the Settings page
4. The app automatically uses the proxy for Cloud instances

### Self-Hosted N8N

1. Configure CORS in your N8N instance:
```bash
N8N_CORS_ORIGIN=http://localhost:5173,https://yourdomain.com
```

2. Or enable the proxy option in Settings for automatic CORS handling

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── chat/        # Chat-related components
│   ├── layout/      # Layout components (navbar, sidebar, etc.)
│   ├── n8n/         # N8N workflow components
│   ├── settings/    # Settings UI components
│   └── common/      # Shared components
├── hooks/           # Custom React hooks
├── lib/             # Utility libraries (AI, TTS, STT, etc.)
├── n8n/             # N8N client and integration logic
├── routes/          # Page components
├── store/           # Zustand stores with IndexedDB persistence
└── styles/          # Global styles and Tailwind config
```

## Features in Detail

### Voice Input/Output
- Supports multiple languages for speech recognition
- Customizable TTS voice and playback rate
- Auto-play assistant responses (configurable)
- Visual feedback during voice recording

### Data Persistence
- IndexedDB for local data storage
- Export/import functionality for backups
- Session management across page reloads
- Persistent settings and preferences

### Mobile-First Design
- Fixed headers and navigation
- Touch-optimized interactions
- Proper keyboard handling
- Safe area support for notched devices
- Hidden scrollbars on mobile

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set up environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
1. Build the application: `npm run build`
2. Deploy the `dist` folder to your hosting provider
3. Ensure serverless function support for `/api/n8n-proxy.js`

## Configuration

### Settings UI
Access settings via the Settings page or dialog:
- AI Chat: Provider selection, API keys, speech settings
- N8N: Instance connection, API configuration
- Profile: Account management (coming soon)

### Environment Variables
```bash
VITE_OPENAI_KEY=       # OpenAI API key
VITE_ANTHROPIC_KEY=    # Anthropic API key
```

## Testing

Run unit tests:
```bash
npm run test
```

Run E2E tests:
```bash
npm run test:e2e
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Built with [Vite](https://vite.dev/)
- UI powered by [Radix UI](https://www.radix-ui.com/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)
- Workflow automation by [N8N](https://n8n.io/)
