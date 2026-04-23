import { createClient as createSupabaseClient } from "@supabase/supabase-js"

let cachedClient: any = null

export function createClient() {
  if (cachedClient) {
    return cachedClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log("[v0] Supabase initialization:", {
    urlExists: !!supabaseUrl,
    keyExists: !!supabaseAnonKey,
    urlValue: supabaseUrl ? supabaseUrl.substring(0, 20) + "..." : "MISSING",
  })

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "[v0] CRITICAL: Supabase environment variables are missing!",
      "NEXT_PUBLIC_SUPABASE_URL:",
      supabaseUrl ? "✓" : "✗",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY:",
      supabaseAnonKey ? "✓" : "✗",
    )
    throw new Error("Supabase environment variables are not configured")
  }

  try {
    cachedClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    })
    console.log("[v0] Supabase client created successfully")
    return cachedClient
  } catch (error) {
    console.error("[v0] Failed to create Supabase client:", error)
    throw error
  }
}

export function isSupabaseReady(): boolean {
  const ready = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  console.log("[v0] isSupabaseReady check:", ready)
  return ready
}

// Type definitions
export interface MilkRecord {
  id: number
  date: string
  session: "morning" | "evening"
  duke_amount: number
  acarcia_amount: number
  home_amount: number
  recorded_by: string
  recorded_at: string
}

export interface PriceHistory {
  id: string
  effective_date: string
  duke_morning_price: number
  evening_price: number
  changed_by: string
  changed_at: string
}

export interface AcarciaPricing {
  id: string
  month_year: string
  price_per_liter: number
  effective_from: string
  effective_to: string
  created_at: string
  updated_at: string
}

export interface PaymentStatus {
  id: number
  period: string
  type: "weekly" | "monthly"
  recipient: "Duke" | "Acarcia" | "Combined"
  is_paid: boolean
  paid_at: string | null
  paid_by: string | null
}

export interface DukePayment {
  id: number
  payment_date: string
  amount: number
  liters: number
  period_start: string
  period_end: string
  paid_by: string
  paid_at: string
  amount_per_litre: number
  notes?: string
}

export interface SystemCredentials {
  id: number
  owner_username: string
  owner_password: string
  updated_at: string
}

export interface StaffCredentials {
  id: number
  username: string
  password: string
  created_at: string
}

export interface VetCredentials {
  id: number
  username: string
  password: string
  created_at: string
}

export interface AIRecord {
  id: string
  cow_name: string
  heat_detected: string
  insemination_date: string
  insemination_time: string
  bull_signature: string
  bull_name: string
  next_due_date: string
  drying_date: string
  expected_next_due: string
  charges: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface TreatmentRecord {
  id: string
  cow_name: string
  treatment_notes: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  title: string
  content: string
  created_by: string
  created_at: string
  updated_at: string
  is_edited: boolean
}
