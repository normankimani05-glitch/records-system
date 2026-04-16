"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Heart, Stethoscope, Camera, Calendar, X, Wifi, LogOut } from "lucide-react"

const COW_NAMES = ["Nyandarwa", "Cate", "Monica", "Dorothy"]
const VET_NAMES = ["Dr. Smith", "Dr. Johnson", "Dr. Williams", "Dr. Brown"]

// Unique text colors for each cow name
const COW_TEXT_COLORS = {
  "Nyandarwa": "text-blue-600",
  "Cate": "text-green-600",
  "Monica": "text-purple-600",
  "Dorothy": "text-orange-600"
}

// Header colors for each section
const HEADER_COLORS = {
  "ai": "text-blue-600",
  "treatment": "text-emerald-600",
  "ai-records": "text-violet-600",
  "treatment-records": "text-amber-600"
}

interface AIRecord {
  id: string
  cow_name: string
  ai_image?: string
  created_by: string
  created_at: string
}

interface TreatmentRecord {
  id: string
  cow_name: string
  treatment_date?: string
  treatment_notes?: string
  treatment_image?: string
  created_by: string
  created_at: string
}

// Image Modal Component
function ImageModal({ isOpen, image, onClose }: { isOpen: boolean; image: string | null; onClose: () => void }) {
  if (!isOpen || !image) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="relative bg-white rounded-lg max-w-4xl w-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100 z-10"
        >
          <X className="w-6 h-6 text-gray-800" />
        </button>
        <img src={image} alt="Full view" className="w-full h-auto object-contain rounded-lg" />
      </div>
    </div>
  )
}

