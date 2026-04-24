"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import VetDashboard from "./vet-dashboard-enhanced-final"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { initializeDatabase } from "@/lib/init-database"
import {
  CalendarDays,
  Milk,
  DollarSign,
  TrendingUp,
  Lock,
  User,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle,
  History,
  Download,
  Settings,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  RefreshCw,
  Stethoscope,
  Menu,
  BarChart3,
  Home,
  FileText,
  Bold,
  Italic,
  Underline,
  Highlighter,
  Save,
  Clock,
  Trash2,
  Edit,
  X,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Import database services
import {
  milkRecordsService,
  priceHistoryService,
  acarciaPricingService,
  paymentStatusService,
  dukePaymentsService,
  systemCredentialsService,
  staffCredentialsService,
  vetCredentialsService,
  aiRecordsService,
  treatmentRecordsService,
  notesService,
} from "./lib/database"

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
} from "./lib/supabase"

interface DailySummary {
  date: string
  morningDuke: number
  eveningAcarcia: number
  morningHome: number
  eveningHome: number
  totalLiters: number
  totalLitersWithHome: number
  recordedBy?: string
  morningPrice: number
  eveningPrice: number
  morningDukeRevenue: number
  eveningRevenue: number
  totalRevenue: number
  priceChanged?: boolean
}

interface EntryState {
  date: string
  dukeAmount: string
  homeAmount: string
  eveningAmount: string
  eveningHomeAmount: string
  morningHomeAmount: string
}

interface ChartData {
  date: string
  Duke: number
  Acarcia: number
  Home: number
  Total: number
}

