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
  Upload,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { compressImage } from "@/lib/image-compressor"



const VISIT_TYPES = [
  "New F2F Assign By MDO",
  "Existing Client Assign By MDO",
  "Existing Client",
  "NBD Client",
]

const DESIGNATIONS = [
  "Owner",
  "Project Manager",
  "Purchase",
  "QC",
  "Surveyor",
  "Site Supervisor",
  "Other",
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

const BALANCE_WORK_PERCENTAGES = [
  "0%-25%",
  "25%-50%",
  "50%-75%",
  "75%-100%",
]

const PROJECT_VALUES = [
  "0 – 50 Cr",
  "50 – 100 Cr",
  "100 – 250 Cr",
  "250 – 500 Cr",
  "500 Cr & Above",
]

const PURCHASE_TIMES = [
  "Immediate",
  "Within 1 Month",
  "Within 3 Months",
  "Within 6 Months",
  "Not Sure",
]

const ORDER_PROBABILITY = ["Hot", "Warm", "Cold"]

const ENQUIRY_VALUES = [
  "0 – 1 Lakh",
  "1 – 3 Lakh",
  "3 – 5 Lakh",
  "5 Lakh & Above",
]

interface ContactEntry {
  designation: string
  otherDesignation?: string
  contactPerson: string
  contactMobile: string
}

interface ProjectEntry {
  id: number
  projectName: string
  projectLocation: string
  natureOfProject: string
  balanceWork: string
  projectValue: string
  remarks: string
}

interface FormSection {
  id: number
  title: string
  icon: React.ReactNode
}

const SECTIONS: FormSection[] = [
  { id: 1, title: "Sales Executive Details", icon: <User className="h-5 w-5" /> },
  { id: 2, title: "Visit & Client Details", icon: <Building2 className="h-5 w-5" /> },
  { id: 3, title: "Project & Enquiry Details", icon: <ClipboardList className="h-5 w-5" /> },
]

function createNewProject(id: number): ProjectEntry {
  return {
    id,
    projectName: "",
    projectLocation: "",
    natureOfProject: "",
    balanceWork: "",
    projectValue: "",
    remarks: "",
  }
}

export default function FieldSalesForm() {
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null)
  const [liveLocation, setLiveLocation] = useState<string>("")
  const [locationLoading, setLocationLoading] = useState<boolean>(true)
  const [coordinates, setCoordinates] = useState<{ latitude: number | null; longitude: number | null }>({
    latitude: null,
    longitude: null,
  })
  const [submittedSerialCode, setSubmittedSerialCode] = useState<string>("")

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
          setCoordinates({ latitude, longitude })
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
  const [assignedCompanies, setAssignedCompanies] = useState<string[]>([])
  const [contacts, setContacts] = useState<ContactEntry[]>([
    { designation: "", otherDesignation: "", contactPerson: "", contactMobile: "" },
  ])
  const [natureOfBusiness, setNatureOfBusiness] = useState("")
  const [projects, setProjects] = useState<ProjectEntry[]>([createNewProject(1)])
  const [hasEnquiry, setHasEnquiry] = useState<string>("")
  const [productInterested, setProductInterested] = useState("")
  const [otherProductInterested, setOtherProductInterested] = useState("")
  const [enquiryValue, setEnquiryValue] = useState("")
  const [quantityRequired, setQuantityRequired] = useState("")
  const [expectedPurchaseTime, setExpectedPurchaseTime] = useState("")
  const [orderProbability, setOrderProbability] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Auto-scroll when section expands
  useEffect(() => {
    if (expandedSection > 0) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`section-${expandedSection}`)
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [expandedSection])

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const fileInputRefs = {
    clientMeeting: useRef<HTMLInputElement>(null),
  }

  const [salesExecutives, setSalesExecutives] = useState<string[]>([])
  const [visitTypes, setVisitTypes] = useState<string[]>(VISIT_TYPES)
  const [designationList, setDesignationList] = useState<string[]>(DESIGNATIONS)
  const [natureOfBusinessList, setNatureOfBusinessList] = useState<string[]>(NATURE_OF_BUSINESS)
  const [natureOfProjectList, setNatureOfProjectList] = useState<string[]>([])
  const [productList, setProductList] = useState<string[]>([])
  const [loadingDropdowns, setLoadingDropdowns] = useState<boolean>(true)

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        setLoadingDropdowns(true)
        const { data, error } = await supabase
          .from("lto_dropdown")
          .select("category, value")
          .in("category", [
            "fos_sales_person_name",
            "fos_type_of_visit",
            "fos_designation",
            "fos_nature_of_business",
            "fos_nature_of_project",
            "fos_product_interested",
          ])
          .order("created_at", { ascending: true })

        if (error) {
          console.error("Error loading dropdowns from Supabase:", error)
          return
        }

        if (data && data.length > 0) {
          const salesNames: string[] = []
          const visits: string[] = []
          const desigs: string[] = []
          const businesses: string[] = []
          const projectNatures: string[] = []
          const products: string[] = []

          data.forEach((item) => {
            const val = item.value?.trim()
            if (!val) return
            if (item.category === "fos_sales_person_name") salesNames.push(val)
            else if (item.category === "fos_type_of_visit") visits.push(val)
            else if (item.category === "fos_designation") desigs.push(val)
            else if (item.category === "fos_nature_of_business") businesses.push(val)
            else if (item.category === "fos_nature_of_project") projectNatures.push(val)
            else if (item.category === "fos_product_interested") products.push(val)
          })

          if (salesNames.length > 0) setSalesExecutives(salesNames)
          if (visits.length > 0) setVisitTypes(visits)
          if (desigs.length > 0) setDesignationList(desigs)
          if (businesses.length > 0) setNatureOfBusinessList(businesses)
          if (projectNatures.length > 0) setNatureOfProjectList(projectNatures)
          if (products.length > 0) setProductList(products)
        }
      } catch (err) {
        console.error("Error loading dropdowns from Supabase:", err)
      } finally {
        setLoadingDropdowns(false)
      }
    }

    fetchDropdowns()
  }, [])

  // When salesPerson changes, fetch their open assigned companies for the combo dropdown
  useEffect(() => {
    if (!salesPerson) { setAssignedCompanies([]); return }
    supabase
      .from("lto_assigned_to_field_person")
      .select("company_name")
      .eq("status", "Open")
      .contains("assigned_to", [salesPerson])
      .then(({ data }) => {
        const names = [...new Set((data || []).map((r: { company_name: string }) => r.company_name).filter(Boolean))]
        setAssignedCompanies(names)
      })
  }, [salesPerson])

  const toggleSection = (sectionId: number) => {
    setExpandedSection(expandedSection === sectionId ? 0 : sectionId)
  }

  const markSectionComplete = (sectionId: number) => {
    // Validation for Section 1
    if (sectionId === 1) {
      if (!salesPerson) {
        alert("Please select a Sales Person Name")
        return
      }
      if (!liveLocation || liveLocation === "Detecting location..." || liveLocation === "Location unavailable" || liveLocation === "Location not supported") {
        alert("Please wait for location to be detected or ensure location services are enabled")
        return
      }
    }

    // Validation for Section 2
    if (sectionId === 2) {
      if (!visitType) {
        alert("Please select a Type of Visit")
        return
      }
    }

    if (!completedSections.includes(sectionId)) {
      setCompletedSections([...completedSections, sectionId])
    }
    if (sectionId < 3) {
      setExpandedSection(sectionId + 1)
    }
  }

  // Contact functions
  const addContact = () => {
    setContacts([...contacts, { designation: "", otherDesignation: "", contactPerson: "", contactMobile: "" }])
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

    // Final validation
    if (!salesPerson) {
      alert("Please select a Sales Person Name")
      setExpandedSection(1)
      return
    }
    if (!liveLocation || liveLocation === "Detecting location..." || liveLocation === "Location unavailable" || liveLocation === "Location not supported") {
      alert("Location is required. Please ensure location services are enabled.")
      setExpandedSection(1)
      return
    }
    if (!visitType) {
      alert("Please select a Type of Visit in Section 2.")
      setExpandedSection(2)
      return
    }

    setIsSubmitting(true)

    try {
      let fileUrl = ""
      if (uploadedFile) {
        try {
          // 1. Client-side Image Compression (Reduces 10MB to <400KB in milliseconds)
          const compressedFile = await compressImage(uploadedFile)
          const fileExt = compressedFile.name.split(".").pop() || "jpg"
          const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`
          const storagePath = `f2f_photos/${cleanFileName}`

          // 2. Upload to Supabase Storage Bucket: field_sales_attachments
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("field_sales_attachments")
            .upload(storagePath, compressedFile, {
              cacheControl: "3600",
              upsert: false,
            })

          if (uploadError) {
            throw uploadError
          } else if (uploadData) {
            const { data: publicUrlData } = supabase.storage
              .from("field_sales_attachments")
              .getPublicUrl(uploadData.path)
            fileUrl = publicUrlData.publicUrl
          }
        } catch (uploadErr) {
          console.error("Image compression or upload error:", uploadErr)
          const proceed = window.confirm(
            "Photo upload failed. Submit the report without the photo?\n\nOK = submit without photo, Cancel = stay and retry."
          )
          if (!proceed) {
            setIsSubmitting(false)
            return
          }
        }
      }

      // Local (device) time, same DD/MM/YYYY hh:mm:ss format shown in the form
      const visitTime = formatDateTime(currentDateTime)

      // 3. Prepare Payload for Atomic Multi-Table Insertion
      const formPayload = {
        sales_person_name: salesPerson,
        visit_datetime: visitTime,
        city_location: liveLocation,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        visit_type: visitType,
        company_name: companyName,
        nature_of_business: natureOfBusiness,
        has_enquiry: hasEnquiry ? hasEnquiry.charAt(0).toUpperCase() + hasEnquiry.slice(1) : "",
        product_interested: productInterested === "OTHER" ? otherProductInterested : productInterested,
        quantity_required: quantityRequired,
        enquiry_value: enquiryValue,
        expected_purchase_time: expectedPurchaseTime,
        order_probability: orderProbability,
        f2f_meeting_photo_url: fileUrl,
      }

      const contactsPayload = contacts
        .filter((c) => c.contactPerson || c.contactMobile || c.designation)
        .map((c) => ({
          designation: c.designation === "Other" ? (c.otherDesignation || "Other") : (c.designation || ""),
          other_designation: c.otherDesignation || "",
          contact_person_name: c.contactPerson || "",
          contact_person_mobile: c.contactMobile || "",
        }))

      const projectsPayload = projects
        .filter((p) => p.projectName || p.projectLocation || p.remarks)
        .map((p) => ({
          project_name: p.projectName || "",
          project_location: p.projectLocation || "",
          nature_of_project: p.natureOfProject || "",
          percentage_balance_work: p.balanceWork || "",
          project_value: p.projectValue || "",
          remarks: p.remarks || "",
        }))

      // 4. Atomic Database Transaction via Stored Procedure
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        "submit_field_sales_report",
        {
          form_payload: formPayload,
          contacts_payload: contactsPayload,
          projects_payload: projectsPayload,
        }
      )

      if (rpcError) {
        console.error("Supabase RPC error:", rpcError)
        alert(`Error submitting report: ${rpcError.message || "Unknown error"}`)
        setIsSubmitting(false)
        return
      }

      if (rpcResult && rpcResult.serial_code) {
        setSubmittedSerialCode(rpcResult.serial_code)
      }

      // Auto-close the open assignment if company matches one assigned to this salesperson
      if (salesPerson && companyName && assignedCompanies.includes(companyName)) {
        await supabase
          .from("lto_assigned_to_field_person")
          .update({ status: "Closed", updated_at: new Date().toISOString() })
          .eq("status", "Open")
          .eq("company_name", companyName)
          .contains("assigned_to", [salesPerson])
      }

      setIsSubmitting(false)
      setIsSubmitted(true)
    } catch (error: any) {
      console.error("Submission error:", error)
      alert(`Error submitting report: ${error?.message || "Please try again."}`)
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
            {submittedSerialCode && (
              <div className="my-4 p-3 bg-primary/5 border border-primary/20 rounded-lg inline-block">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Report Reference Code
                </span>
                <span className="text-2xl font-mono font-bold text-primary">
                  {submittedSerialCode}
                </span>
              </div>
            )}
            <p className="text-muted-foreground mb-6">
              Your field visit report has been successfully recorded in the system.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="w-full h-12 text-base"
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
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-border">
              <img src="/logo.jpeg" alt="Divine Empire Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Field Sales Report</h1>
              <p className="text-sm text-muted-foreground">Divine Empire India Pvt. Ltd</p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>{completedSections.length} of 3 sections completed</span>
            <span>{Math.round((completedSections.length / 3) * 100)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${(completedSections.length / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
        {/* Section 1: Sales Executive Details */}
        <Card id="section-1" className={`transition-all border-none sm:border shadow-sm sm:shadow-md scroll-mt-24 ${expandedSection === 1 ? "ring-2 ring-primary/20" : ""}`}>
          <CardHeader
            className="cursor-pointer select-none p-4 sm:p-6"
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
                <Label>Sales Person Name <span className="text-destructive">*</span></Label>
                <Select value={salesPerson} onValueChange={setSalesPerson} disabled={loadingDropdowns}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={loadingDropdowns ? "Loading names..." : "Select your name"} />
                  </SelectTrigger>
                  <SelectContent>
                    {salesExecutives.map((name) => (
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
                  className="bg-muted font-mono h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>City / Location of Visit <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input
                    value={locationLoading ? "Detecting location..." : liveLocation}
                    readOnly
                    className="bg-muted pr-10 cursor-not-allowed h-11"
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

        {/* Section 2: Visit & Client Details (Merged old Section 2 and 3) */}
        <Card id="section-2" className={`transition-all sm:border shadow-sm sm:shadow-md scroll-mt-24 ${expandedSection === 2 ? "ring-2 ring-primary/20" : ""}`}>
          <CardHeader
            className="cursor-pointer select-none p-4 sm:p-6"
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
                    <Building2 className="h-4 w-4" />
                  )}
                </div>
                <CardTitle className="text-base">Section 2: Visit & Client Details</CardTitle>
              </div>
              {expandedSection === 2 ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          {expandedSection === 2 && (
            <CardContent className="space-y-6 pt-0 p-4 sm:p-6 sm:pt-0">
              {/* Visit Type Fields (Old Section 2) */}
              <div className="space-y-4 pb-4 border-b border-border">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Type of Visit <span className="text-destructive">*</span>
                  </Label>
                  <Select value={visitType} onValueChange={setVisitType}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select visit type" />
                    </SelectTrigger>
                    <SelectContent>
                      {visitTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Client / Company Details (Old Section 3) */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Client / Company Name</Label>
                  {/* Combo: shows assigned open companies as suggestions, allows free-text too */}
                  <input
                    list="assigned-companies-list"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder={assignedCompanies.length > 0 ? "Select assigned company or type new" : "Enter company name"}
                    className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                  <datalist id="assigned-companies-list">
                    {assignedCompanies.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                  {assignedCompanies.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {assignedCompanies.length} assigned {assignedCompanies.length === 1 ? "company" : "companies"} available
                    </p>
                  )}
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
                      <Select
                        value={contact.designation}
                        onValueChange={(val) => updateContact(index, "designation", val)}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select designation" />
                        </SelectTrigger>
                        <SelectContent>
                          {designationList.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {contact.designation === "Other" && (
                        <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                          <Input
                            placeholder="Type designation here..."
                            value={contact.otherDesignation || ""}
                            onChange={(e) => updateContact(index, "otherDesignation", e.target.value)}
                            className="h-11"
                          />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Person Name</Label>
                      <Input
                        value={contact.contactPerson}
                        onChange={(e) => updateContact(index, "contactPerson", e.target.value)}
                        placeholder="Enter contact person name"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Person Mobile</Label>
                      <Input
                        type="tel"
                        value={contact.contactMobile}
                        onChange={(e) => updateContact(index, "contactMobile", e.target.value)}
                        placeholder="Enter mobile number"
                        className="h-11"
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
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select nature of business" />
                    </SelectTrigger>
                    <SelectContent>
                      {natureOfBusinessList.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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

        {/* Section 3: Project & Enquiry Details (Merged old Sections 4, 5, 6, and 7) */}
        <Card id="section-3" className={`transition-all border-none sm:border shadow-sm sm:shadow-md scroll-mt-24 ${expandedSection === 3 ? "ring-2 ring-primary/20" : ""}`}>
          <CardHeader
            className="cursor-pointer select-none p-4 sm:p-6"
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
                    <ClipboardList className="h-4 w-4" />
                  )}
                </div>
                <CardTitle className="text-base">Section 3: Project & Enquiry Details</CardTitle>
              </div>
              {expandedSection === 3 ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          {expandedSection === 3 && (
            <CardContent className="space-y-8 pt-0 p-4 sm:p-6 sm:pt-0">
              
              {/* Project Information (Old Section 4) */}
              <div className="space-y-4 pb-6 border-b border-border">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Project Information</h3>
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
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Project Location</Label>
                      <Input
                        value={project.projectLocation}
                        onChange={(e) => updateProject(project.id, "projectLocation", e.target.value)}
                        placeholder="Enter project location"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nature of Project</Label>
                      <Select
                        value={project.natureOfProject}
                        onValueChange={(val) => updateProject(project.id, "natureOfProject", val)}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select nature of project" />
                        </SelectTrigger>
                        <SelectContent>
                          {natureOfProjectList.map((type) => (
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
                        <SelectTrigger className="h-11">
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
                      <Label>Project Value</Label>
                      <Select
                        value={project.projectValue}
                        onValueChange={(val) => updateProject(project.id, "projectValue", val)}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select project value" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROJECT_VALUES.map((val) => (
                            <SelectItem key={val} value={val}>
                              {val}
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
              </div>

              {/* Enquiry Details (Old Section 5) */}
              <div className="space-y-4 pb-6 border-b border-border">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Enquiry Details</h3>
                <div className="space-y-3">
                  <Label>Did you receive any enquiry?</Label>
                  <RadioGroup
                    value={hasEnquiry}
                    onValueChange={setHasEnquiry}
                    className="flex flex-wrap gap-4 sm:gap-6"
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
                      <Label>Product Interested</Label>
                      <Select value={productInterested} onValueChange={setProductInterested}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {productList.map((product) => (
                            <SelectItem key={product} value={product}>
                              {product}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {productInterested === "OTHER" && (
                        <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                          <Input
                            placeholder="Type product name here..."
                            value={otherProductInterested}
                            onChange={(e) => setOtherProductInterested(e.target.value)}
                            className="h-11"
                          />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Enquiry Value</Label>
                      <Select value={enquiryValue} onValueChange={setEnquiryValue}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select enquiry value" />
                        </SelectTrigger>
                        <SelectContent>
                          {ENQUIRY_VALUES.map((val) => (
                            <SelectItem key={val} value={val}>
                              {val}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity Required</Label>
                      <Input 
                        value={quantityRequired} 
                        onChange={(e) => setQuantityRequired(e.target.value)} 
                        placeholder="Enter quantity" 
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Expected Purchase Time</Label>
                      <Select value={expectedPurchaseTime} onValueChange={setExpectedPurchaseTime}>
                        <SelectTrigger className="h-11">
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
              </div>

              {/* Order Probability (Old Section 6) */}
              <div className="space-y-4 pb-6 border-b border-border">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Order Probability</h3>
                <div className="space-y-2">
                  <Label>Order Probability</Label>
                  <Select value={orderProbability} onValueChange={setOrderProbability}>
                    <SelectTrigger className="h-11">
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
              </div>

              {/* Photo Upload (Old Section 7) */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Photo Upload</h3>
                <p className="text-sm text-muted-foreground">
                  Upload an image of your F2F meeting with the client (optional)
                </p>

                <div className="space-y-2">
                  <Label>F2F Meeting Photo with Client</Label>
                  <input
                    type="file"
                    accept="image/*"
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
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </Button>
                  )}
                </div>
              </div>

              <Button
                type="button"
                onClick={() => markSectionComplete(3)}
                className="w-full"
              >
                Complete All Sections
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Submit Button */}
        <div className="pt-4 pb-8">
          <Button
            type="submit"
            className="w-full h-12 text-base"
            disabled={isSubmitting || [1, 2].some((id) => !completedSections.includes(id))}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
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