export default function VetDashboard() {
  const [activeTab, setActiveTab] = useState("ai")
  const [selectedCowAI, setSelectedCowAI] = useState<string | null>(null)
  const [selectedCowTreatment, setSelectedCowTreatment] = useState<string | null>(null)
  const [currentVet, setCurrentVet] = useState(VET_NAMES[0])
  const [modalImage, setModalImage] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  // Mock data - in real app, this would come from API
  useEffect(() => {
    // Mock AI records (now focused on images)
    setAiRecords([
      {
        id: "1",
        cow_name: "Nyandarwa",
        ai_image: "https://picsum.photos/seed/cow1/400/300",
        created_by: "Dr. Smith",
        created_at: "2024-03-15T10:30:00Z"
      },
      {
        id: "2",
        cow_name: "Nyandarwa",
        ai_image: "https://picsum.photos/seed/cow1a/400/300",
        created_by: "Dr. Johnson",
        created_at: "2024-03-10T14:15:00Z"
      },
      {
        id: "3",
        cow_name: "Cate",
        ai_image: "https://picsum.photos/seed/cow2/400/300",
        created_by: "Dr. Smith",
        created_at: "2024-03-12T09:00:00Z"
      },
      {
        id: "4",
        cow_name: "Monica",
        ai_image: "https://picsum.photos/seed/cow3/400/300",
        created_by: "Dr. Williams",
        created_at: "2024-03-08T11:20:00Z"
      }
    ])

    // Mock Treatment records
    setTreatmentRecords([
      {
        id: "1",
        cow_name: "Nyandarwa",
        treatment_date: "2024-03-14",
        treatment_notes: "Treated for mastitis with antibiotics. Applied antibiotic cream twice daily.",
        treatment_image: "https://picsum.photos/seed/treatment1/400/300",
        created_by: "Dr. Johnson",
        created_at: "2024-03-14T08:45:00Z"
      },
      {
        id: "2",
        cow_name: "Cate",
        treatment_date: "2024-03-12",
        treatment_notes: "Vitamin supplements and deworming. Follow-up scheduled.",
        treatment_image: "https://picsum.photos/seed/treatment2/400/300",
        created_by: "Dr. Smith",
        created_at: "2024-03-12T13:00:00Z"
      },
      {
        id: "3",
        cow_name: "Nyandarwa",
        treatment_date: "2024-03-05",
        treatment_notes: "Routine checkup. Cow is healthy and vaccinated.",
        treatment_image: "https://picsum.photos/seed/treatment3/400/300",
        created_by: "Dr. Johnson",
        created_at: "2024-03-05T10:15:00Z"
      },
      {
        id: "4",
        cow_name: "Dorothy",
        treatment_date: "2024-03-10",
        treatment_notes: "Treatment for foot rot. Bandaged and medicated.",
        treatment_image: "https://picsum.photos/seed/treatment4/400/300",
        created_by: "Dr. Williams",
        created_at: "2024-03-10T15:30:00Z"
      }
    ])
  }, [])

  const handleAiSubmit = useCallback(async () => {
    if (!aiForm.cow_name || !aiForm.ai_image) {
      alert("Please select a cow and upload an image")
      return
    }
    
    setIsLoading(true)
    try {
      // In real app, this would save to backend
      console.log("Saving AI record:", aiForm)
      
      // Add new record to state
      const newRecord: AIRecord = {
        id: Date.now().toString(),
        cow_name: aiForm.cow_name,
        ai_image: aiForm.ai_image,
        created_by: currentVet,
        created_at: new Date().toISOString()
      }
      setAiRecords(prev => [newRecord, ...prev])
      setSelectedCowAI(aiForm.cow_name)
      
      // Reset form
      setAiForm({
        cow_name: "",
        ai_image: ""
      })
      
      alert("AI image saved successfully!")
    } catch (error) {
      console.error("Error saving AI record:", error)
      alert("Error saving AI record")
    } finally {
      setIsLoading(false)
    }
  }, [aiForm, currentVet])

  const handleTreatmentSubmit = useCallback(async () => {
    if (!treatmentForm.cow_name || !treatmentForm.treatment_date || !treatmentForm.treatment_notes) {
      alert("Please fill in all required fields")
      return
    }
    
    setIsLoading(true)
    try {
      // In real app, this would save to backend
      console.log("Saving Treatment record:", treatmentForm)
      
      // Add new record to state
      const newRecord: TreatmentRecord = {
        id: Date.now().toString(),
        ...treatmentForm,
        created_by: currentVet,
        created_at: new Date().toISOString()
      }
      setTreatmentRecords(prev => [newRecord, ...prev])
      setSelectedCowTreatment(treatmentForm.cow_name)
      
      // Reset form
      setTreatmentForm({
        cow_name: "",
        treatment_date: "",
        treatment_notes: "",
        treatment_image: ""
      })
      
      alert("Treatment record saved successfully!")
    } catch (error) {
      console.error("Error saving Treatment record:", error)
      alert("Error saving Treatment record")
    } finally {
      setIsLoading(false)
    }
  }, [treatmentForm, currentVet])

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>, type: 'ai' | 'treatment') => {
    const file = event.target.files?.[0]
    if (file) {
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

  const getRecordsForCow = useCallback((cowName: string, recordType: 'ai' | 'treatment') => {
    const records = recordType === 'ai' ? aiRecords : treatmentRecords
    return records
      .filter(record => record.cow_name === cowName)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [aiRecords, treatmentRecords])

  const openImageModal = (image: string) => {
    setModalImage(image)
    setIsModalOpen(true)
  }

  const closeImageModal = () => {
    setIsModalOpen(false)
    setModalImage(null)
  }

  const handleLogout = () => {
    alert(`${currentVet} logged out successfully`)
    setCurrentVet(VET_NAMES[0])
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">Njoroge&apos;s Milk Tracker</h1>
              <h2 className="text-sm font-medium text-gray-600 mt-1">Veterinary Page</h2>
              <p className="text-sm text-gray-600 mt-2">Welcome back, {currentVet}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Wifi className="w-4 h-4 text-green-600" />
                  <span>Cloud Connected</span>
                </div>
                <span>•</span>
                <span>Last sync: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} PM</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" className="bg-gray-900 text-white hover:bg-gray-800 border-gray-900">
                {currentVet.split(" ")[1] || "Owner"}
              </Button>
              <Button variant="outline" onClick={handleLogout} className="text-gray-900 hover:bg-gray-100">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <div className="flex space-x-4 mb-6">
                <Button variant={activeTab === "ai" ? "default" : "outline"} onClick={() => setActiveTab("ai")} className={activeTab === "ai" ? HEADER_COLORS.ai : ""}>
                  <Heart className="w-4 h-4 mr-2" />
                  AI Records
                </Button>
                <Button variant={activeTab === "treatment" ? "default" : "outline"} onClick={() => setActiveTab("treatment")} className={activeTab === "treatment" ? HEADER_COLORS.treatment : ""}>
                  <Stethoscope className="w-4 h-4 mr-2" />
                  Treatment Records
                </Button>
              </div>
            </div>

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

              {/* AI Images by Cow - Separate Section */}
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
                    <Select value={selectedCowAI || ""} onValueChange={(value) => setSelectedCowAI(value || null)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a cow" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Cows</SelectItem>
                        {COW_NAMES.map((cowName) => (
                          <SelectItem key={cowName} value={cowName}>{cowName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-6">
                    {COW_NAMES.map((cowName) => {
                      if (selectedCowAI && selectedCowAI !== cowName) return null
                      const records = getRecordsForCow(cowName, 'ai')
                      
                      if (records.length === 0) return null
                      
                      return (
                        <div key={cowName}>
                          <h3 className={`text-lg font-semibold mb-4 ${COW_TEXT_COLORS[cowName as keyof typeof COW_TEXT_COLORS]}`}>
                            {cowName} - {records.length} image{records.length !== 1 ? 's' : ''}
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {records.map((record) => (
                              <div key={record.id} className="border rounded-lg p-4 bg-white hover:shadow-lg transition-shadow">
                                {record.ai_image && (
                                  <div 
                                    className="mb-3 cursor-pointer overflow-hidden rounded-lg hover:opacity-80 transition-opacity"
                                    onClick={() => openImageModal(record.ai_image)}
                                  >
                                    <img 
                                      src={record.ai_image} 
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

                  {selectedCowAI && getRecordsForCow(selectedCowAI, 'ai').length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No images uploaded for {selectedCowAI} yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
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

              {/* Treatment Records by Cow - Separate Section */}
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
                    <Select value={selectedCowTreatment || ""} onValueChange={(value) => setSelectedCowTreatment(value || null)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a cow" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Cows</SelectItem>
                        {COW_NAMES.map((cowName) => (
                          <SelectItem key={cowName} value={cowName}>{cowName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-6">
                    {COW_NAMES.map((cowName) => {
                      if (selectedCowTreatment && selectedCowTreatment !== cowName) return null
                      const records = getRecordsForCow(cowName, 'treatment')
                      
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
                                  {record.treatment_image && (
                                    <div 
                                      className="flex-shrink-0 cursor-pointer overflow-hidden rounded-lg hover:opacity-80 transition-opacity"
                                      onClick={() => openImageModal(record.treatment_image)}
                                    >
                                      <img 
                                        src={record.treatment_image} 
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

                  {selectedCowTreatment && getRecordsForCow(selectedCowTreatment, 'treatment').length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Stethoscope className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No treatment records for {selectedCowTreatment} yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal isOpen={isModalOpen} image={modalImage} onClose={closeImageModal} />
    </div>
  )
}
