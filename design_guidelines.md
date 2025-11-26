# Lastro Capital - Design Guidelines

## App Overview
Lastro Capital is a financial investment platform mobile app that allows users to browse investment opportunities, view detailed information about each investment option, and manage their account access.

## Architecture Decisions

### Authentication
**Auth Required** - The app includes login functionality for accessing personalized investment portfolios.
- Email/password authentication (current implementation)
- Future consideration: Add SSO (Google Sign-In for Android, Apple Sign-In for iOS compliance)
- Login screen accessible from header button
- Account screen should include:
  - User profile information
  - Log out functionality
  - Security settings

### Navigation
**Stack-Only Navigation** with manual state management
- Three primary screens: Home → Details, Login (modal-style)
- Linear flow for investment browsing
- Header-based navigation controls (login button, back buttons)
- Future consideration: Implement React Navigation for better UX patterns and transitions

## Screen Specifications

### Home Screen
**Purpose**: Display available investment opportunities

**Layout**:
- Header: Custom header (64px height) with logo, app title, and "Entrar" (Login) button
- Main content: Scrollable list of investment cards
- Safe area insets: 
  - Top: headerHeight (64px) + 8px
  - Bottom: 16px
  - Horizontal: 16px

**Components**:
- Welcome heading (H1 style)
- Descriptive text
- FlatList of investment cards with:
  - Investment title
  - Expected return percentage
  - Touchable with press feedback

### Login Screen
**Purpose**: User authentication entry point

**Layout**:
- Header: Same custom header as Home
- Main content: Centered form layout
- Form elements positioned vertically with consistent spacing
- Bottom safe area inset: 16px

**Components**:
- "Entrar" heading (H1 style)
- Email text input (auto-lowercase)
- Password text input (secure entry)
- Submit button ("Entrar")
- Back link/button to return to Home
- Form validation with error alerts

**Interaction**:
- Submit button disabled state if fields are empty (future enhancement)
- Success alert on login
- Returns to Home screen after successful login

### Details Screen
**Purpose**: Show detailed information about selected investment

**Layout**:
- Header: Same custom header
- Main content: Scrollable detail view
- Safe area insets: Same as Home

**Components**:
- Investment title (H1)
- Expected return subtitle
- "Descrição" section heading (H2)
- Descriptive text content
- Back button to return to Home
- Future: Add investment action buttons (Invest, Save, Share)

## Design System

### Color Palette
**Primary Colors**:
- Background: `#0f172a` (Dark slate)
- Surface: `#111827` (Slightly lighter slate for header)
- Card background: `#0b1220` (Deep blue-black)
- Card border: `#1f2937` (Subtle gray border)

**Accent Colors**:
- Primary accent: `#f97316` (Vibrant orange - for CTAs like login button)
- Secondary accent: `#06b6d4` (Cyan - for primary actions)

**Text Colors**:
- Primary text: `#ffffff` (White - headings, titles)
- Secondary text: `#cbd5e1` (Light gray - body text)
- Tertiary text: `#9ca3af` (Medium gray - subtitles, metadata)
- Button text on cyan: `#04252b` (Dark teal - high contrast)

### Typography
**Heading 1** (Screen titles):
- Color: White (#fff)
- Size: 22px
- Weight: 700 (Bold)

**Heading 2** (Section titles):
- Color: White (#fff)
- Size: 18px
- Weight: 600 (Semibold)

**Body Text**:
- Color: Light gray (#cbd5e1)
- Size: 14px
- Margin top: 8px for spacing

**Card Title**:
- Color: White (#fff)
- Size: 16px
- Weight: 700

**Card Subtitle**:
- Color: Medium gray (#9ca3af)
- Margin top: 6px

### Components

**Header**:
- Height: 64px
- Background: #111827
- Horizontal padding: 16px
- Layout: Icon + Title (left), Action button (right)
- Logo: 36x36px, rounded 6px corners
- Title text: 18px white, 8px margin from logo

**Investment Cards**:
- Background: #0b1220
- Border: 1px solid #1f2937
- Border radius: 8px
- Padding: 12px
- Margin bottom: 12px
- Press feedback: Slight opacity change (0.7)

**Buttons - Primary (Cyan)**:
- Background: #06b6d4
- Text color: #04252b
- Padding: 12px vertical, 16px horizontal
- Border radius: 10px
- Font weight: 700
- Center-aligned text

**Buttons - Accent (Orange)**:
- Background: #f97316
- Text color: White
- Padding: 8px vertical, 12px horizontal
- Border radius: 8px

**Text Inputs**:
- Background: White (#fff)
- Border radius: 8px
- Padding: 12px
- Margin top: 12px
- Appropriate keyboard types (email, secure password)

**Links**:
- Center-aligned
- Default text color with subtle press feedback

### Interaction Design
- All touchable components have visual feedback (opacity or scale animation)
- Investment cards: Light press animation when tapped
- Buttons: ActiveOpacity of 0.8
- Alerts for validation errors and success messages
- Smooth transitions between screens (consider adding fade/slide animations)

### Visual Assets
**Required Assets**:
- App icon (icon.png): 36x36px logo for header, standard app icon sizes for stores
- Splash screen (splash.png): Simple design with #1a237e background color
- Investment category icons (future): Icons representing different investment types

**Icon Usage**:
- Use Feather icons from @expo/vector-icons for standard UI elements
- No emojis in the interface
- System icons for common actions

### Accessibility Requirements
- Minimum touch target size: 44x44px for all interactive elements
- High contrast text (WCAG AA compliant)
- Descriptive button labels
- Form inputs with proper labels and placeholders
- Consider adding accessibility labels for screen readers
- Error messages clearly visible and announced

### Safe Area Considerations
- All screens wrapped in SafeAreaView
- Content padding accounts for notches and system UI
- Horizontal content padding: 16px
- Vertical spacing between elements: 8-20px depending on hierarchy