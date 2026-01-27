# Financial Components Architecture

## Component Hierarchy

```
FinancialPage (13 lines)
│
├── BudgetChart
│   ├── Card (shadcn)
│   ├── ChartContainer (shadcn)
│   │   └── PieChart (recharts)
│   └── Badge (shadcn) × N
│
└── TransactionList
    ├── YearSelector
    │   └── Button (shadcn) × 2
    │
    ├── MonthSelector
    │   └── Tabs (shadcn)
    │       └── TabsTrigger × 12
    │
    └── [Conditional Rendering]
        │
        ├── TransactionListSkeleton (if loading)
        │   └── Card (shadcn)
        │       └── Skeleton (shadcn) × N
        │
        ├── TransactionEmptyState (if empty)
        │   └── Card (shadcn)
        │
        └── TransactionGroup × N (if has data)
            ├── Card (shadcn)
            └── TransactionItem × N
                ├── Icon (lucide)
                └── Amount Display
```

## Data Flow

```
FinancialPage
    │
    └─> TransactionList
            │
            ├─> useTransactionHistory() hook
            │       │
            │       └─> TanStack Query
            │               │
            │               └─> RPC → Server Actions → Database
            │
            └─> Renders based on state:
                    ├─> isLoading → TransactionListSkeleton
                    ├─> empty → TransactionEmptyState
                    └─> data → TransactionGroup → TransactionItem
```

## Component Responsibilities

### Presentation Components (Stateless)
- `BudgetChart` - Visualizes budget data
- `YearSelector` - Year navigation UI
- `MonthSelector` - Month selection UI
- `TransactionGroup` - Groups transactions by date
- `TransactionItem` - Displays single transaction
- `TransactionListSkeleton` - Loading state UI
- `TransactionEmptyState` - Empty state UI

### Container Components (Stateful)
- `TransactionList` - Fetches data, manages state, orchestrates child components

### Configuration
- `constants.ts` - Static data and configurations
- `types.ts` - TypeScript type definitions

## Imports & Dependencies

### External Dependencies
```tsx
// UI Components
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Icons
import { Wallet, ChevronLeft, ChevronRight, ArrowDownLeft, TrendingUp, HelpCircle } from "lucide-react"

// Charts
import { PieChart, Pie, Cell, Label } from "recharts"
```

### Internal Dependencies
```tsx
// Hooks
import { useTransactionHistory } from "@/hooks/use-transaction-history"

// Types
import type { TransactionRecord } from "@/types"

// Utils
import { cn, formatBalance } from "@/lib/utils"
```

## File Structure

```
components/financial/
├── README.md                           # This documentation
├── ARCHITECTURE.md                     # Architecture diagram (current file)
├── index.ts                            # Barrel exports
├── types.ts                            # TypeScript types
├── constants.ts                        # Shared constants
├── budget-chart.tsx                    # Budget visualization
├── month-selector.tsx                  # Month navigation
├── year-selector.tsx                   # Year navigation
├── transaction-list.tsx                # Main container
├── transaction-group.tsx               # Daily group
├── transaction-item.tsx                # Transaction row
├── transaction-list-skeleton.tsx       # Loading state
└── transaction-empty-state.tsx         # Empty state
```

## Design Patterns

### 1. **Container/Presenter Pattern**
- `TransactionList` (Container) - Handles data fetching and state
- Child components (Presenters) - Pure UI rendering

### 2. **Compound Components**
- `TransactionList` orchestrates multiple child components
- Each child is independent and reusable

### 3. **Centralized Configuration**
- All constants in `constants.ts`
- All types in `types.ts`
- Easy to update globally

### 4. **Conditional Rendering**
- Loading → Skeleton
- Empty → Empty State
- Data → Transaction Groups

### 5. **Composition Over Inheritance**
- Small, focused components
- Composed together in parent

## State Management

### Local State (in TransactionList)
```tsx
const {
  isLoading,          // Loading indicator
  year,               // Selected year
  setYear,            // Year setter
  monthName,          // Selected month name
  setMonthByName,     // Month setter
  groupedTransactions // Processed transaction data
} = useTransactionHistory();
```

### Props Flow
```
FinancialPage
    ↓ (currentYear)
TransactionList
    ↓ (year, setYear, currentYear)
YearSelector

TransactionList
    ↓ (monthName, setMonthByName)
MonthSelector

TransactionList
    ↓ (groupedTransactions)
TransactionGroup
    ↓ (transactions)
TransactionItem
```

## Performance Considerations

1. **Memoization Opportunities**
   - `BudgetChart` can be memoized (static data)
   - `TransactionItem` can be memoized (pure component)

2. **Lazy Loading**
   - Transaction groups can be virtualized for large datasets

3. **Code Splitting**
   - Chart library (recharts) can be lazy loaded

4. **Optimistic Updates**
   - Not yet implemented, but architecture supports it via TanStack Query

## Testing Strategy

### Unit Tests
- `TransactionItem` - Test rendering with different transaction types
- `YearSelector` - Test year navigation logic
- `MonthSelector` - Test month selection

### Integration Tests
- `TransactionList` - Test loading/empty/data states
- `TransactionGroup` - Test grouping and rendering

### E2E Tests
- Navigate between months/years
- Verify transaction display
- Test empty states

## Accessibility

- All buttons have proper ARIA labels
- Keyboard navigation supported
- Semantic HTML structure
- Color contrast compliant
- Screen reader friendly

## Future Enhancements

1. **Virtual Scrolling** - For large transaction lists
2. **Infinite Scroll** - Load more transactions on scroll
3. **Real-time Updates** - WebSocket integration
4. **Filtering** - By category, amount range, date
5. **Sorting** - By amount, date, category
6. **Export** - CSV/PDF export functionality
7. **Analytics** - Spending trends and insights
