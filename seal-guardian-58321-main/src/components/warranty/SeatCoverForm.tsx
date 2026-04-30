import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import {
  validateEmail,
  getPhoneError,
  getVehicleRegError,
  formatVehicleRegLive
} from "@/lib/validation";
import { getISTTodayISO } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { MobileSelect } from "@/components/ui/mobile-select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Upload, Loader2, HelpCircle, CheckCircle2, FileText, Building2, User, Car, Smartphone, Mail, Package, XCircle, AlertCircle, Armchair, ImageIcon } from "lucide-react";
import CameraCapture from "@/components/ui/CameraCapture";
import { submitWarranty, updateWarranty } from "@/lib/warrantyApi";
import { TermsModal } from "./TermsModal";
import { compressImage, isCompressibleImage } from "@/lib/imageCompression";
import exifr from 'exifr';
import fpPromise from '@fingerprintjs/fingerprintjs';

interface SeatCoverFormProps {
  initialData?: any;
  warrantyId?: string;
  onSuccess?: (result?: any) => void;
  isEditing?: boolean;
  isPublic?: boolean;
  vendorDirect?: boolean;
  products?: any[];
  storeDetails?: {
    id: number;
    store_name: string;
    store_email: string;
    contact_number: string;
    address_line1?: string;
    city?: string;
    state?: string;
    store_code?: string;
    owner_name?: string;
    vendor_details_id?: number;
  };
  installers?: any[];
}

