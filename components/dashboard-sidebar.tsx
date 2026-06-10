'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  CheckSquare, BookOpen, BarChart3, Calendar, CalendarClock,
  Clock, FileText, TrendingUp, Settings, Wallet,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/exams', label: 'Exams', icon: BookOpen },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/schedule', label: 'Schedule', icon: CalendarClock },
  { href: '/study-sessions', label: 'Study Sessions', icon: Clock },
  { href: '/analytics', label: 'Analytics', icon: TrendingUp },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/money', label: 'Money', icon: Wallet },
]


export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden border-r border-border bg-card md:flex md:flex-col md:justify-between">
      <nav className="flex flex-col gap-2 p-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
      {/* Settings at the bottom */}
      <div className="p-4 border-t border-border">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            pathname === '/settings'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
      </div>
    </aside>
  )
}
