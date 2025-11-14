# NEXO - Design Guidelines
**Agente Comercial Inteligente MG Tools**

## Design Approach

**Selected Framework:** Hybrid approach combining Linear's productivity UI clarity + Stripe Dashboard's B2B professionalism + modern chat interface patterns (ChatGPT-style).

**Rationale:** This is a data-intensive B2B productivity tool requiring both analytical clarity (dashboard/tables) and conversational intelligence (chat). The design must balance information density with usability, supporting rapid decision-making while maintaining professional credibility.

**Key Principles:**
- Information hierarchy over decoration
- Rapid scanability for time-sensitive decisions
- Data-driven visual language
- Professional trust signals
- Conversational warmth within technical precision

---

## Core Design Elements

### A. Typography

**Font Families:**
- Primary (UI): Inter (Google Fonts) - Clean, readable, modern
- Data/Numbers: JetBrains Mono (Google Fonts) - Monospace for data tables and metrics
- Optional Accent: Poppins for headings (if needed for brand personality)

**Scale & Hierarchy:**
- Hero/Dashboard Title: 2xl (24px), font-semibold
- Section Headers: xl (20px), font-semibold
- Card Titles: lg (18px), font-medium
- Body Text: base (16px), font-normal
- Chat Messages: base (16px), font-normal, leading-relaxed
- Data Labels: sm (14px), font-medium
- Metrics/KPIs: 3xl-4xl (30-36px), font-bold (JetBrains Mono)
- Captions/Metadata: xs (12px), font-normal

**Line Height:**
- Headings: leading-tight (1.25)
- Body/Chat: leading-relaxed (1.625)
- Data Tables: leading-normal (1.5)

---

### B. Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Micro spacing (within components): 2, 4
- Component padding: 4, 6, 8
- Section spacing: 12, 16, 20
- Page margins: 16, 20, 24

**Grid Structure:**
- Sidebar: Fixed 280px (desktop), collapsible on mobile
- Main Content: Fluid with max-w-7xl container
- Dashboard Cards: Grid with gap-6, responsive (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- Data Tables: Full-width within container with horizontal scroll if needed

**Responsive Breakpoints:**
- Mobile: < 768px (single column, collapsed sidebar)
- Tablet: 768px - 1024px (2-column layouts)
- Desktop: > 1024px (full multi-column experience)

---

### C. Component Library

#### 1. Navigation & Layout

**Sidebar (Left, Fixed):**
- Width: 280px, full-height
- Sections: Logo/Brand (top), Main Navigation, User Profile (bottom)
- Nav Items: p-4, rounded-lg, with icon + text
- Active state: Highlighted background treatment
- Hover: Subtle background shift

**Top Header:**
- Height: 64px, sticky positioning
- Content: Breadcrumb/Page title (left), Actions/Notifications (right)
- Shadow on scroll for depth

**Main Content Area:**
- Padding: p-6 md:p-8 lg:p-12
- Max-width: max-w-7xl mx-auto

#### 2. Dashboard Components

**KPI Cards:**
- Aspect: Vertical cards with metric-first hierarchy
- Structure: Large number (top), label (below), trend indicator (optional icon/percentage)
- Padding: p-6
- Border: Subtle border, rounded-xl
- Shadow: Minimal elevation (shadow-sm)
- Layout: Grid of 4 cards on desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)

**Data Tables:**
- Header: Sticky, font-medium, text-sm
- Rows: Alternating subtle background for readability, hover state for interactivity
- Cell Padding: px-4 py-3
- Borders: Minimal (border-b on rows)
- Action Columns: Right-aligned with icon buttons
- Responsive: Horizontal scroll on mobile with key columns pinned

**Charts/Visualizations:**
- Container: p-6, rounded-xl, bordered
- Title: Above chart, text-lg font-semibold
- Use simple bar/line charts (Chart.js or Recharts)
- Minimal decoration, focus on data clarity

#### 3. Chat Interface Components

**Chat Container:**
- Layout: Flex column, flex-1
- Message Area: Scrollable, flex-1, p-6
- Input Area: Fixed bottom, p-4, border-t

**Message Bubbles:**
- User Messages: Right-aligned, max-w-2xl, p-4, rounded-2xl
- NEXO Responses: Left-aligned, max-w-3xl, p-6, rounded-2xl
- Spacing: space-y-4 between messages
- Timestamp: text-xs, text-muted below bubble

