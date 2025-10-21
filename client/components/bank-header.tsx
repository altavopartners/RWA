"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { Bell, User, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { bankLogout } from "@/lib/bankAuth"

interface BankHeaderProps {
  title: string
  description?: string
}

export function BankHeader({ title, description }: BankHeaderProps) {
  const router = useRouter()
  const [user, setUser] = useState<{ name?: string; email?: string; bankId?: string } | null>(null)

  // ✅ Read cookie on mount
  useEffect(() => {
    try {
      const cookie = Cookies.get("bank_user")
      if (cookie) {
        const parsed = JSON.parse(cookie)
        setUser(parsed)
      }
    } catch (err) {
      console.error("Failed to parse bank_user cookie:", err)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await bankLogout()
      Cookies.remove("bank_auth_token")
      Cookies.remove("bank_user")
      router.push("/bank-auth/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "BK"

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-background border-b border-border">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
              >
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <div className="flex flex-col gap-1">
                <p className="font-medium">KYC Approval Required</p>
                <p className="text-xs text-muted-foreground">
                  Client ABC Corp needs verification
                </p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex flex-col gap-1">
                <p className="font-medium">Document Validation</p>
                <p className="text-xs text-muted-foreground">
                  2 documents pending review
                </p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex flex-col gap-1">
                <p className="font-medium">Escrow Approval</p>
                <p className="text-xs text-muted-foreground">
                  Multisig signature required
                </p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/professional-banker.jpg" />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-sm font-medium">
                  {user?.name || "Bank User"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.bankId ? `Bank ID: ${user.bankId}` : user?.email}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
