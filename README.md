# GPK — Broker & Distributor Sembako Dashboard

A premium, modern React dashboard web application tailored for Sembako (consumer goods) distributors and brokers. Packaged for mobile devices via Capacitor.

## Tech Stack
- **Framework**: React 19, Vite 6
- **Styling**: TailwindCSS, Radix UI
- **Database & Backend**: Supabase
- **Mobile Integration**: Capacitor
- **Icons**: Lucide React
- **Charts**: Recharts

## Project Scripts

### 1. Development Server
Start the local development server with hot-module replacement:
```bash
npm run dev
```

### 2. Code Linting
Scan the codebase for code quality, syntax issues, and standard rules:
```bash
npm run lint
```

### 3. Production Build
Build the optimized production assets inside the `/dist` folder:
```bash
npm run build
```

### 4. Android Build (Capacitor)
Export production assets and sync them with the native Android Studio project:
```bash
npx cap sync android
```
