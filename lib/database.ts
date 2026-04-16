import { createClient } from "./supabase"
import { isSupabaseReady } from "./supabase"
import type {
  MilkRecord,
  PriceHistory,
  AcarciaPricing,
  PaymentStatus,
  DukePayment,
  SystemCredentials,
  StaffCredentials,
  VetCredentials,
  AIRecord,
  TreatmentRecord,
  Note,
} from "./supabase"

function checkSupabaseReady(serviceName: string): boolean {
  if (!isSupabaseReady()) {
    console.error(`[v0] ${serviceName}: Supabase is not properly initialized. Check environment variables.`)
    return false
  }
  return true
}

// Milk Records Service
export const milkRecordsService = {
  async getAll(): Promise<MilkRecord[]> {
    if (!checkSupabaseReady("milkRecordsService.getAll")) return []
    try {
      console.log("[v0] Fetching milk records...")
      const supabase = createClient()
      const { data, error } = await supabase.from("milk_records").select("*").order("date", { ascending: false })

      if (error) {
        console.error("[v0] Supabase error fetching milk records:", error.message, error.code)
        throw error
      }
      console.log("[v0] Milk records fetched successfully:", data?.length)
      return data || []
    } catch (error) {
      console.error("[v0] Error fetching milk records:", error instanceof Error ? error.message : error)
      return []
    }
  },

  async create(record: Omit<MilkRecord, "id" | "recorded_at">): Promise<MilkRecord> {
    if (!checkSupabaseReady("milkRecordsService.create")) throw new Error("Supabase not ready")
    const supabase = createClient()
    const { data, error } = await supabase.from("milk_records").insert(record).select().single()

    if (error) throw error
    return data
  },

  async upsertByDateSession(record: Omit<MilkRecord, "id" | "recorded_at">): Promise<MilkRecord> {
    if (!checkSupabaseReady("milkRecordsService.upsertByDateSession")) throw new Error("Supabase not ready")
    const supabase = createClient()
    const { data, error } = await supabase
      .from("milk_records")
      .upsert(record, {
        onConflict: "date,session",
        ignoreDuplicates: false,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },
}

// Price History Service
export const priceHistoryService = {
  async getAll(): Promise<PriceHistory[]> {
    if (!checkSupabaseReady("priceHistoryService.getAll")) return []
    try {
      console.log("[v0] Fetching price history...")
      const supabase = createClient()
      const { data, error } = await supabase
        .from("price_history")
        .select("*")
        .order("effective_date", { ascending: false })

      if (error) {
        console.error("[v0] Supabase error fetching price history:", error.message, error.code)
        throw error
      }
      console.log("[v0] Price history fetched successfully:", data?.length)
      return data || []
    } catch (error) {
      console.error("[v0] Error fetching price history:", error instanceof Error ? error.message : error)
      return []
    }
  },

  async create(price: Omit<PriceHistory, "id" | "changed_at">): Promise<PriceHistory> {
    if (!checkSupabaseReady("priceHistoryService.create")) throw new Error("Supabase not ready")
    const supabase = createClient()
    const { data, error } = await supabase.from("price_history").insert(price).select().single()

    if (error) throw error
    return data
  },

  async update(price: Omit<PriceHistory, "created_at">): Promise<PriceHistory> {
    if (!checkSupabaseReady("priceHistoryService.update")) throw new Error("Supabase not ready")
    const supabase = createClient()
    const { data, error } = await supabase
      .from("price_history")
      .update(price)
      .eq("id", price.id)
      .select()
      .single()

    if (error) throw error
    return data
  },
}

// Acarcia Pricing Service
export const acarciaPricingService = {
  async getAll(): Promise<AcarciaPricing[]> {
    if (!checkSupabaseReady("acarciaPricingService.getAll")) return []
    try {
      console.log("[v0] Fetching acarcia pricing...")
      const supabase = createClient()
      const { data, error } = await supabase
        .from("acarcia_pricing")
        .select("*")
        .order("month_year", { ascending: false })

      if (error) {
        console.error("[v0] Supabase error fetching acarcia pricing:", error.message, error.code)
        throw error
      }
      console.log("[v0] Acarcia pricing fetched successfully:", data?.length)
      return data || []
    } catch (error) {
      console.error("[v0] Error fetching acarcia pricing:", error instanceof Error ? error.message : error)
      return []
    }
  },

  async create(pricing: Omit<AcarciaPricing, "id" | "created_at" | "updated_at">): Promise<AcarciaPricing> {
    if (!checkSupabaseReady("acarciaPricingService.create")) throw new Error("Supabase not ready")
    const supabase = createClient()
    const { data, error } = await supabase.from("acarcia_pricing").insert(pricing).select().single()

    if (error) throw error
    return data
  },

  async upsert(pricing: Omit<AcarciaPricing, "id" | "created_at" | "updated_at">): Promise<AcarciaPricing> {
    if (!checkSupabaseReady("acarciaPricingService.upsert")) throw new Error("Supabase not ready")
    const supabase = createClient()
    const { data, error } = await supabase
      .from("acarcia_pricing")
      .upsert(pricing, {
        onConflict: "month_year",
        ignoreDuplicates: false,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },
}

// Payment Status Service
export const paymentStatusService = {
  async getAll(): Promise<PaymentStatus[]> {
    if (!checkSupabaseReady("paymentStatusService.getAll")) return []
    try {
      console.log("[v0] Fetching payment status...")
      const supabase = createClient()
      const { data, error } = await supabase.from("payment_status").select("*")

      if (error) {
        console.error("[v0] Supabase error fetching payment status:", error.message, error.code)
        throw error
      }
      console.log("[v0] Payment status fetched successfully:", data?.length)
      return data || []
    } catch (error) {
      console.error("[v0] Error fetching payment status:", error instanceof Error ? error.message : error)
      return []
    }
  },

  async upsert(payment: Omit<PaymentStatus, "id">): Promise<PaymentStatus> {
    if (!checkSupabaseReady("paymentStatusService.upsert")) throw new Error("Supabase not ready")
    const supabase = createClient()
    const { data, error } = await supabase
      .from("payment_status")
      .upsert(payment, {
        onConflict: "period,type,recipient",
        ignoreDuplicates: false,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },
}

// Duke Payments Service
export const dukePaymentsService = {
  async getAll(): Promise<DukePayment[]> {
    if (!checkSupabaseReady("dukePaymentsService.getAll")) return []
    try {
      console.log("[v0] Fetching duke payments...")
      const supabase = createClient()
      const { data, error } = await supabase
        .from("duke_payments")
        .select("*")
        .order("payment_date", { ascending: false })

      if (error) {
        console.error("[v0] Supabase error fetching duke payments:", error.message, error.code)
        throw error
      }
      console.log("[v0] Duke payments fetched successfully:", data?.length)
      return data || []
    } catch (error) {
      console.error("[v0] Error fetching duke payments:", error instanceof Error ? error.message : error)
      return []
    }
  },

  async create(payment: Omit<DukePayment, "id" | "paid_at">): Promise<DukePayment> {
    if (!checkSupabaseReady("dukePaymentsService.create")) throw new Error("Supabase not ready")
    const supabase = createClient()
    const { data, error } = await supabase.from("duke_payments").insert(payment).select().single()

    if (error) throw error
    return data
  },
}

// System Credentials Service
export const systemCredentialsService = {
  async get(): Promise<SystemCredentials | null> {
    if (!checkSupabaseReady("systemCredentialsService.get")) return null
    try {
      console.log("[v0] Fetching system credentials...")
      const supabase = createClient()
      const { data, error } = await supabase.from("system_credentials").select("*").limit(1).maybeSingle()

      if (error && error.code !== "PGRST116") {
        console.error("[v0] Supabase error fetching system credentials:", error.message, error.code)
        return null
      }
      console.log("[v0] System credentials fetched successfully", data ? "✓" : "(empty)")
      return data
    } catch (error) {
      console.error("[v0] Error fetching system credentials:", error instanceof Error ? error.message : error)
      return null
    }
  },

  async update(credentials: { owner_username: string; owner_password: string }): Promise<SystemCredentials> {
    if (!checkSupabaseReady("systemCredentialsService.update")) throw new Error("Supabase not ready")
    try {
      const supabase = createClient()
      const existing = await this.get()

      if (!existing) {
        const { data, error } = await supabase
          .from("system_credentials")
          .insert({
            owner_username: credentials.owner_username,
            owner_password: credentials.owner_password,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) throw error
        return data
      }

      const { data, error } = await supabase
        .from("system_credentials")
        .update({
          ...credentials,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("[v0] Error updating system credentials:", error instanceof Error ? error.message : error)
      throw error
    }
  },
}

// Staff Credentials Service
export const staffCredentialsService = {
  async getAll(): Promise<StaffCredentials[]> {
    if (!checkSupabaseReady("staffCredentialsService.getAll")) return []
    try {
      console.log("[v0] Fetching staff credentials...")
      const supabase = createClient()
      const { data, error } = await supabase.from("staff_credentials").select("*").order("username")

      if (error) {
        console.error("[v0] Supabase error fetching staff credentials:", error.message, error.code)
        throw error
      }
      console.log("[v0] Staff credentials fetched successfully:", data?.length)
      return data || []
    } catch (error) {
      console.error("[v0] Error fetching staff credentials:", error instanceof Error ? error.message : error)
      return []
    }
  },

  async create(credentials: { username: string; password: string }): Promise<StaffCredentials> {
    if (!checkSupabaseReady("staffCredentialsService.create")) throw new Error("Supabase not ready")
    const supabase = createClient()
    const { data, error } = await supabase.from("staff_credentials").insert(credentials).select().single()

    if (error) throw error
    return data
  },

  async delete(username: string): Promise<void> {
    if (!checkSupabaseReady("staffCredentialsService.delete")) throw new Error("Supabase not ready")
    const supabase = createClient()
    const { error } = await supabase.from("staff_credentials").delete().eq("username", username)

    if (error) throw error
  },
}

// Notes Service
export const notesService = {
  async getAll(): Promise<Note[]> {
    if (!checkSupabaseReady("notesService.getAll")) return []
    try {
      console.log("[v0] Fetching notes...")
      const supabase = createClient()
      const { data, error } = await supabase.from("notes").select("*").order("created_at", { ascending: false })

      if (error && error.code === "42P01") {
        console.warn("[v0] Notes table does not exist yet. Please run the migration script.")
        return []
      }

      if (error) {
        console.error("[v0] Supabase error fetching notes:", error.message, error.code)
        throw error
      }
      console.log("[v0] Notes fetched successfully:", data?.length)
      return data || []
    } catch (error) {
      console.error("[v0] Error fetching notes:", error instanceof Error ? error.message : error)
      return []
    }
  },

  async create(note: Omit<Note, "id" | "created_at" | "updated_at" | "is_edited">): Promise<Note> {
    if (!checkSupabaseReady("notesService.create")) throw new Error("Supabase not ready")
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("notes").insert(note).select().single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("[v0] Error creating note:", error instanceof Error ? error.message : error)
      throw error
    }
  },

  async update(id: string, updates: Partial<Pick<Note, "title" | "content">>): Promise<Note> {
    if (!checkSupabaseReady("notesService.update")) throw new Error("Supabase not ready")
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("notes")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          is_edited: true,
        })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("[v0] Error updating note:", error instanceof Error ? error.message : error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    if (!checkSupabaseReady("notesService.delete")) throw new Error("Supabase not ready")
    try {
      const supabase = createClient()
      const { error } = await supabase.from("notes").delete().eq("id", id)

      if (error) throw error
    } catch (error) {
      console.error("[v0] Error deleting note:", error instanceof Error ? error.message : error)
      throw error
    }
  },
}

// Vet Credentials Service
export const vetCredentialsService = {
  async getAll(): Promise<VetCredentials[]> {
    if (!checkSupabaseReady("vetCredentialsService.getAll")) return []
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("vet_credentials").select("*").order("created_at", { ascending: false })
      if (error) throw error
      return data || []
    } catch (error) {
      console.error("[v0] Error fetching vet credentials:", error)
      return []
    }
  },

  async create(credential: Omit<VetCredentials, "id" | "created_at">): Promise<VetCredentials> {
    if (!checkSupabaseReady("vetCredentialsService.create")) throw new Error("Supabase not ready")
    const supabase = createClient()
    const { data, error } = await supabase.from("vet_credentials").insert(credential).select().single()
    if (error) throw error
    return data
  },

  async delete(username: string): Promise<void> {
    if (!checkSupabaseReady("vetCredentialsService.delete")) throw new Error("Supabase not ready")
    const supabase = createClient()
    const { error } = await supabase.from("vet_credentials").delete().eq("username", username)
    if (error) throw error
  },
}

// AI Records Service
export const aiRecordsService = {
  async getAll(): Promise<AIRecord[]> {
    if (!checkSupabaseReady("aiRecordsService.getAll")) return []
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("ai_records").select("*").order("created_at", { ascending: false })
      if (error) throw error
      return data || []
    } catch (error) {
      console.error("[v0] Error fetching AI records:", error)
      return []
    }
  },

  async getByCowName(cowName: string): Promise<AIRecord[]> {
    if (!checkSupabaseReady("aiRecordsService.getByCowName")) return []
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("ai_records")
        .select("*")
        .eq("cow_name", cowName)
        .order("created_at", { ascending: false })
      if (error) throw error
      return data || []
    } catch (error) {
      console.error("[v0] Error fetching AI records for cow:", error)
      return []
    }
  },

  async create(record: Omit<AIRecord, "id" | "created_at" | "updated_at">): Promise<AIRecord> {
    if (!checkSupabaseReady("aiRecordsService.create")) throw new Error("Supabase not ready")
    const supabase = createClient()
    const { data, error } = await supabase.from("ai_records").insert(record).select().single()
    if (error) throw error
    return data
  },

  async update(record: Omit<AIRecord, "created_at">): Promise<AIRecord> {
    if (!checkSupabaseReady("aiRecordsService.update")) throw new Error("Supabase not ready")
    const supabase = createClient()
    const { data, error } = await supabase
      .from("ai_records")
      .update(record)
      .eq("id", record.id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    if (!checkSupabaseReady("aiRecordsService.delete")) throw new Error("Supabase not ready")
    const supabase = createClient()
    const { error } = await supabase.from("ai_records").delete().eq("id", id)
    if (error) throw error
  },
}

// Treatment Records Service
export const treatmentRecordsService = {
  async getAll(): Promise<TreatmentRecord[]> {
    if (!checkSupabaseReady("treatmentRecordsService.getAll")) return []
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("treatment_records").select("*").order("created_at", { ascending: false })
      if (error) throw error
      return data || []
    } catch (error) {
      console.error("[v0] Error fetching treatment records:", error)
      return []
    }
  },

  async getByCowName(cowName: string): Promise<TreatmentRecord[]> {
    if (!checkSupabaseReady("treatmentRecordsService.getByCowName")) return []
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("treatment_records")
        .select("*")
        .eq("cow_name", cowName)
        .order("created_at", { ascending: false })
      if (error) throw error
      return data || []
    } catch (error) {
      console.error("[v0] Error fetching treatment records for cow:", error)
      return []
    }
  },

  async create(record: Omit<TreatmentRecord, "id" | "created_at" | "updated_at">): Promise<TreatmentRecord> {
    if (!checkSupabaseReady("treatmentRecordsService.create")) throw new Error("Supabase not ready")
    const supabase = createClient()
    const { data, error } = await supabase.from("treatment_records").insert(record).select().single()
    if (error) throw error
    return data
  },

  async update(record: Omit<TreatmentRecord, "created_at">): Promise<TreatmentRecord> {
    if (!checkSupabaseReady("treatmentRecordsService.update")) throw new Error("Supabase not ready")
    const supabase = createClient()
    const { data, error } = await supabase
      .from("treatment_records")
      .update(record)
      .eq("id", record.id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    if (!checkSupabaseReady("treatmentRecordsService.delete")) throw new Error("Supabase not ready")
    const supabase = createClient()
    const { error } = await supabase.from("treatment_records").delete().eq("id", id)
    if (error) throw error
  },
}
