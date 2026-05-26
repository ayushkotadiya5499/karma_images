# 🎨 Webelight Frontend Agent — React + Vite + TypeScript Project Structure & Conventions

> **Purpose**: This agent ensures that every new React frontend project follows the exact architectural patterns, file structures, component organization, state management, API integration, routing, theming, and deployment configurations established in the **ai-code-review-agent/frontend** reference project.

---

## 📋 Table of Contents

1. [Project Root Structure](#1-project-root-structure)
2. [Source (`src/`) Directory Layout](#2-source-src-directory-layout)
3. [Technology Stack](#3-technology-stack)
4. [Configuration Files](#4-configuration-files)
5. [Application Entry Point](#5-application-entry-point)
6. [Routing Architecture](#6-routing-architecture)
7. [Context Providers](#7-context-providers)
8. [Authentication System](#8-authentication-system)
9. [API Service Layer](#9-api-service-layer)
10. [Type System](#10-type-system)
11. [Component Architecture](#11-component-architecture)
12. [Page Components](#12-page-components)
13. [UI Component Library](#13-ui-component-library)
14. [Styling Strategy](#14-styling-strategy)
15. [Custom Hooks](#15-custom-hooks)
16. [Utility Libraries](#16-utility-libraries)
17. [Environment Variables](#17-environment-variables)
18. [Docker & Deployment](#18-docker--deployment)
19. [API Response Handling Pattern](#19-api-response-handling-pattern)
20. [Step-by-Step: Adding a New Feature](#20-step-by-step-adding-a-new-feature)
21. [Anti-Patterns to Avoid](#21-anti-patterns-to-avoid)
22. [Checklist for New Projects](#22-checklist-for-new-projects)

---

## 1. Project Root Structure

```
frontend/
├── .dockerignore                 # Docker ignore rules
├── .env                          # Environment variables (never commit)
├── Dockerfile                    # Production multi-stage build
├── Dockerfile.dev                # Development Dockerfile
├── env.example                   # Template for .env
├── index.html                    # Vite entry HTML
├── nginx.conf                    # Nginx config for production
├── package.json                  # Dependencies & scripts
├── package-lock.json
├── postcss.config.js             # PostCSS (Tailwind integration)
├── tailwind.config.js            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript config
├── tsconfig.node.json            # TypeScript config for Node
├── vite.config.ts                # Vite bundler configuration
├── dist/                         # Build output (auto-generated)
├── node_modules/                 # Dependencies (auto-generated)
└── src/                          # ALL application source code
```

---

## 2. Source (`src/`) Directory Layout

```
src/
├── App.tsx                       # Root component — routing + providers
├── main.tsx                      # React DOM entry point
├── index.css                     # Global styles + Tailwind directives
├── vite-env.d.ts                 # Vite environment type declarations
├── components/                   # Shared/layout components
│   ├── Layout.tsx                # Main application layout (sidebar + content)
│   ├── ProtectedRoute.tsx        # Auth-guard wrapper component
│   └── ui/                       # Reusable UI primitives (Radix-based)
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── tabs.tsx
│       ├── badge.tsx
│       ├── skeleton.tsx
│       ├── separator.tsx
│       ├── popover.tsx
│       ├── calendar.tsx
│       └── date-range-picker.tsx
├── config/                       # External service configs
│   └── firebase.ts               # Firebase initialization
├── contexts/                     # React Context providers
│   ├── AuthContext.tsx            # Authentication state
│   └── ThemeContext.tsx           # Theme (light/dark/system)
├── hooks/                        # Custom React hooks
│   └── useDebounce.ts            # Debounce hook
├── lib/                          # Utility functions
│   ├── utils.ts                  # General utilities (cn, clsx)
│   └── scoreTooltip.ts           # Domain-specific helpers
├── pages/                        # Page-level components (one per route)
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── ReviewList.tsx
│   ├── ReviewDetail.tsx
│   ├── Performance.tsx
│   ├── TeamDetail.tsx
│   ├── ProjectDetail.tsx
│   ├── RepositoryProfile.tsx
│   ├── DeveloperProfile.tsx
│   ├── Developers.tsx
│   ├── Credentials.tsx
│   └── RepositoryConfig.tsx
├── services/                     # API client layer
│   └── api.ts                    # Centralized API service (axios)
└── types/                        # TypeScript type definitions
    ├── review.ts                 # Domain types (reviews, analytics, etc.)
    └── credential.ts             # Credential/repository types
```

### Key Principle:
- **Pages** are route-level components — one file per page
- **Components** are reusable across pages
- **Services** handle ALL API communication
- **Types** define all data interfaces
- **Contexts** manage global state
- **Hooks** encapsulate reusable logic

---

## 3. Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| **Framework** | React | 18.x |
| **Language** | TypeScript | 5.x |
| **Bundler** | Vite | 5.x |
| **Styling** | Tailwind CSS | 3.x |
| **UI Primitives** | Radix UI | Latest |
| **State Management** | TanStack React Query | 5.x |
| **Data Tables** | TanStack React Table | 8.x |
| **HTTP Client** | Axios | 1.x |
| **Routing** | React Router DOM | 6.x |
| **Charts** | Recharts | 2.x |
| **Animations** | Framer Motion | 11.x |
| **Icons** | Lucide React | Latest |
| **Auth** | Firebase Auth | 10.x |
| **Markdown** | React Markdown | 9.x |
| **Code Highlighting** | React Syntax Highlighter | 15.x |
| **Dates** | date-fns | 3.x |
| **CSS Utilities** | clsx + tailwind-merge | Latest |
| **Component Variants** | class-variance-authority | Latest |

### Key Rules:
- **TanStack React Query** for ALL server state (no Redux)
- **Axios** for HTTP requests (not fetch)
- **Radix UI** for accessible primitives (not Material UI)
- **Tailwind CSS** for styling (no CSS Modules)
- **Firebase** for authentication

---

## 4. Configuration Files

### `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),  // @ = src/ path alias
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://backend:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  }
})
```

### Key Rules:
- Path alias `@` → `./src` for clean imports
- Dev proxy `/api` → backend server (avoids CORS issues)
- Port `3000` for development

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### `tailwind.config.js`

```javascript
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Project-specific theme extensions
    }
  },
  plugins: [require('tailwindcss-animate')],
}
```

### `vite-env.d.ts` — Type-safe environment variables:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // Add ALL VITE_ prefixed env vars here
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

---

## 5. Application Entry Point

### `main.tsx`

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

### `App.tsx` — Provider Stack

```typescript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
// ... more pages

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 10000,
    },
  },
});

function App() {
  return (
    <ThemeProvider>                     {/* Outermost: theme */}
      <QueryClientProvider client={queryClient}>  {/* React Query */}
        <Router>                        {/* Router */}
          <AuthProvider>                {/* Auth (needs Router for navigation) */}
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout><Dashboard /></Layout>
                </ProtectedRoute>
              } />
              {/* ... more routes */}
            </Routes>
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
```

### Provider Order (outermost → innermost):
1. `ThemeProvider` — theme state
2. `QueryClientProvider` — React Query cache
3. `Router` — React Router
4. `AuthProvider` — auth state (needs Router for `useNavigate`)

### Query Client Config:
- `refetchOnWindowFocus: false` — don't refetch on tab switch
- `retry: 1` — retry failed queries once
- `staleTime: 10000` — 10s stale time

---

## 6. Routing Architecture

### Pattern: Protected Routes with Layout

```typescript
// Public route (no auth required)
<Route path="/login" element={<Login />} />

// Protected route (requires auth + layout)
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Layout>
      <Dashboard />
    </Layout>
  </ProtectedRoute>
} />

// Protected route with URL params
<Route path="/performance/team/:id" element={
  <ProtectedRoute>
    <Layout>
      <TeamDetail />
    </Layout>
  </ProtectedRoute>
} />

// Protected route with encoded params
<Route path="/performance/developer/:email" element={
  <ProtectedRoute>
    <Layout>
      <DeveloperProfile />
    </Layout>
  </ProtectedRoute>
} />
```

### Key Rules:
- **Every protected route** wraps in `<ProtectedRoute><Layout>...</Layout></ProtectedRoute>`
- Login page is the ONLY unprotected route
- Use URL params (`:id`, `:email`) for detail pages
- Encode special characters in URLs (`encodeURIComponent`)
- All routes defined in `App.tsx` — no lazy routing config files

---

## 7. Context Providers

### Auth Context (`contexts/AuthContext.tsx`)

```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
    navigate('/');
  };

  // ... signInWithEmail, signOut

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### Theme Context (`contexts/ThemeContext.tsx`)

```typescript
type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme');
    return (stored as Theme) || 'system';
  });

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    let resolvedTheme: 'light' | 'dark';
    if (theme === 'system') {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolvedTheme = theme;
    }
    root.classList.add(resolvedTheme);
    setActualTheme(resolvedTheme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // ... system theme change listener
}
```

### Context Pattern Rules:
1. Define interface for context value
2. Create context with `undefined` default
3. Create Provider component with state management
4. Create custom hook (`useAuth`, `useTheme`) with error boundary
5. Persist preferences to `localStorage` where appropriate
6. Listen for system changes (e.g., dark mode media query)

---

## 8. Authentication System

### Firebase Configuration (`config/firebase.ts`)

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // ... other config
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
```

### Protected Route Component

```typescript
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

### Auth Flow:
1. Firebase handles auth state
2. `onAuthStateChanged` updates context
3. `ProtectedRoute` checks auth, redirects to `/login` if unauthenticated
4. User email sent in API headers via interceptor (`X-User-Email`)
5. 403 responses trigger automatic sign-out + redirect

---

## 9. API Service Layer

### Architecture: Single centralized `services/api.ts`

```typescript
import axios from 'axios';
import { auth } from '../config/firebase';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: inject user email header
api.interceptors.request.use((config) => {
  const user = auth.currentUser;
  if (user?.email) {
    config.headers['X-User-Email'] = user.email;
  }
  return config;
});

// Response interceptor: handle 403 (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      // Sign out + redirect to login
      signOut(auth).catch(() => {});
      window.location.href = `/login?error=${encodeURIComponent(error.response?.data?.detail || '...')}`;
    }
    return Promise.reject(error);
  }
);
```

### BaseResponse Unwrapper

The backend wraps ALL responses in `{ status, code, data }`. The frontend unwraps:

```typescript
function unwrapApiData<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'data' in body && 'status' in body) {
    return normalizeKeys((body as { data: T }).data) as T;
  }
  return normalizeKeys(body) as T;
}
```

### Key Normalization

Backend uses `CamelCaseModel` (camelCase JSON). Frontend normalizes to both forms:

```typescript
function normalizeKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(normalizeKeys);
  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    const val = normalizeKeys(obj[key]);
    acc[key] = val;           // Keep camelCase
    if (snakeKey !== key) acc[snakeKey] = val;  // Add snake_case
    return acc;
  }, {} as any);
}
```

### API Module Pattern

Group API methods by domain into exported objects:

```typescript
export const reviewsApi = {
  getReviews: async (params?) => {
    const response = await api.get('/reviews', { params });
    return unwrapApiData(response.data);
  },

  getReview: async (id: number | string): Promise<ReviewDetail> => {
    const response = await api.get(`/reviews/${id}`);
    return unwrapApiData(response.data);
  },

  getDashboardStats: async (params?): Promise<DashboardStats> => {
    const response = await api.get('/reviews/stats/dashboard', { params });
    return unwrapApiData(response.data);
  },
};

export const credentialsApi = {
  list: async (params?) => { ... },
  create: async (data) => { ... },
  test: async (id: number) => { ... },
};

export const repositoriesApi = { ... };
export const projectsApi = { ... };
export const usersApi = { ... };
```

### Key Rules:
- **One `api.ts` file** with ALL API methods — NO scattered fetch calls
- Group by domain: `reviewsApi`, `credentialsApi`, `repositoriesApi`, etc.
- ALWAYS unwrap `BaseResponse` with `unwrapApiData()`
- ALWAYS normalize keys (camel → snake) for consistent access
- Use specific normalizer functions for complex types
- Request interceptor adds auth headers
- Response interceptor handles 403 globally
- Type-annotate return values with `Promise<SpecificType>`

---

## 10. Type System

### Domain Types (`types/review.ts`)

```typescript
// Enums as string unions
export enum ReviewStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Data interfaces
export interface Review {
  id: string;
  repository_id: string;
  provider: string | null;
  mr_iid: string;
  mr_title: string | null;
  status: ReviewStatus;
  overall_score: number | null;
  // ... all fields
  created_at: string;
  updated_at: string;
}

// Extended types
export interface ReviewDetail extends Review {
  review_data: any;
  changed_files: any[];
}

// Response wrappers
export interface UserMetricsResponse {
  items: UserMetric[];
  total: number;
  page: number;
  page_size: number;
}

// Nested complex types
export interface DashboardStats {
  total_reviews: number;
  completed_reviews: number;
  avg_ai_score: number | null;
  // ... rich metrics
}
```

### Type Organization:
```
types/
├── review.ts          # Reviews, analytics, dashboard, metrics
└── credential.ts      # Credentials, repositories, webhooks
```

### Key Rules:
- **ALL types in `types/` directory** — never inline
- Use `snake_case` for field names (matches normalized API response)
- Use `number | null` for optional numeric fields
- Use `string | null` for optional string fields
- Group related interfaces in the same file
- Use `extends` for detail/extended types
- Export enums, interfaces, and response types
- Type arrays as `Array<{...}>` for nested objects

---

## 11. Component Architecture

### Layout Component (`components/Layout.tsx`)

```typescript
interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { theme, setTheme, actualTheme } = useTheme();
  const { signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card">
        <nav>{/* Navigation links */}</nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <header>{/* Top bar: user info, theme toggle, logout */}</header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
```

### Component Patterns:
1. **Layout** wraps all protected pages (sidebar + header + content)
2. **ProtectedRoute** handles auth guards
3. **UI components** are Radix-based primitives

---

## 12. Page Components

### Page Structure Template

```typescript
import { useQuery } from '@tanstack/react-query';
import { reviewsApi } from '../services/api';
import type { DashboardStats } from '../types/review';

export default function Dashboard() {
  // 1. Data fetching with React Query
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => reviewsApi.getDashboardStats(),
  });

  // 2. Loading state
  if (isLoading) {
    return <div className="p-6"><Skeleton /></div>;
  }

  // 3. Error state
  if (error) {
    return <div className="p-6 text-destructive">Error loading data</div>;
  }

  // 4. Render with data
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {/* Stats cards, charts, tables */}
    </div>
  );
}
```

### Key Rules:
- **One default export per page file**
- Use `useQuery` for data fetching — NO `useEffect` + `useState` combos
- Handle 3 states: loading, error, success
- Page components are large, self-contained files
- Use URL params from `useParams()` for detail pages
- Use `useNavigate()` for programmatic navigation
- Use descriptive query keys: `['reviews', id]`, `['dashboard-stats', { start_date }]`

---

## 13. UI Component Library

### Pattern: Radix UI + CVA (class-variance-authority)

```typescript
// components/ui/button.tsx
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  }
)
```

### Available UI Components:
| Component | Base | File |
|-----------|------|------|
| `Button` | Custom + CVA | `button.tsx` |
| `Card` | Custom | `card.tsx` |
| `Dialog` | `@radix-ui/react-dialog` | `dialog.tsx` |
| `Input` | Custom | `input.tsx` |
| `Select` | `@radix-ui/react-select` | `select.tsx` |
| `Tabs` | `@radix-ui/react-tabs` | `tabs.tsx` |
| `Badge` | Custom + CVA | `badge.tsx` |
| `Skeleton` | Custom | `skeleton.tsx` |
| `Separator` | `@radix-ui/react-separator` | `separator.tsx` |
| `Popover` | `@radix-ui/react-popover` | `popover.tsx` |
| `Calendar` | Custom | `calendar.tsx` |
| `DateRangePicker` | Custom | `date-range-picker.tsx` |

### Key Rules:
- Use `class-variance-authority` for variant-based styling
- Use `cn()` utility to merge Tailwind classes
- ALL UI components use `React.forwardRef` for ref forwarding
- Components support `asChild` prop via Radix `Slot`
- Use consistent naming: `components/ui/<component>.tsx`

---

## 14. Styling Strategy

### Tailwind CSS (`index.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    /* ... CSS custom properties for theming */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... dark mode overrides */
  }
}
```

### Key Rules:
- Use Tailwind utility classes — no custom CSS files per component
- Dark mode via `class` strategy (not `media`)
- CSS custom properties for theme tokens
- Use `cn()` helper for conditional classes:
  ```typescript
  import { clsx, type ClassValue } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
  }
  ```
- Use `tailwindcss-animate` plugin for animations

---

## 15. Custom Hooks

### Pattern: `hooks/useDebounce.ts`

```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

### When to Create Hooks:
- Debouncing (search inputs)
- Intersection observer (lazy loading)
- Window size / media queries
- Local storage persistence
- Polling intervals
- Complex form state
- **NOT** for API calls (use React Query instead)

---

## 16. Utility Libraries

### `lib/utils.ts`

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### `lib/scoreTooltip.ts` — Domain helpers

```typescript
export function getScoreColor(score: number | null): string {
  if (score === null) return 'text-muted-foreground';
  if (score >= 8) return 'text-green-500';
  if (score >= 5) return 'text-yellow-500';
  return 'text-red-500';
}

export function getScoreLabel(score: number | null): string {
  // ... domain logic
}
```

### Key Rules:
- `cn()` is ALWAYS used for conditional Tailwind classes
- Domain-specific utilities go in `lib/`
- Keep utilities pure (no side effects)
- Type all function parameters and returns

---

## 17. Environment Variables

### `env.example`

```bash
# API Backend
VITE_API_URL=/api

# Firebase Auth
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### Key Rules:
- **ALL** env vars prefixed with `VITE_` (Vite requirement for client-side access)
- Define types in `vite-env.d.ts`
- Access via `import.meta.env.VITE_*`
- Provide `env.example` template — NEVER commit `.env`

---

## 18. Docker & Deployment

### Production Dockerfile (multi-stage)

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Config (`nginx.conf`)

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;   # SPA fallback
    }

    location /api/ {
        proxy_pass http://backend:8080/;    # API proxy
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Development Dockerfile

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

---

## 19. API Response Handling Pattern

### Backend sends:
```json
{
  "status": "SUCCESS",
  "code": 200,
  "data": {
    "userId": 1,
    "displayName": "John",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

### Frontend processes:
1. **Axios response** → `response.data` = `{ status, code, data }`
2. **`unwrapApiData()`** → extracts `data` field
3. **`normalizeKeys()`** → adds `snake_case` aliases: `{ userId: 1, user_id: 1, ... }`
4. **Type-specific normalizer** → maps to UI interface with correct field names

### For complex types, create dedicated normalizers:

```typescript
function normalizeCredential(r: Record<string, unknown>): Credential {
  return {
    id: Number(r.id),
    name: String(r.name ?? ''),
    base_url: String(r.base_url ?? r.baseUrl ?? ''),
    is_active: Boolean(r.is_active ?? r.isActive),
    // ... handle both cases
  };
}
```

---

## 20. Step-by-Step: Adding a New Feature

### 1. Define types (`types/<feature>.ts`):
```typescript
export interface Order {
  id: number;
  status: string;
  total: number;
  created_at: string;
}
```

### 2. Add API methods (`services/api.ts`):
```typescript
export const ordersApi = {
  list: async (params?) => {
    const response = await api.get('/orders', { params });
    return unwrapApiData(response.data);
  },
  get: async (id: number): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return unwrapApiData(response.data);
  },
};
```

### 3. Create page (`pages/Orders.tsx`):
```typescript
export default function Orders() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.list(),
  });
  // ... render
}
```

### 4. Add route (`App.tsx`):
```typescript
<Route path="/orders" element={
  <ProtectedRoute><Layout><Orders /></Layout></ProtectedRoute>
} />
```

### 5. Add nav link (`components/Layout.tsx`):
```typescript
{ name: 'Orders', path: '/orders', icon: ShoppingCart }
```

---

## 21. Anti-Patterns to Avoid

| ❌ Don't | ✅ Do |
|----------|-------|
| Fetch data with `useEffect` + `useState` | Use `useQuery` from React Query |
| Import axios directly in pages | Use centralized `api.ts` service |
| Hardcode API URLs | Use `import.meta.env.VITE_API_URL` |
| Skip `unwrapApiData()` | ALWAYS unwrap `BaseResponse` |
| Define types inline in components | Put ALL types in `types/` |
| Use CSS Modules or styled-components | Use Tailwind + `cn()` |
| Create multiple axios instances | One shared `api` instance |
| Put auth logic in individual pages | Use `ProtectedRoute` + `AuthContext` |
| Store server state in `useState` | Use React Query for server state |
| Use `any` freely | Type everything, use `unknown` + narrow |
| Skip loading/error states | Handle all 3 states (loading, error, data) |
| Scatter interceptor logic | Centralize in `api.ts` interceptors |

---

## 22. Checklist for New Projects

- [ ] Initialize with `npx create-vite . --template react-ts`
- [ ] Install core deps: `react-router-dom`, `@tanstack/react-query`, `axios`
- [ ] Install UI deps: `@radix-ui/*`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`
- [ ] Install styling: `tailwindcss`, `postcss`, `autoprefixer`, `tailwindcss-animate`
- [ ] Install charting: `recharts`, `framer-motion`
- [ ] Install auth: `firebase`
- [ ] Configure `vite.config.ts` with alias and proxy
- [ ] Configure `tsconfig.json` with path aliases
- [ ] Configure `tailwind.config.js` with dark mode and plugins
- [ ] Create directory structure: `components/ui/`, `contexts/`, `hooks/`, `lib/`, `pages/`, `services/`, `types/`, `config/`
- [ ] Create `lib/utils.ts` with `cn()` helper
- [ ] Create `vite-env.d.ts` with env var types
- [ ] Create `config/firebase.ts` (if using Firebase auth)
- [ ] Create `contexts/AuthContext.tsx` and `ThemeContext.tsx`
- [ ] Create `components/ProtectedRoute.tsx`
- [ ] Create `components/Layout.tsx`
- [ ] Create `services/api.ts` with interceptors + unwrappers
- [ ] Create `types/` with domain type definitions
- [ ] Set up base UI components in `components/ui/`
- [ ] Create page components in `pages/`
- [ ] Wire up `App.tsx` with providers + routes
- [ ] Create `.env` and `env.example`
- [ ] Create `Dockerfile`, `Dockerfile.dev`, `nginx.conf`
- [ ] Verify with `npm run dev`

---

> **This agent should be consulted whenever creating a new frontend feature, setting up a new React project, or making UI architectural decisions. It ensures consistency across all Webelight React frontend projects.**