**Rich Message Content:**
- Priority Badges: Inline badges (🔴 Alto / 🟡 Médio / 🟢 Baixo) with corresponding visual treatment
- Data Tables in Chat: Compact version with key columns only
- Insight Cards: Nested cards within chat messages (border-l-4 for visual accent)
- Lists: Structured with proper bullets/numbering, consistent indentation

**Input Field:**
- Multi-line textarea, rounded-xl, p-4
- Placeholder: "Pergunte ao NEXO sobre clientes, produtos ou vendas..."
- Submit: Icon button (send arrow) with hover state
- Height: Auto-expanding with max height

**Quick Actions (Suggested Prompts):**
- Horizontal scrollable chips below input
- Chip style: px-4 py-2, rounded-full, border, text-sm
- Examples: "Clientes inativos 60+ dias", "Vendas do mês", "Top produtos"

#### 4. Forms & Inputs

**Text Inputs:**
- Height: h-12
- Padding: px-4
- Border: Consistent 1px, rounded-lg
- Focus: Ring treatment (ring-2)
- Labels: Above input, text-sm font-medium, mb-2

**Select Dropdowns:**
- Match text input height and styling
- Icon indicator (chevron-down)

**Buttons:**
- Primary: px-6 py-3, rounded-lg, font-medium
- Secondary: Same sizing, outlined variant
- Icon-only: p-3, rounded-lg, square
- Sizes: sm (px-4 py-2), base (px-6 py-3), lg (px-8 py-4)

#### 5. Feedback Components

**Loading States:**
- Spinner: Centered, medium size with animation
- Skeleton: Animated pulse for cards/tables while loading
- Chat loading: Three-dot animation ("NEXO está analisando...")

**Alerts/Notifications:**
- Toast style: Fixed top-right, slide-in animation
- Types: Success (green accent), Warning (yellow), Error (red), Info (blue)
- Dismissible with X button
- Auto-dismiss after 5 seconds

**Empty States:**
- Centered content with icon + message
- Example: "Nenhuma análise no histórico" with CTA button

#### 6. Status Indicators

**Priority/Urgency Badges:**
- 🔴 Alto: Red accent, font-semibold
- 🟡 Médio: Yellow accent, font-medium  
- 🟢 Baixo: Green accent, font-normal
- Style: px-3 py-1, rounded-full, text-xs

**Client Status:**
- Ativo: Green dot
- Inativo: Red dot
- Teste: Yellow dot
- Expansão: Blue dot
- Style: Dot (w-2 h-2 rounded-full) + label

---

### D. Brand Integration

**MG Tools Identity:**
- Primary: Orange (#FF6B35 or similar) for CTAs, accents, active states
- Secondary: Blue (#2C3E50 or similar) for trust, data, professional elements
- Usage: Orange for action-oriented elements, Blue for informational

**Logo Placement:**
- Sidebar top: Full logo with "MG Tools" text
- Mobile header: Icon/mark only

**NEXO Personality:**
- Avatar: Simple icon or abstract geometric shape
- Voice: Professional but approachable in message formatting
- Visual language: Data-driven with human touch (emoji badges ✅)

---

## Images

**No Hero Images Required** - This is a productivity application, not a marketing site.

**Functional Images:**
1. **User Profile Pictures** - Small circular avatars (w-10 h-10) in header/sidebar
2. **Empty State Illustrations** - Simple line art or icons for "No data" states (centered, grayscale)
3. **NEXO Avatar** - Geometric icon or AI-themed symbol for chat interface (w-8 h-8, rounded-full)
4. **Logo** - MG Tools logo in sidebar (full) and header (responsive)

All images should be SVG or optimized PNG/WebP, no decorative photography needed.

---

## Page-Specific Layouts

### Dashboard Page
- Grid of KPI cards (4 columns desktop)
- Chart section below (2 columns: Sales trend + Product distribution)
- Quick alerts panel (right sidebar or integrated cards)
- Recent activity table at bottom

### Chat Interface Page
- Sidebar: Navigation (left, 280px)
- Main: Chat messages (center, flex-1)
- Right Panel (optional, collapsible): Contextual data/details when client is mentioned

### History Page
- Filter bar (top): Date range, type of analysis
- Card list: Each analysis as a card with title, timestamp, summary
- Pagination or infinite scroll

---

## Accessibility & Polish

- All interactive elements have hover states (subtle background shift)
- Focus states with visible ring indicators
- Minimum touch target: 44x44px for mobile
- ARIA labels for icons and complex interactions
- Keyboard navigation support throughout
- High contrast for text (WCAG AA minimum)
- Loading states for all async operations
- Error boundaries with friendly messages