export default function MilkProductionTracker() {
  const [user, setUser] = useState<{ name: string; role: "owner" | "staff" | "vet" } | null>(null)
  const [loginMode, setLoginMode] = useState<"staff" | "owner" | "vet">("staff")
  const [staffForm, setStaffForm] = useState({ username: "", password: "" })
  const [ownerForm, setOwnerForm] = useState({ username: "", password: "" })
  const [vetForm, setVetForm] = useState({ username: "", password: "" })
  const [loginError, setLoginError] = useState("")
  const [dataError, setDataError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState("daily-entry")

  // Data states
  const [records, setRecords] = useState<MilkRecord[]>([])
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([])
  const [acarciaPricing, setAcarciaPricing] = useState<AcarciaPricing[]>([])
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus[]>([])
  const [dukePayments, setDukePayments] = useState<DukePayment[]>([])
  const [systemCredentials, setSystemCredentials] = useState<SystemCredentials | null>(null)
  const [staffCredentials, setStaffCredentials] = useState<StaffCredentials[]>([])
  const [vetCredentials, setVetCredentials] = useState<VetCredentials[]>([])
  const [aiRecords, setAIRecords] = useState<AIRecord[]>([])
  const [treatmentRecords, setTreatmentRecords] = useState<TreatmentRecord[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [currentDukeMorningPrice, setCurrentDukeMorningPrice] = useState<number>(50)
const [currentAcarciaPrice, setCurrentAcarciaPrice] = useState<number>(45)

  // UI states
  const [showStaffPassword, setShowStaffPassword] = useState(false)
  const [showOwnerPassword, setShowOwnerPassword] = useState(false)
  const [showNewOwnerPassword, setShowNewOwnerPassword] = useState(false)
  const [showNewStaffPassword, setShowNewStaffPassword] = useState(false)
  const [showNewVetPassword, setShowNewVetPassword] = useState(false)
  const [showVetPassword, setShowVetPassword] = useState(false)
  const [showStaffPasswords, setShowStaffPasswords] = useState<{ [key: string]: boolean }>({})

  // Form states
  const [newOwnerUsername, setNewOwnerUsername] = useState("")
  const [newOwnerPassword, setNewOwnerPassword] = useState("")
  const [newStaffUsername, setNewStaffUsername] = useState("")
  const [newStaffPassword, setNewStaffPassword] = useState("")
  const [newVetUsername, setNewVetUsername] = useState("")
  const [newVetPassword, setNewVetPassword] = useState("")
  const [dukePaymentDate, setDukePaymentDate] = useState(new Date().toISOString().split("T")[0])
  const [newPriceDate, setNewPriceDate] = useState(new Date().toISOString().split("T")[0])
  const [newDukeMorningPrice, setNewDukeMorningPrice] = useState("")
  const [newEveningPrice, setNewEveningPrice] = useState("")

  // Acarcia pricing states
  const [acarciaPrice, setAcarciaPrice] = useState("")
  const [acarciaEffectiveFrom, setAcarciaEffectiveFrom] = useState("")
  const [acarciaEffectiveTo, setAcarciaEffectiveTo] = useState("")

  // Acarcia payment calculation states
  const [acarciaMonthlyPayment, setAcarciaMonthlyPayment] = useState("")
  const [acarciaPaymentMonth, setAcarciaPaymentMonth] = useState("")
  const [calculatedPricePerLiter, setCalculatedPricePerLiter] = useState<number | null>(null)

  // Notepad states
  const [currentNoteTitle, setCurrentNoteTitle] = useState("")
  const [currentNoteContent, setCurrentNoteContent] = useState("")
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  const [entry, setEntry] = useState<EntryState>({
    date: new Date().toISOString().split("T")[0],
    dukeAmount: "",
    homeAmount: "",
    eveningAmount: "",
    eveningHomeAmount: "",
    morningHomeAmount: "",
  })

  const [message, setMessage] = useState("")
  const [dukePaymentNotes, setDukePaymentNotes] = useState("")
  const [manualPaymentAmount, setManualPaymentAmount] = useState("")

  // Load notes from database
  const loadNotes = useCallback(async () => {
    try {
      const notesData = await notesService.getAll()
      setNotes(notesData)
    } catch (error) {
      console.error("Error loading notes:", error)
    }
  }, [])

  // Add new note
  const addNewNote = useCallback(async () => {
    if (!currentNoteContent.trim()) {
      setMessage("Please write something before saving!")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    if (!user) return

    try {
      const newNote = {
        title: currentNoteTitle.trim() || "Untitled Note",
        content: currentNoteContent,
        created_by: user.name,
      }

      await notesService.create(newNote)
      await loadNotes() // Refresh notes

      setCurrentNoteTitle("")
      setCurrentNoteContent("")

      // Clear editor
      if (editorRef.current) {
        editorRef.current.innerHTML = ""
      }

      setMessage("Note saved successfully!")
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("Error saving note:", error)
      setMessage("Failed to save note. Please try again.")
      setTimeout(() => setMessage(""), 3000)
    }
  }, [currentNoteTitle, currentNoteContent, user, loadNotes])

  // Edit existing note
  const editNote = useCallback((note: Note) => {
    setEditingNoteId(note.id)
    setCurrentNoteTitle(note.title)
    setCurrentNoteContent(note.content)

    // Set editor content
    if (editorRef.current) {
      editorRef.current.innerHTML = note.content
    }
  }, [])

  // Update existing note
  const updateNote = useCallback(async () => {
    if (!editingNoteId || !currentNoteContent.trim()) {
      setMessage("Please write something before saving!")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    try {
      await notesService.update(editingNoteId, {
        title: currentNoteTitle.trim() || "Untitled Note",
        content: currentNoteContent,
      })

      await loadNotes() // Refresh notes

      setEditingNoteId(null)
      setCurrentNoteTitle("")
      setCurrentNoteContent("")

      // Clear editor
      if (editorRef.current) {
        editorRef.current.innerHTML = ""
      }

      setMessage("Note updated successfully!")
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("Error updating note:", error)
      setMessage("Failed to update note. Please try again.")
      setTimeout(() => setMessage(""), 3000)
    }
  }, [editingNoteId, currentNoteTitle, currentNoteContent, loadNotes])

  // Cancel editing
  const cancelEdit = useCallback(() => {
    setEditingNoteId(null)
    setCurrentNoteTitle("")
    setCurrentNoteContent("")

    // Clear editor
    if (editorRef.current) {
      editorRef.current.innerHTML = ""
    }
  }, [])

  // Delete note with confirmation
  const deleteNote = useCallback(
    async (noteId: string) => {
      try {
        await notesService.delete(noteId)
        await loadNotes() // Refresh notes
        setDeleteConfirmId(null)
        setMessage("Note deleted successfully!")
        setTimeout(() => setMessage(""), 3000)
      } catch (error) {
        console.error("Error deleting note:", error)
        setMessage("Failed to delete note. Please try again.")
        setTimeout(() => setMessage(""), 3000)
      }
    },
    [loadNotes],
  )

  // Format text in editor
  const formatText = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
    if (editorRef.current) {
      setCurrentNoteContent(editorRef.current.innerHTML)
    }
  }, [])

  // Handle editor content change
  const handleEditorChange = useCallback(() => {
    if (editorRef.current) {
      setCurrentNoteContent(editorRef.current.innerHTML)
    }
  }, [])

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Load all data from database with timeout and retry
  const loadAllData = useCallback(async (retryCount = 0) => {
    setIsLoading(true)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Data loading timeout - database may be unavailable")), 30000),
    )

    try {
      const dataPromises = Promise.race([
        Promise.all([
          milkRecordsService.getAll(),
          priceHistoryService.getAll(),
          acarciaPricingService.getAll(),
          paymentStatusService.getAll(),
          dukePaymentsService.getAll(),
          systemCredentialsService.get(),
          staffCredentialsService.getAll(),
          vetCredentialsService.getAll(),
          aiRecordsService.getAll(),
          treatmentRecordsService.getAll(),
          notesService.getAll(),
        ]),
        timeoutPromise,
      ])

      const [
        recordsData,
        priceHistoryData,
        acarciaPricingData,
        paymentStatusData,
        dukePaymentsData,
        systemCredsData,
        staffCredsData,
        vetCredsData,
        aiRecordsData,
        treatmentRecordsData,
        notesData,
      ] = (await dataPromises) as [
        MilkRecord[],
        PriceHistory[],
        AcarciaPricing[],
        PaymentStatus[],
        DukePayment[],
        SystemCredentials | null,
        StaffCredentials[],
        VetCredentials[],
        AIRecord[],
        TreatmentRecord[],
        Note[],
      ]

      setRecords(recordsData)
      setPriceHistory(priceHistoryData)
      setAcarciaPricing(acarciaPricingData)
      setPaymentStatus(paymentStatusData)
      setDukePayments(dukePaymentsData)
      setSystemCredentials(systemCredsData)
      setStaffCredentials(staffCredsData)
      setVetCredentials(vetCredsData)
      setAIRecords(aiRecordsData)
      setTreatmentRecords(treatmentRecordsData)
      setNotes(notesData)
      setLastSync(new Date())
      setDataError("")
    } catch (error) {
      console.error("[v0] Error loading data:", error)
      
      // Retry logic with exponential backoff
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
        console.log(`[v0] Retrying data load in ${delay}ms (attempt ${retryCount + 1}/3)`)
        setTimeout(() => loadAllData(retryCount + 1), delay)
        return
      }
      
      // Final fallback - set empty data to allow login screen to show
      setRecords([])
      setPriceHistory([{ effective_date: "2024-01-01", duke_morning_price: 50, acarcia_price: 45, changed_by: "System", changed_at: new Date().toISOString() } as PriceHistory])
      setAcarciaPricing([])
      setPaymentStatus([])
      setDukePayments([])
      setStaffCredentials([])
      setVetCredentials([])
      setAIRecords([])
      setTreatmentRecords([])
      setNotes([])
      setDataError("Database connection failed after 3 attempts. Showing login screen with default data.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial database setup and data load
  useEffect(() => {
    const initializeApp = async () => {
      // First, initialize database tables if they don't exist
      console.log("[v0] Initializing database...")
      await initializeDatabase()
      
      // Then load all data
      console.log("[v0] Loading application data...")
      await loadAllData()
    }
    
    initializeApp()
  }, [loadAllData])

  // Generate recent dates for custom date picker (3 months back)
  const getRecentDates = () => {
    const dates: string[] = []
    // Generate dates for 3 months back (approximately 90 days)
    for (let i = 0; i < 90; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      dates.push(date.toISOString().split("T")[0])
    }
    return dates
  }

  // Get Acarcia price for a specific date
  const getAcarciaPriceForDate = useCallback(
    (date: string): number => {
      if (!acarciaPricing || acarciaPricing.length === 0) {
        return 45
      }

      const dateObj = new Date(date)
      const applicablePricing = acarciaPricing.find((pricing) => {
        const effectiveFrom = new Date(pricing.effective_from)
        const effectiveTo = new Date(pricing.effective_to)
        return dateObj >= effectiveFrom && dateObj <= effectiveTo
      })

      return applicablePricing?.price_per_liter || 45
    },
    [acarciaPricing],
  )

  // Get current Acarcia price (most recent)
  const getCurrentAcarciaPrice = useCallback(() => {
    if (!acarciaPricing || acarciaPricing.length === 0) {
      return 45
    }

    const currentDate = new Date()
    const currentPricing = acarciaPricing
      .filter((pricing) => {
        const effectiveFrom = new Date(pricing.effective_from)
        const effectiveTo = new Date(pricing.effective_to)
        return currentDate >= effectiveFrom && currentDate <= effectiveTo
      })
      .sort((a, b) => new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime())[0]

    return currentPricing?.price_per_liter || 45
  }, [acarciaPricing])

  // Get prices for a specific date
  const getPricesForDate = useCallback(
    (date: string) => {
      // Get Duke price for date
      let dukePrice = 50
      if (priceHistory && priceHistory.length > 0) {
        const applicablePrice = priceHistory.find((price) => {
          const priceDate = new Date(price.effective_date)
          const targetDate = new Date(date)
          return targetDate >= priceDate
        })
        dukePrice = applicablePrice?.duke_morning_price || 50
      }
      
      // Get Acarcia price for date
      const acarciaPrice = getAcarciaPriceForDate(date)
      
      return {
        dukeMorning: dukePrice,
        evening: acarciaPrice,
      }
    },
    [priceHistory, getAcarciaPriceForDate],
  )

  // Get current active prices
  const getCurrentPrices = useCallback(
    () => {
      // Use the dedicated price states if available, otherwise calculate from history
      const dukePrice = currentDukeMorningPrice || 50
      const acarciaPrice = currentAcarciaPrice || 45
      
      return {
        dukeMorning: dukePrice,
        evening: acarciaPrice,
      }
    },
    [currentDukeMorningPrice, currentAcarciaPrice],
  )

  // Check if price changed on a specific date
  const isPriceChangeDate = useCallback(
    (date: string): boolean => {
      if (!priceHistory || priceHistory.length === 0) return false
      return priceHistory.some((price) => price && price.effective_date === date)
    },
    [priceHistory],
  )

  // Get payment status
  const getPaymentStatusValue = useCallback(
    (period: string, type: "weekly" | "monthly", recipient?: string): boolean => {
      const payment = paymentStatus.find((p) => p.period === period && p.type === type && p.recipient === recipient)
      return payment?.is_paid || false
    },
    [paymentStatus],
  )

  // Toggle payment status
  const togglePaymentStatus = useCallback(
    async (period: string, type: "weekly" | "monthly", recipient: "Duke" | "Acarcia" | "Combined") => {
      try {
        const existingPayment = paymentStatus.find(
          (p) => p.period === period && p.type === type && p.recipient === recipient,
        )

        const newPayment = {
          period,
          type,
          recipient,
          is_paid: !existingPayment?.is_paid,
          paid_at: !existingPayment?.is_paid ? new Date().toISOString() : null,
          paid_by: !existingPayment?.is_paid ? user?.name : null,
        }

        await paymentStatusService.upsert(newPayment)
        await loadAllData() // Refresh data
        setMessage("Payment status updated successfully!")
        setTimeout(() => setMessage(""), 3000)
      } catch (error) {
        console.error("Error updating payment status:", error)
        setDataError("Failed to update payment status")
        setTimeout(() => setDataError(""), 5000)
      }
    },
    [paymentStatus, user, loadAllData],
  )

  // Calculate Duke's current debt
  const getDukeCurrentDebt = useCallback(() => {
    // Get ALL Duke records regardless of date
    const dukeRecords = records.filter(
      (record) => record && record.session === "morning" && (record.duke_amount ?? 0) > 0,
    )

    let totalOwed = 0
    dukeRecords.forEach((record) => {
      if (record && record.date) {
        const prices = getPricesForDate(record.date)
        const amount = record.duke_amount ?? 0
        const price = prices.dukeMorning || 50
        totalOwed += amount * price
      }
    })

    const totalPaid = dukePayments.reduce((sum, payment) => {
      const amount = payment?.amount || 0
      return sum + (isNaN(amount) ? 0 : amount)
    }, 0)

    const outstandingBalance = Math.max(0, (totalOwed || 0) - (totalPaid || 0))
    const totalLiters = dukeRecords.reduce((sum, record) => sum + (record?.duke_amount ?? 0), 0)
    const paidLiters = dukePayments.reduce((sum, payment) => sum + (payment?.liters ?? 0), 0)
    const unpaidLiters = Math.max(0, (totalLiters || 0) - (paidLiters || 0))

    const lastPaymentDate =
      dukePayments.length > 0
        ? dukePayments.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())[0]
            ?.payment_date || "2024-01-01"
        : "2024-01-01"

    return {
      liters: isNaN(unpaidLiters) ? 0 : unpaidLiters,
      amount: isNaN(outstandingBalance) ? 0 : outstandingBalance,
      totalOwed: isNaN(totalOwed) ? 0 : totalOwed,
      totalPaid: isNaN(totalPaid) ? 0 : totalPaid,
      periodStart: lastPaymentDate,
      records: dukeRecords,
    }
  }, [dukePayments, records, getPricesForDate])

  // Handle login
  const handleLogin = useCallback(async () => {
    setLoginError("")
    setIsLoading(true)

    try {
      if (loginMode === "staff") {
        const staffCredential = staffCredentials.find(
          (cred) => cred.username === staffForm.username && cred.password === staffForm.password,
        )
        if (staffCredential) {
          setUser({ name: staffForm.username, role: "staff" })
          setMessage(`Welcome ${staffForm.username}!`)
          setTimeout(() => setMessage(""), 3000)
        } else {
          setLoginError("Invalid staff credentials")
        }
      } else if (loginMode === "vet") {
        const vetCredential = vetCredentials.find(
          (cred) => cred.username === vetForm.username && cred.password === vetForm.password,
        )
        if (vetCredential) {
          setUser({ name: vetForm.username, role: "vet" })
          setMessage(`Welcome ${vetForm.username}!`)
          setTimeout(() => setMessage(""), 3000)
        } else {
          if (vetCredentials.length === 0) {
            setLoginError("Vet credentials not found. Please execute SQL script first.")
          } else {
            setLoginError("Invalid veterinarian credentials")
          }
        }
      } else {
        if (
          systemCredentials &&
          ownerForm.username === systemCredentials.owner_username &&
          ownerForm.password === systemCredentials.owner_password
        ) {
          setUser({ name: "Owner", role: "owner" })
          setMessage("Welcome Owner!")
          setTimeout(() => setMessage(""), 3000)
        } else {
          setLoginError("Invalid owner credentials")
        }
      }
    } catch (error) {
      console.error("Login error:", error)
      setLoginError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [loginMode, staffForm, ownerForm, vetForm, systemCredentials, staffCredentials, vetCredentials])

  // Handle logout
  const handleLogout = useCallback(() => {
    setUser(null)
    setStaffForm({ username: "", password: "" })
    setOwnerForm({ username: "", password: "" })
    setVetForm({ username: "", password: "" })
    setLoginError("")
    setLoginMode("staff")
  }, [])

  // Handle credential updates
  const handleUpdateOwnerCredentials = useCallback(async () => {
    if (!newOwnerUsername.trim() || !newOwnerPassword.trim()) {
      setMessage("Please enter both username and password!")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    setIsLoading(true)
    try {
      await systemCredentialsService.update({
        owner_username: newOwnerUsername.trim(),
        owner_password: newOwnerPassword.trim(),
      })

      setNewOwnerUsername("")
      setNewOwnerPassword("")
      await loadAllData() // Refresh data
      setMessage("Owner credentials updated successfully!")
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("Error updating owner credentials:", error)
      setDataError("Failed to update owner credentials")
      setTimeout(() => setDataError(""), 5000)
    } finally {
      setIsLoading(false)
    }
  }, [newOwnerUsername, newOwnerPassword, loadAllData])

  const handleAddStaffCredentials = useCallback(async () => {
    if (!newStaffUsername.trim() || !newStaffPassword.trim()) {
      setMessage("Please enter both username and password!")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    const existingStaff = staffCredentials.find((cred) => cred.username === newStaffUsername.trim())
    if (existingStaff) {
      setMessage("Staff username already exists!")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    setIsLoading(true)
    try {
      await staffCredentialsService.create({
        username: newStaffUsername.trim(),
        password: newStaffPassword.trim(),
      })

      setNewStaffUsername("")
      setNewStaffPassword("")
      await loadAllData() // Refresh data
      setMessage("Staff credentials added successfully!")
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("Error adding staff credentials:", error)
      setDataError("Failed to add staff credentials")
      setTimeout(() => setDataError(""), 5000)
    } finally {
      setIsLoading(false)
    }
  }, [newStaffUsername, newStaffPassword, staffCredentials, loadAllData])

  const handleAddVetCredentials = useCallback(async () => {
    if (!newVetUsername.trim() || !newVetPassword.trim()) {
      setMessage("Please enter both username and password!")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    const existingVet = vetCredentials.find((cred) => cred.username === newVetUsername.trim())
    if (existingVet) {
      setMessage("Vet username already exists!")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    setIsLoading(true)
    try {
      await vetCredentialsService.create({
        username: newVetUsername.trim(),
        password: newVetPassword.trim(),
      })

      setNewVetUsername("")
      setNewVetPassword("")
      await loadAllData() // Refresh data
      setMessage("Vet credentials added successfully!")
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("Error adding vet credentials:", error)
      setDataError("Failed to add vet credentials")
      setTimeout(() => setDataError(""), 5000)
    } finally {
      setIsLoading(false)
    }
  }, [newVetUsername, newVetPassword, vetCredentials, loadAllData])

  const handleRemoveStaffCredentials = useCallback(
    async (username: string) => {
      setIsLoading(true)
      try {
        await staffCredentialsService.delete(username)
        await loadAllData() // Refresh data
        setMessage(`Staff ${username} removed successfully!`)
        setTimeout(() => setMessage(""), 3000)
      } catch (error) {
        console.error("Error removing staff credentials:", error)
        setDataError("Failed to remove staff credentials")
        setTimeout(() => setDataError(""), 5000)
      } finally {
        setIsLoading(false)
      }
    },
    [loadAllData],
  )

  const handleRemoveVetCredentials = useCallback(
    async (username: string) => {
      setIsLoading(true)
      try {
        await vetCredentialsService.delete(username)
        await loadAllData() // Refresh data
        setMessage(`Vet ${username} removed successfully!`)
        setTimeout(() => setMessage(""), 3000)
      } catch (error) {
        console.error("Error removing vet credentials:", error)
        setDataError("Failed to remove vet credentials")
        setTimeout(() => setDataError(""), 5000)
      } finally {
        setIsLoading(false)
      }
    },
    [loadAllData],
  )

  // Handle entry change
  const handleEntryChange = useCallback((field: keyof EntryState, value: string) => {
    setEntry((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  // Handle morning entry (Duke only)
  const handleMorningEntry = useCallback(async () => {
    const dukeAmount = entry.dukeAmount.trim() === "" ? 0 : Number.parseFloat(entry.dukeAmount)

    if (isNaN(dukeAmount) || dukeAmount < 0) {
      setMessage("Please enter a valid amount for Duke's morning production!")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    if (dukeAmount === 0) {
      setMessage("Duke's amount must be greater than zero!")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    setIsLoading(true)
    try {
      const newRecord = {
        date: entry.date,
        session: "morning" as const,
        duke_amount: dukeAmount,
        acarcia_amount: 0, // Always 0 for morning sessions
        home_amount: 0, // Home is recorded separately
        recorded_by: user?.name || "Unknown",
        recorded_at: new Date().toISOString(),
      }

      await milkRecordsService.upsertByDateSession(newRecord)
      await loadAllData() // Refresh data

      setEntry((prev) => ({ ...prev, dukeAmount: "" }))
      setMessage("Duke's morning production recorded successfully!")
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("Error recording morning entry:", error)
      setDataError("Failed to record morning production")
      setTimeout(() => setDataError(""), 5000)
    } finally {
      setIsLoading(false)
    }
  }, [entry, user, loadAllData])

  // Handle evening entry (Acarcia only)
  const handleEveningEntry = useCallback(async () => {
    const eveningAmount = entry.eveningAmount.trim() === "" ? 0 : Number.parseFloat(entry.eveningAmount)

    if (isNaN(eveningAmount) || eveningAmount < 0) {
      setMessage("Please enter a valid amount for evening production!")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    if (eveningAmount === 0) {
      setMessage("Evening amount must be greater than zero!")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    setIsLoading(true)
    try {
      const newRecord = {
        date: entry.date,
        session: "evening" as const,
        duke_amount: 0, // Always 0 for evening sessions
        acarcia_amount: eveningAmount,
        home_amount: 0, // Home is recorded separately
        recorded_by: user?.name || "Unknown",
        recorded_at: new Date().toISOString(),
      }

      await milkRecordsService.upsertByDateSession(newRecord)
      await loadAllData() // Refresh data

      setEntry((prev) => ({ ...prev, eveningAmount: "" }))
      setMessage("Evening production recorded successfully!")
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("Error recording evening entry:", error)
      setDataError("Failed to record evening production")
      setTimeout(() => setDataError(""), 5000)
    } finally {
      setIsLoading(false)
    }
  }, [entry, user, loadAllData])

  // Handle all home entries at once
  const handleAllHomeEntries = useCallback(async () => {
    const morningHomeAmount = entry.morningHomeAmount.trim() === "" ? 0 : Number.parseFloat(entry.morningHomeAmount)
    const eveningHomeAmount = entry.eveningHomeAmount.trim() === "" ? 0 : Number.parseFloat(entry.eveningHomeAmount)

    if (isNaN(morningHomeAmount) || isNaN(eveningHomeAmount) || morningHomeAmount < 0 || eveningHomeAmount < 0) {
      setMessage("Please enter valid amounts for home use!")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    if (morningHomeAmount === 0 && eveningHomeAmount === 0) {
      setMessage("At least one home amount must be greater than zero!")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    setIsLoading(true)
    try {
      const promises = []

      // Handle morning home entry if provided
      if (morningHomeAmount > 0) {
        const existingMorningRecord = records.find((r) => r.date === entry.date && r.session === "morning")
        const morningRecord = {
          date: entry.date,
          session: "morning" as const,
          duke_amount: existingMorningRecord?.duke_amount || 0,
          acarcia_amount: 0,
          home_amount: morningHomeAmount,
          recorded_by: user?.name || "Unknown",
          recorded_at: new Date().toISOString(),
        }
        promises.push(milkRecordsService.upsertByDateSession(morningRecord))
      }

      // Handle evening home entry if provided
      if (eveningHomeAmount > 0) {
        const existingEveningRecord = records.find((r) => r.date === entry.date && r.session === "evening")
        const eveningRecord = {
          date: entry.date,
          session: "evening" as const,
          duke_amount: 0,
          acarcia_amount: existingEveningRecord?.acarcia_amount || 0,
          home_amount: eveningHomeAmount,
          recorded_by: user?.name || "Unknown",
          recorded_at: new Date().toISOString(),
        }
        promises.push(milkRecordsService.upsertByDateSession(eveningRecord))
      }

      await Promise.all(promises)
      await loadAllData() // Refresh data

      setEntry((prev) => ({ ...prev, morningHomeAmount: "", eveningHomeAmount: "" }))
      setMessage("All home use entries recorded successfully!")
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("Error recording home entries:", error)
      setDataError("Failed to record home use entries")
      setTimeout(() => setDataError(""), 5000)
    } finally {
      setIsLoading(false)
    }
  }, [entry, user, records, loadAllData])

  // Handle price update
  const handlePriceUpdate = useCallback(async () => {
    const dukeMorningPrice = Number.parseFloat(newDukeMorningPrice || "0")

    if (isNaN(dukeMorningPrice)) {
      setMessage("Please enter a valid Duke morning price!")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    if (dukeMorningPrice < 0) {
      setMessage("Price cannot be negative!")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    if (!newPriceDate || new Date(newPriceDate) > new Date()) {
      setMessage("Please select a valid effective date!")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    setIsLoading(true)
    try {
      // Check if price already exists for this date
      const existingPrice = priceHistory.find(p => p.effective_date === newPriceDate)
      
      if (existingPrice) {
        // Update existing price instead of creating duplicate
        const updatedPriceEntry = {
          id: existingPrice.id,
          effective_date: newPriceDate,
          duke_morning_price: dukeMorningPrice,
          acarcia_price: existingPrice.acarcia_price || 45,
          changed_by: user?.name || "Owner",
          changed_at: new Date().toISOString(),
        }
        
        console.log("[v0] Updating existing price entry:", updatedPriceEntry)
        await priceHistoryService.update(updatedPriceEntry)
      } else {
        // Create new price entry
        const newPriceEntry = {
          effective_date: newPriceDate,
          duke_morning_price: dukeMorningPrice,
          acarcia_price: 45, // Set acarcia price to default
          changed_by: user?.name || "Owner",
          changed_at: new Date().toISOString(),
        }

        console.log("[v0] Creating new price entry:", newPriceEntry)
        await priceHistoryService.create(newPriceEntry)
      }
      
      // Update the dedicated Duke price state immediately
      setCurrentDukeMorningPrice(dukeMorningPrice)
      
      // Immediately update the price history state to show new price
      setPriceHistory(prev => {
        const updated = [...prev]
        const existingIndex = updated.findIndex(p => p.effective_date === newPriceDate)
        
        if (existingIndex >= 0) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            duke_morning_price: dukeMorningPrice,
            changed_by: user?.name || "Owner",
            changed_at: new Date().toISOString(),
          }
        } else {
          updated.push({
            effective_date: newPriceDate,
            duke_morning_price: dukeMorningPrice,
            acarcia_price: 45,
            changed_by: user?.name || "Owner",
            changed_at: new Date().toISOString(),
            id: `temp-${Date.now()}`, // Temporary ID for new entries
          })
        }
        
        return updated
      })
      
      await loadAllData() // Refresh data

      setNewDukeMorningPrice("")
      setNewPriceDate(new Date().toISOString().split("T")[0])
      setMessage(
        `Duke Morning price updated to ${dukeMorningPrice} KSh/L effective from ${new Date(
          newPriceDate,
        ).toLocaleDateString()}!`,
      )
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("[v0] Error updating prices - Full error details:", error)
      console.error("[v0] Error type:", typeof error)
      console.error("[v0] Error message:", error?.message)
      console.error("[v0] Error details:", JSON.stringify(error, null, 2))
      setDataError("Failed to update prices")
      console.error("Failed to update prices:", error)
      setTimeout(() => setDataError(""), 5000)
    } finally {
      setIsLoading(false)
    }
  }, [newDukeMorningPrice, newPriceDate, user, priceHistory, loadAllData])

  // Handle Acarcia pricing update
  const handleAcarciaPricingUpdate = useCallback(async () => {
    const price = Number.parseFloat(acarciaPrice || "0")

    if (!acarciaPrice || !acarciaEffectiveFrom || !acarciaEffectiveTo) {
      setMessage("Please fill in all Acarcia pricing fields!")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    if (isNaN(price) || price < 0) {
      setMessage("Please enter a valid price for Acarcia!")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    if (new Date(acarciaEffectiveFrom) > new Date(acarciaEffectiveTo)) {
      setMessage("Effective from date must be before effective to date!")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    setIsLoading(true)
    try {
      const monthYear = new Date(acarciaEffectiveFrom).toISOString().split("-").slice(0, 2).join("-")
      const newAcarciaPricing = {
        month_year: monthYear,
        price_per_liter: price,
        effective_from: acarciaEffectiveFrom,
        effective_to: acarciaEffectiveTo,
      }

      try {
        await acarciaPricingService.upsert(newAcarciaPricing)
      } catch (upsertError) {
        console.error("Upsert failed, trying insert instead:", upsertError)
        // Fallback: try to insert instead of upsert
        try {
          await acarciaPricingService.create(newAcarciaPricing)
        } catch (insertError) {
          console.error("Insert also failed:", insertError)
          throw insertError
        }
      }
      
      // Update dedicated Acarcia price state immediately
      setCurrentAcarciaPrice(price)
      
      // Immediately update acarcia pricing state to show new price
      setAcarciaPricing(prev => {
        const existingIndex = prev.findIndex(p => p.month_year === monthYear)
        if (existingIndex >= 0) {
          const updated = [...prev]
          updated[existingIndex] = {
            ...updated[existingIndex],
            month_year: monthYear,
            price_per_liter: price,
            effective_from: acarciaEffectiveFrom,
            effective_to: acarciaEffectiveTo,
            updated_at: new Date().toISOString(),
          }
          return updated
        } else {
          return [...prev, {
            id: Date.now().toString(),
            month_year: monthYear,
            price_per_liter: price,
            effective_from: acarciaEffectiveFrom,
            effective_to: acarciaEffectiveTo,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]
        }
      })
      
      await loadAllData() // Refresh data from server

      setAcarciaPrice("")
      setAcarciaEffectiveFrom("")
      setAcarciaEffectiveTo("")
      setMessage(
        `Acarcia pricing updated: ${price} KSh/L from ${new Date(acarciaEffectiveFrom).toLocaleDateString()} to ${new Date(
          acarciaEffectiveTo,
        ).toLocaleDateString()}!`,
      )
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("Error updating Acarcia pricing:", error)
      setDataError("Failed to update Acarcia pricing")
      setTimeout(() => setDataError(""), 5000)
    } finally {
      setIsLoading(false)
    }
  }, [acarciaPrice, acarciaEffectiveFrom, acarciaEffectiveTo, user, loadAllData])

  // Handle Acarcia payment calculation
  const handleAcarciaPaymentCalculation = useCallback(() => {
    const paymentAmount = Number.parseFloat(acarciaMonthlyPayment || "0")
    const selectedMonth = acarciaPaymentMonth

    if (!acarciaMonthlyPayment || !selectedMonth) {
      setMessage("Please fill in both payment amount and month!")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    if (isNaN(paymentAmount) || paymentAmount < 0) {
      setMessage("Please enter a valid payment amount!")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    // Calculate total Acarcia liters for the selected month
    const monthStart = new Date(selectedMonth + "-01")
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)
    
    const monthRecords = records.filter(record => {
      const recordDate = new Date(record.date)
      return record.session === "evening" && // Only Acarcia records
             recordDate >= monthStart && 
             recordDate <= monthEnd
    })

    // Debug: Log the records found
    console.log("Acarcia records for month:", monthRecords)
    console.log("Month range:", { start: monthStart, end: monthEnd })

    const totalLiters = monthRecords.reduce((sum, record) => sum + record.acarcia_amount, 0)
    
    // Debug: Log the calculation
    console.log("Calculation:", {
      paymentAmount,
      totalLiters,
      monthRecordsCount: monthRecords.length,
      calculation: `${paymentAmount} ÷ ${totalLiters} = ${paymentAmount / totalLiters}`
    })

    if (totalLiters === 0) {
      setMessage("No Acarcia milk records found for this month!")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    // Calculate price per liter
    const pricePerLiter = paymentAmount / totalLiters
    setCalculatedPricePerLiter(pricePerLiter)

    // Show detailed calculation breakdown
    setMessage(`Payment: ${paymentAmount.toFixed(2)} KSh ÷ ${totalLiters} liters = ${pricePerLiter.toFixed(2)} KSh per liter`)
    setTimeout(() => setMessage(""), 5000)
  }, [acarciaMonthlyPayment, acarciaPaymentMonth, records])

  // Memoized daily summaries - Extended to 3 months
  const dailySummaries = useMemo(() => {
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const dailyData: { [key: string]: DailySummary } = {}

    records
      .filter((record) => record && record.date && new Date(record.date) >= threeMonthsAgo)
      .forEach((record) => {
        if (!dailyData[record.date]) {
          const prices = getPricesForDate(record.date)
          const acarciaPrice = getAcarciaPriceForDate(record.date)
          dailyData[record.date] = {
            date: record.date,
            morningDuke: 0,
            eveningAcarcia: 0,
            morningHome: 0,
            eveningHome: 0,
            totalLiters: 0,
            totalLitersWithHome: 0,
            morningPrice: prices.dukeMorning || 50,
            eveningPrice: acarciaPrice,
            morningDukeRevenue: 0,
            eveningRevenue: 0,
            totalRevenue: 0,
            priceChanged: isPriceChangeDate(record.date),
          }
        }

        if (record.session === "morning") {
          const prices = getPricesForDate(record.date)
          dailyData[record.date].morningDuke = record.duke_amount ?? 0
          dailyData[record.date].morningHome = record.home_amount ?? 0
          dailyData[record.date].recordedBy = record.recorded_by
          dailyData[record.date].morningDukeRevenue = (record.duke_amount ?? 0) * (prices.dukeMorning || 50)
        } else {
          const acarciaPrice = getAcarciaPriceForDate(record.date)
          dailyData[record.date].eveningAcarcia = record.acarcia_amount ?? 0
          dailyData[record.date].eveningHome = record.home_amount ?? 0
          dailyData[record.date].eveningRevenue = (record.acarcia_amount ?? 0) * acarciaPrice
        }

        // Calculate totals (excluding home amounts for revenue)
        dailyData[record.date].totalLiters =
          (dailyData[record.date].morningDuke ?? 0) + (dailyData[record.date].eveningAcarcia ?? 0)

        // Calculate totals including home amounts for chart
        dailyData[record.date].totalLitersWithHome =
          (dailyData[record.date].morningDuke ?? 0) +
          (dailyData[record.date].eveningAcarcia ?? 0) +
          (dailyData[record.date].morningHome ?? 0) +
          (dailyData[record.date].eveningHome ?? 0)

        dailyData[record.date].totalRevenue =
          dailyData[record.date].morningDukeRevenue + dailyData[record.date].eveningRevenue
      })

    return Object.values(dailyData).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [records, getPricesForDate, getAcarciaPriceForDate, isPriceChangeDate])

  // Chart data for the graph - Extended to 40 days
  const chartData = useMemo(() => {
    const last40Days = dailySummaries.slice(0, 40).reverse()
    return last40Days.map((summary) => ({
      date: new Date(summary.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      Duke: summary.morningDuke,
      Acarcia: summary.eveningAcarcia,
      Home: summary.morningHome + summary.eveningHome,
      Total: summary.totalLitersWithHome,
    }))
  }, [dailySummaries])

  // Get current week/month totals
  const getCurrentWeekTotal = useCallback(() => {
    const now = new Date()
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    return records.reduce(
      (totals, record) => {
        if (!record || !record.date) return totals
        const recordDate = new Date(record.date)
        if (recordDate < weekStart || recordDate > weekEnd) return totals

        const prices = getPricesForDate(record.date)
        const acarciaPrice = getAcarciaPriceForDate(record.date)
        const totalLiters = record.session === "morning" ? (record.duke_amount ?? 0) : (record.acarcia_amount ?? 0)

        const totalLitersWithHome = totalLiters + (record.home_amount ?? 0)

        const revenue =
          record.session === "morning"
            ? (record.duke_amount ?? 0) * (prices.dukeMorning || 50)
            : (record.acarcia_amount ?? 0) * acarciaPrice

        return {
          total: totals.total + totalLiters,
          totalWithHome: totals.totalWithHome + totalLitersWithHome,
          morning: totals.morning + (record.session === "morning" ? (record.duke_amount ?? 0) : 0),
          evening: totals.evening + (record.session === "evening" ? (record.acarcia_amount ?? 0) : 0),
          home: totals.home + (record.home_amount ?? 0),
          revenue: totals.revenue + revenue,
        }
      },
      { total: 0, totalWithHome: 0, morning: 0, evening: 0, home: 0, revenue: 0 },
    )
  }, [records, getPricesForDate, getAcarciaPriceForDate])

  const getCurrentMonthTotal = useCallback(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    monthStart.setHours(0, 0, 0, 0)

    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    monthEnd.setHours(23, 59, 59, 999)

    return records.reduce(
      (totals, record) => {
        if (!record || !record.date) return totals
        const recordDate = new Date(record.date)
        if (recordDate < monthStart || recordDate > monthEnd) return totals

        const prices = getPricesForDate(record.date)
        const acarciaPrice = getAcarciaPriceForDate(record.date)
        const totalLiters = record.session === "morning" ? (record.duke_amount ?? 0) : (record.acarcia_amount ?? 0)

        const totalLitersWithHome = totalLiters + (record.home_amount ?? 0)

        const revenue =
          record.session === "morning"
            ? (record.duke_amount ?? 0) * (prices.dukeMorning || 50)
            : (record.acarcia_amount ?? 0) * acarciaPrice

        return {
          total: totals.total + totalLiters,
          totalWithHome: totals.totalWithHome + totalLitersWithHome,
          morning: totals.morning + (record.session === "morning" ? (record.duke_amount ?? 0) : 0),
          evening: totals.evening + (record.session === "evening" ? (record.acarcia_amount ?? 0) : 0),
          home: totals.home + (record.home_amount ?? 0),
          revenue: totals.revenue + revenue,
        }
      },
      { total: 0, totalWithHome: 0, morning: 0, evening: 0, home: 0, revenue: 0 },
    )
  }, [records, getPricesForDate, getAcarciaPriceForDate])

  // Get existing record
  const getExistingRecord = useCallback(
    (date: string, session: "morning" | "evening") => {
      return records.find((r) => r && r.date === date && r.session === session)
    },
    [records],
  )

  // Handle manual Duke payment
  const handleManualDukePayment = useCallback(async () => {
    const paymentAmount = Number.parseFloat(manualPaymentAmount || "0")
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      setMessage("Please enter a valid payment amount!")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    const currentDebt = getDukeCurrentDebt()
    if (paymentAmount > currentDebt.amount) {
      setMessage(
        `Payment amount (${paymentAmount.toFixed(0)} KSh) cannot exceed outstanding balance (${currentDebt.amount.toFixed(0)} KSh)!`,
      )
      setTimeout(() => setMessage(""), 3000)
      return
    }

    setIsLoading(true)
    try {
      const currentPrices = getCurrentPrices()
      const averagePrice =
        currentDebt.amount > 0 && currentDebt.liters > 0
          ? currentDebt.amount / currentDebt.liters
          : currentPrices.dukeMorning || 50

      const litersCovered = paymentAmount / averagePrice

      const newPayment = {
        payment_date: dukePaymentDate,
        amount: paymentAmount,
        liters: litersCovered,
        period_start: currentDebt.periodStart,
        period_end: dukePaymentDate,
        paid_by: user?.name || "Owner",
        paid_at: new Date().toISOString(),
        notes: dukePaymentNotes.trim() || undefined,
      }

      await dukePaymentsService.create(newPayment)
      await loadAllData() // Refresh data

      setManualPaymentAmount("")
      setDukePaymentNotes("")

      const remainingBalance = currentDebt.amount - paymentAmount
      setMessage(
        `✅ Payment recorded: ${paymentAmount.toFixed(0)} KSh on ${new Date(dukePaymentDate).toLocaleDateString()}. ` +
          `Remaining balance: ${remainingBalance.toFixed(0)} KSh. ` +
          `Covered ${litersCovered.toFixed(1)}L of milk records.`,
      )
      setTimeout(() => setMessage(""), 8000)
    } catch (error) {
      console.error("Error recording Duke payment:", error)
      setDataError("Failed to record Duke payment")
      setTimeout(() => setDataError(""), 5000)
    } finally {
      setIsLoading(false)
    }
  }, [manualPaymentAmount, dukePaymentDate, dukePaymentNotes, user, getDukeCurrentDebt, getCurrentPrices, loadAllData])

  // Export daily summaries as CSV (removed evening revenue)
  const exportDailySummaries = useCallback(() => {
    const headers = [
      "Date",
      "Morning Duke (L)",
      "Morning Home (L)",
      "Evening Acarcia (L)",
      "Evening Home (L)",
      "Total Liters (Sold)",
      "Total Liters (Including Home)",
      "Morning Price",
      "Evening Price",
      "Duke Revenue",
      "Total Revenue",
      "Recorded By",
    ]

    const rows = dailySummaries.map((summary) => [
      summary.date,
      summary.morningDuke.toFixed(1),
      summary.morningHome.toFixed(1),
      summary.eveningAcarcia.toFixed(1),
      summary.eveningHome.toFixed(1),
      summary.totalLiters.toFixed(1),
      summary.totalLitersWithHome.toFixed(1),
      summary.morningPrice,
      summary.eveningPrice,
      summary.morningDukeRevenue.toFixed(0),
      summary.totalRevenue.toFixed(0),
      summary.recordedBy || "",
    ])

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `milk_production_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [dailySummaries])

  const exportDukePayments = useCallback(() => {
    const headers = [
      "Payment Date",
      "Amount (KSh)",
      "Liters Covered",
      "Period Start",
      "Period End",
      "Recorded By",
      "Recorded At",
      "Notes",
    ]

    const rows = dukePayments
      .sort((a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime())
      .map((payment) => [
        payment.payment_date,
        payment.amount.toFixed(0),
        payment.liters.toFixed(1),
        payment.period_start,
        payment.period_end,
        payment.paid_by,
        new Date(payment.paid_at).toLocaleString(),
        payment.notes || "",
      ])

    const csv = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `duke_payments_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [dukePayments])

  // Toggle staff password visibility
  const toggleStaffPasswordVisibility = useCallback((username: string) => {
    setShowStaffPasswords((prev) => ({
      ...prev,
      [username]: !prev[username],
    }))
  }, [])

  // Manual refresh
  const handleRefresh = useCallback(async () => {
    await loadAllData()
    setMessage("Data refreshed successfully!")
    setTimeout(() => setMessage(""), 3000)
  }, [loadAllData])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-2 sm:p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center p-6 sm:p-8">
            <RefreshCw className="w-8 h-8 animate-spin text-green-600 mb-4" />
            <p className="text-lg font-medium text-center">Loading Milk Tracker...</p>
            <p className="text-sm text-gray-600 mt-2 text-center">Connecting to cloud database</p>
            <p className="text-xs text-gray-500 mt-4 text-center">If this takes too long, check your database connection</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-2 sm:p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Milk className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-xl mt-2">{"NJORANJIK FARM"}</CardTitle>
            <CardDescription className="space-y-2">
              <div className="flex items-center justify-center gap-2 mt-2">
                {isOnline ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Connected to cloud</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-600" />
                    <span className="text-red-600">Offline mode</span>
                  </>
                )}
              </div>
              <div className="mt-2 text-center">Secure login required to access the system</div>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <Button
                variant={loginMode === "staff" ? "default" : "outline"}
                onClick={() => {
                  setLoginMode("staff")
                  setLoginError("")
                }}
                className="flex-1"
              >
                <User className="w-4 h-4 mr-2" />
                <span className="truncate">Staff Login</span>
              </Button>
              <Button
                variant={loginMode === "vet" ? "default" : "outline"}
                onClick={() => {
                  setLoginMode("vet")
                  setLoginError("")
                }}
                className="flex-1"
              >
                <Stethoscope className="w-4 h-4 mr-2" />
                <span className="truncate">Vet Login</span>
              </Button>
              <Button
                variant={loginMode === "owner" ? "default" : "outline"}
                onClick={() => {
                  setLoginMode("owner")
                  setLoginError("")
                }}
                className="flex-1"
              >
                <User className="w-4 h-4 mr-2" />
                <span className="truncate">Owner Login</span>
              </Button>
            </div>
            
            {/* Staff Login Form */}
            {loginMode === "staff" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="staff-username">Staff Username</Label>
                  <Input
                    id="staff-username"
                    placeholder="Enter your staff username"
                    value={staffForm.username}
                    onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                    onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                    aria-label="Staff username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-password">Staff Password</Label>
                  <div className="relative">
                    <Input
                      id="staff-password"
                      type={showStaffPassword ? "text" : "password"}
                      placeholder="Enter your staff password"
                      value={staffForm.password}
                      onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                      onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                      aria-label="Staff password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowStaffPassword(!showStaffPassword)}
                      aria-label={showStaffPassword ? "Hide password" : "Show password"}
                    >
                      {showStaffPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Vet Login Form */}
            {loginMode === "vet" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vet-username">Vet Username</Label>
                  <Input
                    id="vet-username"
                    placeholder="Enter your vet username"
                    value={vetForm.username}
                    onChange={(e) => setVetForm({ ...vetForm, username: e.target.value })}
                    onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                    aria-label="Vet username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vet-password">Vet Password</Label>
                  <div className="relative">
                    <Input
                      id="vet-password"
                      type={showVetPassword ? "text" : "password"}
                      placeholder="Enter your vet password"
                      value={vetForm.password}
                      onChange={(e) => setVetForm({ ...vetForm, password: e.target.value })}
                      onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                      aria-label="Vet password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowVetPassword(!showVetPassword)}
                      aria-label={showVetPassword ? "Hide password" : "Show password"}
                    >
                      {showVetPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Owner Login Form */}
            {loginMode === "owner" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="owner-username">Owner Username</Label>
                  <Input
                    id="owner-username"
                    placeholder="Enter your owner username"
                    value={ownerForm.username}
                    onChange={(e) => setOwnerForm({ ...ownerForm, username: e.target.value })}
                    onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                    aria-label="Owner username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="owner-password">Owner Password</Label>
                  <div className="relative">
                    <Input
                      id="owner-password"
                      type={showOwnerPassword ? "text" : "password"}
                      placeholder="Enter your owner password"
                      value={ownerForm.password}
                      onChange={(e) => setOwnerForm({ ...ownerForm, password: e.target.value })}
                      onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                      aria-label="Owner password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                      aria-label={showOwnerPassword ? "Hide password" : "Show password"}
                    >
                      {showOwnerPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {loginError && (
              <Alert variant="destructive">
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleLogin}
              className="w-full"
              disabled={
                isLoading ||
                (loginMode === "staff"
                  ? !staffForm.username.trim() || !staffForm.password.trim()
                  : loginMode === "vet"
                  ? !vetForm.username.trim() || !vetForm.password.trim()
                  : !ownerForm.username.trim() || !ownerForm.password.trim())
              }
              aria-label={
                loginMode === "staff" 
                  ? "Login as staff" 
                  : loginMode === "vet"
                  ? "Login as vet"
                  : "Login as owner"
              }
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  {loginMode === "staff" 
                    ? "Login as Staff" 
                    : loginMode === "vet"
                    ? "Login as Vet"
                    : "Login as Owner"
                  }
                </>
              )}
            </Button>

            {/* Show branding only on owner login */}
            {loginMode === "owner" && (
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-lg font-semibold text-gray-700">BLESSED FAMILY</p>
                <p className="text-sm text-gray-500">by Norman Kimani</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentWeekTotal = getCurrentWeekTotal()
  const currentMonthTotal = getCurrentMonthTotal()
  const currentPrices = getCurrentPrices()
  const dukeCurrentDebt = getDukeCurrentDebt()
  const recentDates = getRecentDates()

  // Role-based routing
  if (user?.role === "vet") {
    return <VetDashboard user={user} onLogout={handleLogout} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Milk className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{"NJORANJIK FARM"}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <p className="text-gray-600">Welcome back, {user.name}</p>
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <>
                      <Wifi className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-green-600">Cloud Connected</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-red-600" />
                      <span className="text-xs text-red-600">Offline</span>
                    </>
                  )}
                  {lastSync && (
                    <span className="text-xs text-gray-500">Last sync: {lastSync.toLocaleTimeString()}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Badge variant={user.role === "owner" ? "default" : "secondary"}>
              {user.role === "owner" ? "Owner" : "Staff"}
            </Badge>
            <Button variant="outline" onClick={handleLogout} aria-label="Logout">
              Logout
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {(message || dataError) && (
          <Alert variant={dataError ? "destructive" : "default"}>
            <AlertDescription>{message || dataError}</AlertDescription>
          </Alert>
        )}

        {/* Summary Cards - Show above tabs for owners only */}
        {user.role === "owner" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Prices</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-3 h-3 text-yellow-600" />
                      <Sun className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs font-medium text-yellow-700">Duke Morning</span>
                    </div>
                    <span className="text-sm font-bold text-yellow-800">{currentPrices.dukeMorning} KSh/L</span>
                  </div>
                  <div className="p-2 bg-blue-50 rounded border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-3 h-3 text-blue-600" />
                      <Moon className="w-3 h-3 text-blue-500" />
                      <span className="text-xs font-medium text-blue-700">Acarcia Last Price</span>
                    </div>
                    <span className="text-sm font-bold text-blue-800">{currentAcarciaPrice} KSh/L</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentWeekTotal.total.toFixed(1)}L</div>
                <div className="text-xs text-blue-600 font-medium mt-1">Weekly Total Milk</div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>🌅 {currentWeekTotal.morning.toFixed(1)}L</span>
                  <span>🌙 {currentWeekTotal.evening.toFixed(1)}L</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>🏠 {currentWeekTotal.home.toFixed(1)}L</span>
                  <span>📊 {currentWeekTotal.totalWithHome.toFixed(1)}L Total</span>
                </div>
                <p className="text-xs text-green-600 font-medium mt-1">{currentWeekTotal.revenue.toFixed(0)} KSh</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentMonthTotal.total.toFixed(1)}L</div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>🌅 {currentMonthTotal.morning.toFixed(1)}L</span>
                  <span>🌙 {currentMonthTotal.evening.toFixed(1)}L</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>🏠 {currentMonthTotal.home.toFixed(1)}L</span>
                  <span>📊 {currentMonthTotal.totalWithHome.toFixed(1)}L Total</span>
                </div>
                <p className="text-xs text-green-600 font-medium mt-1">{currentMonthTotal.revenue.toFixed(0)} KSh</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Duke Owes</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{dukeCurrentDebt.amount.toFixed(0)} KSh</div>
                <div className="text-xs text-muted-foreground mt-1">{dukeCurrentDebt.liters.toFixed(1)}L unpaid</div>
                <div className="text-xs text-gray-500 mt-1">
                  Total owed: {dukeCurrentDebt.totalOwed.toFixed(0)} KSh | Paid: {dukeCurrentDebt.totalPaid.toFixed(0)}{" "}
                  KSh
                </div>
                {dukeCurrentDebt.amount > 0 && <p className="text-xs text-orange-600 font-medium mt-1">Payment Due</p>}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-4">
          {/* Navigation */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <Button
                variant={activeTab === "daily-entry" ? "default" : "outline"}
                onClick={() => setActiveTab("daily-entry")}
                size="sm"
              >
                Daily Entry
              </Button>
              <Button
                variant={activeTab === "analytics" ? "default" : "outline"}
                onClick={() => setActiveTab("analytics")}
                size="sm"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
              <Button
                variant={activeTab === "records" ? "default" : "outline"}
                onClick={() => setActiveTab("records")}
                size="sm"
              >
                Records
              </Button>
              {user.role === "owner" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Menu className="w-4 h-4 mr-2" />
                      More
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setActiveTab("duke-payments")}>Duke Payments</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab("acarcia-monthly")}>Acarcia Monthly</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab("settings")}>Settings</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab("credentials")}>Credentials</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab("notepad")}>Notepad</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "daily-entry" && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
              {/* Morning Production - Duke Only */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sun className="w-5 h-5 text-yellow-500" />
                    Morning Production
                  </CardTitle>
                  <CardDescription>Record Duke's morning milk production</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="morning-date">Date</Label>
                    <Select value={entry.date} onValueChange={(value) => handleEntryChange("date", value)}>
                      <SelectTrigger id="morning-date">
                        <SelectValue placeholder="Select date (past 3 months)" />
                      </SelectTrigger>
                      <SelectContent>
                        {recentDates.filter(date => date && date.trim() !== "").map((date) => (
                          <SelectItem key={date} value={date}>
                            {date}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duke-amount">{"Duke's Amount (L)"}</Label>
                    <Input
                      id="duke-amount"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0.0"
                      value={entry.dukeAmount}
                      onChange={(e) => handleEntryChange("dukeAmount", e.target.value)}
                    />
                  </div>

                  {(() => {
                    const existingRecord = getExistingRecord(entry.date, "morning")
                    if (existingRecord) {
                      return (
                        <div className="p-3 bg-yellow-100 rounded-lg border border-yellow-300">
                          <p className="text-sm text-yellow-800">
                            <strong>Existing morning record:</strong>
                          </p>
                          <p className="text-sm text-yellow-800">
                            Duke: {existingRecord.duke_amount.toFixed(1)}L | Home:{" "}
                            {existingRecord.home_amount.toFixed(1)}L
                          </p>
                          <p className="text-xs text-yellow-700">
                            Recorded by {existingRecord.recorded_by} at{" "}
                            {new Date(existingRecord.recorded_at).toLocaleString()}
                          </p>
                        </div>
                      )
                    }
                    return null
                  })()}

                  <Button onClick={handleMorningEntry} className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Recording...
                      </>
                    ) : (
                      "Record Duke's Morning Production"
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Evening Production - Acarcia Only */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Moon className="w-5 h-5 text-blue-500" />
                    Evening Production
                  </CardTitle>
                  <CardDescription>Record Acarcia's evening milk production</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="evening-date">Date</Label>
                    <Select value={entry.date} onValueChange={(value) => handleEntryChange("date", value)}>
                      <SelectTrigger id="evening-date">
                        <SelectValue placeholder="Select date (past 3 months)" />
                      </SelectTrigger>
                      <SelectContent>
                        {recentDates.filter(date => date && date.trim() !== "").map((date) => (
                          <SelectItem key={date} value={date}>
                            {date}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="evening-amount">{"Acarcia's Evening Amount (L)"}</Label>
                    <Input
                      id="evening-amount"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0.0"
                      value={entry.eveningAmount}
                      onChange={(e) => handleEntryChange("eveningAmount", e.target.value)}
                    />
                  </div>

                  {(() => {
                    const existingRecord = getExistingRecord(entry.date, "evening")
                    if (existingRecord) {
                      return (
                        <div className="p-3 bg-blue-100 rounded-lg border border-blue-300">
                          <p className="text-sm text-blue-800">
                            <strong>Existing evening record:</strong> Acarcia:{" "}
                            {existingRecord.acarcia_amount.toFixed(1)}L | Home: {existingRecord.home_amount.toFixed(1)}L
                          </p>
                          <p className="text-xs text-blue-700">
                            Recorded by {existingRecord.recorded_by} at{" "}
                            {new Date(existingRecord.recorded_at).toLocaleString()}
                          </p>
                        </div>
                      )
                    }
                    return null
                  })()}

                  <Button onClick={handleEveningEntry} className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Recording...
                      </>
                    ) : (
                      "Record Acarcia's Evening Production"
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Home Use - Separate Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="w-5 h-5 text-green-500" />
                    Home Use
                  </CardTitle>
                  <CardDescription>Record milk kept for home consumption</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="home-date">Date</Label>
                    <Select value={entry.date} onValueChange={(value) => handleEntryChange("date", value)}>
                      <SelectTrigger id="home-date">
                        <SelectValue placeholder="Select date (past 3 months)" />
                      </SelectTrigger>
                      <SelectContent>
                        {recentDates.filter(date => date && date.trim() !== "").map((date) => (
                          <SelectItem key={date} value={date}>
                            {date}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="morning-home-amount" className="flex items-center gap-1">
                        <Sun className="w-3 h-3 text-yellow-500" />
                        Morning Home Amount (L)
                      </Label>
                      <Input
                        id="morning-home-amount"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="0.0"
                        value={entry.morningHomeAmount}
                        onChange={(e) => handleEntryChange("morningHomeAmount", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="evening-home-amount" className="flex items-center gap-1">
                        <Moon className="w-3 h-3 text-blue-500" />
                        Evening Home Amount (L)
                      </Label>
                      <Input
                        id="evening-home-amount"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="0.0"
                        value={entry.eveningHomeAmount}
                        onChange={(e) => handleEntryChange("eveningHomeAmount", e.target.value)}
                      />
                    </div>
                  </div>

                  {(() => {
                    const morningRecord = getExistingRecord(entry.date, "morning")
                    const eveningRecord = getExistingRecord(entry.date, "evening")
                    if (morningRecord?.home_amount > 0 || eveningRecord?.home_amount > 0) {
                      return (
                        <div className="p-3 bg-green-100 rounded-lg border border-green-300">
                          <p className="text-sm text-green-800">
                            <strong>Existing home records:</strong>
                          </p>
                          {morningRecord?.home_amount > 0 && (
                            <p className="text-sm text-green-800">Morning: {morningRecord.home_amount.toFixed(1)}L</p>
                          )}
                          {eveningRecord?.home_amount > 0 && (
                            <p className="text-sm text-green-800">Evening: {eveningRecord.home_amount.toFixed(1)}L</p>
                          )}
                        </div>
                      )
                    }
                    return null
                  })()}

                  {/* Single submission button */}
                  <Button onClick={handleAllHomeEntries} className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Recording...
                      </>
                    ) : (
                      "Record Home Use"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "analytics" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Milk Production Analytics
                </CardTitle>
                <CardDescription>Last 40 days production trends including home consumption</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 sm:h-80 lg:h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                      <YAxis label={{ value: "Liters", angle: -90, position: "insideLeft" }} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="Duke" stroke="#f59e0b" strokeWidth={2} />
                      <Line type="monotone" dataKey="Acarcia" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="Home" stroke="#10b981" strokeWidth={2} />
                      <Line type="monotone" dataKey="Total" stroke="#6366f1" strokeWidth={3} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "records" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <span>Recent Daily Summaries</span>
                  {user.role === "owner" && (
                    <Button variant="outline" onClick={exportDailySummaries} size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  )}
                </CardTitle>
                <CardDescription>All records from the past 3 months - Real-time cloud sync</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dailySummaries.map((summary) => (
                    <div
                      key={summary.date}
                      className={`p-4 rounded-lg border ${summary.priceChanged ? "bg-orange-50 border-orange-200" : "bg-gray-50 border-gray-200"}`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{new Date(summary.date).toLocaleDateString()}</p>
                            {summary.priceChanged && (
                              <Badge variant="secondary" className="text-xs">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Price Changed
                              </Badge>
                            )}
                          </div>
                          <p className="text-lg font-bold text-green-600">{summary.totalLiters.toFixed(1)}L Sold</p>
                          <p className="text-sm text-gray-600">
                            {summary.totalLitersWithHome.toFixed(1)}L Total (incl. Home)
                          </p>
                        </div>
                        {user.role === "owner" && (
                          <div className="text-left sm:text-right">
                            <p className="text-lg font-bold text-green-600">{summary.totalRevenue.toFixed(0)} KSh</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        {summary.morningDuke > 0 && (
                          <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
                            <div className="flex items-center gap-1 mb-1">
                              <Sun className="w-3 h-3 text-yellow-500" />
                              <span className="font-medium">Duke Morning</span>
                            </div>
                            <p className="text-lg font-bold text-yellow-700">{summary.morningDuke.toFixed(1)}L</p>
                            {user.role === "owner" && (
                              <p className="text-xs text-yellow-600">{summary.morningDukeRevenue.toFixed(0)} KSh</p>
                            )}
                          </div>
                        )}

                        {summary.eveningAcarcia > 0 && (
                          <div className="p-2 bg-blue-50 rounded border border-blue-200">
                            <div className="flex items-center gap-1 mb-1">
                              <Moon className="w-3 h-3 text-blue-500" />
                              <span className="font-medium">Acarcia Evening</span>
                            </div>
                            <p className="text-lg font-bold text-blue-700">{summary.eveningAcarcia.toFixed(1)}L</p>
                          </div>
                        )}

                        {(summary.morningHome > 0 || summary.eveningHome > 0) && (
                          <div className="p-2 bg-gray-50 rounded border border-gray-200">
                            <div className="flex items-center gap-1 mb-1">
                              <Home className="w-3 h-3 text-gray-500" />
                              <span className="font-medium">Home Use</span>
                            </div>
                            <p className="text-lg font-bold text-gray-700">
                              {(summary.morningHome + summary.eveningHome).toFixed(1)}L
                            </p>
                            <p className="text-xs text-gray-600">No revenue</p>
                          </div>
                        )}
                      </div>

                      {summary.recordedBy && (
                        <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                          Recorded by: {summary.recordedBy}
                        </p>
                      )}
                    </div>
                  ))}

                  {dailySummaries.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      No records in the last 3 months. Add your first entry above!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Staff view - simplified without weekly/monthly summary cards */}
          {user.role === "staff" && activeTab === "daily-entry" && (
            <div className="mt-6">
            </div>
          )}

          {user.role === "owner" && activeTab === "duke-payments" && (
            <div className="space-y-6">
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700">
                    <User className="w-5 h-5" />
                    {"Duke's Outstanding Balance"}
                  </CardTitle>
                  <CardDescription>Current amount due for morning milk deliveries</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-orange-600">{dukeCurrentDebt.amount.toFixed(0)} KSh</p>
                      <p className="text-sm text-gray-600">Outstanding Balance</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-600">{dukeCurrentDebt.liters.toFixed(1)} L</p>
                      <p className="text-sm text-gray-600">Unpaid Liters</p>
                    </div>
                  </div>

                  {dukeCurrentDebt.amount > 0 && (
                    <div className="mb-4 p-3 bg-orange-100 rounded-lg border border-orange-200">
                      <p className="text-sm text-orange-800">
                        <strong>Last Payment:</strong>{" "}
                        {dukePayments.length > 0
                          ? new Date(
                              dukePayments.sort(
                                (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime(),
                              )[0].payment_date,
                            ).toLocaleDateString()
                          : "No payments yet"}
                      </p>
                      <p className="text-sm text-orange-800 mt-1">
                        <strong>Total Records:</strong> {dukeCurrentDebt.records.length} milk deliveries
                      </p>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-4">Record Payment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label htmlFor="manual-payment-amount">Payment Amount (KSh)</Label>
                        <Input
                          id="manual-payment-amount"
                          type="number"
                          step="0.01"
                          min="0"
                          max={dukeCurrentDebt.amount > 0 ? dukeCurrentDebt.amount : undefined}
                          placeholder={
                            dukeCurrentDebt.amount > 0 ? `Max: ${dukeCurrentDebt.amount.toFixed(0)} KSh` : "0 KSh"
                          }
                          value={manualPaymentAmount}
                          onChange={(e) => setManualPaymentAmount(e.target.value)}
                        />
                        {manualPaymentAmount && Number.parseFloat(manualPaymentAmount) > 0 && (
                          <p className="text-xs text-gray-600 mt-1">
                            Remaining after payment:{" "}
                            {Math.max(0, dukeCurrentDebt.amount - Number.parseFloat(manualPaymentAmount)).toFixed(0)}{" "}
                            KSh
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="duke-payment-date">Payment Date</Label>
                        <Select value={dukePaymentDate} onValueChange={setDukePaymentDate}>
                          <SelectTrigger id="duke-payment-date">
                            <SelectValue placeholder="Select date (past 3 months)" />
                          </SelectTrigger>
                          <SelectContent>
                            {recentDates.map((date) => (
                              <SelectItem key={date} value={date}>
                                {date}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="mb-4">
                      <Label htmlFor="duke-payment-notes">Payment Notes (Optional)</Label>
                      <Input
                        id="duke-payment-notes"
                        placeholder="Add notes about this payment..."
                        value={dukePaymentNotes}
                        onChange={(e) => setDukePaymentNotes(e.target.value)}
                      />
                    </div>

                    <Button
                      onClick={handleManualDukePayment}
                      disabled={
                        isLoading ||
                        !manualPaymentAmount ||
                        Number.parseFloat(manualPaymentAmount) <= 0 ||
                        Number.parseFloat(manualPaymentAmount) > dukeCurrentDebt.amount
                      }
                      className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Recording...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Record Payment of{" "}
                          {manualPaymentAmount ? Number.parseFloat(manualPaymentAmount).toFixed(0) : "0"} KSh
                        </>
                      )}
                    </Button>
                  </div>

                  {dukeCurrentDebt.amount === 0 && (
                    <div className="text-center py-4">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                      <p className="text-green-600 font-medium">Duke is all paid up!</p>
                      <p className="text-sm text-gray-600">No outstanding balance</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <History className="w-5 h-5" />
                      {"Duke's Payment History"}
                    </div>
                    <Button variant="outline" onClick={exportDukePayments} size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </CardTitle>
                  <CardDescription>All payments made by Duke with running balance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dukePayments
                      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                      .map((payment, index) => {
                        return (
                          <div key={payment.id} className="p-4 border rounded-lg bg-green-50">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
                              <div>
                                <p className="font-medium text-lg">Payment #{dukePayments.length - index}</p>
                                <p className="text-sm text-gray-600">
                                  Paid on {new Date(payment.payment_date).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Recorded on {new Date(payment.paid_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-left sm:text-right">
                                <p className="text-2xl font-bold text-green-600">{payment.amount.toFixed(0)} KSh</p>
                                <p className="text-sm text-gray-600">{payment.liters.toFixed(1)} liters covered</p>
                              </div>
                            </div>

                            {payment.notes && (
                              <div className="mb-2 p-2 bg-blue-50 rounded border-l-4 border-blue-200">
                                <p className="text-sm text-blue-800">
                                  <strong>Notes:</strong> {payment.notes}
                                </p>
                              </div>
                            )}

                            <div className="text-xs text-gray-500 pt-2 border-t border-green-200">
                              <p>
                                Recorded by {payment.paid_by} • Period:{" "}
                                {new Date(payment.period_start).toLocaleDateString()} to{" "}
                                {new Date(payment.period_end).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        )
                      })}

                    {dukePayments.length === 0 && (
                      <p className="text-center text-gray-500 py-8">No payment history yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {user.role === "owner" && activeTab === "acarcia-monthly" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  {"Acarcia's Monthly Summary"}
                </CardTitle>
                <CardDescription>{"Monthly totals for Acarcia's evening milk - Real-time cloud sync"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    const monthlyData: { [key: string]: { evening: number; revenue: number } } = {}

                    records.forEach((record) => {
                      if (!record || !record.date) return
                      const date = new Date(record.date)
                      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

                      if (!monthlyData[monthKey]) {
                        monthlyData[monthKey] = { evening: 0, revenue: 0 }
                      }

                      if (record.session === "evening") {
                        const acarciaPrice = getAcarciaPriceForDate(record.date)
                        monthlyData[monthKey].evening += record.acarcia_amount ?? 0
                        monthlyData[monthKey].revenue += (record.acarcia_amount ?? 0) * acarciaPrice
                      }
                    })

                    return Object.entries(monthlyData)
                      .map(([month, data]) => ({
                        month: new Date(month + "-01").toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                        }),
                        monthKey: month,
                        evening: data.evening,
                        total: data.evening,
                        revenue: data.revenue,
                        isPaid: getPaymentStatusValue(month, "monthly", "Acarcia"),
                      }))
                      .sort((a, b) => new Date(b.monthKey + "-01").getTime() - new Date(a.monthKey + "-01").getTime())
                      .slice(0, 12)
                      .map((month, index) => (
                        <div key={index} className="p-4 border rounded-lg bg-blue-50">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
                            <div>
                              <p className="font-medium text-lg">{month.month}</p>
                              <p className="text-xl font-bold text-blue-600">{month.total.toFixed(1)} liters</p>
                            </div>
                            <div className="text-left sm:text-right space-y-2">
                              <p className="text-3xl font-bold text-blue-600">{month.revenue.toFixed(0)} KSh</p>
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`acarcia-month-${month.monthKey}`}
                                  checked={month.isPaid}
                                  onCheckedChange={() => togglePaymentStatus(month.monthKey, "monthly", "Acarcia")}
                                  disabled={isLoading}
                                />
                                <Label htmlFor={`acarcia-month-${month.monthKey}`} className="text-sm">
                                  {month.isPaid ? (
                                    <span className="text-green-600 flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3" />
                                      Acarcia Paid
                                    </span>
                                  ) : (
                                    "Mark Acarcia Paid"
                                  )}
                                </Label>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                  })()}
                </div>
              </CardContent>
            </Card>
          )}

          {user.role === "owner" && activeTab === "settings" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Duke Morning Pricing</CardTitle>
                  <CardDescription>
                    Set Duke morning price with custom effective date range
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duke-morning-price">Duke Morning Price (KSh/L)</Label>
                      <Input
                        id="duke-morning-price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={newDukeMorningPrice}
                        onChange={(e) => setNewDukeMorningPrice(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duke-effective-from">Effective From</Label>
                      <Input
                        id="duke-effective-from"
                        type="date"
                        value={newPriceDate}
                        onChange={(e) => setNewPriceDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duke-effective-to">Effective To</Label>
                      <Input
                        id="duke-effective-to"
                        type="date"
                        placeholder="Optional - Leave empty for ongoing"
                      />
                    </div>
                  </div>


                  <Button
                    onClick={handlePriceUpdate}
                    disabled={isLoading || !newDukeMorningPrice || !newPriceDate}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Set Duke Morning Price"
                    )}
                  </Button>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Current prices:{" "}
                      <span className="font-medium">Duke Morning {currentPrices.dukeMorning} KSh/L</span>,{" "}
                      <span className="font-medium">Acarcia Last Price {currentAcarciaPrice} KSh/L</span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Acarcia Monthly Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle>Acarcia Monthly Pricing</CardTitle>
                  <CardDescription>
                    Set specific prices for Acarcia with custom date ranges - Prices vary by time period
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="acarcia-price">Price per Liter (KSh)</Label>
                      <Input
                        id="acarcia-price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={acarciaPrice}
                        onChange={(e) => setAcarciaPrice(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="acarcia-effective-from">Effective From</Label>
                      <Input
                        id="acarcia-effective-from"
                        type="date"
                        value={acarciaEffectiveFrom}
                        onChange={(e) => setAcarciaEffectiveFrom(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="acarcia-effective-to">Effective To</Label>
                      <Input
                        id="acarcia-effective-to"
                        type="date"
                        value={acarciaEffectiveTo}
                        onChange={(e) => setAcarciaEffectiveTo(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleAcarciaPricingUpdate}
                    disabled={isLoading || !acarciaPrice || !acarciaEffectiveFrom || !acarciaEffectiveTo}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Set Acarcia Monthly Price"
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Acarcia Payment Calculator */}
              <Card>
                <CardHeader>
                  <CardTitle>Acarcia Payment Calculator</CardTitle>
                  <CardDescription>
                    Calculate amount paid per liter by entering total monthly payment and selecting the month
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Input Fields */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="acarcia-payment">Total Monthly Payment (KSh)</Label>
                          <Input
                            id="acarcia-payment"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={acarciaMonthlyPayment}
                            onChange={(e) => setAcarciaMonthlyPayment(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="acarcia-payment-month">Month</Label>
                          <Input
                            id="acarcia-payment-month"
                            type="month"
                            value={acarciaPaymentMonth}
                            onChange={(e) => setAcarciaPaymentMonth(e.target.value)}
                          />
                        </div>
                      </div>

                      <Button
                        onClick={handleAcarciaPaymentCalculation}
                        disabled={isLoading || !acarciaMonthlyPayment || !acarciaPaymentMonth}
                        className="w-full sm:w-auto px-6 py-2 h-10 text-sm sm:text-base transition-all duration-200 hover:scale-105 active:scale-95"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Calculating...
                          </>
                        ) : (
                          <>
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Calculate Price Per Liter
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Result Display on Right Side */}
                    <div className="lg:col-span-1">
                      {calculatedPricePerLiter !== null ? (
                        <div className="p-4 sm:p-6 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl shadow-lg">
                          <div className="text-center">
                            <div className="text-2xl sm:text-3xl font-bold text-green-800 mb-2">
                              {calculatedPricePerLiter.toFixed(2)}
                            </div>
                            <div className="text-sm sm:text-base text-green-600 font-medium">
                              KSh per liter
                            </div>
                            <div className="text-xs text-green-500 mt-1">
                              Amount paid per liter
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 sm:p-6 bg-gray-50 border-2 border-gray-200 rounded-xl">
                          <div className="text-center">
                            <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <div className="text-sm text-gray-500">
                              Result will appear here
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Price History</CardTitle>
                  <CardDescription>View all price changes and their effective dates </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {priceHistory
                      .sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime())
                      .slice(0, 5) // Show only first 5 records
                      .map((price) => (
                        <div key={price.id} className="p-3 bg-gray-50 rounded-lg border">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-1">
                                <div className="flex items-center gap-1">
                                  <Sun className="w-3 h-3 text-yellow-500" />
                                  <span className="font-medium">Duke: {price.duke_morning_price} KSh/L</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3 text-green-500" />
                                  <span className="font-medium">Acarcia: {price.acarcia_price} KSh/L</span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600">
                                Effective from {new Date(price.effective_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-left sm:text-right text-sm text-gray-500">
                              <p>Changed by {price.changed_by}</p>
                              <p>{new Date(price.changed_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    {/* Duke's Payment History Sub-card - Show first 5 records */}

                    {/* Acarcia Pricing History Sub-card - Show first 5 records */}
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">Acarcia Pricing History (First 5 Records)</h4>
                      <div className="space-y-3">
                        {acarciaPricing.length > 0 ? (
                          acarciaPricing
                            .sort((a, b) => new Date(a.effective_from).getTime() - new Date(b.effective_from).getTime())
                            .slice(0, 5) // Show only first 5 records
                            .map((pricing, index) => {
                              const previousPricing = acarciaPricing
                                .filter((p) => new Date(p.effective_from) < new Date(pricing.effective_from))
                                .sort(
                                  (a, b) => new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime(),
                                )[0]

                              return (
                                <div key={pricing.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                    <div>
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="outline" className="text-xs">
                                          Record #{index + 1}
                                        </Badge>
                                        <span className="text-lg font-bold text-blue-600">
                                          {pricing.price_per_liter} KSh/L
                                        </span>
                                        {previousPricing && (
                                          <span className="text-sm text-gray-600">
                                            (was {previousPricing.price_per_liter} KSh/L)
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm text-blue-800 font-medium">
                                        Effective: {new Date(pricing.effective_from).toLocaleDateString()} -{" "}
                                        {new Date(pricing.effective_to).toLocaleDateString()}
                                      </p>
                                      <p className="text-xs text-gray-600 mt-1">
                                        Price calculations apply only during this period
                                      </p>
                                    </div>
                                    <div className="text-left sm:text-right">
                                      <p className="text-xs text-gray-500">by {pricing.created_by}</p>
                                      <p className="text-xs text-gray-500">
                                        {new Date(pricing.created_at).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )
                            })
                        ) : (
                          <p className="text-center text-gray-500 py-4">No Acarcia pricing history yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                  <CardDescription>Cloud database statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Total Records:</p>
                      <p className="font-medium">{records.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Price Changes:</p>
                      <p className="font-medium">{priceHistory.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Duke Payments:</p>
                      <p className="font-medium">{dukePayments.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Acarcia Paid Periods:</p>
                      <p className="font-medium">
                        {paymentStatus.filter((p) => p.is_paid && p.recipient === "Acarcia").length}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Cloud Database Connected</span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      All data is automatically synced across all devices in real-time
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {user.role === "owner" && activeTab === "notepad" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Personal Notepad
                </CardTitle>
                <CardDescription>
                  Write and format your personal notes 
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Rich Text Editor */}
                <div className="space-y-4">
                  {/* Note Title Input */}
                  <div className="space-y-2">
                    <Label htmlFor="note-title">Note Title</Label>
                    <Input
                      id="note-title"
                      placeholder="Enter note title (optional)"
                      value={currentNoteTitle}
                      onChange={(e) => setCurrentNoteTitle(e.target.value)}
                    />
                  </div>

                  {/* Formatting Toolbar */}
                  <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 rounded-lg border">
                    <Button variant="outline" size="sm" onClick={() => formatText("bold")} title="Bold">
                      <Bold className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => formatText("italic")} title="Italic">
                      <Italic className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => formatText("underline")} title="Underline">
                      <Underline className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => formatText("hiliteColor", "#ffff00")}
                      title="Highlight"
                    >
                      <Highlighter className="w-4 h-4" />
                    </Button>
                    <div className="flex-1" />
                    {editingNoteId ? (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={updateNote} title="Update Note">
                          <Save className="w-4 h-4 mr-2" />
                          Update Note
                        </Button>
                        <Button variant="outline" size="sm" onClick={cancelEdit} title="Cancel Edit">
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" onClick={addNewNote} title="Save Note">
                        <Save className="w-4 h-4 mr-2" />
                        Save Note
                      </Button>
                    )}
                  </div>

                  {/* Rich Text Editor */}
                  <div className="space-y-2">
                    <Label htmlFor="rich-editor">{editingNoteId ? "Edit Your Note" : "Write Your Note"}</Label>
                    <div
                      ref={editorRef}
                      contentEditable
                      className="min-h-[200px] p-4 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{
                        fontSize: "14px",
                        lineHeight: "1.5",
                      }}
                      onInput={handleEditorChange}
                      suppressContentEditableWarning={true}
                      placeholder="Start writing your note here... Use the toolbar above to format your text."
                    />
                  </div>
                </div>

                {/* Notes List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Your Notes ({notes.length})</h4>
                    <div className="text-xs text-gray-500">Sorted by newest first </div>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {notes.length > 0 ? (
                      notes.map((note) => (
                        <div key={note.id} className="p-4 bg-gray-50 rounded-lg border">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 mb-1">{note.title}</h5>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>Created: {new Date(note.created_at).toLocaleString()}</span>
                                {note.is_edited && (
                                  <>
                                    <span>•</span>
                                    <span className="text-blue-600 font-medium">
                                      Edited: {new Date(note.updated_at).toLocaleString()}
                                    </span>
                                  </>
                                )}
                                <span>•</span>
                                <span>by {note.created_by}</span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => editNote(note)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteConfirmId(note.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: note.content }}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No notes yet. Write your first note above!</p>
                      </div>
                    )}
                  </div>
                </div>

              </CardContent>
            </Card>
          )}

          {user.role === "owner" && activeTab === "credentials" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Owner Credentials
                  </CardTitle>
                  <CardDescription>Update owner login credentials - Changes sync instantly</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-owner-username">New Username</Label>
                      <Input
                        id="new-owner-username"
                        placeholder="Enter new username"
                        value={newOwnerUsername}
                        onChange={(e) => setNewOwnerUsername(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-owner-password">New Password</Label>
                      <div className="relative">
                        <Input
                          id="new-owner-password"
                          type={showNewOwnerPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          value={newOwnerPassword}
                          onChange={(e) => setNewOwnerPassword(e.target.value)}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewOwnerPassword(!showNewOwnerPassword)}
                          aria-label={showNewOwnerPassword ? "Hide password" : "Show password"}
                        >
                          {showNewOwnerPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleUpdateOwnerCredentials} className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Owner Credentials"
                    )}
                  </Button>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Current Owner Username:</strong> {systemCredentials?.owner_username}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Staff Credentials
                  </CardTitle>
                  <CardDescription>Manage staff login credentials </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-staff-username">Staff Username</Label>
                      <Input
                        id="new-staff-username"
                        placeholder="Enter staff username"
                        value={newStaffUsername}
                        onChange={(e) => setNewStaffUsername(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-staff-password">Staff Password</Label>
                      <div className="relative">
                        <Input
                          id="new-staff-password"
                          type={showNewStaffPassword ? "text" : "password"}
                          placeholder="Enter staff password"
                          value={newStaffPassword}
                          onChange={(e) => setNewStaffPassword(e.target.value)}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewStaffPassword(!showNewStaffPassword)}
                          aria-label={showNewStaffPassword ? "Hide password" : "Show password"}
                        >
                          {showNewStaffPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleAddStaffCredentials} className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          "Add Staff"
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Current Staff Members</h4>
                    {staffCredentials.map((staff, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{staff.username}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-gray-600">
                              Password:{" "}
                              {showStaffPasswords[staff.username] ? staff.password : "*".repeat(staff.password.length)}
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleStaffPasswordVisibility(staff.username)}
                              className="h-6 w-6 p-0"
                              aria-label={showStaffPasswords[staff.username] ? "Hide password" : "Show password"}
                            >
                              {showStaffPasswords[staff.username] ? (
                                <EyeOff className="h-3 w-3 text-gray-400" />
                              ) : (
                                <Eye className="h-3 w-3 text-gray-400" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveStaffCredentials(staff.username)}
                          disabled={isLoading}
                        >
                          {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Remove"}
                        </Button>
                      </div>
                    ))}

                    {staffCredentials.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No staff members added yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="w-5 h-5" />
                    Vet Credentials
                  </CardTitle>
                  <CardDescription>Manage veterinarian login credentials</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-vet-username">Vet Username</Label>
                      <Input
                        id="new-vet-username"
                        placeholder="Enter vet username"
                        value={newVetUsername}
                        onChange={(e) => setNewVetUsername(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-vet-password">Vet Password</Label>
                      <div className="relative">
                        <Input
                          id="new-vet-password"
                          type={showNewVetPassword ? "text" : "password"}
                          placeholder="Enter vet password"
                          value={newVetPassword}
                          onChange={(e) => setNewVetPassword(e.target.value)}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewVetPassword(!showNewVetPassword)}
                          aria-label={showNewVetPassword ? "Hide password" : "Show password"}
                        >
                          {showNewVetPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-end md:col-span-2">
                      <Button onClick={handleAddVetCredentials} className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          "Add Vet"
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Current Vet Members</h4>
                    {vetCredentials.map((vet, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-blue-50 rounded-lg gap-2"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{vet.username}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-gray-600">
                              Password: {"*".repeat(vet.password.length)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveVetCredentials(vet.username)}
                          disabled={isLoading}
                        >
                          {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Remove"}
                        </Button>
                      </div>
                    ))}

                    {vetCredentials.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No vet members added yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <Wifi className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="font-medium text-gray-800">System Status: Connected</p>
                      <p className="text-sm text-gray-600">
                        Last sync: {lastSync ? lastSync.toLocaleString() : "Never"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this note?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the note from the cloud database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConfirmId && deleteNote(deleteConfirmId)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Note
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