const SeatCoverForm = ({ initialData, warrantyId, onSuccess, isEditing, isPublic, vendorDirect, storeDetails, installers, products: initialProducts }: SeatCoverFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [manpowerList, setManpowerList] = useState<any[]>([]);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  // UID Validation State
  const [uidStatus, setUidStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid' | 'used'>('idle');
  const [uidMessage, setUidMessage] = useState('');
  const uidTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [deviceFingerprint, setDeviceFingerprint] = useState<string | null>(null);
  const [isBrandNew, setIsBrandNew] = useState(initialData?.registration_number === 'APPLIED-FOR');
  const [formData, setFormData] = useState(initialData ? {
    uid: initialData.product_details?.uid || "",
    customerName: initialData.customer_name || "",
    customerEmail: initialData.customer_email || "",
    customerMobile: initialData.customer_phone || "",

    productName: initialData.product_details?.productName || "",
    storeEmail: initialData.installer_contact || "",
    purchaseDate: getISTTodayISO(),
    storeName: initialData.installer_name || "",
    manpowerId: initialData.manpower_id || "",
    carReg: initialData.registration_number || "",
    carYear: initialData.car_year || "",
    warrantyType: initialData.warranty_type || "1 Year",
    invoiceFile: null as File | null,
    vehicleFile: null as File | null,
    seatCoverPhoto: null as File | null,
    carOuterPhoto: null as File | null,
    termsAccepted: true, // Already accepted if editing
    exifData: null as any,
  } : {
    uid: "",
    customerName: "",
    customerEmail: "",
    customerMobile: "",

    productName: "",
    storeEmail: "",
    purchaseDate: getISTTodayISO(),
    storeName: "",
    manpowerId: "",
    carReg: "",
    carYear: "",
    warrantyType: "1 Year",
    invoiceFile: null as File | null,
    vehicleFile: null as File | null,
    seatCoverPhoto: null as File | null,
    carOuterPhoto: null as File | null,
    termsAccepted: false,
    exifData: null as any,
    allExifData: {} as Record<string, any>,
  });

  // Auto-fill customer details for logged-in customers
  useEffect(() => {
    if (user?.role === 'customer') {
      setFormData(prev => ({
        ...prev,
        customerName: user.name || "",
        customerEmail: user.email || "",
        customerMobile: user.phoneNumber || "",
      }));
    }
  }, [user]);

  // Auto-fill vendor/store details for logged-in vendors
  useEffect(() => {
    const fetchVendorDetails = async () => {
      if (user?.role === 'vendor') {
        try {
          // Fetch vendor's own store details
          const response = await api.get('/vendor/profile');
          if (response.data.success && response.data.vendorDetails) {
            const vendorDetails = response.data.vendorDetails;
            setFormData(prev => ({
              ...prev,
              storeName: vendorDetails.store_name || "",
              storeEmail: vendorDetails.store_email || "",
            }));

            // Fetch vendor's manpower list
            const manpowerResponse = await api.get('/vendor/manpower?active=true');
            if (manpowerResponse.data.success) {
              const rawList = manpowerResponse.data.manpower || [];
              const list = rawList.filter((mp: any) => mp.applicator_type === 'seat_cover');

              if (vendorDetails.owner_name && !list.some((mp: any) => mp.name === vendorDetails.owner_name)) {
                list.unshift({
                  id: 'owner',
                  name: vendorDetails.owner_name,
                  manpower_id: 'OWNER',
                  applicator_type: 'Store Owner'
                });
              }
              setManpowerList(list);
            }
          }
        } catch (error) {
          console.error("Failed to fetch vendor details", error);
        }
      }
    };
    fetchVendorDetails();
  }, [user]);

  // Fetch stores on mount
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await api.get('/public/stores');
        if (response.data.success) {
          setStores(response.data.stores);
        }
      } catch (error) {
        console.error("Failed to fetch stores", error);
        toast({
          title: "Failed to Load Stores",
          description: "Could not load store list. Please refresh the page.",
          variant: "destructive",
        });
      }
    };

    const fetchProducts = async () => {
      // Use pre-fetched products if available
      if (initialProducts && initialProducts.length > 0) {
        setProducts(initialProducts);
        return;
      }

      try {
        const response = await api.get('/public/products');
        if (response.data.success) {
          setProducts(response.data.products.filter((p: any) => p.type === 'seat_cover'));
        }
      } catch (error) {
        console.error("Failed to fetch products", error);
        toast({
          title: "Failed to Load Products",
          description: "Could not load product list. Please refresh the page.",
          variant: "destructive",
        });
      }
    };

    if (!isPublic) {
      fetchStores();
    }
    fetchProducts();
  }, [initialProducts, isPublic]);

  // Initialize FingerprintJS
  useEffect(() => {
    const loadFingerprint = async () => {
      try {
        const fp = await fpPromise.load();
        const result = await fp.get();
        setDeviceFingerprint(result.visitorId);
      } catch (err) {
        console.warn("FingerprintJS failed to load:", err);
      }
    };
    loadFingerprint();
  }, []);

  // Auto-fill store details for public QR flow
  useEffect(() => {
    if (isPublic && storeDetails) {
      setFormData(prev => ({
        ...prev,
        storeName: storeDetails.store_name || "",
        storeEmail: storeDetails.store_email || "",
      }));
      if (installers) {
        setManpowerList(installers.filter((mp: any) => ['seat_cover', 'ppf_spf'].includes(mp.applicator_type)));
      }

      // Add owner to manpower list if not already there
      const ownerName = storeDetails.owner_name || storeDetails.store_name || "Store Owner";
      setManpowerList(prev => {
        if (prev.some(mp => mp.name === ownerName)) return prev;
        return [{
          id: 'owner', // Virtual ID
          name: ownerName,
          manpower_id: 'OWNER',
          applicator_type: 'Store Owner'
        }, ...prev];
      });
    }
  }, [isPublic, storeDetails, installers]);

  // Fetch manpower when store changes (only for non-public mode)
  // In public mode, installers are passed as prop and set by the previous effect
  useEffect(() => {
    // Skip in public mode - we already have installers from props
    if (isPublic) return;

    const fetchManpower = async () => {
      const selectedStore = stores.find(s => s.store_name === formData.storeName);
      if (selectedStore) {
        // Auto-fill email
        setFormData(prev => ({ ...prev, storeEmail: selectedStore.store_email, manpowerId: "" }));

        try {
          const manpowerResponse = await api.get(`/public/stores/${selectedStore.vendor_details_id}/manpower?active=true`);
          if (manpowerResponse.data.success) {
            const rawList = manpowerResponse.data.manpower || [];

            // Filter only Seat Cover and PPF specialists
            const list = rawList.filter((mp: any) => ['seat_cover', 'ppf_spf'].includes(mp.applicator_type));

            // Always ensure at least one installer (Owner/Store Name) is available as fallback
            const ownerName = selectedStore.owner_name || selectedStore.store_name || "Store Owner";
            if (!list.some((mp: any) => mp.name === ownerName)) {
              list.unshift({
                id: 'owner-' + selectedStore.vendor_details_id,
                name: ownerName,
                phone_number: selectedStore.phone || "",
                applicator_type: 'Default (Store)',
                is_active: 1
              });
            }
            setManpowerList(list);

            // Auto-select owner if it's the only one and no selection yet
            if (list.length === 1 && list[0].id.toString().startsWith('owner') && !formData.manpowerId) {
              setFormData(prev => ({ ...prev, manpowerId: list[0].id }));
            }
          }
        } catch (error) {
          console.error("Failed to fetch manpower", error);
          setManpowerList([]);
        }
      } else {
        setManpowerList([]);
      }
    };

    if (formData.storeName) {
      fetchManpower();
    }
  }, [formData.storeName, stores, isPublic]);

  // Auto-select warranty type based on product name
  // Auto-select warranty type based on product name
  useEffect(() => {
    const selectedProduct = products.find(p => p.name === formData.productName);
    if (selectedProduct) {
      setFormData(prev => ({
        ...prev,
        warrantyType: selectedProduct.warranty_years,
      }));
    }
  }, [formData.productName, products]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.termsAccepted) {
        toast({
          title: "Terms Required",
          description: "Please accept the terms and conditions to proceed.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!/^[a-zA-Z0-9]{13,30}$/.test(formData.uid)) {
        toast({
          title: "Invalid UID",
          description: "UID must be a 13-30 character alphanumeric string",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // ===== UID Validation against backend =====
      try {
        setUidStatus('checking');
        const excludeParam = warrantyId ? `&excludeId=${warrantyId}` : '';
        const uidCheckRes = await api.get(`/public/warranty/check-uid?uid=${formData.uid}${excludeParam}`);
        if (uidCheckRes.data.success && !uidCheckRes.data.valid) {
          setUidStatus('invalid');
          setUidMessage(uidCheckRes.data.reason);
          toast({
            title: "Invalid UID",
            description: uidCheckRes.data.reason,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        setUidStatus('valid');
        setUidMessage('');
      } catch (uidErr: any) {
        console.error('UID check failed:', uidErr);
        // If the check endpoint itself fails, let the backend submission catch it
        // Don't block submission on network errors for the check
      }

      // Validate Customer Name
      if (!formData.customerName || formData.customerName.trim().length < 2) {
        toast({
          title: "Customer Name Required",
          description: "Please enter the customer's full name",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Validate Customer Mobile
      const phoneError = getPhoneError(formData.customerMobile);
      if (phoneError) {
        toast({
          title: "Invalid Mobile Number",
          description: phoneError,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Validate Customer Email (if provided or required)
      // Note: Email is required for non-vendors and for public flow
      if (isPublic && !formData.customerEmail) {
        toast({
          title: "Email Required",
          description: "Please enter your email address",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      if (formData.customerEmail && !validateEmail(formData.customerEmail)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Validate Product Name (Seat Cover selection)
      if (!formData.productName) {
        toast({
          title: "Product Required",
          description: "Please select a seat cover product",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Validate Store Name (required for non-public flow; public flow auto-fills it)
      if (!formData.storeName) {
        toast({
          title: "Store Required",
          description: "Please select a store / franchise",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Validate Applicator / Installer
      if (!formData.manpowerId) {
        toast({
          title: "Applicator Required",
          description: "Please select an applicator / installer",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Prevent vendor from using their own email as the customer email
      if (user?.role === 'vendor' && formData.customerEmail && user.email && formData.customerEmail.toLowerCase().trim() === user.email.toLowerCase().trim()) {
        toast({
          title: "Invalid Customer Email",
          description: "You cannot use your franchise email address as the customer's email. Please use the actual customer's email.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Validate Purchase / Installation Date
      if (!formData.purchaseDate) {
        toast({
          title: "Date Required",
          description: "Please select the installation / purchase date",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Standard vehicle registration number validation (Indian formats)
      const regError = getVehicleRegError(formData.carReg);
      if (regError) {
        toast({
          title: "Invalid Registration Format",
          description: regError,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }


      // Validate mandatory files for new registration
      if (!warrantyId) {
        if (!formData.invoiceFile) {
          toast({
            title: "Invoice Required",
            description: "Please upload proof of purchase (Invoice / MRP Sticker)",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        if (!formData.vehicleFile) {
          toast({
            title: "Number Plate Photo Required",
            description: "Please capture a photo of the vehicle number plate",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        if (!formData.seatCoverPhoto) {
          toast({
            title: "Seat Cover Photo Required",
            description: "Please capture a photo of the fitted seat cover",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        if (!formData.carOuterPhoto) {
          toast({
            title: "Car Outer Photo Required",
            description: "Please capture a photo of the car exterior",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }



      // Find selected manpower name
      const selectedManpower = manpowerList.find(mp => mp.id === formData.manpowerId);
      const manpowerName = selectedManpower ? selectedManpower.name : "";

      // Prepare warranty data
      const warrantyData = {
        productType: "seat-cover",
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerMobile,
        customerAddress: "N/A",
        registrationNumber: formData.carReg,
        carMake: null,
        carModel: null,
        carYear: formData.carYear || new Date().getFullYear().toString(),
        purchaseDate: formData.purchaseDate,
        warrantyType: formData.warrantyType,
        installerName: formData.storeName,
        installerContact: formData.storeEmail,
        manpowerId: formData.manpowerId || null,
        productDetails: {
          uid: formData.uid,
          productName: formData.productName,
          storeName: formData.storeName,
          storeEmail: formData.storeEmail,
          manpowerId: formData.manpowerId,
          manpowerName: manpowerName,
          exifData: formData.exifData ? { ...formData.exifData, deviceFingerprint } : { deviceFingerprint },
          allExifData: formData.allExifData,
          customerAddress: "N/A",
          invoiceFileName: formData.invoiceFile?.name || null,
          invoiceFile: formData.invoiceFile, // Pass file object for API wrapper
          photos: {
            vehicle: formData.vehicleFile,
            seatCover: formData.seatCoverPhoto,
            carOuter: formData.carOuterPhoto
          }
        },
        vendorDirect: vendorDirect || false,
      };

      // Submit or update warranty registration
      let result;
      if (warrantyId) {
        const response = await updateWarranty(warrantyId, warrantyData);
        result = response;
        toast({
          title: "Success",
          description: result.message || "Warranty registration updated successfully.",
        });
      } else if (isPublic) {
        // Public flow: use public API endpoint
        const formDataPayload = new FormData();

        // Add warranty data fields
        Object.entries(warrantyData).forEach(([key, value]) => {
          if (key === 'productDetails') {
            const pd = value as any;
            // Extract invoice file before stringifying
            const invoiceFile = pd.invoiceFile;
            const pdWithoutFile = { ...pd };
            delete pdWithoutFile.invoiceFile;
            formDataPayload.append('productDetails', JSON.stringify(pdWithoutFile));

            // Append invoice file
            if (invoiceFile instanceof File) formDataPayload.append('invoiceFile', invoiceFile);

            // Append photo files
            if (pd.photos?.vehicle instanceof File) {
              formDataPayload.append('vehiclePhoto', pd.photos.vehicle);
            }
            if (pd.photos?.seatCover instanceof File) {
              formDataPayload.append('seatCoverPhoto', pd.photos.seatCover);
            }
            if (pd.photos?.carOuter instanceof File) {
              formDataPayload.append('carOuterPhoto', pd.photos.carOuter);
            }
          } else if (value !== null && value !== undefined) {
            formDataPayload.append(key, String(value));
          }
        });

        const response = await api.post('/public/warranty/submit', formDataPayload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        result = response.data;
        toast({
          title: "Warranty Submitted!",
          description: result.isNewUser
            ? "Your warranty has been submitted. Check your email for account details!"
            : "Your warranty has been submitted and is awaiting store verification.",
        });
      } else {
        const response = await submitWarranty(warrantyData);
        result = response;
        toast({
          title: "Warranty Registered",
          description: `Warranty registered successfully. UID: ${result.uid || formData.uid}`,
        });
      }

      // Redirection Details
      const submissionDetails = {
        customerName: formData.customerName,
        productType: "seat-cover",
        registrationId: result?.uid || formData.uid || "PENDING",
        role: user?.role || 'public',
        isPublic: isPublic
      };

      navigate("/thank-you", {
        state: { submissionDetails }
      });

      // Call onSuccess callback if provided (for data refresh)
      if (onSuccess) {
        onSuccess(result);
      }

    } catch (error: any) {
      console.error("Warranty submission error:", error);
      toast({
        title: "Submission Failed",
        description: error.response?.data?.error || "Failed to submit warranty registration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name: string, value: string) => {
    let processedValue = value;

    if (name === 'customerMobile') {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'customerName') {
      // Allow only letters and spaces for customer name
      processedValue = value.replace(/[^A-Za-z\s]/g, '');
    } else if (name === 'uid') {
      // UID should be alphanumeric, max 30 chars
      processedValue = value.replace(/[^A-Za-z0-9-]/g, '').slice(0, 30);
      // Reset UID validation status when value changes
      setUidStatus('idle');
      setUidMessage('');
    } else if (name === 'carReg') {
      processedValue = formatVehicleRegLive(value);
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));

    // Real-time uniqueness check for Mobile number
    if (name === 'customerMobile' && processedValue.length === 10) {
      api.get(`/public/warranty/check-uniqueness?phone=${processedValue}&type=seat-cover`)
        .then(res => {
          if (!res.data.unique) {
            toast({
              title: "Already Registered",
              description: res.data.message,
              variant: "destructive",
            });
          }
        })
        .catch(err => console.error("Uniqueness check failed", err));
    }

    // Real-time uniqueness check for Vehicle Registration
    if (name === 'carReg' && processedValue.length >= 6 && processedValue !== 'APPLIED-FOR') {
      // Small delay to let user finish typing
      if (uidTimerRef.current) clearTimeout(uidTimerRef.current);
      uidTimerRef.current = setTimeout(() => {
        api.get(`/public/warranty/check-uniqueness?reg=${processedValue}&type=seat-cover`)
          .then(res => {
            if (!res.data.unique) {
              toast({
                title: "Vehicle Registered",
                description: res.data.message,
                variant: "destructive",
              });
            }
          })
          .catch(err => console.error("Uniqueness check failed", err));
      }, 800);
    }
  };

  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif', 'application/pdf'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'invoiceFile' | 'vehicleFile' | 'seatCoverPhoto' | 'carOuterPhoto') => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast({
          title: "Invalid File Format",
          description: "Only JPG, PNG, HEIC, and PDF files are allowed",
          variant: "destructive",
        });
        e.target.value = ''; // Reset input
        return;
      }

      // --- FRAUD DETECTION: Extract EXIF BEFORE compression ---
      if (['vehicleFile', 'seatCoverPhoto', 'carOuterPhoto'].includes(field)) {
        try {
          // Parse EXIF, GPS, and TIFF data (for make/model)
          const exif = await exifr.parse(file, {
            tiff: true, xmp: true, icc: true, gps: true, exif: true
          });
          if (exif) {
            console.log(`[FraudDetection] Extracted EXIF for ${field}:`, {
              lat: exif.latitude, lng: exif.longitude, time: exif.DateTimeOriginal
            });
            // Keep the first valid EXIF data we find for the legacy 'exifData' field
            setFormData(prev => {
              const currentExif = prev.exifData || {};
              const fieldExif = {
                lat: exif.latitude,
                lng: exif.longitude,
                timestamp: exif.DateTimeOriginal,
                deviceMake: exif.Make,
                deviceModel: exif.Model
              };

              // If we already have GPS and this one doesn't, keep the old one for the summary field
              const updatedExif = (currentExif.lat && !exif.latitude) ? currentExif : {
                lat: exif.latitude || currentExif.lat,
                lng: exif.longitude || currentExif.lng,
                timestamp: exif.DateTimeOriginal || currentExif.timestamp,
                deviceMake: exif.Make || currentExif.deviceMake,
                deviceModel: exif.Model || currentExif.deviceModel
              };

              return {
                ...prev,
                exifData: updatedExif,
                allExifData: {
                  ...prev.allExifData,
                  [field]: fieldExif
                }
              };
            });
          }
        } catch (err) {
          console.warn(`[FraudDetection] EXIF extraction failed for ${field}:`, err);
        }
      }

      let processedFile = file;

      // Compress image if it's a compressible type (not PDF)
      if (isCompressibleImage(file)) {
        try {
          setLoading(true);
          processedFile = await compressImage(file, { maxSizeKB: 1024, quality: 0.8 });
          // Silent compression - no need to inform customer
        } catch (err) {
          // Continue with original file if compression fails
          console.warn("Image compression failed, using original:", err);
        } finally {
          setLoading(false);
        }
      }

      // Check file size after compression
      if (processedFile.size > MAX_FILE_SIZE) {
        toast({
          title: "File Too Large",
          description: "Maximum file size is 5 MB",
          variant: "destructive",
        });
        e.target.value = ''; // Reset input
        return;
      }

      setFormData(prev => ({ ...prev, [field]: processedFile || null }));
    }
  };

  // Handle camera captures: extract EXIF then compress before storing
  const handleCameraCapture = async (file: File | null, field: 'vehicleFile' | 'seatCoverPhoto' | 'carOuterPhoto') => {
    if (!file) {
      setFormData(prev => ({ ...prev, [field]: null }));
      return;
    }

    console.log(`[FraudDetection] Camera file received for ${field}:`, {
      name: file.name, type: file.type, size: file.size
    });

    // 1. Get GPS via Geolocation API (iOS strips GPS from camera captures for privacy)
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 60000
        });
      });
      console.log(`[FraudDetection] Geolocation GPS:`, position.coords.latitude, position.coords.longitude);
      setFormData(prev => ({
        ...prev,
        exifData: {
          ...(prev.exifData || {}),
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
      }));
    } catch (err) {
      console.warn(`[FraudDetection] Geolocation failed (user denied or unavailable):`, err);
    }

    // 2. Extract EXIF for device make/model/timestamp (GPS will be null on iOS, that's OK)
    // CRITICAL FIX: Only read the first 128KB of the file! Reading the full 5-10MB 4K photo 
    // into an ArrayBuffer causes iOS Safari to crash (OOM) and forcibly refresh the page.
    try {
      const exifChunk = file.slice(0, 128 * 1024); // 128KB is plenty for EXIF metadata headers
      const arrayBuffer = await exifChunk.arrayBuffer();
      const exif = await exifr.parse(arrayBuffer, {
        gps: true, exif: true, tiff: true, mergeOutput: true,
      });
      console.log(`[FraudDetection] EXIF for ${field}:`, exif ? {
        Make: exif.Make, Model: exif.Model, DateTimeOriginal: exif.DateTimeOriginal
      } : 'NULL');

      if (exif) {
        setFormData(prev => {
          const currentExif = prev.exifData || {};
          const fieldExif = {
            lat: currentExif.lat || exif.latitude || null,
            lng: currentExif.lng || exif.longitude || null,
            timestamp: exif.DateTimeOriginal || exif.CreateDate || currentExif.timestamp || null,
            deviceMake: exif.Make || currentExif.deviceMake || null,
            deviceModel: exif.Model || currentExif.deviceModel || null
          };

          return {
            ...prev,
            exifData: {
              ...fieldExif
            },
            allExifData: {
              ...prev.allExifData,
              [field]: fieldExif
            }
          };
        });
      }
    } catch (err) {
      console.warn(`[FraudDetection] EXIF extraction failed for ${field}:`, err);
    }

    // 3. Compress the image
    let processedFile = file;
    if (isCompressibleImage(file)) {
      try {
        processedFile = await compressImage(file, { maxSizeKB: 800, quality: 0.7 });
        console.log(`[FraudDetection] Compressed ${field}: ${file.size} -> ${processedFile.size}`);
      } catch (err) {
        console.warn("Camera image compression failed, using original:", err);
      }
    }

    setFormData(prev => ({ ...prev, [field]: processedFile }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-1 sm:p-4">
      {/* Header Section */}
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-orange-100 rounded-full mb-4 ring-8 ring-orange-50">
          <Car className="h-8 w-8 text-orange-600" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          {warrantyId ? "Edit Seat Cover Warranty" : "Seat Cover Warranty Registration"}
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {warrantyId
            ? "Update the warranty details below and resubmit for approval."
            : "Complete the form below to register your premium seat cover warranty. Please ensure all details are accurate."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Store & Installer Details */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm ring-1 ring-slate-100">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50/30 px-6 py-4 border-b border-orange-100 flex items-center gap-3 rounded-t-xl">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Building2 className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Store Details</h3>
              <p className="text-xs text-muted-foreground">Store and manpower information</p>
            </div>
          </div>
          <CardContent className="p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              {/* Store Selection */}
              <div className="space-y-3">
                <Label htmlFor="storeName" className="text-sm font-medium text-slate-700">
                  Store Name <span className="text-destructive">*</span>
                </Label>
                {user?.role === 'vendor' || isPublic ? (
                  <Input
                    id="storeName"
                    value={formData.storeName}
                    readOnly
                    className="bg-slate-50 border-slate-200"
                    placeholder={isPublic ? "Store Name" : "Loading store name..."}
                  />
                ) : (
                  <Combobox
                    options={stores.map(store => ({ value: store.store_name, label: store.store_name }))}
                    value={formData.storeName}
                    onChange={(value) => handleChange("storeName", value)}
                    placeholder="Select Store"
                    searchPlaceholder="Search store name..."
                    emptyMessage="No store found."
                    disabled={loading}
                    className="w-full"
                  />
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="storeEmail" className="text-sm font-medium text-slate-700">
                  Store Email <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="storeEmail"
                    type="email"
                    placeholder="store@example.com"
                    value={formData.storeEmail}
                    onChange={(e) => handleChange("storeEmail", e.target.value)}
                    required
                    readOnly
                    disabled={loading}
                    className="pl-9 bg-slate-50 border-slate-200"
                  />
                </div>
              </div>

              {/* Manpower Selection */}
              <div className="space-y-3">
                <Label htmlFor="manpowerId" className="text-sm font-medium text-slate-700">
                  Manpower (Installer) <span className="text-destructive">*</span>
                </Label>
                <MobileSelect
                  options={manpowerList.map((mp) => ({
                    value: mp.id.toString(),
                    label: `${mp.name} (${mp.applicator_type === 'seat_cover' ? 'Seat cover applicator' : mp.applicator_type === 'ppf_spf' ? 'PPF Applicator' : mp.applicator_type || 'Staff'})`
                  }))}
                  value={formData.manpowerId}
                  onValueChange={(value) => handleChange("manpowerId", value)}
                  placeholder={!formData.storeName ? "Select Store First" : manpowerList.length === 0 ? "No Manpower Found" : "Select Installer"}
                  title="Select Installer"
                  disabled={(!formData.storeName || manpowerList.length === 0) || loading}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="purchaseDate" className="text-sm font-medium text-slate-700">
                  Purchase Date <span className="text-destructive">*</span>
                </Label>
                <DatePicker
                  value={formData.purchaseDate}
                  onChange={(value) => handleChange("purchaseDate", value)}
                  minDate={new Date(new Date().setDate(new Date().getDate() - 30))}
                  maxDate={new Date()}
                  placeholder="Select purchase date"
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Customer Information */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm ring-1 ring-slate-100">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50/30 px-6 py-4 border-b border-blue-100 flex items-center gap-3 rounded-t-xl">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Customer Information</h3>
              <p className="text-xs text-muted-foreground">Personal and contact details</p>
            </div>
          </div>
          <CardContent className="p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              <div className="space-y-3">
                <Label htmlFor="customerName" className="text-sm font-medium text-slate-700">
                  Name <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="customerName"
                    type="text"
                    placeholder="Enter customer name"
                    value={formData.customerName}
                    onChange={(e) => handleChange("customerName", e.target.value)}
                    required
                    readOnly={user?.role === 'customer'}
                    disabled={loading}
                    className={`pl-9 border-slate-200 ${user?.role === 'customer' ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'}`}
                  />
                </div>
                {user?.role === 'customer' && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" /> Auto-filled
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="customerEmail" className="text-sm font-medium text-slate-700">
                  Email {(isPublic || user?.role !== 'vendor') && <span className="text-destructive">*</span>}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="customerEmail"
                    type="email"
                    placeholder="customer@example.com"
                    value={formData.customerEmail}
                    onChange={(e) => handleChange("customerEmail", e.target.value)}
                    required={isPublic || user?.role !== 'vendor'}
                    readOnly={user?.role === 'customer'}
                    disabled={loading}
                    className={`pl-9 border-slate-200 ${user?.role === 'customer' ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'}`}
                  />
                </div>
                {(!isPublic && user?.role === 'vendor') && (
                  <p className="text-xs text-muted-foreground">Optional for notification</p>
                )}
              </div>

              <div className="space-y-3 md:col-span-2">
                <Label htmlFor="customerMobile" className="text-sm font-medium text-slate-700">
                  Mobile Number <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="customerMobile"
                    type="tel"
                    placeholder="9876543210"
                    value={formData.customerMobile}
                    onChange={(e) => handleChange("customerMobile", e.target.value)}
                    required
                    readOnly={user?.role === 'customer'}
                    disabled={loading}
                    className={`pl-9 border-slate-200 ${user?.role === 'customer' ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'}`}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Vehicle Details */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm ring-1 ring-slate-100">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50/30 px-6 py-4 border-b border-emerald-100 flex items-center gap-3 rounded-t-xl">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Car className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Vehicle Details</h3>
              <p className="text-xs text-muted-foreground">Vehicle registration information</p>
            </div>
          </div>
          <CardContent className="p-6 md:p-8">
            <div className="grid gap-6">
              <div className="space-y-3">
                <Label htmlFor="carReg" className="text-sm font-medium text-slate-700">
                  Vehicle Registration Number <span className="text-destructive">*</span>
                </Label>
                
                <div className="flex items-center space-x-2 pb-2">
                  <input
                    type="checkbox"
                    id="isBrandNew"
                    checked={isBrandNew}
                    onChange={(e) => {
                      setIsBrandNew(e.target.checked);
                      if (e.target.checked) {
                        setFormData(prev => ({ ...prev, carReg: 'APPLIED-FOR' }));
                      } else {
                        setFormData(prev => ({ ...prev, carReg: '' }));
                      }
                    }}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <Label htmlFor="isBrandNew" className="text-sm font-normal text-slate-600 cursor-pointer">
                    Brand new car (No registration number yet)
                  </Label>
                </div>

                {!isBrandNew && (
                  <Input
                    id="carReg"
                    type="text"
                    placeholder="Format: DL-01-AB-1234 / 26-BH-6045-F"
                    value={formData.carReg}
                    onChange={(e) => handleChange("carReg", e.target.value)}
                    disabled={loading}
                    required
                    className={`bg-white ${formData.carReg
                      ? getVehicleRegError(formData.carReg)
                        ? 'border-red-400 focus-visible:ring-red-300'
                        : 'border-green-400 focus-visible:ring-green-300'
                      : 'border-slate-200'
                      }`}
                  />
                )}
                {!isBrandNew && formData.carReg && (
                  <p className={`text-xs flex items-center gap-1 ${getVehicleRegError(formData.carReg) ? 'text-red-500' : 'text-green-600'
                    }`}>
                    {getVehicleRegError(formData.carReg)
                      ? `⚠ ${getVehicleRegError(formData.carReg)}`
                      : '✓ Valid registration format'
                    }
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Product & Warranty */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm ring-1 ring-slate-100">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50/30 px-6 py-4 border-b border-purple-100 flex items-center gap-3 rounded-t-xl">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Product & Warranty Information</h3>
              <p className="text-xs text-muted-foreground">Product UID and warranty details</p>
            </div>
          </div>
          <CardContent className="p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              <div className="space-y-3 md:col-span-2">
                <Label htmlFor="uid" className="text-sm font-medium text-slate-700">
                  Product UID (from MRP Sticker) <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-2.5 bg-slate-100 rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-500 tracking-wider">UID</div>
                  <Input
                    id="uid"
                    type="text"
                    placeholder="Enter 13-16 digit number"
                    value={formData.uid}
                    onChange={(e) => handleChange("uid", e.target.value)}
                    onBlur={() => {
                      // Validate UID on blur if it has the right length
                      const uidVal = formData.uid;
                      if (/^\d{13,16}$/.test(uidVal)) {
                        // Skip real-time UID validation in public QR flow (no auth token)
                        // Server validates during submission anyway
                        if (isPublic) {
                          setUidStatus('idle');
                          return;
                        }
                        setUidStatus('checking');
                        api.get(`/uid/validate/${uidVal}`)
                          .then(res => {
                            const data = res.data;
                            if (data.valid && data.available) {
                              setUidStatus('valid');
                              setUidMessage('UID is valid and available');
                            } else if (data.valid && !data.available) {
                              setUidStatus('used');
                              setUidMessage(data.message || 'UID has already been used');
                            } else {
                              setUidStatus('invalid');
                              setUidMessage(data.message || 'UID not found in the system');
                            }
                          })
                          .catch(() => {
                            setUidStatus('idle');
                            setUidMessage('');
                          });
                      }
                    }}
                    required
                    maxLength={16}
                    disabled={loading}
                    pattern="[0-9]{13,16}"
                    className={`pl-12 pr-10 font-mono tracking-wide bg-white ${uidStatus === 'valid'
                      ? 'border-emerald-400 ring-1 ring-emerald-200 focus-visible:ring-emerald-300'
                      : uidStatus === 'invalid' || uidStatus === 'used'
                        ? 'border-red-400 ring-1 ring-red-200 focus-visible:ring-red-300'
                        : 'border-slate-200'
                      }`}
                  />
                  {/* Validation Status Icon */}
                  <div className="absolute right-3 top-2.5">
                    {uidStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-orange-500" />}
                    {uidStatus === 'valid' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    {uidStatus === 'invalid' && <XCircle className="h-4 w-4 text-red-500" />}
                    {uidStatus === 'used' && <AlertCircle className="h-4 w-4 text-red-500" />}
                  </div>
                </div>
                <div className="flex justify-between text-xs px-1 mt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{formData.uid.length}/16 digits</span>
                    {uidStatus === 'valid' && (
                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Available
                      </span>
                    )}
                    {uidStatus === 'invalid' && (
                      <span className="text-red-500 font-medium flex items-center gap-1">
                        <XCircle className="h-3 w-3" /> {uidMessage}
                      </span>
                    )}
                    {uidStatus === 'used' && (
                      <span className="text-red-500 font-medium flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {uidMessage}
                      </span>
                    )}
                    {uidStatus === 'checking' && (
                      <span className="text-orange-500 font-medium">Checking...</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => toast({
                      title: "Where to find UID?",
                      description: "Locate the sticker on the seat cover product packaging.",
                    })}
                    className="flex items-center gap-1 text-orange-600 font-medium hover:text-orange-700 transition-colors"
                  >
                    <HelpCircle className="h-3 w-3" /> Where to find?
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="productName" className="text-sm font-medium text-slate-700">
                  Product Name <span className="text-destructive">*</span>
                </Label>
                <Combobox
                  options={products.map(product => ({ value: product.name, label: product.name }))}
                  value={formData.productName}
                  onChange={(value) => handleChange("productName", value)}
                  placeholder="Select Product"
                  searchPlaceholder="Search product..."
                  emptyMessage="No product found."
                  disabled={loading}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="warrantyType" className="text-sm font-medium text-slate-700">
                  Warranty Type
                </Label>
                <div className="relative">
                  <CheckCircle2 className="absolute left-3 top-2.5 h-4 w-4 text-green-500" />
                  <Input
                    id="warrantyType"
                    type="text"
                    value={formData.warrantyType}
                    readOnly
                    className="pl-9 bg-green-50/50 border-green-100 text-green-700 font-medium"
                  />
                </div>
              </div>

              {/* Number Plate Photo */}
              <CameraCapture
                id="vehicleFile"
                label="Number Plate Image"
                description="Take a photo or upload from gallery"
                required={!warrantyId}
                disabled={loading}
                cameraOnly={false}
                value={formData.vehicleFile}
                onChange={(file) => handleCameraCapture(file, 'vehicleFile')}
                accept="image/jpeg,image/heic,image/heif"
                selectedIcon={<Car className="h-6 w-6" />}
                sampleImageUrl="https://res.cloudinary.com/dmwt4rg4m/image/upload/v1776227240/Car-Number-Plate-Image_cmbu0u.png"
              />

              {/* Fitted Seat Cover Photo */}
              <CameraCapture
                id="seatCoverPhoto"
                label="Fitted Seat Cover Image"
                description="Take a photo or upload from gallery"
                required={!warrantyId}
                disabled={loading}
                cameraOnly={false}
                value={formData.seatCoverPhoto}
                onChange={(file) => handleCameraCapture(file, 'seatCoverPhoto')}
                accept="image/jpeg,image/heic,image/heif"
                selectedIcon={<Armchair className="h-6 w-6" />}
                sampleImageUrl="https://res.cloudinary.com/dmwt4rg4m/image/upload/v1775217073/Seat_Cover_Fitted_jfgizq.jpg"
              />

              {/* Car Outer Image */}
              <CameraCapture
                id="carOuterPhoto"
                label="Car Exterior Image"
                description="Take a photo or upload from gallery"
                required={!warrantyId}
                disabled={loading}
                cameraOnly={false}
                value={formData.carOuterPhoto}
                onChange={(file) => handleCameraCapture(file, 'carOuterPhoto')}
                accept="image/jpeg,image/heic,image/heif"
                selectedIcon={<ImageIcon className="h-6 w-6" />}
                sampleImageUrl="https://res.cloudinary.com/dmwt4rg4m/image/upload/v1776228125/Car_Exterior_Image_New_vvjoqa.jpg"
              />
            </div>
            <div className="space-y-3 mt-5 md:col-span-2">
              <Label htmlFor="invoiceFile" className="text-sm font-medium text-slate-700">
                Proof of Purchase (Invoice / MRP Sticker) <span className="text-destructive">*</span>
              </Label>
              <div className={`mt-2 border-2 border-dashed rounded-xl p-6 transition-all duration-200 text-center relative ${formData.invoiceFile ? 'border-orange-300 bg-orange-50/30' : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50'}`}>
                <div className="flex flex-col items-center gap-2">
                  <div className={`p-3 rounded-full ${formData.invoiceFile ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                    {formData.invoiceFile ? <FileText className="h-6 w-6" /> : <Upload className="h-6 w-6" />}
                  </div>
                  <div>
                    {formData.invoiceFile ? (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-orange-700 break-all">{formData.invoiceFile.name}</p>
                        <p className="text-xs text-orange-600/70">{(formData.invoiceFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        <label htmlFor="invoiceFile" className="text-xs text-orange-600 underline cursor-pointer hover:text-orange-800">Change File</label>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-700">Click to upload or drag and drop</p>
                        <p className="text-xs text-muted-foreground">(Max 2MB)</p>
                      </div>
                    )}
                  </div>
                  <Input
                    id="invoiceFile"
                    type="file"
                    accept="image/jpeg,image/heic,image/heif"
                    onChange={(e) => handleFileChange(e, 'invoiceFile')}
                    required={!warrantyId}
                    disabled={loading}
                    className="hidden"
                  />
                  {!formData.invoiceFile && (
                    <label htmlFor="invoiceFile" className="absolute inset-0 cursor-pointer"></label>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms & Submit */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm ring-1 ring-slate-100">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              {/* Simple Checkbox T&C */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="termsCheckbox"
                  checked={formData.termsAccepted}
                  onChange={(e) => setFormData(prev => ({ ...prev, termsAccepted: e.target.checked }))}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="termsCheckbox" className="text-sm text-slate-700 cursor-pointer">
                  I have read and agree to the{" "}
                  <button
                    type="button"
                    onClick={() => setTermsModalOpen(true)}
                    className="text-primary font-medium underline hover:text-primary/80"
                  >
                    Terms and Conditions
                  </button>
                </label>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full text-lg h-12 shadow-orange-200 shadow-lg hover:shadow-xl transition-all"
                disabled={loading || !formData.termsAccepted}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing Registration...
                  </>
                ) : (
                  "Complete Registration"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Terms Modal */}
        <TermsModal
          isOpen={termsModalOpen}
          onClose={() => setTermsModalOpen(false)}
          onAccept={() => setFormData(prev => ({ ...prev, termsAccepted: true }))}
        />
      </form>
    </div>
  );
};

export default SeatCoverForm;