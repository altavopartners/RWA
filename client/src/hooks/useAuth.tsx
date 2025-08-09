import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface User {
  id: string
  wallet_address: string
  name: string | null
  email: string | null
  business_name: string | null
  location: string | null
  description: string | null
  avatar_url: string | null
  role: 'producer' | 'buyer'
  verified: boolean
  did: string | null
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  walletAddress: string | null
  isConnected: boolean
  isLoading: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock WalletConnect functionality for demo
const mockWalletConnect = {
  connect: async (): Promise<string> => {
    // Simulate wallet connection delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Return a mock wallet address
    const addresses = [
      '0x1234567890123456789012345678901234567890',
      '0x9876543210987654321098765432109876543210',
      '0x5555555555555555555555555555555555555555'
    ]
    
    return addresses[Math.floor(Math.random() * addresses.length)]
  },
  
  disconnect: async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500))
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Check for existing session on mount
  useEffect(() => {
    const savedWalletAddress = localStorage.getItem('walletAddress')
    if (savedWalletAddress) {
      setWalletAddress(savedWalletAddress)
      setIsConnected(true)
      fetchUser(savedWalletAddress)
    }
  }, [])

  const fetchUser = async (address: string) => {
    try {
      // Try to get user from localStorage first
      const savedUser = localStorage.getItem(`user_${address}`)
      if (savedUser) {
        setUser(JSON.parse(savedUser))
        return
      }

      // If no local user, try Supabase (will fallback gracefully)
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('wallet_address', address)
          .single()

        if (error && error.code !== 'PGRST116') {
          throw error
        }

        if (data) {
          setUser(data)
          localStorage.setItem(`user_${address}`, JSON.stringify(data))
        }
      } catch (supabaseError) {
        console.log('Supabase not available, working offline')
        // Continue without Supabase
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  const createUser = async (address: string): Promise<User> => {
    const newUser = {
      id: `user_${Date.now()}`,
      wallet_address: address,
      role: 'producer' as const,
      verified: false,
      name: null,
      email: null,
      business_name: null,
      location: null,
      description: null,
      avatar_url: null,
      did: `did:hedera:testnet:${address.slice(-8)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    try {
      // Try Supabase first
      const { data, error } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single()

      if (error) throw error
      
      localStorage.setItem(`user_${address}`, JSON.stringify(data))
      return data
    } catch (error) {
      console.log('Supabase not available, creating offline user')
      // Fallback to localStorage
      localStorage.setItem(`user_${address}`, JSON.stringify(newUser))
      return newUser
    }
  }

  const connectWallet = async () => {
    setIsLoading(true)
    try {
      // Connect to wallet
      const address = await mockWalletConnect.connect()
      
      setWalletAddress(address)
      setIsConnected(true)
      localStorage.setItem('walletAddress', address)

      // Check if user exists, create if not
      let userData = user
      if (!userData) {
        // Check localStorage first
        const savedUser = localStorage.getItem(`user_${address}`)
        if (savedUser) {
          userData = JSON.parse(savedUser)
          toast({
            title: "Welcome back!",
            description: "Successfully connected to your wallet.",
          })
        } else {
          // Create new user
          userData = await createUser(address)
          toast({
            title: "Welcome to Hex-Port!",
            description: "Your account has been created successfully.",
          })
        }
      }

      setUser(userData)
    } catch (error) {
      console.error('Error connecting wallet:', error)
      toast({
        title: "Connection failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      })
      setIsConnected(false)
      setWalletAddress(null)
    } finally {
      setIsLoading(false)
    }
  }

  const disconnectWallet = async () => {
    setIsLoading(true)
    try {
      await mockWalletConnect.disconnect()
      
      setUser(null)
      setWalletAddress(null)
      setIsConnected(false)
      localStorage.removeItem('walletAddress')
      
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from wallet.",
      })
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    if (!user || !walletAddress) return

    try {
      const updatedUser = {
        ...user,
        ...data,
        updated_at: new Date().toISOString()
      }

      try {
        // Try Supabase first
        const { data: supabaseUser, error } = await supabase
          .from('users')
          .update(updatedUser)
          .eq('wallet_address', walletAddress)
          .select()
          .single()

        if (error) throw error
        
        localStorage.setItem(`user_${walletAddress}`, JSON.stringify(supabaseUser))
        setUser(supabaseUser)
      } catch (supabaseError) {
        console.log('Supabase not available, updating offline')
        // Fallback to localStorage
        localStorage.setItem(`user_${walletAddress}`, JSON.stringify(updatedUser))
        setUser(updatedUser)
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        walletAddress,
        isConnected,
        isLoading,
        connectWallet,
        disconnectWallet,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}