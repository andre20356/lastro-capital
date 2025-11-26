# Lastro Capital

## Overview

Lastro Capital is a React Native mobile application built with Expo for billing and charges management. The app enables users to manage receivables, track payments, maintain a client directory, and view payment history. It's designed as a cross-platform solution targeting iOS, Android, and Web, with a focus on offline-first functionality and modern UI/UX patterns.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Platform & Framework
- **React Native with Expo SDK 54**: Provides cross-platform development with native capabilities
- **React 19.1.0**: Latest React version with improved performance
- **New Architecture Enabled**: Uses React Native's new architecture for better performance
- **React Compiler Experiments**: Enabled for automatic memoization and optimization

**Rationale**: Expo simplifies deployment and provides unified access to native APIs across platforms. The new architecture improves rendering performance and reduces memory usage.

### Navigation Architecture
- **React Navigation v7**: Stack and tab-based navigation system
- **Bottom Tab Navigator**: Four main tabs (Dashboard, Charges, Clients, History)
- **Native Stack Navigator**: Modal-style screens for forms and detail views
- **Gesture Handler Integration**: Smooth touch interactions and swipe gestures

**Structure**:
- Main tabs act as primary navigation
- Stack overlays for forms (Add/Edit Charge, Add/Edit Client)
- Detail screens accessible from lists
- Modal presentation for focused data entry

**Rationale**: Tab-based navigation provides familiar mobile UX patterns. Stack navigation enables deep linking and natural back navigation. Modal presentation minimizes context switching for data entry tasks.

### State Management
- **Context API with DataContext**: Centralized application state
- **React Hooks**: Local component state management
- **AsyncStorage Persistence**: Automatic data sync to device storage

**Data Models**:
```typescript
- Clients: id, name, phone, email, notes, createdAt
- Charges: id, clientId, amount, dueDate, status, description, createdAt
- Payments: id, chargeId, clientId, amount, paidAt, notes
```

**Rationale**: Context API eliminates prop drilling and provides global state access. AsyncStorage enables offline-first functionality without external dependencies. Simple data models reduce complexity while meeting all business requirements.

### Data Persistence Strategy
- **AsyncStorage**: Single source of truth stored at `@lastro_capital_data`
- **Automatic Sync**: All CRUD operations immediately persist to storage
- **Computed Values**: Overdue status calculated at runtime
- **Optimistic Updates**: UI updates before persistence completes

**Rationale**: AsyncStorage is built-in, requires no configuration, and works across all platforms. Single-key storage simplifies data management. Computed values prevent stale data issues.

### UI/UX Architecture
- **Theme System**: Light/dark mode support with centralized color tokens
- **Custom Components**: Reusable ThemedText, ThemedView, Button, Card
- **Screen Layout Components**: ScreenScrollView, ScreenFlatList for consistent layouts
- **Safe Area Management**: Automatic inset handling for notched devices
- **Keyboard Awareness**: react-native-keyboard-controller for input handling

**Design Tokens**:
- Spacing scale: xs(4), sm(8), md(12), lg(16), xl(20)
- Border radius: sm(4), md(8), lg(12), xl(16), xxl(24)
- Typography scale: h1-h4, body, small, link styles
- Elevation-based background colors (root, default, secondary, tertiary)

**Rationale**: Centralized theming ensures visual consistency. Custom components encapsulate platform-specific behavior. Elevation-based backgrounds create visual hierarchy without shadows.

### Animation & Interaction
- **React Native Reanimated v4**: High-performance animations
- **Spring Animations**: Natural, physics-based motion
- **Gesture Handler**: Native touch interactions
- **Haptic Feedback**: expo-haptics for tactile responses

**Rationale**: Reanimated runs on the UI thread for 60fps animations. Spring animations feel more natural than linear interpolations. Haptics improve perceived responsiveness.

### Error Handling
- **Error Boundaries**: Class component-based error catching
- **Custom Fallback UI**: User-friendly error display
- **Development Mode Details**: Stack traces visible in dev mode
- **Graceful Recovery**: App restart capability via expo reloadAppAsync

**Rationale**: Error boundaries prevent full app crashes. Development mode details aid debugging. Restart functionality provides recovery path for users.

### Code Organization
- **Path Aliases**: `@/` prefix for absolute imports
- **Module Resolver**: Babel plugin for clean import paths
- **TypeScript**: Type safety for data models and props
- **Component Colocation**: Screens, components, hooks in dedicated folders

**Rationale**: Absolute imports prevent brittle relative paths. TypeScript catches errors at compile time. Clear folder structure improves maintainability.

### Business Logic Patterns
- **Automatic Status Updates**: Overdue charges computed on data load
- **Client-Charge Relationships**: Foreign key pattern (clientId)
- **Payment History Tracking**: Immutable payment records linked to charges
- **Derived Metrics**: Totals and summaries calculated from raw data

**Rationale**: Computed status prevents manual updates. Foreign keys maintain data integrity. Immutable history ensures audit trail.

## External Dependencies

### Core Framework
- **Expo SDK 54**: Mobile app framework and native API access
- **React Native 0.81.5**: Cross-platform UI framework
- **React 19.1.0**: Core library with latest features

### Navigation
- **@react-navigation/native v7**: Navigation framework
- **@react-navigation/bottom-tabs v7**: Tab-based navigation
- **@react-navigation/native-stack v7**: Stack navigation
- **@react-navigation/elements**: Header components

### Data & Storage
- **@react-native-async-storage/async-storage v2**: Local key-value storage (no backend database currently configured)

### UI & Interaction
- **react-native-reanimated v4**: Animation library
- **react-native-gesture-handler v2**: Touch gesture system
- **react-native-keyboard-controller**: Keyboard interaction handling
- **react-native-safe-area-context v5**: Safe area insets management
- **expo-haptics**: Haptic feedback

### Utilities
- **@expo/vector-icons**: Icon library (Feather icons used)
- **expo-blur**: Blur effect component
- **expo-image**: Optimized image component
- **expo-status-bar**: Status bar styling
- **expo-web-browser**: In-app browser

### Development Tools
- **TypeScript 5.9**: Type checking
- **ESLint**: Code linting with Expo config
- **Prettier**: Code formatting
- **babel-plugin-module-resolver**: Import path aliasing

### Platform Support
- iOS: Supports tablets, bundle ID `com.lastro.capital`
- Android: Adaptive icons, edge-to-edge display, package `com.lastro.capital`
- Web: Single-page application output

**Note**: The application currently uses AsyncStorage for local persistence. No external database (like PostgreSQL) is configured, but the data structure supports future migration to a backend database system.