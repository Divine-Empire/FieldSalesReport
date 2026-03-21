"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  User,
  MapPin,
  Building2,
  HardHat,
  ClipboardList,
  Target,
  Camera,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  Send,
  X,
  Plus,
  Trash2,
} from "lucide-react"

const SALES_EXECUTIVES = [
  "PRANAV VINAYAKRAO BHOGAWAR",
  "RANJAN KUMAR PRUSTY",
  "SAMIRAN RAJBONGSHI",
  "ROSHAN DEWANGAN",
  "AMAN JHA",
]

const VISIT_TYPES = [
  "New F2F",
  "Existing F2F",
  "MDO F2F",
]

const DESIGNATIONS = [
  "Owner",
  "Project Manager",
  "Purchase",
  "QC",
  "Surveyor",
]

const NATURE_OF_BUSINESS = [
  "Bridge",
  "Building",
  "Consultant",
  "Industrial Civil",
  "Rail",
  "Resellers",
  "Road",
]

const NATURE_OF_PROJECT = [
  "Bridge",
  "Building",
  "Industrial Civil",
  "Mines",
  "Rail",
  "Road",
  "Other",
]

const BALANCE_WORK_PERCENTAGES = [
  "0%-25%",
  "25%-50%",
  "50%-75%",
  "75%-100%",
]

const PURCHASE_TIMES = [
  "Immediate",
  "Within 1 Month",
  "Within 3 Months",
  "Within 6 Months",
  "Not Sure",
]

const ORDER_PROBABILITY = ["Hot", "Warm", "Cold"]

interface ContactEntry {
  designation: string
  contactPerson: string
  contactMobile: string
}

interface ProjectEntry {
  id: number
  projectName: string
  projectLocation: string
  natureOfProject: string
  balanceWork: string
  remarks: string
}

interface FormSection {
  id: number
  title: string
  icon: React.ReactNode
}

const SECTIONS: FormSection[] = [
  { id: 1, title: "Sales Executive Details", icon: <User className="h-5 w-5" /> },
  { id: 2, title: "Visit Type", icon: <MapPin className="h-5 w-5" /> },
  { id: 3, title: "Client / Company Details", icon: <Building2 className="h-5 w-5" /> },
  { id: 4, title: "Project Information", icon: <HardHat className="h-5 w-5" /> },
  { id: 5, title: "Enquiry Details", icon: <ClipboardList className="h-5 w-5" /> },
  { id: 6, title: "Order Probability", icon: <Target className="h-5 w-5" /> },
  { id: 7, title: "Photo Upload", icon: <Camera className="h-5 w-5" /> },
]

function createNewProject(id: number): ProjectEntry {
  return {
    id,
    projectName: "",
    projectLocation: "",
    natureOfProject: "",
    balanceWork: "",
    remarks: "",
  }
}

