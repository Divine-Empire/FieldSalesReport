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
  Users,
  ArrowRight,
  Camera,
  MessageSquare,
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
  "Akshat Kumar",
  "Anil Kumar Nayak",
  "Aninda Ganguly",
  "Ankita Yadav",
  "Anshika Lalwani",
  "Bharti Sahu",
  "Deepak Vishwakarma",
  "Ganga Dhritlahare",
  "Geeta Bhiwagade",
  "Hitesh Ganware",
  "Khushi Khemani",
  "Krishna Jangde",
  "Kritika Gupta",
  "Kuleshwar Prasad Yadav",
  "Prakash Sonwani",
  "Pranav Vinayakrao Bhogawar",
  "Priya Swarnkar",
  "Radhika Chaudhary",
  "Rani Yadav",
  "Rishab Ritesh Swain",
  "Sameer Shankar Bilampalli",
  "Samiran Rajbongshi",
  "Sarita Baghel",
  "Sarita Nand",
  "Suman Sonwani",
  "Suraj Kumar",
  "Suresh Kumar",
  "Suruchi Singhania",
  "Yogendra Kumar",
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

interface ReportState {
  id: number
  expandedSection: number
  completedSections: number[]
  companyName: string
  contacts: ContactEntry[]
  hasEnquiry: string
  isCollapsed: boolean
}

