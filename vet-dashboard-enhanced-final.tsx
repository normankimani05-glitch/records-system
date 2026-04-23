"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Heart, Stethoscope, Camera, Calendar, X, Wifi, LogOut } from "lucide-react"
import { vetService, type AIRecord, type TreatmentRecord } from "@/lib/vet-service"

const COW_NAMES = ["Nyandarwa", "Cate", "Monica", "Dorothy", "Shalon", "Fridah", "Viola", "Jakuom"]

// Unique text colors for each cow name
const COW_TEXT_COLORS = {
  "Nyandarwa": "text-blue-600",
  "Cate": "text-green-600",
  "Monica": "text-purple-600",
  "Dorothy": "text-orange-600",
  "Shalon": "text-pink-600",
  "Fridah": "text-indigo-600",
  "Viola": "text-teal-600",
  "Jakuom": "text-red-600"
}

// Header colors for each section
const HEADER_COLORS = {
  "ai": "text-blue-600",
  "treatment": "text-emerald-600",
  "ai-records": "text-violet-600",
  "treatment-records": "text-amber-600"
}

// Image Modal Component
function ImageModal({ isOpen, image, onClose }: { isOpen: boolean; image: string | null; onClose: () => void }) {
  if (!isOpen || !image) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <button
          onClick={onClose}
          className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-white rounded-full p-2 hover:bg-gray-100 z-10 shadow-lg"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" />
        </button>
        <div className="p-2 sm:p-4">
          <img src={image} alt="Full view" className="w-full h-auto object-contain rounded-lg" />
        </div>
      </div>
    </div>
  )
}

interface VetDashboardProps {
  user: { name: string; role: "owner" | "staff" | "vet" } | null
  onLogout: () => void
}

