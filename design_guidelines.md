# Design Guidelines: Psychic Source Content Management System

## Design Approach
**System-Based Approach**: Modern SaaS Dashboard Pattern
Drawing inspiration from leading SEO/analytics platforms (Ahrefs, SEMrush, Google Analytics) with emphasis on data clarity and efficient workflows.

**Core Principles**:
- Information hierarchy for quick scanning
- Data-dense layouts without overwhelming users
- Workflow-optimized navigation
- Professional, trustworthy aesthetic

## Typography System
**Font Stack**: Inter (primary), JetBrains Mono (code/data)
- Headlines: text-2xl to text-4xl, font-semibold
- Section Headers: text-lg to text-xl, font-medium
- Body Text: text-sm to text-base, font-normal
- Data/Metrics: text-xs to text-sm, font-mono for numbers
- Labels: text-xs, font-medium, uppercase tracking

## Layout System
**Spacing Units**: Tailwind units 2, 4, 6, 8, 12 (p-4, gap-6, mb-8, etc.)

**Dashboard Structure**:
- Sidebar Navigation: w-64, fixed left, full-height
- Main Content: ml-64, min-h-screen with p-6 to p-8
- Cards/Panels: rounded-lg with p-6, shadow-sm
- Page Headers: mb-8 with breadcrumbs + actions

## Component Library

**Navigation Sidebar**:
- Logo/brand at top (h-16)
- Primary nav groups with icons + labels
- Active state indicators (border-l-4)
- Collapse button for space efficiency
- User profile/settings at bottom

**Dashboard Cards**:
- Metric Cards: Grid layout (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- Large number display with label and trend indicator
- Chart Cards: Larger panels for graphs/visualizations
- Action Cards: Quick access to common tasks

**Data Tables**:
- Sticky header row
- Row hover states
- Sortable columns with indicators
- Pagination controls at bottom
- Inline action buttons (view, edit)
- Checkbox selection for bulk actions

**Forms & Inputs**:
- Standard input: h-10, px-4, rounded-md, border
- Textarea: min-h-32 for content editing
- Rich text editor toolbar: sticky at top
- Dropdown selects with search capability
- Toggle switches for boolean options
- Help text below inputs (text-xs)

**Content Editor**:
- Split view: Editor (60%) | Preview/Insights (40%)
- Floating toolbar with formatting options
- SEO metrics sidebar: keyword density, readability score
- AI suggestions panel (collapsible)
- Save draft + publish workflow

**Analytics Dashboard**:
- Date range selector (top-right)
- KPI summary cards (top row)
- Chart section: line/bar graphs (Chart.js or similar)
- Keywords table with ranking positions
- Performance comparison widgets

**Integration Panels**:
- Status indicators for connected services
- API connection cards with reconnect buttons
- Data sync timestamps
- Settings modals for API configurations

**Buttons**:
- Primary: px-4 py-2, rounded-md, font-medium
- Secondary: outlined variant
- Icon buttons: w-10 h-10, centered icon
- Button groups for related actions

**Modals/Overlays**:
- Center-aligned, max-w-2xl for forms
- max-w-4xl for content previews
- Backdrop blur
- Close button (top-right)

## Responsive Behavior
- Sidebar collapses to icon-only on tablets
- Cards stack to single column on mobile
- Tables convert to card view on mobile
- Chart legends move below on small screens

## Icons
**Heroicons** via CDN for consistent line-style icons across the application

## Performance Considerations
- Lazy load chart libraries
- Virtual scrolling for large tables
- Debounced search inputs
- Progressive data loading for analytics

This creates a professional, data-focused application optimized for content creators and SEO specialists working efficiently with multiple integrations.