export default function FieldSalesForm() {
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null)
  const [liveLocation, setLiveLocation] = useState<string>("")
  const [locationLoading, setLocationLoading] = useState<boolean>(true)

  useEffect(() => {
    setCurrentDateTime(new Date())
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      setLocationLoading(true)

      const fetchLocationName = async (latitude: number, longitude: number) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          )
          if (!res.ok) throw new Error("Nominatim failed")
          const data = await res.json()
          if (data.display_name) {
            setLiveLocation(data.display_name)
          } else {
            throw new Error("No display_name")
          }
        } catch {
          try {
            const fallbackRes = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            )
            const fallbackData = await fallbackRes.json()
            const fallbackName = [fallbackData.locality, fallbackData.city, fallbackData.principalSubdivision]
              .filter(Boolean)
              .join(", ")
            if (fallbackName) {
              setLiveLocation(fallbackName)
            } else {
              setLiveLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
            }
          } catch {
            setLiveLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
          }
        } finally {
          setLocationLoading(false)
        }
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          fetchLocationName(latitude, longitude)
        },
        (error) => {
          console.error("Geolocation error:", error.message)
          setLiveLocation("Location unavailable")
          setLocationLoading(false)
        },
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
      )
    } else {
      setLiveLocation("Location not supported")
      setLocationLoading(false)
    }
  }, [])

  const formatDateTime = (date: Date | null) => {
    if (!date) return ""
    const pad = (n: number) => n.toString().padStart(2, "0")
    const DD = pad(date.getDate())
    const MM = pad(date.getMonth() + 1)
    const YYYY = date.getFullYear()
    const hh = pad(date.getHours())
    const mm = pad(date.getMinutes())
    const ss = pad(date.getSeconds())
    return `${DD}/${MM}/${YYYY} ${hh}:${mm}:${ss}`
  }

  // Form state
  const [expandedSection, setExpandedSection] = useState<number>(1)
  const [completedSections, setCompletedSections] = useState<number[]>([])
  const [salesPerson, setSalesPerson] = useState("")
  const [visitType, setVisitType] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [contacts, setContacts] = useState<ContactEntry[]>([
    { designation: "", contactPerson: "", contactMobile: "" },
  ])
  const [natureOfBusiness, setNatureOfBusiness] = useState("")
  const [projects, setProjects] = useState<ProjectEntry[]>([createNewProject(1)])
  const [hasEnquiry, setHasEnquiry] = useState<string>("")
  const [productInterested, setProductInterested] = useState("")
  const [quantityRequired, setQuantityRequired] = useState("")
  const [expectedPurchaseTime, setExpectedPurchaseTime] = useState("")
  const [orderProbability, setOrderProbability] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const fileInputRefs = {
    clientMeeting: useRef<HTMLInputElement>(null),
  }

  const APPSCRIPT_URL = process.env.NEXT_PUBLIC_APPSCRIPT_URL || process.env.VITE_APPSCRIPT_URL || "https://script.google.com/macros/s/AKfycbwaEwRX6RhSxlkcWjAUoacmwSVwW8uMlEf-2NBTPLaf18N3iKOYXo39PVcAiSSDCrF38Q/exec"
  const GOOGLE_FOLDER_ID = process.env.NEXT_PUBLIC_GOOGLE_FOLDER_ID || process.env.GOOGLE_FOLDER_ID || "1-2NwO1mXzYmYPIDNUTkA4oOl3c9r8pZ8"

  const toggleSection = (sectionId: number) => {
    setExpandedSection(expandedSection === sectionId ? 0 : sectionId)
  }

  const markSectionComplete = (sectionId: number) => {
    if (!completedSections.includes(sectionId)) {
      setCompletedSections([...completedSections, sectionId])
    }
    if (sectionId < 7) {
      setExpandedSection(sectionId + 1)
    }
  }

  // Contact functions
  const addContact = () => {
    setContacts([...contacts, { designation: "", contactPerson: "", contactMobile: "" }])
  }

  const removeContact = (index: number) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter((_, i) => i !== index))
    }
  }

  const updateContact = (index: number, field: keyof ContactEntry, value: string) => {
    const updated = [...contacts]
    updated[index] = { ...updated[index], [field]: value }
    setContacts(updated)
  }

  // Project functions
  const addProject = () => {
    const newId = projects.length > 0 ? Math.max(...projects.map((p) => p.id)) + 1 : 1
    setProjects([...projects, createNewProject(newId)])
  }

  const removeProject = (id: number) => {
    if (projects.length > 1) {
      setProjects(projects.filter((p) => p.id !== id))
    }
  }

  const updateProject = (id: number, field: keyof ProjectEntry, value: string) => {
    setProjects(
      projects.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let fileUrl = ""
      if (uploadedFile) {
        const reader = new FileReader()
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(uploadedFile)
        })
        const base64Data = await base64Promise
        
        try {
          const uploadResponse = await fetch(APPSCRIPT_URL, {
            method: "POST",
            body: new URLSearchParams({
              action: "uploadFile",
              base64Data: base64Data,
              fileName: uploadedFile.name,
              mimeType: uploadedFile.type,
              folderId: GOOGLE_FOLDER_ID
            })
          })
          const uploadResult = await uploadResponse.json()
          if (uploadResult.success) {
            fileUrl = uploadResult.fileUrl
          }
        } catch (uploadErr) {
          console.error("File upload failed, proceeding without photo:", uploadErr)
        }
      }

      // 1. Fetch Headers from Row 3
      const getResponse = await fetch(`${APPSCRIPT_URL}?sheet=Data`)
      const getResult = await getResponse.json()
      if (!getResult.success) throw new Error(getResult.error)
      
      const headers = getResult.data[2] // Row 3 is index 2
      
      // Use a format that Google Sheets recognizes reliably across locales
      const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0]
      const visitTime = currentDateTime ? currentDateTime.toISOString().replace('T', ' ').split('.')[0] : ""

      // 2. Map Data to Headers
      const rowData = headers.map((header: string) => {
        const h = header.trim().toLowerCase()
        if (h === "timestamp") return timestamp
        if (h === "sale person name") return salesPerson
        if (h === "date and time to visit") return visitTime
        if (h === "city/location of visit") return liveLocation
        if (h === "type of visit") return visitType
        if (h === "client/company name") return companyName
        if (h === "nature of business") return natureOfBusiness
        if (h === "did you receive any enquiry?") return hasEnquiry
        if (h === "product interested in") return productInterested
        if (h === "quantity required") return quantityRequired
        if (h === "expected purchase time") return expectedPurchaseTime
        if (h === "order probability") return orderProbability
        if (h === "f2f meeting photo with client") return fileUrl

        // Contacts Mapping
        if (h === "designation") return contacts[0]?.designation || ""
        if (h === "contact person name") return contacts[0]?.contactPerson || ""
        if (h === "contact person mobile") return contacts[0]?.contactMobile || ""
        
        for (let i = 2; i <= 4; i++) {
          if (h === `contact person name ${i}`) return contacts[i-1]?.contactPerson || ""
          if (h === `contact person mobile ${i}`) return contacts[i-1]?.contactMobile || ""
        }

        // Projects Mapping
        if (h === "project name") return projects[0]?.projectName || ""
        if (h === "project location") return projects[0]?.projectLocation || ""
        if (h === "nature of project") return projects[0]?.natureOfProject || ""
        if (h === "percentage of balance work") return projects[0]?.balanceWork || ""
        if (h === "remarks") return projects[0]?.remarks || ""

        for (let i = 2; i <= 4; i++) {
          if (h === `project name ${i}`) return projects[i-1]?.projectName || ""
          if (h === `project location ${i}`) return projects[i-1]?.projectLocation || ""
          if (h === `nature of project ${i}`) return projects[i-1]?.natureOfProject || ""
          if (h === `percentage of balance work ${i}`) return projects[i-1]?.balanceWork || ""
          if (h === `remarks ${i}`) return projects[i-1]?.remarks || ""
        }

        return ""
      })

      // 3. Submit Data
      const postResponse = await fetch(APPSCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          action: "insert",
          sheetName: "Data",
          rowData: JSON.stringify(rowData)
        })
      })

      setIsSubmitting(false)
      setIsSubmitted(true)
    } catch (error) {
      console.error("Submission error:", error)
      alert("Error submitting report. Please try again.")
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Report Submitted!
            </h2>
            <p className="text-muted-foreground mb-6">
              Your field visit report has been successfully recorded.
            </p>
            <Button
              onClick={() => {
                setIsSubmitted(false)
                setCompletedSections([])
                setExpandedSection(1)
                setCompanyName("")
                setContacts([{ designation: "", contactPerson: "", contactMobile: "" }])
                setProjects([createNewProject(1)])
                setHasEnquiry("")
                setUploadedFile(null)
              }}
              className="w-full"
            >
              Submit Another Report
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <HardHat className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Field Sales Report</h1>
              <p className="text-sm text-muted-foreground">Construction Equipment Division</p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>{completedSections.length} of 7 sections completed</span>
            <span>{Math.round((completedSections.length / 7) * 100)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${(completedSections.length / 7) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {/* Section 1: Sales Executive Details */}
        <Card className={`transition-all ${expandedSection === 1 ? "ring-2 ring-primary/20" : ""}`}>
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => toggleSection(1)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${completedSections.includes(1)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                    }`}
                >
                  {completedSections.includes(1) ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <CardTitle className="text-base">Section 1: Sales Executive Details</CardTitle>
              </div>
              {expandedSection === 1 ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          {expandedSection === 1 && (
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2">
                <Label>Sales Person Name</Label>
                <Select value={salesPerson} onValueChange={setSalesPerson}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your name" />
                  </SelectTrigger>
                  <SelectContent>
                    {SALES_EXECUTIVES.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date and Time of Visit</Label>
                <Input
                  type="text"
                  value={formatDateTime(currentDateTime)}
                  readOnly
                  className="bg-muted font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>City / Location of Visit</Label>
                <div className="relative">
                  <Input
                    value={locationLoading ? "Detecting location..." : liveLocation}
                    readOnly
                    className="bg-muted pr-10 cursor-not-allowed"
                  />
                  {locationLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
              <Button
                type="button"
                onClick={() => markSectionComplete(1)}
                className="w-full"
              >
                Continue
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Section 2: Visit Type */}
        <Card className={`transition-all ${expandedSection === 2 ? "ring-2 ring-primary/20" : ""}`}>
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => toggleSection(2)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${completedSections.includes(2)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                    }`}
                >
                  {completedSections.includes(2) ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                </div>
                <CardTitle className="text-base">Section 2: Visit Type</CardTitle>
              </div>
              {expandedSection === 2 ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          {expandedSection === 2 && (
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2">
                <Label>Type of Visit</Label>
                <Select value={visitType} onValueChange={setVisitType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select visit type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                onClick={() => markSectionComplete(2)}
                className="w-full"
              >
                Continue
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Section 3: Client / Company Details */}
        <Card className={`transition-all ${expandedSection === 3 ? "ring-2 ring-primary/20" : ""}`}>
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => toggleSection(3)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${completedSections.includes(3)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                    }`}
                >
                  {completedSections.includes(3) ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Building2 className="h-4 w-4" />
                  )}
                </div>
                <CardTitle className="text-base">Section 3: Client / Company Details</CardTitle>
              </div>
              {expandedSection === 3 ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          {expandedSection === 3 && (
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2">
                <Label>Client / Company Name</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                />
              </div>
              {contacts.map((contact, index) => (
                <div key={index} className="space-y-3 p-3 border border-border rounded-lg relative">
                  {contacts.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-7 w-7 p-0"
                      onClick={() => removeContact(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <p className="text-sm font-medium text-muted-foreground">
                    Contact {index + 1}
                  </p>
                  <div className="space-y-2">
                    <Label>Designation</Label>
                    <Select
                      value={contact.designation}
                      onValueChange={(val) => updateContact(index, "designation", val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select designation" />
                      </SelectTrigger>
                      <SelectContent>
                        {DESIGNATIONS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Person Name</Label>
                    <Input
                      value={contact.contactPerson}
                      onChange={(e) => updateContact(index, "contactPerson", e.target.value)}
                      placeholder="Enter contact person name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Person Mobile</Label>
                    <Input
                      type="tel"
                      value={contact.contactMobile}
                      onChange={(e) => updateContact(index, "contactMobile", e.target.value)}
                      placeholder="Enter mobile number"
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addContact}
                className="w-full"
                disabled={contacts.length >= 4}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Contact {contacts.length >= 4 && "(Limit reached)"}
              </Button>
              <div className="space-y-2">
                <Label>Nature of Business</Label>
                <Select value={natureOfBusiness} onValueChange={setNatureOfBusiness}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select nature of business" />
                  </SelectTrigger>
                  <SelectContent>
                    {NATURE_OF_BUSINESS.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                onClick={() => markSectionComplete(3)}
                className="w-full"
              >
                Continue
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Section 4: Project Information (Repeatable) */}
        <Card className={`transition-all ${expandedSection === 4 ? "ring-2 ring-primary/20" : ""}`}>
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => toggleSection(4)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${completedSections.includes(4)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                    }`}
                >
                  {completedSections.includes(4) ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <HardHat className="h-4 w-4" />
                  )}
                </div>
                <CardTitle className="text-base">Section 4: Project Information</CardTitle>
              </div>
              {expandedSection === 4 ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          {expandedSection === 4 && (
            <CardContent className="space-y-4 pt-0">
              {projects.map((project, index) => (
                <div key={project.id} className="space-y-3 p-3 border border-border rounded-lg relative">
                  {projects.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeProject(project.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <p className="text-sm font-medium text-muted-foreground">
                    Project {index + 1}
                  </p>
                  <div className="space-y-2">
                    <Label>Project Name</Label>
                    <Input
                      value={project.projectName}
                      onChange={(e) => updateProject(project.id, "projectName", e.target.value)}
                      placeholder="Enter project name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Project Location</Label>
                    <Input
                      value={project.projectLocation}
                      onChange={(e) => updateProject(project.id, "projectLocation", e.target.value)}
                      placeholder="Enter project location"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nature of Project</Label>
                    <Select
                      value={project.natureOfProject}
                      onValueChange={(val) => updateProject(project.id, "natureOfProject", val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select nature of project" />
                      </SelectTrigger>
                      <SelectContent>
                        {NATURE_OF_PROJECT.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Percentage% of Balance Work</Label>
                    <Select
                      value={project.balanceWork}
                      onValueChange={(val) => updateProject(project.id, "balanceWork", val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select balance work %" />
                      </SelectTrigger>
                      <SelectContent>
                        {BALANCE_WORK_PERCENTAGES.map((pct) => (
                          <SelectItem key={pct} value={pct}>
                            {pct}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Remarks</Label>
                    <Textarea
                      value={project.remarks}
                      onChange={(e) => updateProject(project.id, "remarks", e.target.value)}
                      placeholder="Enter remarks about the project..."
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addProject}
                className="w-full"
                disabled={projects.length >= 4}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Project Information {projects.length >= 4 && "(Limit reached)"}
              </Button>
              <Button
                type="button"
                onClick={() => markSectionComplete(4)}
                className="w-full"
              >
                Save
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Section 5: Enquiry Details */}
        <Card className={`transition-all ${expandedSection === 5 ? "ring-2 ring-primary/20" : ""}`}>
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => toggleSection(5)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${completedSections.includes(5)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                    }`}
                >
                  {completedSections.includes(5) ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <ClipboardList className="h-4 w-4" />
                  )}
                </div>
                <CardTitle className="text-base">Section 5: Enquiry Details</CardTitle>
              </div>
              {expandedSection === 5 ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          {expandedSection === 5 && (
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-3">
                <Label>Did you receive any enquiry?</Label>
                <RadioGroup
                  value={hasEnquiry}
                  onValueChange={setHasEnquiry}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="enquiry-yes" />
                    <Label htmlFor="enquiry-yes" className="font-normal cursor-pointer">
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="enquiry-no" />
                    <Label htmlFor="enquiry-no" className="font-normal cursor-pointer">
                      No
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              {hasEnquiry === "yes" && (
                <>
                  <div className="space-y-2">
                    <Label>Product Interested In</Label>
                    <Input 
                      value={productInterested} 
                      onChange={(e) => setProductInterested(e.target.value)} 
                      placeholder="Enter product name" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity Required</Label>
                    <Input 
                      value={quantityRequired} 
                      onChange={(e) => setQuantityRequired(e.target.value)} 
                      placeholder="Enter quantity" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expected Purchase Time</Label>
                    <Select value={expectedPurchaseTime} onValueChange={setExpectedPurchaseTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select expected time" />
                      </SelectTrigger>
                      <SelectContent>
                        {PURCHASE_TIMES.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <Button
                type="button"
                onClick={() => markSectionComplete(5)}
                className="w-full"
              >
                Continue
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Section 6: Order Probability */}
        <Card className={`transition-all ${expandedSection === 6 ? "ring-2 ring-primary/20" : ""}`}>
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => toggleSection(6)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${completedSections.includes(6)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                    }`}
                >
                  {completedSections.includes(6) ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Target className="h-4 w-4" />
                  )}
                </div>
                <CardTitle className="text-base">Section 6: Order Probability</CardTitle>
              </div>
              {expandedSection === 6 ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          {expandedSection === 6 && (
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2">
                <Label>Order Probability</Label>
                <Select value={orderProbability} onValueChange={setOrderProbability}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select probability" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_PROBABILITY.map((prob) => (
                      <SelectItem key={prob} value={prob}>
                        {prob}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                onClick={() => markSectionComplete(6)}
                className="w-full"
              >
                Continue
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Section 7: Photo Upload */}
        <Card className={`transition-all ${expandedSection === 7 ? "ring-2 ring-primary/20" : ""}`}>
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => toggleSection(7)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${completedSections.includes(7)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                    }`}
                >
                  {completedSections.includes(7) ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </div>
                <CardTitle className="text-base">Section 7: Photo Upload</CardTitle>
              </div>
              {expandedSection === 7 ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          {expandedSection === 7 && (
            <CardContent className="space-y-4 pt-0">
              <p className="text-sm text-muted-foreground">
                Capture a photo of your F2F meeting with the client (optional)
              </p>

              <div className="space-y-2">
                <Label>F2F Meeting Photo with Client</Label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  ref={fileInputRefs.clientMeeting}
                  onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                />
                {uploadedFile ? (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm truncate flex-1">
                      {uploadedFile.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadedFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRefs.clientMeeting.current?.click()}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                  </Button>
                )}
              </div>

              <Button
                type="button"
                onClick={() => markSectionComplete(7)}
                className="w-full"
              >
                Continue
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Add Another Project Information */}

        {/* Submit Button */}
        <div className="pt-4 pb-8">
          <Button
            type="submit"
            className="w-full h-12 text-base"
            disabled={isSubmitting || [1, 2, 3, 4, 5, 6].some((id) => !completedSections.includes(id))}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Submitting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Submit Field Report
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