export default function VetDashboard({ user, onLogout }: VetDashboardProps) {
  const [activeTab, setActiveTab] = useState("ai")
  const [selectedCowAI, setSelectedCowAI] = useState<string | null>(null)
  const [selectedCowTreatment, setSelectedCowTreatment] = useState<string | null>(null)
  const [modalImage, setModalImage] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState(new Date())
  const [message, setMessage] = useState("")
  
  // Get current vet from logged-in user
  const currentVet = user?.name || "Unknown Vet"
  
  const handleLogout = () => {
    onLogout()
  }
  
  // Update last sync time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setLastSyncTime(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // Show welcome message when component mounts
  useEffect(() => {
    setMessage(`Welcome ${currentVet}!`)
    setTimeout(() => setMessage(""), 3000)
  }, [currentVet])

  const [aiForm, setAiForm] = useState({
    cow_name: "",
    ai_image: ""
  })
  const [treatmentForm, setTreatmentForm] = useState({
    cow_name: "",
    treatment_date: "",
    treatment_notes: "",
    treatment_image: ""
  })
  const [aiRecords, setAiRecords] = useState<AIRecord[]>([])
  const [treatmentRecords, setTreatmentRecords] = useState<TreatmentRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load data from database
  useEffect(() => {
    loadVetData()
  }, [])

  const loadVetData = async () => {
    try {
      setIsDataLoading(true)
      setError(null)
      
      // Load AI records and treatment records from database
      const [aiData, treatmentData] = await Promise.all([
        vetService.getAIRecords(),
        vetService.getTreatmentRecords()
      ])
      
      setAiRecords(aiData)
      setTreatmentRecords(treatmentData)
    } catch (error) {
      console.error('Error loading vet data:', error)
      setError('Failed to load records. Please try again.')
    } finally {
      setIsDataLoading(false)
    }
  }

  const handleAiSubmit = useCallback(async () => {
    if (!aiForm.cow_name || !aiForm.ai_image) {
      alert("Please select a cow and upload an image")
      return
    }
    
    setIsLoading(true)
    try {
      // Extract image type from data URL
      const mimeType = aiForm.ai_image.split(',')[0].split(':')[1].split(';')[0]
      const base64Data = aiForm.ai_image.split(',')[1] || aiForm.ai_image
      
      // Process image - store as base64 data URL
      const imageDataUrl = await vetService.storeBase64Image(base64Data, mimeType)
      
      // Create AI record in database
      const newRecord = await vetService.createAIRecord({
        cow_name: aiForm.cow_name,
        ai_image_url: imageDataUrl,
        created_by: currentVet
      })
      
      // Update local state
      setAiRecords(prev => [newRecord, ...prev])
      
      // Show success message
      setMessage("AI image saved successfully!")
      setTimeout(() => setMessage(""), 3000)
      
      // Reset form
      setAiForm({
        cow_name: "",
        ai_image: ""
      })
    } catch (error) {
      console.error("Error saving AI record:", error)
      setMessage("Error saving AI record. Please try again.")
      setTimeout(() => setMessage(""), 3000)
    } finally {
      setIsLoading(false)
    }
  }, [aiForm, currentVet])

  const handleTreatmentSubmit = useCallback(async () => {
    if (!treatmentForm.cow_name || !treatmentForm.treatment_date || !treatmentForm.treatment_notes) {
      setMessage("Please fill in all required fields")
      setTimeout(() => setMessage(""), 3000)
      return
    }
    
    setIsLoading(true)
    try {
      // Process image if provided
      let treatmentImageUrl = undefined
      let treatmentImageType = undefined
      if (treatmentForm.treatment_image) {
        // Extract image type from data URL
        const mimeType = treatmentForm.treatment_image.split(',')[0].split(':')[1].split(';')[0]
        const base64Data = treatmentForm.treatment_image.split(',')[1] || treatmentForm.treatment_image
        
        treatmentImageUrl = await vetService.storeBase64Image(base64Data, mimeType)
        treatmentImageType = mimeType
      }
      
      // Create treatment record in database
      const newRecord = await vetService.createTreatmentRecord({
        cow_name: treatmentForm.cow_name,
        treatment_date: treatmentForm.treatment_date,
        treatment_notes: treatmentForm.treatment_notes,
        treatment_image_url: treatmentImageUrl,
        created_by: currentVet
      })
      
      // Update local state
      setTreatmentRecords(prev => [newRecord, ...prev])
      
      // Show success message
      setMessage("Treatment record saved successfully!")
      setTimeout(() => setMessage(""), 3000)
      
      // Reset form
      setTreatmentForm({
        cow_name: "",
        treatment_date: "",
        treatment_notes: "",
        treatment_image: ""
      })
    } catch (error) {
      console.error("Error saving Treatment record:", error)
      setMessage("Error saving Treatment record. Please try again.")
      setTimeout(() => setMessage(""), 3000)
    } finally {
      setIsLoading(false)
    }
  }, [treatmentForm, currentVet])

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>, type: 'ai' | 'treatment') => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG, GIF, etc.)')
        return
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (type === 'ai') {
          setAiForm(prev => ({ ...prev, ai_image: result }))
        } else {
          setTreatmentForm(prev => ({ ...prev, treatment_image: result }))
        }
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const getAIRecordsForCow = useCallback((cowName: string) => {
    return aiRecords
      .filter(record => record.cow_name === cowName)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [aiRecords])

  const getTreatmentRecordsForCow = useCallback((cowName: string) => {
    return treatmentRecords
      .filter(record => record.cow_name === cowName)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [treatmentRecords])

  // Refresh data function
  const refreshData = useCallback(async () => {
    await loadVetData()
  }, [])

  const openImageModal = (image: string) => {
    setModalImage(image)
    setIsModalOpen(true)
  }

  const closeImageModal = () => {
    setIsModalOpen(false)
    setModalImage(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header Section */}
      <header className="bg-white border-b border-gray-200 shadow-sm relative">
        {/* Logout Button - Top Right Corner */}
        <Button 
          variant="outline" 
          onClick={handleLogout} 
          className="absolute top-4 right-4 text-gray-900 hover:bg-gray-100 p-2 h-8 w-8"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </Button>

        {/* Success/Error Message */}
        {message && (
          <div className="absolute top-16 right-4 left-4 sm:left-auto sm:w-auto z-10">
            <div className={`p-3 rounded-lg shadow-lg text-sm font-medium ${
              message.includes("Error") || message.includes("Please fill") 
                ? "bg-red-100 text-red-800 border border-red-200" 
                : "bg-green-100 text-green-800 border border-green-200"
            }`}>
              {message}
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Veterinary Page</h1>
              <p className="text-sm text-gray-600 mt-2">Welcome back, {currentVet}</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Wifi className="w-4 h-4 text-green-600" />
                  <span>Database Connected</span>
                </div>
                <span className="hidden sm:inline">â¢</span>
                <span>Last sync: {lastSyncTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} PM</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button variant="outline" className="bg-gray-900 text-white hover:bg-gray-800 border-gray-900 w-full sm:w-auto">
                {currentVet.split(" ")[1] || currentVet}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-2 sm:p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            {/* Loading State */}
            {isDataLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading veterinary records...</span>
              </div>
            )}
            
            {/* Error State */}
            {error && !isDataLoading && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <div className="text-red-600 mr-2">â</div>
                  <div className="flex-1">
                    <h3 className="text-red-800 font-medium">Error loading records</h3>
                    <p className="text-red-600 text-sm">{error}</p>
                    <Button onClick={loadVetData} className="mt-2" size="sm">
                      Try Again
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Main Content */}
            {!isDataLoading && (
              <>
                <div className="mb-6">
                  <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 mb-6">
                    <Button 
                      variant={activeTab === "ai" ? "default" : "outline"} 
                      onClick={() => setActiveTab("ai")} 
                      className={`flex items-center justify-center ${activeTab === "ai" ? HEADER_COLORS.ai : ""} w-full sm:w-auto flex-shrink-0`}
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      <span className="truncate">AI Records</span>
                    </Button>
                    <Button 
                      variant={activeTab === "ai-images" ? "default" : "outline"} 
                      onClick={() => setActiveTab("ai-images")} 
                      className={`flex items-center justify-center ${activeTab === "ai-images" ? HEADER_COLORS["ai-records"] : ""} w-full sm:w-auto flex-shrink-0`}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      <span className="truncate">AI Images by Cow</span>
                    </Button>
                    <Button 
                      variant={activeTab === "treatment" ? "default" : "outline"} 
                      onClick={() => setActiveTab("treatment")} 
                      className={`flex items-center justify-center ${activeTab === "treatment" ? HEADER_COLORS.treatment : ""} w-full sm:w-auto flex-shrink-0`}
                    >
                      <Stethoscope className="w-4 h-4 mr-2" />
                      <span className="truncate">Treatment Records</span>
                    </Button>
                    <Button 
                      variant={activeTab === "treatment-records" ? "default" : "outline"} 
                      onClick={() => setActiveTab("treatment-records")} 
                      className={`flex items-center justify-center ${activeTab === "treatment-records" ? HEADER_COLORS["treatment-records"] : ""} w-full sm:w-auto flex-shrink-0`}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="truncate">Treatment Records by Cow</span>
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Tab Content - Only show when not loading */}
            {!isDataLoading && (
              <>
            {/* AI Section Tab */}
            {activeTab === "ai" && (
              <div className="space-y-8">
                {/* AI Record Upload Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className={`flex items-center space-x-2 ${HEADER_COLORS.ai}`}>
                      <Heart className="w-5 h-5" />
                      <h3 className="text-lg font-medium">Upload AI Image</h3>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="ai-cow">Select Cow Name</Label>
                        <Select value={aiForm.cow_name} onValueChange={(value) => setAiForm(prev => ({ ...prev, cow_name: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select cow" />
                          </SelectTrigger>
                          <SelectContent>
                            {COW_NAMES.map((cowName) => (
                              <SelectItem key={cowName} value={cowName}>{cowName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="ai-image" className="flex items-center space-x-2">
                          <Camera className="w-4 h-4" />
                          <span>Upload AI Image for Reference</span>
                        </Label>
                        <input
                          type="file"
                          id="ai-image"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'ai')}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:ml-4 file:py-2 file:px-4 file:border file:border-gray-300 file:rounded-md file:text-sm file:font-semibold hover:file:bg-gray-50"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Accepts: JPG, PNG, GIF, WebP, BMP, and all image formats
                        </p>
                        {aiForm.ai_image && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Image Preview:</p>
                            <img 
                              src={aiForm.ai_image} 
                              alt="AI scan preview" 
                              className="h-40 w-40 object-cover rounded-lg border-2 border-gray-200"
                            />
                          </div>
                        )}
                      </div>
                      
                      <Button onClick={handleAiSubmit} disabled={isLoading} className="w-full">
                        {isLoading ? "Saving..." : "Save AI Image"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* AI Images by Cow Tab */}
            {activeTab === "ai-images" && (
              <Card>
                <CardHeader>
                  <CardTitle className={HEADER_COLORS["ai-records"]}>
                    <div className="flex items-center space-x-2">
                      <Camera className="w-5 h-5" />
                      <span>AI Images by Cow</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <Label htmlFor="ai-records-select">Select Cow to View Images</Label>
                    <Select value={selectedCowAI || "all"} onValueChange={(value) => setSelectedCowAI(value === "all" ? null : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a cow" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Cows</SelectItem>
                        {COW_NAMES.map((cowName) => (
                          <SelectItem key={cowName} value={cowName}>{cowName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-6">
                    {COW_NAMES.map((cowName) => {
                      if (selectedCowAI && selectedCowAI !== cowName) return null
                      const records = getAIRecordsForCow(cowName)
                      
                      if (records.length === 0) return null
                      
                      return (
                        <div key={cowName}>
                          <h3 className={`text-lg font-semibold mb-4 ${COW_TEXT_COLORS[cowName as keyof typeof COW_TEXT_COLORS]}`}>
                            {cowName} - {records.length} image{records.length !== 1 ? 's' : ''}
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {records.map((record) => (
                              <div key={record.id} className="border rounded-lg p-4 bg-white hover:shadow-lg transition-shadow">
                                {record.ai_image_url && (
                                  <div 
                                    className="mb-3 cursor-pointer overflow-hidden rounded-lg hover:opacity-80 transition-opacity"
                                    onClick={() => openImageModal(record.ai_image_url)}
                                  >
                                    <img 
                                      src={record.ai_image_url} 
                                      alt={`AI image for ${cowName}`} 
                                      className="w-full h-40 object-cover"
                                    />
                                  </div>
                                )}
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(record.created_at).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}</span>
                                  </div>
                                  <p className="text-xs text-gray-500">Recorded by: <span className="font-semibold">{record.created_by}</span></p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {selectedCowAI && getAIRecordsForCow(selectedCowAI).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No images uploaded for {selectedCowAI} yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Treatment Section Tab */}
            {activeTab === "treatment" && (
              <div className="space-y-8">
                {/* Treatment Record Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className={`flex items-center space-x-2 ${HEADER_COLORS.treatment}`}>
                      <Stethoscope className="w-5 h-5" />
                      <h3 className="text-lg font-medium">Record Treatment</h3>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="treatment-cow">Cow Name</Label>
                        <Select value={treatmentForm.cow_name} onValueChange={(value) => setTreatmentForm(prev => ({ ...prev, cow_name: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select cow" />
                          </SelectTrigger>
                          <SelectContent>
                            {COW_NAMES.map((cowName) => (
                              <SelectItem key={cowName} value={cowName}>{cowName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="treatment-image">Upload Treatment Image</Label>
                        <input
                          type="file"
                          id="treatment-image"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'treatment')}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:ml-4 file:py-2 file:px-4 file:border file:border-gray-300 file:rounded-md file:text-sm file:font-semibold hover:file:bg-gray-50"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Accepts: JPG, PNG, GIF, WebP, BMP, and all image formats
                        </p>
                        {treatmentForm.treatment_image && (
                          <div className="mt-2">
                            <img 
                              src={treatmentForm.treatment_image} 
                              alt="Treatment" 
                              className="h-32 w-32 object-cover rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="treatment-date">Treatment Date</Label>
                        <input
                          type="date"
                          id="treatment-date"
                          value={treatmentForm.treatment_date}
                          onChange={(e) => setTreatmentForm(prev => ({ ...prev, treatment_date: e.target.value }))}
                          className="block w-full p-2 border rounded-md"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="treatment-notes">Treatment Notes</Label>
                        <Textarea
                          id="treatment-notes"
                          placeholder="Enter treatment notes here..."
                          rows={6}
                          value={treatmentForm.treatment_notes}
                          onChange={(e) => setTreatmentForm(prev => ({ ...prev, treatment_notes: e.target.value }))}
                          className="block w-full p-2 border rounded-md"
                        />
                      </div>
                      
                      <Button onClick={handleTreatmentSubmit} disabled={isLoading} className="w-full">
                        {isLoading ? "Saving..." : "Save Treatment Record"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Treatment Records by Cow Tab */}
            {activeTab === "treatment-records" && (
              <Card>
                <CardHeader>
                  <CardTitle className={HEADER_COLORS["treatment-records"]}>
                    <div className="flex items-center space-x-2">
                      <Stethoscope className="w-5 h-5" />
                      <span>Treatment Records by Cow</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <Label htmlFor="treatment-records-select">Select Cow to View Treatment Records</Label>
                    <Select value={selectedCowTreatment || "all"} onValueChange={(value) => setSelectedCowTreatment(value === "all" ? null : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a cow" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Cows</SelectItem>
                        {COW_NAMES.map((cowName) => (
                          <SelectItem key={cowName} value={cowName}>{cowName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-6">
                    {COW_NAMES.map((cowName) => {
                      if (selectedCowTreatment && selectedCowTreatment !== cowName) return null
                      const records = getTreatmentRecordsForCow(cowName)
                      
                      if (records.length === 0) return null
                      
                      return (
                        <div key={cowName}>
                          <h3 className={`text-lg font-semibold mb-4 ${COW_TEXT_COLORS[cowName as keyof typeof COW_TEXT_COLORS]}`}>
                            {cowName} - {records.length} record{records.length !== 1 ? 's' : ''}
                          </h3>
                          
                          <div className="space-y-4">
                            {records.map((record) => (
                              <div key={record.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center space-x-2">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium text-gray-900">{record.treatment_date}</span>
                                      </div>
                                      <span className="text-xs text-gray-500">{new Date(record.created_at).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'short', 
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}</span>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg mb-3">
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{record.treatment_notes}</p>
                                    </div>
                                    <p className="text-xs text-gray-600">
                                      Recorded by: <span className="font-semibold text-gray-900">{record.created_by}</span>
                                    </p>
                                  </div>
                                  {record.treatment_image_url && (
                                    <div 
                                      className="flex-shrink-0 cursor-pointer overflow-hidden rounded-lg hover:opacity-80 transition-opacity"
                                      onClick={() => openImageModal(record.treatment_image_url)}
                                    >
                                      <img 
                                        src={record.treatment_image_url} 
                                        alt={`Treatment for ${cowName}`} 
                                        className="h-32 w-32 object-cover"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {selectedCowTreatment && getTreatmentRecordsForCow(selectedCowTreatment).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Stethoscope className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No treatment records for {selectedCowTreatment} yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            </>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal isOpen={isModalOpen} image={modalImage} onClose={closeImageModal} />
    </div>
  )
}
