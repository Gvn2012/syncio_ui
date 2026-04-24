---
trigger: always_on
---

# AI Agent Rules - Syncio UI Project

## 🎯 Core Principles

- **Convenience**: Write code that is easy to understand, reuse, and extend.
- **Maintainability**: Follow the established feature-based structure (`src/features/`).
- **Performance**: Optimize for speed and responsiveness.
- **Aesthetics**: Ensure a premium, modern look following the system design.

## 🛠 State Management (Redux)

- **Use Redux Toolkit**: Always use slices (`src/store/slices/`) for global state.
- **Usage**: Use `useSelector` and `useDispatch` from `react-redux`.
- **Types**: Use `RootState` and `AppDispatch` from `src/store`.
- **Local vs Global**: Use Redux only for truly global state (auth, UI settings, notifications). For server state, prefer `@tanstack/react-query`.

## 🌓 Dark/Light Theme Mode

- **System**: The project uses a custom theming system via CSS variables.
- **Application**: The theme is managed in `uiSlice` and applied to `<html>` via `data-theme`.
- **CSS Usage**:
  - **NEVER** hardcode colors. Always use CSS variables (e.g., `var(--primary)`, `var(--bg-main)`).
  - Use `[data-theme='dark']` in CSS for dark-mode specific overrides if variables are not enough.
  - Variables are defined in `src/index.css`.

## 🎨 Styling Standards (index.css)

- **Standard Tokens**:
  - Colors: `--primary`, `--bg-main`, `--bg-card`, `--text-main`, etc.
  - Spacing/Radius: `--radius-md`, `--radius-lg`, etc.
  - Transitions: `--transition-speed`, `--transition-bezier`.
- **Animations**: Use `framer-motion` for smooth, premium transitions.
- **Forms**: Use the global input styles defined in `index.css`.

## 📁 Project Structure

- `src/api/`: Shared axios instances and API clients.
- `src/common/`: Shared constants, types, and utils.
- `src/components/`: Generic UI components (Button, Input, Card).
- `src/features/`: Domain-specific logic, components, and pages.
- `src/hooks/`: Reusable React hooks.
- `src/store/`: Redux store and slices.

## ⚡ Performance Guidelines

- **React Query**: Use `@tanstack/react-query` for all data fetching to benefit from caching and background updates.
- **Memoization**: Use `useMemo` and `useCallback` for expensive computations or stable references passed to memoized components.
- **Image Loading**: Use lazy loading for images and components where appropriate.
- **Bundle Size**: Avoid importing entire libraries; use named imports.

## 📝 Coding Style

- **TypeScript**: Use strict typing. Avoid `any`.
- **Functional Components**: Use arrow functions for components and hooks.
- **Lucide Icons**: Use `lucide-react` for icons.
- **Naming**: Use PascalCase for components, camelCase for variables/functions.