function createNewReport(id: number): ReportState {
  return {
    id,
    expandedSection: 1,
    completedSections: [],
    companyName: "",
    contacts: [{ designation: "", contactPerson: "", contactMobile: "" }],
    hasEnquiry: "",
    isCollapsed: false,
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
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`
          )
          const data = await res.json()
          const addr = data.address || {}
          const locationName =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.suburb ||
            addr.county ||
            data.display_name ||
            `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          setLiveLocation(locationName)
        } catch {
          setLiveLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        } finally {
          setLocationLoading(false)
        }
      }

      const watchId = navigator.geolocation.watchPosition(
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

      return () => navigator.geolocation.clearWatch(watchId)
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

  const [reports, setReports] = useState<ReportState[]>([createNewReport(1)])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const fileInputRefs = {
    visitingCard: useRef<HTMLInputElement>(null),
    projectSite: useRef<HTMLInputElement>(null),
    clientMeeting: useRef<HTMLInputElement>(null),
  }

  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File | null }>({
    visitingCard: null,
    projectSite: null,
    clientMeeting: null,
  })

  const updateReport = (reportId: number, updates: Partial<ReportState>) => {
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, ...updates } : r))
    )
  }

  const toggleSection = (reportId: number, sectionId: number) => {
    const report = reports.find((r) => r.id === reportId)
    if (report) {
      updateReport(reportId, {
        expandedSection: report.expandedSection === sectionId ? 0 : sectionId,
      })
    }
  }

  const markSectionComplete = (reportId: number, sectionId: number) => {
    const report = reports.find((r) => r.id === reportId)
    if (report) {
      const newCompleted = report.completedSections.includes(sectionId)
        ? report.completedSections
        : [...report.completedSections, sectionId]
      updateReport(reportId, {
        completedSections: newCompleted,
        expandedSection: sectionId < 7 ? sectionId + 1 : report.expandedSection,
      })
    }
  }

  const addContact = (reportId: number) => {
    const report = reports.find((r) => r.id === reportId)
    if (report) {
      updateReport(reportId, {
        contacts: [...report.contacts, { designation: "", contactPerson: "", contactMobile: "" }],
      })
    }
  }

  const removeContact = (reportId: number, index: number) => {
    const report = reports.find((r) => r.id === reportId)
    if (report && report.contacts.length > 1) {
      updateReport(reportId, {
        contacts: report.contacts.filter((_, i) => i !== index),
      })
    }
  }

  const updateContact = (reportId: number, index: number, field: keyof ContactEntry, value: string) => {
    const report = reports.find((r) => r.id === reportId)
    if (report) {
      const updated = [...report.contacts]
      updated[index] = { ...updated[index], [field]: value }
      updateReport(reportId, { contacts: updated })
    }
  }

  const handleFileUpload = (type: keyof typeof uploadedFiles, file: File | null) => {
    setUploadedFiles((prev) => ({ ...prev, [type]: file }))
  }

  const addNewReport = () => {
    const lastReport = reports[reports.length - 1]
    // Collapse the last report
    updateReport(lastReport.id, { isCollapsed: true, expandedSection: 0 })
    const newId = lastReport.id + 1
    setReports((prev) => [...prev, createNewReport(newId)])
  }

  const toggleReportCollapse = (reportId: number) => {
    const report = reports.find((r) => r.id === reportId)
    if (report) {
      updateReport(reportId, { isCollapsed: !report.isCollapsed })
    }
  }

  const deleteReport = (reportId: number) => {
    if (reports.length > 1) {
      setReports((prev) => prev.filter((r) => r.id !== reportId))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  // Calculate total progress
  const totalSections = reports.length * 7
  const totalCompleted = reports.reduce((sum, r) => sum + r.completedSections.length, 0)

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
              {reports.length} field visit report{reports.length > 1 ? "s" : ""} successfully recorded.
            </p>
            <Button
              onClick={() => {
                setIsSubmitted(false)
                setReports([createNewReport(1)])
                setUploadedFiles({
                  visitingCard: null,
                  projectSite: null,
                  clientMeeting: null,
                })
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
            <span>{reports.length} Report{reports.length > 1 ? "s" : ""} — {totalCompleted} of {totalSections} sections completed</span>
            <span>{Math.round((totalCompleted / totalSections) * 100)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${(totalCompleted / totalSections) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {reports.map((report, reportIndex) => (
          <div key={report.id} className="space-y-3">
            {/* Report Header */}
            <div
              className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3 cursor-pointer"
              onClick={() => toggleReportCollapse(report.id)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${report.completedSections.length === 7
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                  }`}>
                  {report.completedSections.length === 7 ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-semibold">{reportIndex + 1}</span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    Field Sales Report #{reportIndex + 1}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {report.completedSections.length}/7 sections completed
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {reports.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteReport(report.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                {report.isCollapsed ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>

            {!report.isCollapsed && (
              <>
                {/* Section 1: Sales Executive Details */}
                <Card className={`transition-all ${report.expandedSection === 1 ? "ring-2 ring-primary/20" : ""}`}>
                  <CardHeader
                    className="cursor-pointer select-none"
                    onClick={() => toggleSection(report.id, 1)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${report.completedSections.includes(1)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                            }`}
                        >
                          {report.completedSections.includes(1) ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </div>
                        <CardTitle className="text-base">Section 1: Sales Executive Details</CardTitle>
                      </div>
                      {report.expandedSection === 1 ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {report.expandedSection === 1 && (
                    <CardContent className="space-y-4 pt-0">
                      <div className="space-y-2">
                        <Label>Sales Person Name *</Label>
                        <Select>
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
                        <Label>Date and Time of Visit *</Label>
                        <Input
                          type="text"
                          value={formatDateTime(currentDateTime)}
                          readOnly
                          className="bg-muted font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>City / Location of Visit *</Label>
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
                        onClick={() => markSectionComplete(report.id, 1)}
                        className="w-full"
                      >
                        Continue
                      </Button>
                    </CardContent>
                  )}
                </Card>

                {/* Section 2: Visit Type */}
                <Card className={`transition-all ${report.expandedSection === 2 ? "ring-2 ring-primary/20" : ""}`}>
                  <CardHeader
                    className="cursor-pointer select-none"
                    onClick={() => toggleSection(report.id, 2)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${report.completedSections.includes(2)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                            }`}
                        >
                          {report.completedSections.includes(2) ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <MapPin className="h-4 w-4" />
                          )}
                        </div>
                        <CardTitle className="text-base">Section 2: Visit Type</CardTitle>
                      </div>
                      {report.expandedSection === 2 ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {report.expandedSection === 2 && (
                    <CardContent className="space-y-4 pt-0">
                      <div className="space-y-2">
                        <Label>Type of Visit *</Label>
                        <Select>
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
                        onClick={() => markSectionComplete(report.id, 2)}
                        className="w-full"
                      >
                        Continue
                      </Button>
                    </CardContent>
                  )}
                </Card>

                {/* Section 3: Client / Company Details */}
                <Card className={`transition-all ${report.expandedSection === 3 ? "ring-2 ring-primary/20" : ""}`}>
                  <CardHeader
                    className="cursor-pointer select-none"
                    onClick={() => toggleSection(report.id, 3)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${report.completedSections.includes(3)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                            }`}
                        >
                          {report.completedSections.includes(3) ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Building2 className="h-4 w-4" />
                          )}
                        </div>
                        <CardTitle className="text-base">Section 3: Client / Company Details</CardTitle>
                      </div>
                      {report.expandedSection === 3 ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {report.expandedSection === 3 && (
                    <CardContent className="space-y-4 pt-0">
                      <div className="space-y-2">
                        <Label>Client / Company Name *</Label>
                        <Input
                          value={report.companyName}
                          onChange={(e) => updateReport(report.id, { companyName: e.target.value })}
                          placeholder="Enter company name"
                        />
                      </div>
                      {report.contacts.map((contact, index) => (
                        <div key={index} className="space-y-3 p-3 border border-border rounded-lg relative">
                          {report.contacts.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 h-7 w-7 p-0"
                              onClick={() => removeContact(report.id, index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          <p className="text-sm font-medium text-muted-foreground">
                            Contact {index + 1}
                          </p>
                          <div className="space-y-2">
                            <Label>Designation *</Label>
                            <Select
                              value={contact.designation}
                              onValueChange={(val) => updateContact(report.id, index, "designation", val)}
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
                            <Label>Contact Person Name *</Label>
                            <Input
                              value={contact.contactPerson}
                              onChange={(e) => updateContact(report.id, index, "contactPerson", e.target.value)}
                              placeholder="Enter contact person name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Contact Person Mobile *</Label>
                            <Input
                              type="tel"
                              value={contact.contactMobile}
                              onChange={(e) => updateContact(report.id, index, "contactMobile", e.target.value)}
                              placeholder="Enter mobile number"
                            />
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addContact(report.id)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another Contact
                      </Button>
                      <div className="space-y-2">
                        <Label>Nature of Business *</Label>
                        <Select>
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
                        onClick={() => markSectionComplete(report.id, 3)}
                        className="w-full"
                      >
                        Continue
                      </Button>
                    </CardContent>
                  )}
                </Card>

                {/* Section 4: Project Information */}
                <Card className={`transition-all ${report.expandedSection === 4 ? "ring-2 ring-primary/20" : ""}`}>
                  <CardHeader
                    className="cursor-pointer select-none"
                    onClick={() => toggleSection(report.id, 4)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${report.completedSections.includes(4)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                            }`}
                        >
                          {report.completedSections.includes(4) ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <HardHat className="h-4 w-4" />
                          )}
                        </div>
                        <CardTitle className="text-base">Section 4: Project Information</CardTitle>
                      </div>
                      {report.expandedSection === 4 ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {report.expandedSection === 4 && (
                    <CardContent className="space-y-4 pt-0">
                      <div className="space-y-2">
                        <Label>Project Name</Label>
                        <Input placeholder="Enter project name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Project Location</Label>
                        <Input placeholder="Enter project location" />
                      </div>
                      <div className="space-y-2">
                        <Label>Nature of Project</Label>
                        <Select>
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
                        <Select>
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
                          placeholder="Enter remarks about the project..."
                          className="min-h-[80px]"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={() => markSectionComplete(report.id, 4)}
                        className="w-full"
                      >
                        Save
                      </Button>
                    </CardContent>
                  )}
                </Card>

                {/* Section 5: Enquiry Details */}
                <Card className={`transition-all ${report.expandedSection === 5 ? "ring-2 ring-primary/20" : ""}`}>
                  <CardHeader
                    className="cursor-pointer select-none"
                    onClick={() => toggleSection(report.id, 5)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${report.completedSections.includes(5)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                            }`}
                        >
                          {report.completedSections.includes(5) ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <ClipboardList className="h-4 w-4" />
                          )}
                        </div>
                        <CardTitle className="text-base">Section 5: Enquiry Details</CardTitle>
                      </div>
                      {report.expandedSection === 5 ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {report.expandedSection === 5 && (
                    <CardContent className="space-y-4 pt-0">
                      <div className="space-y-3">
                        <Label>Did you receive any enquiry? *</Label>
                        <RadioGroup
                          value={report.hasEnquiry}
                          onValueChange={(val) => updateReport(report.id, { hasEnquiry: val })}
                          className="flex gap-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id={`enquiry-yes-${report.id}`} />
                            <Label htmlFor={`enquiry-yes-${report.id}`} className="font-normal cursor-pointer">
                              Yes
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id={`enquiry-no-${report.id}`} />
                            <Label htmlFor={`enquiry-no-${report.id}`} className="font-normal cursor-pointer">
                              No
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                      {report.hasEnquiry === "yes" && (
                        <>
                          <div className="space-y-2">
                            <Label>Product Interested In *</Label>
                            <Input placeholder="Enter product name" />
                          </div>
                          <div className="space-y-2">
                            <Label>Quantity Required *</Label>
                            <Input placeholder="Enter quantity" />
                          </div>
                          <div className="space-y-2">
                            <Label>Expected Purchase Time *</Label>
                            <Select>
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
                        onClick={() => markSectionComplete(report.id, 5)}
                        className="w-full"
                      >
                        Continue
                      </Button>
                    </CardContent>
                  )}
                </Card>

                {/* Section 6: Order Probability */}
                <Card className={`transition-all ${report.expandedSection === 6 ? "ring-2 ring-primary/20" : ""}`}>
                  <CardHeader
                    className="cursor-pointer select-none"
                    onClick={() => toggleSection(report.id, 6)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${report.completedSections.includes(6)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                            }`}
                        >
                          {report.completedSections.includes(6) ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Target className="h-4 w-4" />
                          )}
                        </div>
                        <CardTitle className="text-base">Section 6: Order Probability</CardTitle>
                      </div>
                      {report.expandedSection === 6 ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {report.expandedSection === 6 && (
                    <CardContent className="space-y-4 pt-0">
                      <div className="space-y-2">
                        <Label>Order Probability *</Label>
                        <Select>
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
                        onClick={() => markSectionComplete(report.id, 6)}
                        className="w-full"
                      >
                        Continue
                      </Button>
                    </CardContent>
                  )}
                </Card>

                {/* Section 7: Photo Upload */}
                <Card className={`transition-all ${report.expandedSection === 7 ? "ring-2 ring-primary/20" : ""}`}>
                  <CardHeader
                    className="cursor-pointer select-none"
                    onClick={() => toggleSection(report.id, 7)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${report.completedSections.includes(7)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                            }`}
                        >
                          {report.completedSections.includes(7) ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Camera className="h-4 w-4" />
                          )}
                        </div>
                        <CardTitle className="text-base">Section 7: Photo Upload</CardTitle>
                      </div>
                      {report.expandedSection === 7 ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {report.expandedSection === 7 && (
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
                          onChange={(e) =>
                            handleFileUpload("clientMeeting", e.target.files?.[0] || null)
                          }
                        />
                        {uploadedFiles.clientMeeting ? (
                          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <span className="text-sm truncate flex-1">
                              {uploadedFiles.clientMeeting.name}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFileUpload("clientMeeting", null)}
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
                        onClick={() => markSectionComplete(report.id, 7)}
                        className="w-full"
                      >
                        Continue
                      </Button>
                    </CardContent>
                  )}
                </Card>
              </>
            )}
          </div>
        ))}

        {/* Add Another Report Button */}
        <Button
          type="button"
          variant="outline"
          onClick={addNewReport}
          className="w-full h-12 text-base border-dashed border-2"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Another Field Sales Report
        </Button>

        {/* Submit Button */}
        <div className="pt-4 pb-8">
          <Button
            type="submit"
            className="w-full h-12 text-base"
            disabled={isSubmitting}
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
                Submit {reports.length > 1 ? `All ${reports.length} Reports` : "Field Report"}
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
