// src/config/navigation.ts
export const NAVIGATION_ITEMS = [
  {
    label: 'Home',
    href: '/',
    icon: 'home',
  },
  {
    label: 'Browse',
    href: '/browse',
    icon: 'grid',
  },
  {
    label: 'Add Listing',
    href: '/add-item',
    icon: 'plus',
    requiresAuth: true,
  },
  {
    label: 'Messages',
    href: '/chat',
    icon: 'message',
    requiresAuth: true,
  },
  {
    label: 'Favorites',
    href: '/favorites',
    icon: 'heart',
    requiresAuth: true,
  },
] as const

export const USER_MENU_ITEMS = [
  {
    label: 'Profile',
    href: '/profile',
    icon: 'user',
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: 'settings',
  },
  {
    label: 'Notifications',
    href: '/notifications',
    icon: 'bell',
  },
  {
    label: 'Help',
    href: '/help',
    icon: 'help',
  },
] as const

export const FOOTER_LINKS = {
  marketplace: {
    title: 'Marketplace',
    links: [
      { label: 'Browse Listings', href: '/browse' },
      { label: 'Categories', href: '/categories' },
      { label: 'How It Works', href: '/how-it-works' },
      { label: 'Safety Tips', href: '/safety' },
    ],
  },
  account: {
    title: 'Account',
    links: [
      { label: 'Sign In', href: '/signin' },
      { label: 'Sign Up', href: '/signup' },
      { label: 'My Profile', href: '/profile' },
      { label: 'Settings', href: '/settings' },
    ],
  },
  support: {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '/help' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Report Issue', href: '/report' },
      { label: 'Community Guidelines', href: '/guidelines' },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Disclaimer', href: '/disclaimer' },
    ],
  },
} as const

export const ADMIN_NAVIGATION = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: 'dashboard',
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: 'users',
  },
  {
    label: 'Listings',
    href: '/admin/listings',
    icon: 'grid',
  },
  {
    label: 'Reports',
    href: '/admin/reports',
    icon: 'flag',
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: 'chart',
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: 'settings',
  },
] as const
