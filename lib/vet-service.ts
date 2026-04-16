import { createClient } from '@/lib/supabase'

// Types for vet records
export interface AIRecord {
  id: string
  cow_name: string
  ai_image_url?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface TreatmentRecord {
  id: string
  cow_name: string
  treatment_date: string
  treatment_notes: string
  treatment_image_url?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface CreateAIRecordRequest {
  cow_name: string
  ai_image_url?: string
  created_by: string
}

export interface CreateTreatmentRecordRequest {
  cow_name: string
  treatment_date: string
  treatment_notes: string
  treatment_image_url?: string
  created_by: string
}

class VetService {
  private supabase = createClient()

  // AI Records CRUD Operations
  async getAIRecords(): Promise<AIRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from('ai_records')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching AI records:', error)
      throw error
    }
  }

  async getAIRecordsByCow(cowName: string): Promise<AIRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from('ai_records')
        .select('*')
        .eq('cow_name', cowName)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching AI records by cow:', error)
      throw error
    }
  }

  async createAIRecord(record: CreateAIRecordRequest): Promise<AIRecord> {
    try {
      const { data, error } = await this.supabase
        .from('ai_records')
        .insert([record])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating AI record:', error)
      throw error
    }
  }

  async deleteAIRecord(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ai_records')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting AI record:', error)
      throw error
    }
  }

  // Treatment Records CRUD Operations
  async getTreatmentRecords(): Promise<TreatmentRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from('treatment_records')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching treatment records:', error)
      throw error
    }
  }

  async getTreatmentRecordsByCow(cowName: string): Promise<TreatmentRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from('treatment_records')
        .select('*')
        .eq('cow_name', cowName)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching treatment records by cow:', error)
      throw error
    }
  }

  async createTreatmentRecord(record: CreateTreatmentRecordRequest): Promise<TreatmentRecord> {
    try {
      const { data, error } = await this.supabase
        .from('treatment_records')
        .insert([record])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating treatment record:', error)
      throw error
    }
  }

  async deleteTreatmentRecord(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('treatment_records')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting treatment record:', error)
      throw error
    }
  }

  // Image Upload Helper
  async uploadImage(base64Data: string, fileName: string, mimeType: string): Promise<string> {
    try {
      // Convert base64 to blob
      const base64Response = await fetch(`data:${mimeType};base64,${base64Data}`)
      const blob = await base64Response.blob()
      
      // Generate unique file name
      const timestamp = Date.now()
      const uniqueFileName = `${timestamp}-${fileName}`
      
      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from('vet-images')
        .upload(uniqueFileName, blob, {
          contentType: mimeType,
          upsert: true
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from('vet-images')
        .getPublicUrl(uniqueFileName)

      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }

  // Alternative: Store base64 directly in database (for smaller images)
  async storeBase64Image(base64Data: string, mimeType: string): Promise<string> {
    try {
      // Create data URL that can be stored directly
      const dataUrl = `data:${mimeType};base64,${base64Data}`
      return dataUrl
    } catch (error) {
      console.error('Error storing base64 image:', error)
      throw error
    }
  }
}

export const vetService = new VetService()
