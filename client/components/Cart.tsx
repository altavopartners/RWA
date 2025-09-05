'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Trash2, Minus, Plus, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

/**
 * Cart page wired to your backend shape:
 * {
 *   "id": "1",
 *   "userId": "...",
 *   "productId": 1,
 *   "quantity": 2,
 *   "product": {
 *     "id": 1,
 *     "name": "Premium Cocoa Beans2",
 *     "pricePerUnit": 2.5,
 *     "images": [{ "path": "/uploads/images/....png" }],
 *     ...
 *   }
 * }
 *
 * NOTES:
 * - If your API serves relative file paths (e.g., "/uploads/..."), we prefix them with API_BASE.
 * - Works whether the endpoint returns a single object or an array of objects.
 * - Update token key / endpoints as needed.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'

export type CartItem = {
  id: string | number
  name: string
  price: number
  qty: number
  image?: string
}

function money(n: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n)
}

function joinUrl(base: string, path?: string | null) {
  if (!path) return undefined
  try {
    // absolute? return as-is
    if (/^https?:\/\//i.test(path)) return path
    // ensure single slash join
    return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
  } catch {
    return path || undefined
  }
}

export default function CartPage() {
  const { isConnected } = useAuth()
  const router = useRouter()

  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null)

  // Redirect if not connected (comment out while debugging)
  useEffect(() => {
    if (isConnected === false) router.replace('/')
  }, [isConnected, router])

  const normalizeFromBackend = useCallback((raw: any): CartItem[] => {
    // Accept: array of cart rows, single cart row, or nested shapes
    const rows: any[] =
      (Array.isArray(raw) && raw) ||
      (Array.isArray(raw?.items) && raw.items) ||
      (raw && typeof raw === 'object' ? [raw] : [])

    return rows.map((row) => {
      const product = row.product || {}
      const id =
        row.id ??
        row._id ??
        row.itemId ??
        row.productId ??
        product.id ??
        product._id ??
        Math.random().toString(36).slice(2)

      const name =
        product.name ??
        product.title ??
        row.name ??
        row.title ??
        'Item'

      // Your backend uses product.pricePerUnit and row.quantity
      const price =
        Number(product.pricePerUnit ?? product.price ?? row.price ?? row.unitPrice ?? 0) || 0

      const qty =
        Math.max(1, Number(row.quantity ?? row.qty ?? 1) || 1)

      // Prefer first product image path; prefix if relative
      const firstImagePath =
        row.image ??
        row.thumbnail ??
        product.image ??
        product.thumbnail ??
        (Array.isArray(product.images) && product.images.length > 0
          ? product.images[0]?.path || product.images[0]?.url
          : undefined)

      const image = joinUrl(API_BASE, firstImagePath)

      return { id, name, price, qty, image } as CartItem
    })
  }, [])

  const fetchCartItems = useCallback(async () => {
    if (!isConnected) return
    setLoading(true)
    setError(null)

    try {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('jwtToken') : null

      const res = await fetch(`${API_BASE}/api/carts/getmycart`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
      })

      const txt = await res.text()
      let data: any = {}
      try {
        data = txt ? JSON.parse(txt) : {}
      } catch {
        if (!res.ok) throw new Error(txt || 'Failed to fetch cart items')
      }

      if (!res.ok) {
        const message =
          (typeof data?.message === 'string' && data.message) ||
          (typeof data?.error === 'string' && data.error) ||
          txt ||
          'Failed to fetch cart items'
        throw new Error(message)
      }

      console.log('Cart data from server:', data)
      const normalized = normalizeFromBackend(data)
      setItems(normalized)
      setLastFetchedAt(Date.now())
    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'Something went wrong')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [isConnected, normalizeFromBackend])

  useEffect(() => {
    if (isConnected) fetchCartItems()
  }, [isConnected, fetchCartItems])

  // Optimistic quantity changes (replace with real API calls where noted)
  const inc = useCallback((id: CartItem['id']) => {
    setItems(prev => prev.map(it => (it.id === id ? { ...it, qty: it.qty + 1 } : it)))
    // await fetch(`${API_BASE}/api/carts/items/${id}`, { method: 'PATCH', body: JSON.stringify({ op: 'inc' }) })
  }, [])

  const dec = useCallback((id: CartItem['id']) => {
    setItems(prev => prev.map(it => (it.id === id ? { ...it, qty: Math.max(1, it.qty - 1) } : it)))
    // await fetch(`${API_BASE}/api/carts/items/${id}`, { method: 'PATCH', body: JSON.stringify({ op: 'dec' }) })
  }, [])

  const removeItem = useCallback((id: CartItem['id']) => {
    setItems(prev => prev.filter(it => it.id !== id))
    // await fetch(`${API_BASE}/api/carts/items/${id}`, { method: 'DELETE' })
  }, [])

  const { subtotal, shipping, total } = useMemo(() => {
    const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0)
    const shipping = items.length > 0 ? 5 : 0
    const total = subtotal + shipping
    return { subtotal, shipping, total }
  }, [items])

  if (isConnected === false) return null

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your Cart</h1>
        <Button variant="outline" onClick={fetchCartItems} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4 sm:p-6">
            {loading ? (
              <p className="text-muted-foreground">Loading your cart…</p>
            ) : error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            ) : items.length === 0 ? (
              <div className="space-y-3">
                <p className="text-muted-foreground">Your cart is empty.</p>
                <div className="text-xs text-muted-foreground">
                  Expected shapes: a single cart row or an array of rows each with
                  <code className="ml-1">
                    {" { id, productId, quantity, product: { name, pricePerUnit, images[] } }"}
                  </code>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map(it => (
                  <div key={it.id} className="flex items-center gap-4 p-3 rounded-xl border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={it.image || '/placeholder.svg'}
                      alt={it.name}
                      className="h-16 w-16 rounded-lg object-cover border"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{it.name}</div>
                      <div className="text-sm text-muted-foreground">{money(it.price)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => dec(it.id)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="w-10 text-center tabular-nums">{it.qty}</div>
                      <Button variant="outline" size="icon" onClick={() => inc(it.id)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="w-24 text-right font-medium">{money(it.price * it.qty)}</div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove item"
                      onClick={() => removeItem(it.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
                {lastFetchedAt && (
                  <div className="text-xs text-muted-foreground">
                    Last updated: {new Date(lastFetchedAt).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardContent className="p-4 sm:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium tabular-nums">{money(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium tabular-nums">{money(shipping)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-lg">
              <span className="font-semibold">Total</span>
              <span className="font-bold tabular-nums">{money(total)}</span>
            </div>
            <Button className="w-full" disabled={items.length === 0 || loading}>
              Checkout
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Dev helpers – safe to delete */}
      <div className="text-xs text-muted-foreground">
        Using <code>product.pricePerUnit</code> and <code>quantity</code>. Image paths are
        prefixed with <code>NEXT_PUBLIC_API_BASE</code> if they are relative (e.g. /uploads/...).
      </div>
    </div>
  )
}
