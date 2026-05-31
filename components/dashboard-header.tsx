'use client'

import { signOut } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut, Menu } from 'lucide-react'
import { useState } from 'react'

export function DashboardHeader() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/sign-in')
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="flex items-center justify-between px-4 py-4 md:px-8">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">StudyFlow</h1>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="hidden gap-2 md:flex"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </header>
  )
}
