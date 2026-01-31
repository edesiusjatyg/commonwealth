// Centralized query keys for TanStack Query
// All query keys should be defined here to ensure consistency and type safety

export const queryKeys = {
  wallet: {
    all: ['wallet'] as const,
    balance: (walletId?: string) => ['wallet', 'balance', walletId] as const,
    transactions: (walletId?: string) => ['wallet', 'transactions', walletId] as const,
    dailySpending: (walletId?: string) => ['wallet', 'daily-spending', walletId] as const,
    emergencyContacts: (walletId: string) => ['wallet', 'emergency-contacts', walletId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (userId?: string) => ['notifications', 'list', userId] as const,
  },
  contacts: {
    all: ['contacts'] as const,
    transferred: () => ['contacts', 'transferred'] as const,
  },
  rewards: {
    all: ['rewards'] as const,
    list: () => ['rewards', 'list'] as const,
  },
  user: {
    all: ['user'] as const,
    profile: () => ['user', 'profile'] as const,
  },
  profile: {
    all: ['profile'] as const,
    detail: (walletId?: string) => ['profile', walletId] as const,
  },
} as const;

