import { Category, Product, Review } from "@/types/catalog";

// Categories
export const categories: Category[] = [
  // Main Categories
  { id: "seat-cover", name: "Seat Cover", description: "Premium seat covers for all vehicles", image: "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Seat-GIF.gif" },
  { id: "accessories", name: "Accessories", description: "Enhance your driving experience", image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2070&auto=format&fit=crop" },
  { id: "mat", name: "Mats", description: "High-quality mats for your vehicle", image: "https://images.unsplash.com/photo-1618333258404-f509733839c4?q=80&w=1780&auto=format&fit=crop" },
  { id: "light-utility", name: "Light & Utility", description: "Make life easier on the road", image: "https://images.unsplash.com/photo-1489686995744-f47e995ffe61?q=80&w=2071&auto=format&fit=crop" },
  { id: "audio-security", name: "Audio & Security", description: "Premium sound and safety solutions", image: "https://images.unsplash.com/photo-1558537348-c0f8e733989d?q=80&w=1978&auto=format&fit=crop" },
  { id: "care-fragrance", name: "Care & Fragrance", description: "Keep your car fresh and clean", image: "https://images.unsplash.com/photo-1527359443443-84a48aec73d2?q=80&w=2070&auto=format&fit=crop" },

  // Subcategories for Seat Cover
  { id: "4-wheeler-seat-cover", name: "4 Wheeler", parentId: "seat-cover", image: "/images/bannersforcataloguewebsite/Seat-Cover 4W.jpg" },
  { id: "2-wheeler-seat-cover", name: "2 Wheeler", parentId: "seat-cover", image: "/images/bannersforcataloguewebsite/Seat-Cover-2W.jpg" },


  //4w seat categories based on the material
  { id: "riviera", name: "REVIERA SERIES", parentId: "4-wheeler-seat-cover", image: "/images/Autoform - Swatch Book 12-4-22 T2.jpg" },
  { id: "lucenzo", name: "LUCENZO SERIES", parentId: "4-wheeler-seat-cover", image: "/images/Autoform - Swatch Book 12-4-22 T1.jpg" },
  { id: "signature", name: "SIGNATURE SERIES", parentId: "4-wheeler-seat-cover", image: "/images/Autoform - Swatch Book 22-12-23.jpg" },
  { id: "emporio", name: "EMPORIO SERIES", parentId: "4-wheeler-seat-cover", image: " /images/Autoform - Swatch Book 12-4-22 T4.jpg" },




  // Subcategories for the Accessories
  { id: "4-wheeler-accessories", name: "4 Wheeler Accessories", parentId: "accessories", image: "/images/cover images/Four-Wheler-Accessories.jpg" },
  { id: "2-wheeler-accessories", name: "2 Wheeler Accessories", parentId: "accessories", image: "/images/bannersforcataloguewebsite/02.jpg" },

  // Sub-Subcategories of the Accessories (4w)
  { id: "healthy-memory-for-comfort", name: "Healthy Memory For Comfort", parentId: "4-wheeler-accessories", image: "/images/cover images/Memory Product.jpg" },
  { id: "polyfill-range", name: "PolyFill Range", parentId: "4-wheeler-accessories", image: "/images/bannersforcataloguewebsite/Polyfill-Range.jpg" },
  { id: "premium-steering-covers", name: "Premium Steering Covers", parentId: "4-wheeler-accessories", image: "/images/bannersforcataloguewebsite/Steering-Cover.jpg" },
  { id: "innovative-organizers", name: "Innovative Organizers", parentId: "4-wheeler-accessories", image: "/images/bannersforcataloguewebsite/Innovative-Organizer.jpg" },
  { id: "essential-tissue-box", name: "Essential Tissue Boxes", parentId: "4-wheeler-accessories", image: "/images/bannersforcataloguewebsite/Tissue-Box.jpg" },
  { id: "padded-seat-covers", name: "Padded Seat Covers", parentId: "4-wheeler-accessories", image: "/images/bannersforcataloguewebsite/Padded-Seat-Covers.jpg" },
  { id: "Electronic-accessories", name: "Electronic Accessories", parentId: "4-wheeler-accessories", image: "/images/bannersforcataloguewebsite/Electronic.jpg" },
  { id: "car-utility", name: "Car Utility", parentId: "4-wheeler-accessories", image: "/images/bannersforcataloguewebsite/Car-Utility.jpg" },
  { id: "car-care-products", name: "Car Care Products", parentId: "4-wheeler-accessories", image: "/images/bannersforcataloguewebsite/Car-Care.jpg" },
  { id: "Easy-fit", name: "Easy Fit (DIY)", parentId: "4-wheeler-accessories", image: "/images/bannersforcataloguewebsite/DIY-Seat.jpg" },
  { id: "car-body-cover", name: "Car Body Cover", parentId: "4-wheeler-accessories", image: "/images/bannersforcataloguewebsite/Car-Body-Cover.jpg" },




  //  { id: "car-mobile-charger", name: "Letherette Perfume", parentId: "car-utility", image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?q=80&w=2070&auto=format&fit=crop" },
  //  { id: "venus", name: "Venus", parentId: "Easy-fit", image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?q=80&w=2070&auto=format&fit=crop" },
  // { id: "tauras", name: "Tauras", parentId: "Easy-fit", image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?q=80&w=2070&auto=format&fit=crop" },
  //  { id: "trilayer-body-cover", name: "Trilayer Body cover", parentId: "car-body-cover", image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?q=80&w=2070&auto=format&fit=crop" },
  // { id: "sparko-jungle-body-cover", name: "Sparko Jungle Body Cover", parentId: "car-body-cover", image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?q=80&w=2070&auto=format&fit=crop" },
  //  { id: "sparko-silver-body-cover", name: "Sparko Silver Body Cover", parentId: "car-body-cover", image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?q=80&w=2070&auto=format&fit=crop" },

  // Sub-sub Categories of the 2W Accessories
  { id: "body-cover", name: "Body Cover", parentId: "2-wheeler-accessories", image: "/images/cover images/Bike-Body-Cover.jpg" },
  { id: "bag", name: "Bag", parentId: "2-wheeler-accessories", image: "/images/cover images/Side-Bags.jpg" },
  { id: "chest-guard", name: "Chest Guard", parentId: "2-wheeler-accessories", image: "/images/cover images/Chest-Gaurd.jpg" },
  { id: "ropes", name: "Ropes", parentId: "2-wheeler-accessories", image: "/images/cover images/Ropes.jpg" },
  { id: "back-rest-pad", name: "Back Rest Pad", parentId: "2-wheeler-accessories", image: "/images/cover images/Back-Rest-Pad.jpg" },
  { id: "foot-mat", name: "Foot Mat", parentId: "2-wheeler-accessories", image: "/images/cover images/Foot-Mat.jpg" },
  { id: "tank-cover", name: "Tank Cover", parentId: "2-wheeler-accessories", image: "/images/cover images/Tank-Cover.jpg" },
  { id: "2w-electronics", name: "Electronic Accessories", parentId: "2-wheeler-accessories", image: "/images/bannersforcataloguewebsite/LED-Light.jpg" },
  { id: "cleaning-kit", name: "Cleaning Kit", parentId: "2-wheeler-accessories", image: "/images/cover images/Cleaning-Kit.jpg" },


  // subcategories for the Life and Care

  // Care & Fragrance subcategories
  { id: "ppf", name: "PPF(Paint Protection Film)", parentId: "care-fragrance", image: "/images/bannersforcataloguewebsite/PPF.jpg" },
  { id: "Microfibre-clothc", name: "Microfibre Cloth", parentId: "care-fragrance", image: "/images/bannersforcataloguewebsite/Microfier-Cloth.jpg" },
  { id: "care-range-polish", name: "Care Range (Polish)", parentId: "care-fragrance", image: "/images/ChatGPT Image Jun 18, 2025, 01_02_13 PM.png" },
  { id: "wiper-blade", name: "Wiper Blade", parentId: "care-fragrance", image: "/images/ChatGPT Image Jun 18, 2025, 01_02_13 PM.png" },
  { id: "car-perfume", name: "Car Perfume", parentId: "care-fragrance", image: "/images/ChatGPT Image Jun 18, 2025, 01_02_13 PM.png" },
  { id: "odour-eliminator", name: "Odour Eliminator", parentId: "care-fragrance", image: "/images/care&Fregrance/ChatGPT Image Jul 18, 2025, 02_21_51 PM.png" },




  // Subcategories for Audio & Security
  { id: "android", name: "Android", parentId: "audio-security", image: "/images/bannersforcataloguewebsite/Android.jpg" },
  { id: "audio-series-cadence", name: "Audio Series (Cadence)", parentId: "audio-security", image: "/images/bannersforcataloguewebsite/Cadence.jpg" },
  { id: "damping", name: "Damping Sheet", parentId: "audio-security", image: "/images/bannersforcataloguewebsite/Damping-Sheet.jpg" },
  { id: "dvr", name: "DVR", parentId: "audio-security", image: "/images/bannersforcataloguewebsite/Digital-Video-Recorder.jpg" },

  // Subcategories for Speakers

  { id: "speaker", name: "Speakers", parentId: "audio-series-cadence", image: "/images/bannersforcataloguewebsite/Speaker.jpg" },
  { id: "subwoofer", name: "Sub Woofers", parentId: "audio-series-cadence", image: "/images/bannersforcataloguewebsite/Sub-Woofer.jpg" },

  { id: "amplifier", name: "Amplifier", parentId: "audio-series-cadence", image: "/images/bannersforcataloguewebsite/Amplifier.jpg" },
  { id: "ampkit", name: "AmpKit", parentId: "audio-series-cadence", image: "/images/bannersforcataloguewebsite/AMPkit.jpg" },

  // speakers sub category 
  { id: "coaxial", name: "Coaxial Speakers", parentId: "speaker", image: "https://cadencesound.com/wp-content/uploads/2024/12/iq653.jpg" },
  { id: "component", name: "Component Speakers", parentId: "speaker", image: "https://cadencesound.com/wp-content/uploads/2024/12/iq65k-768x768.jpg" },
  // { id: "speaker", name: "Speakers", parentId: "audio-series-cadence", image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=2069&auto=format&fit=crop" },




  // sub-sub categories for the 2 wheeler starts----------------------------------------------
  { id: "bullet", name: "Bullet", parentId: "2-wheeler-seat-cover", image: "/images/bannersforcataloguewebsite/03.jpg" },
  { id: "bike", name: "Bike", parentId: "2-wheeler-seat-cover", image: "/images/bannersforcataloguewebsite/05.jpg" },
  { id: "scooty", name: "Scooter", parentId: "2-wheeler-seat-cover", image: "/images/bannersforcataloguewebsite/06.jpg" },

  // sub-sub categories for the 2 wheeler ends----------------------------------------------

  // subcategory for the bullet stars-------------------------------------------
  { id: "u-impress", name: "U-Impress", parentId: "bullet", image: "/images/bullet/u-impress-brown.png" },
  { id: "u-drive", name: "U-Drive", parentId: "bullet", image: "/images/bullet/u-drive-black.png" },
  { id: "u-pyramid", name: "U-Pyramid", parentId: "bullet", image: "/images/bullet/u-pyramid-black.png" },
  { id: "u-cross", name: "U-Cross", parentId: "bullet", image: "/images/bullet/u-cross.png" },

  // subcategory for the bullet ends-------------------------------------------

  // subcategory for the bike starts-------------------------------
  { id: "u-impressb", name: "U-Impress", parentId: "bike", image: "/images/bike/u-impress.png" },
  { id: "u-sportzb", name: "U-Sportz", parentId: "bike", image: "/images/bike/u-sportz2.png" },
  { id: "u-activeb", name: "U-Active", parentId: "bike", image: "/images/bike/u-active2.png" },
  { id: "u-activeplusb", name: "U-Active Plus", parentId: "bike", image: "/images/bike/u-active-plus1-white.png" },

  // subcategory for the bike end-------------------------------

  //Subcategory for the Scooty Starts----------------------

  { id: "u-impresss", name: "U-Impress", parentId: "scooty", image: "/images/Scooty/u-impressScooty.png" },
  { id: "u-sportzs", name: "U-Sportz", parentId: "scooty", image: "/images/Scooty/u-sportzScooty.png" },
  { id: "u-actives", name: "U-Active", parentId: "scooty", image: "/images/Scooty/u-activeScootyBluew.png" },
  { id: "u-activeplusc", name: "U-Active Plus", parentId: "scooty", image: "/images/Scooty/u-active-plus-red.png" },

  //subcategory for the Scooty Ends---------------------------


  { id: "back-seat-organiser", name: "Back Seat Organiser", parentId: "life-utility", image: "https://images.unsplash.com/photo-1489686995744-f47e995ffe61?q=80&w=2071&auto=format&fit=crop" },
  { id: "car-coat-hanger", name: "Car Coat Hanger", parentId: "life-utility", image: "https://images.unsplash.com/photo-1489686995744-f47e995ffe61?q=80&w=2071&auto=format&fit=crop" },
  { id: "food-tray", name: "Food Tray", parentId: "life-utility", image: "https://images.unsplash.com/photo-1489686995744-f47e995ffe61?q=80&w=2071&auto=format&fit=crop" },


  // Subcategories for Mat
  { id: "pu-pvc", name: "PU/PVC", parentId: "mat", image: "/images/bannersforcataloguewebsite/PVC-Mat.jpg" },
  // { id: "3d-mat", name: "3D Mat", parentId: "mat", image: "https://images.unsplash.com/photo-1606028638131-29913d642c04?q=80&w=1972&auto=format&fit=crop" },
  { id: "tpe", name: "TPE", parentId: "mat", image: "/images/bannersforcataloguewebsite/TPE-Mat.jpg" },
  // { id: "boot-mat", name: "Boot Mat", parentId: "mat", image: "https://images.unsplash.com/photo-1603811478698-7e15b7d724b9?q=80&w=2070&auto=format&fit=crop" },







];

// Reviews
const reviews: { [key: string]: Review[] } = {
  "1": [
    {
      id: "r1",
      userName: "John D.",
      date: "May 15, 2023",
      rating: 5,
      comment: "These leather seat covers are amazing! Perfect fit and excellent quality."
    },
    {
      id: "r2",
      userName: "Sarah M.",
      date: "April 3, 2023",
      rating: 4,
      comment: "Great quality for the price. Installation was a bit tricky but worth it."
    }
  ],
  "2": [
    {
      id: "r3",
      userName: "Michael T.",
      date: "June 22, 2023",
      rating: 5,
      comment: "The fabric is breathable and very comfortable. Highly recommend!"
    },
    {
      id: "r4",
      userName: "Lisa K.",
      date: "May 5, 2023",
      rating: 4,
      comment: "Easy to install and looks great in my car. Good value."
    }
  ],
  "3": [
    {
      id: "r5",
      userName: "David R.",
      date: "July 12, 2023",
      rating: 5,
      comment: "Perfect fit for my SUV. These 3D mats catch all the dirt and are easy to clean."
    }
  ],
  "4": [
    {
      id: "r6",
      userName: "Emma P.",
      date: "August 3, 2023",
      rating: 4,
      comment: "Sturdy phone holder with good adjustability. Works great with my phone."
    }
  ],
  "5": [
    {
      id: "r7",
      userName: "Robert J.",
      date: "September 19, 2023",
      rating: 5,
      comment: "The sound quality is exceptional. Easy to install and makes a huge difference."
    }
  ],
  "6": [
    {
      id: "r8",
      userName: "Jessica L.",
      date: "October 8, 2023",
      rating: 4,
      comment: "Long-lasting fragrance that isn't overpowering. Perfect for my car."
    }
  ]
};



export const products: Product[] = [

  // Micro fibre cloth>care&fregrance
  {
    id: "Microfibre-cloth",
    name: "Microfibre Cloth",
    price: 342,
    description: [
      "Ultra-soft Microfibre cloth ideal for car detailing and cleaning.",
      "Highly absorbent and lint-free for streak-free shine.",
      "Safe for use on paint, glass, dashboard, and chrome.",
      "Machine washable and reusable multiple times."
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/micro-fibre-cloth-2.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/micro-fibre-cloth-uni.jpg",

    ],
    categoryId: "Microfibre-clothc",
    additionalInfo: [
      "In The Package: 1 x Microfibre Cloth (Approx. 40x40 cm)",
      "Note: Color may vary depending on stock availability."
    ],
    inStock: true,
    rating: 4.5,
    reviews: reviews["1"]
  },
  //ppf>care&Fregrance

  {
    "id": "ppf-emporio",
    "name": "Pro Shield PPF",
    "price": 124999,
    "description": [
      "High-performance Paint Protection Film designed to safeguard your vehicle's surface.",
      "Features anti-oil and anti-fingerprint properties for a clean, polished look.",
      "Smudge-resistant and dust-repellent coating ensures long-lasting clarity.",
      "Protects against scratches, road debris, and environmental contaminants."
    ],
    "images": [
      "/images/4w-acc/PPF-Product-01.png",
      "https://m.media-amazon.com/images/I/7112WDBhloL._SX679_.jpg",
      "https://m.media-amazon.com/images/S/aplus-media-library-service-media/9fd9acef-9c45-45ea-84fa-110520758a8f.__CR0,0,300,300_PT0_SX300_V1___.jpg"
    ],
    "categoryId": "ppf",
    "additionalInfo": [
      "In The Package: 1 x Pro Shield Paint Protection Film Roll (custom cut as per vehicle panels).",
      "Key Features: Anti-oil, anti-fingerprint, smudge-resistant, dust-repellent, and anti-scratch surface.",
      "Note: Professional installation recommended for best results. Color and finish may vary slightly from images."
    ],
    "inStock": true,
    "rating": 4.5,
    "reviews": reviews["1"]
  }
  ,






  //Amplifiers -------------------------------
  {
    "id": "esp-640",
    "name": "Amplifier - ESP 640",

    "description": [
      "4 ohm RMS Power: 100 watts x 4",
      "2 ohm RMS Power: 150 watts x 4",
      "Bridged 4 ohm RMS Power: 320 watts x 2",
      "RMS Power: 640 watts",
      "Frequency Response: 10Hz–20 kHz",
      "S/N Ratio: > 90 dB",
      "Minimum T.H.D.: < 0.05%",
      "Input Voltage: 300 mV – 6 V",
      "Dimensions (L x W x H): 260 mm x 110 mm x 48 mm – 10.24 in. x 4.33 in. x 1.89 in."
    ],
    "images": ["https://cadencesound.com/wp-content/uploads/2025/01/ESC6404D-600x600.jpg",
      "https://cadencesound.com/wp-content/uploads/2025/01/ESC6404D-03.jpg",
      "https://cadencesound.com/wp-content/uploads/2025/01/ESC6404D-04.jpg",
    ],
    "categoryId": "amplifier",
    "additionalInfo": [
      "In The Box: 1 x ESP 640 Amplifier, Wiring Manual, Mounting Screws.",
      "Supports both high-level and RCA low-level inputs.",
      "Warranty: 1 year against manufacturing defects."
    ],
    "price": 27199,
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  }
  ,
  {
    "id": "q-2404",
    "name": "Amplifier - Q 2404",
    "description": [
      "Model: Q2404",
      "Channel/Class: 4 / AB",
      "RMS Power @ 1 Ohm - 14.4V: -",
      "RMS Power @ 2 Ohm - 14.4V: 60W x 2 + 90W x 2",
      "RMS Power @ 4 Ohm - 14.4V: 60W x 4",
      "Bridged RMS Power @ 4 Ohm - 14.4V: 60W x 2 + 130W x 1",
      "Subwoofer Channel @ 2 Ohm - 14.4V: -",
      "Fuse Rating: 20A x 2",
      "Dimensions (L x W x H): 12.68 x 7.1 x 2.05 in",
      "Unit Weight: 2.22 KG"
    ],
    "images": ["https://cadencesound.com/wp-content/uploads/2025/01/Q2404.jpg",
      "https://cadencesound.com/wp-content/uploads/2025/01/Q2404-02.jpg",
      "https://cadencesound.com/wp-content/uploads/2025/01/Q2404-06.jpg",
      "https://cadencesound.com/wp-content/uploads/2025/01/Q2404-05.jpg",
    ],
    "categoryId": "amplifier",
    "additionalInfo": [
      "Application Type: Car",
      "Amplifier Class: AB",
      "Channel Configuration: 4 Channels",
      "Input Voltage: 14.4V",
      "Includes variable low-pass and high-pass filters for tuning.",
      "In The Box: 1 x Q 2404 Amplifier, Power Cable Kit, Mounting Hardware.",
      "Warranty: 1 year against manufacturing defects."
    ],
    "price": 17099,
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  },


  {
    "id": "q-1602",
    "name": "Amplifier - Q 1602",
    "description": [
      "Compact 2-channel amplifier with robust output for car speakers or subs.",
      "Max Power Output: 320W (2x160W) with low THD for clean audio.",
      "Ideal for powering component speakers or bridged for a subwoofer.",
      "Class AB design ensures balance of power and clarity."
    ],
    "images": ["https://cadencesound.com/wp-content/uploads/2025/01/Q1602.jpg",
      "https://cadencesound.com/wp-content/uploads/2025/01/Q1602-02.jpg",
      "https://cadencesound.com/wp-content/uploads/2025/01/Q1602-04.jpg",
      "https://cadencesound.com/wp-content/uploads/2025/01/Q1602-06.jpg"
    ],
    "categoryId": "amplifier",
    "additionalInfo": [
      "Application Type: Car",
      "Amplifier IC: A/B",
      "Channel: 2 Channels",
      "RMS Power @ 4 Ohm: 80 W × 2",
      "RMS Power @ 2 Ohm: 120 W × 2",
      "Bridge RMS Power @ 4 Ohm: 240 W × 1",
      "In The Box: 1 x Q 1602 Amplifier, User Manual, Installation Screws.",
      "Bridgeable channels for flexible system setup.",
      "Warranty: 1 year against manufacturing defects."
    ],
    "price": 15599,
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  },

  // to upload the images and description with the additional info
  {
    "id": "sdsp4-640",
    "name": "DSP - SDSP4.6ABT1",
    "description": [
      "Introducing the Cadence SDSP4.6ABT1, a game-changing 31-band DSP car amplifier that transforms car audio.",
      "This amplifier delivers superior sound upgrades with advanced technology.",
      "Featuring a 31-band high-power DSP amplifier and a Japan Pioneer PA2032 amplifier for exceptional audio quality and stability.",
      "Crafted with precision using Siemens Hi-Fi capacitors, copper toroidal inductors, and 6 RCA interfaces for premium audio.",
      "Customize your sound with the 31-band EQ accessible via smartphone, tablet, or laptop.",
      "Elevate your driving experience with the Cadence SDSP4.6ABT1!"
    ],
    "images": [
      "https://cadencesound.com/wp-content/uploads/2025/03/SDSP46ABT1-a.jpg",
      "https://cadencesound.com/wp-content/uploads/2025/03/SDSP46ABT1-04.jpg",
      "https://cadencesound.com/wp-content/uploads/2025/03/SDSP46ABT1-08-scaled.webp",
      "https://cadencesound.com/wp-content/uploads/2025/03/SDSP46ABT1-09-scaled.webp"
    ],
    "categoryId": "amplifier",
    "additionalInfo": [
      "Application Type: Car",
      "Channel: 10-Ch",
      "EQ Bands: 31",
      "Sampling Rate: 192 kHz",
      "S/N: 108 dB",
      "Optical Input: Yes",
      "USB Audio Input: Yes",
      "RCA Output: Yes",
      "High-Level Input: Yes",
      "Mobile App Control: Android, Apple"
    ],
    "price": 25439,
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  },

  /// AMpkit/Audio cables 
  {
    "id": "4-gauge-wire-kit-ampkit",
    "name": "4 Gauge Wire Kit - Ampkit",
    "description": [
      "One set of 17' Translucent Twisted Pair, Double-Shielded 100% OFC Audiophile RCA cables",
      "Woven Nylon Mesh on Shielded Power Cable",
      "Mini ANL Distribution Block with 150 Amp Fuse",
      "30' 16 Gauge Translucent Orange/Silver Heavy-Duty Speaker Wire",
      "17' Remote Turn-On Wire",
      "6' Split Loom Tubing",
      "Includes Cadence Decorative Name Plate"
    ],
    "images": ["https://cadencesound.com/wp-content/uploads/2025/04/AMPKIT4.jpg",
      "https://cadencesound.com/wp-content/uploads/2025/04/AMPKIT4-02.jpg",
      "https://cadencesound.com/wp-content/uploads/2025/04/AMPKIT4-03.jpg",
      "https://cadencesound.com/wp-content/uploads/2025/04/AMPKIT4-05.jpg"
    ],
    "categoryId": "ampkit",
    "additionalInfo": [
      "Designed for high-power systems up to 2000W RMS.",
      "OFC (Oxygen-Free Copper) for superior conductivity and signal clarity.",
      "Includes full wiring essentials: power, ground, speaker, RCA, and remote cables with high-quality shielding.",
      "Mini ANL distribution block ensures safe and efficient power handling.",
      "Warranty: 1 year against manufacturing defects."
    ],
    "price": 11299,
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  },
  {
    "id": "8-gauge-wire-kit-ampkit",
    "name": "8 Gauge Wire Kit - Ampkit",
    "description": [
      "Woven Nylon Mesh on Shielded Power Cable",
      "Mini ANL Distribution Block with 100 Amp Fuse",
      "17\" Remote Turn-On Wire",
      "6' Split Loom Tubing",
      "10pc 8\" Black Cable Ties",
      "5pc 14-16 Gauge Butt Connectors",
      "2pc 8 Gauge Butt Connectors",
      "2pc #10 1/2\" Self Tapping Pan Head Screws",
      "2pc Serrated Ground Washers"
    ],
    "images": ["/images/ampkit/WhatsApp Image 2025-06-17 at 15.04.42_356f1531.png",
      "https://cadencesound.com/wp-content/uploads/2025/04/AMPKIT4-08.jpg",
      "https://cadencesound.com/wp-content/uploads/2025/04/AMPKIT4-04.jpg",
      "https://cadencesound.com/wp-content/uploads/2025/04/AMPKIT4-05.jpg"
    ],
    "categoryId": "ampkit",
    "additionalInfo": [
      "Ideal for mid-range car audio setups up to 1000W RMS.",
      "CCA (Copper-Clad Aluminum) conductors for budget-friendly performance.",
      "Includes power/ground/remote/RCA cables, fuse holder, and accessories for complete installation.",
      "Warranty: 1 year against manufacturing defects."
    ],
    "price": 8499,
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  },

  //products for the speakers starts--------------------------------------
  //1
  {
    "id": "subwoofer-fsb-124sa",
    "name": "SUBWOOFER - FSB 124SAI",
    "description": [
      "Feel it before you hear it. The FSB12SAI isn’t just a subwoofer enclosure — it’s an experience. With its 12-inch woofer, built-in amplifier, and space-saving wedge design, this active sub box is built to transform your vehicle into a personal sound chamber where bass becomes a living, breathing force.",
      "Massive Woofer, Massive Presence: Featuring a 12″ black paper cone paired with a laminated butyl rubber surround, the FSB12SA delivers deep, powerful bass that moves air and stirs emotion. It handles up to 250 watts RMS and 500 watts peak, giving your music the full-body impact it deserves.",
      "High-Efficiency Built-In Class D Amplifier: The integrated amplifier maximizes output while maintaining clarity and control. Its compact power design ensures your bass stays clean and responsive, even at high volume levels.",
      "Engineered for Tight, Accurate Bass: The sealed sub box enclosure delivers fast, punchy low-end performance — ideal for precision bass lovers who want more definition and less boom.",
      "Signature FSB Styling: Wrapped in premium black carpet with bold orange Cadence embroidery, this enclosure looks as powerful as it sounds. The aggressive ABS grille not only protects the woofer, but gives your system a bold visual identity.",
      "Smart Space-Saving Form Factor: Measuring just 5.2 to 7.3 inches deep with a slanted wedge shape, the FSB12SA fits snugly behind seats or in tight trunk corners — perfect for modern vehicles where space is at a premium.",
      "Clean RCA Integration: Designed for clean installation with aftermarket head units or processors, the FSB12SA uses RCA inputs to preserve signal integrity and deliver smooth, distortion-free performance.",
      "Deep Bass You Can Feel: With a frequency response down to 35Hz and a sensitivity of 92dB, every note lands with authority — from subtle low-end textures to explosive kick drums."
    ],
    "images": [
      "https://cadencesound.com/wp-content/uploads/2025/04/FSB12SA.jpg",
      "https://cadencesound.com/wp-content/uploads/2025/04/FSB12SA-04.jpg",
      "https://cadencesound.com/wp-content/uploads/2025/04/FSB12SA-02.jpg",
      "https://cadencesound.com/wp-content/uploads/2025/04/FSB12SA-03.jpg"
    ],
    "categoryId": "subwoofer",
    "additionalInfo": [
      "Application Type: Car",
      "Enclosure Type: Active Sealed",
      "Size & Type: 12″",
      "Power Handling: 250W RMS / 500W Peak",
      "Frequency Response: 35Hz – 500Hz",
      "SPL @ 1w/1m: 92 dB",
      "Impedance: 2 Ohm (4 on GB)"
    ],
    "price": 43099,
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  },

  //2
  {
    "id": "subwoofer-ux6va",
    "name": "SUBWOOFER - UX6VA",
    "description": [
      "6-inch compact subwoofer with tight bass response.",
      "Ideal for small cars or under-seat setups.",
      "Max Power Output: 800W.",
      "Built with durable materials for long life.",
      "Exterior: High Grade Black Carpet with Embroidered Logos with Sleek and Sturdy Orange Steel Bar.",
      "Surround: High Density Stitched Foam.",
      "Dust Cap: 3D Injected Poly and Model Number."
    ],
    "images": ["/images/subwoofer/Screenshot 2025-06-17 152734.png"],
    "categoryId": "subwoofer",
    "additionalInfo": [
      "Model: UX6VA",
      "Enclosure Type: 6.5 in. Active, Vented",
      "MAX Power: 500 W",
      "Frequency Response: 65 Hz – 500 Hz",
      "SPL @ 1w/1m: 89 dB",
      "Impedance: 4 Ohm",
      "Dimensions (L x W x H): 15.4 x 10.6 x 9.5 in",
      "Includes: 1 x UX6VA Subwoofer, Fitting Kit",
      "Compact design fits easily under front seats",
      "Warranty: 1 year replacement warranty"
    ],
    "price": 30499,
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  },
  //3
  {
    "id": "subwoofer-ux8va",
    "name": "SUBWOOFER - UX8VA",
    "description": [
      "8-inch active vented subwoofer designed for tight and powerful bass performance.",
      "Perfect for small to mid-sized car installations with space-saving needs.",
      "Max Power Output: 600W.",
      "Exterior: High Grade Black Carpet with Embroidered Logos and a Sleek, Sturdy Orange Steel Bar.",
      "Surround: High Density Stitched Foam.",
      "Dust Cap: 3D Injected Poly for durability and aesthetics."
    ],
    "images": ["/images/subwoofer/ux8va.png"],
    "categoryId": "subwoofer",
    "additionalInfo": [
      "Model Number: UX8VA",
      "Enclosure Type: 8 in. Active, Vented",
      "MAX Power: 600 W",
      "Frequency Response: 53 Hz – 500 Hz",
      "SPL @ 1w/1m: 90 dB",
      "Impedance: 4 Ohm",
      "Dimensions (L x W x H): 16.9 x 11.4 x 10.4 in",
      "Includes: 1 x UX8VA Subwoofer, Fitting Kit",
      "Compact design ideal for under-seat or trunk setups",
      "Warranty: 1 year replacement warranty"
    ],
    "price": 38669,
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  },

  //4
  {
    "id": "subwoofer-qsb10sa",
    "name": "SUBWOOFER - QSB10SA",
    "description": [
      "10-inch active subwoofer with built-in amplifier.",
      "Delivers thumping bass and quick installation.",
      "Max Power: 900W, high-efficiency cooling.",
      "RCA and high-level input supported.",
      "Exterior: High Grade Black Carpet with Embroidered Logos and a Sleek and Sturdy Orange Steel Bar.",
      "Surround: High Density Stitched Foam.",
      "Dust Cap: 3D Injected Poly for added strength and visual appeal."
    ],
    "images": ["/images/subwoofer/qsb10a.png"],
    "categoryId": "subwoofer",
    "additionalInfo": [
      "Model Number: QSB10SA",
      "Enclosure Type: 10 inch. Active, Sealed",
      "MAX Power / RMS: 900 W / 300 W",
      "Frequency Response: 20 Hz – 150 Hz",
      "SPL @ 1w/1m: 90 dB",
      "Impedance: 4 Ohm",
      "Dimensions (L x W x H): 14.1 x 10.8 x 3.3 in",
      "Package Includes: Subwoofer + Wiring Kit",
      "Compact slim body for trunk or rear seat",
      "1 year brand warranty included"
    ],
    "price": 30499,
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  },

  //5
  {
    "id": "coaxial-c160",
    "name": "COAXIAL - C160 COAX-GI",
    "description": [
      "6.5-inch coaxial speaker with 2-way audio performance.",
      "Excellent clarity in mids and treble.",
      "Max Power: 180W.",
      "Easy drop-in replacement for factory speakers."
    ],
    "images": ["/images/c160/C160COAX-1 (1)-1.png",
      "/images/c160/C160COAX-1 (2)-2.png",
      "/images/c160/C160COAX-1 (3)-2.png",
      "/images/c160/C160COAX-1 (4)-5.png"
    ],
    "categoryId": "coaxial",
    "additionalInfo": [
      "Set of 2 speakers + grille covers.",
      "Ideal for car front or rear doors.",
      "Durable and water-resistant build."
    ],
    "price": 3799,
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  },

  //6
  {
    "id": "coaxial-iq653",
    "name": "COAXIAL - IQ653",
    "description": [
      "The IQ653 Coaxial Speakers from the IQ series combine the enduring strength of quartz with cutting-edge audio design.",
      "Embodying the spirit of “Infused Quartz,” the IQ653 features a sleek black finish accented by a radiant orange highlight, symbolizing energy and precision.",
      "With its 6.5-inch three-way configuration, the IQ653 delivers a full, dynamic soundstage, transforming every journey into a concert-like experience.",
      "Enhanced Three-Way Audio Clarity: Hear details across highs, mids, and lows with optimal balance.",
      "Superior Materials, Unmatched Durability: Built to withstand heat, vibration, and environmental challenges.",
      "Sparkling Highs, Smooth Midrange: Engineered for crisp vocals and resonant highs without harshness.",
      "Seamless Installation with Grille Protection: Comes ready with grilles for protection and easy installation.",
      "Performance Across All Frequencies: Designed to deliver consistent output at all volume levels."
    ],
    "images": [
      "https://cadencesound.com/wp-content/uploads/2024/12/iq653.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/iq653-01.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/iq653-03.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/iq653-04.jpg"
    ],
    "categoryId": "coaxial",
    "additionalInfo": [
      "Application Type: Car",
      "Size & Type: 6.5″ 3-Way Coaxial",
      "Power Handling: 50W RMS / 125W Peak",
      "Frequency Response: 60 Hz – 20 kHz",
      "SPL @ 1w/1m: 89 dB",
      "Impedance: 4 Ohm",
      "Package: 2 speakers + screws",
      "Compatible with most car models",
      "1 year manufacturing warranty"
    ],
    "price": 8999,
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  },

  //7
  {
    "id": "component-iq65k",
    "name": "COMPONENT - IQ65K",
    "description": [
      "The IQ65K Component Speakers from the IQ series embody the spirit of “Infused Quartz”—where purity meets precision.",
      "Designed to deliver audiophile-grade sound, the IQ65K features a sleek black finish with vibrant orange accents, symbolizing energy and clarity.",
      "With its two-way component design, this speaker system delivers superior separation and precision, bringing every note to life with unmatched detail and depth.",
      "Precision Sound, Perfectly Separated: Hear distinct vocals, instruments, and ambient detail with clarity.",
      "Premium Build for Lasting Performance: Durable construction ensures long-lasting quality and reliability.",
      "Enhanced Crossover Network: Dedicated crossovers ensure smooth transitions between woofer and tweeter.",
      "Flexible Tweeter Mounting Options: Surface and flush mount options for a tailored installation.",
      "Seamless Installation, Elegant Design: Engineered to fit most vehicle doors while adding style and performance."
    ],
    "images": [
      "https://cadencesound.com/wp-content/uploads/2024/12/iq65k-768x768.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/iq65k-01.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/iq65k-02.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/iq65k-04.jpg"
    ],
    "categoryId": "component",
    "additionalInfo": [
      "Application Type: Car",
      "Size & Type: 6.5″ 2-Way Component Kit",
      "Power Handling: 60W RMS / 150W Peak",
      "Frequency Response: 60 Hz – 20 kHz",
      "SPL @ 1w/1m: 89 dB",
      "Impedance: 4 Ohm",
      "Package: 2 woofers, 2 tweeters, 2 crossovers",
      "Designed for premium car audio upgrades",
      "Warranty: 1 year replacement"
    ],
    "price": 10799,
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  },

  //8
  {
    "id": "coaxial-q652xi",
    "name": "COAXIAL - Q652XI",
    "description": [
      "IQ652Xi (2-way full-range Coaxial system) designed to elevate your in-car audio experience.",
      "Model Number: IQ652Xi with a 6.5-inch driver delivers balanced mids and crisp highs.",
      "Engineered for OEM replacement with enhanced sound dynamics.",
      "RMS/MAX Power: 55W / 140W for rich, detailed performance.",
      "Frequency Response: 70 Hz - 20 kHz ensures coverage of a full musical spectrum.",
      "SPL at 1W/1m: 89 dB for efficient output without distortion."
    ],
    "images": [
      "/images/subwoofer/Q652Xi.png",
      "/images/subwoofer/Q652XiGE-1.png",
      "/images/subwoofer/Q652XiGE-3.png",
      "/images/subwoofer/Q652XiGE-4.png"
    ],
    "categoryId": "coaxial",
    "additionalInfo": [
      "Model Number: IQ652Xi",
      "Size: 6.5 in.",
      "RMS/MAX Power: 55W / 140W",
      "Frequency Response: 70 Hz - 20 kHz",
      "SPL at 1W/1m: 89 dB",
      "Magnet: 22 oz.",
      "System Impedance: 4 ohm",
      "Mounting Depth: 2.60 in.",
      "Includes: Pair of coaxial speakers",
      "Plug-and-play compatible for most cars",
      "12-month manufacturer warranty"
    ],
    "price": 9499,
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  },

  //9
  {
    "id": "component-q65kxi",
    "name": "COMPONENT - Q65KXi-GI",
    "description": [
      "Q65KXi is a 6.5-inch 2-way component speaker system engineered for rich sound reproduction and precise imaging.",
      "Built for car audio enthusiasts, it features a 22 oz magnet and separate tweeter for detailed highs and warm mids.",
      "Rated at 60W RMS and 240W peak power, the system delivers dynamic output with clarity.",
      "Ideal for audiophile-level upgrades with accurate frequency response and minimal distortion."
    ],
    "images": [
      "/images/subwoofer/iq65kxi.png",
      "https://cadencesound.com/wp-content/uploads/2024/12/iq65kge-06.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/iq65kge-03.jpg"
    ],
    "categoryId": "component",
    "additionalInfo": [
      "Model Number: Q65KXi",
      "Application Type: Car",
      "Size & Type: 6.5 inch, 2-Way Component Speaker",
      "Power Handling: 60W RMS / 240W Peak",
      "Frequency Response: 65 Hz – 21 kHz",
      "SPL @ 1w/1m: 89 dB",
      "Impedance: 4 Ohm",
      "Dimensions: 22.2 inch / 58mm (Woofer), 0.77 inch / 20mm (Tweeter)",
      "Magnet: 22 oz",
      "Includes: Woofer, tweeter, and passive crossover",
      "Covered under 1 year manufacturer warranty"
    ],
    "price": 13599,
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  },

  //10
  {
    "id": "coaxial-qr965",
    "name": "COAXIAL - QR965",
    "description": [
      "The QR965 Coaxial Speakers bring the spirit of “Quartz Resonance Nine” to life, merging precision engineering with elegant design.",
      "Wrapped in a sleek all-black finish, accented by subtle textures, the QR965 exudes strength and sophistication.",
      "Its advanced components and powerful soundstage redefine what’s possible for 6.5-inch speakers, delivering a perfectly balanced and immersive audio experience.",
      "Dynamic 2-Way Coaxial System:",
      "Engineered for Precision and Durability:",
      "Refined High Frequencies:",
      "Visually Stunning, Built to Last:",
      "Expansive Frequency and Efficiency:"
    ],
    "images": [
      "https://cadencesound.com/wp-content/uploads/2024/12/qr965.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/qr965-01.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/qr965-03.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/qr965-04.jpg"
    ],
    "categoryId": "coaxial",
    "additionalInfo": [
      "Application Type: Car",
      "Size & Type: 6.5″ 2-Way Coaxial Car Audio",
      "Power Handling: 65W RMS / 160W Peak",
      "Frequency Response: 60 Hz – 20 kHz",
      "SPL @ 1w/1m: 90 dB",
      "Impedance: 4 Ohm",
      "Set includes: 2 speakers + grilles.",
      "Weather-resistant housing.",
      "Backed by 12-month warranty."
    ],
    "price": 12299,
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  },

  //11
  {
    "id": "component-qr965k",
    "name": "COMPONENT - QR965K",
    "description": [
      "The QR965K Component Kit is the ultimate embodiment of “Quartz Resonance Nine”, where meticulous engineering meets sophisticated design.",
      "With its all-black, sleek aesthetics and unparalleled performance, the QR965K delivers an extraordinary listening experience.",
      "Built as a 6.5-inch 2-Way Component System, it offers precision, power, and clarity, creating a seamless fusion of artistry and technology.",
      "2-Way Component System for Perfect Sound Separation:",
      "Premium Materials, Refined Performance:",
      "Silk Dome Tweeter for Pristine Highs:",
      "Flexible and Versatile Installation:",
      "Expansive Frequency and Dynamic Range:"
    ],
    "images": [
      "https://cadencesound.com/wp-content/uploads/2024/12/qr965k.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/qr965k-01-768x768.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/qr965k-04.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/qr965k-07.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/qr965k-08.jpg"
    ],
    "categoryId": "component",
    "additionalInfo": [
      "Application Type: Car",
      "Size & Type: 6.5″ 2-Way Component Kit",
      "Power Handling: 75W RMS / 180W Peak",
      "Frequency Response: 65 Hz – 20 kHz",
      "SPL @ 1w/1m: 89 dB",
      "Impedance: 4 Ohm",
      "Contents: 2 woofers, 2 tweeters, 2 crossovers.",
      "Built for audiophiles and sound-off events.",
      "Full-year product warranty included."
    ],
    "price": 18299,
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  },

  //12
  {
    "id": "coaxial-qrs65r",
    "name": "COAXIAL - QRS65R",
    "description": [
      "As part of the “Quartz Resonance Supreme” series, the QRS65R Refined Edition represents a meticulous evolution in sound engineering.",
      "Designed for those who seek warmth, depth, and detail, the QRS65R combines a sleek, sophisticated aesthetic with natural, lifelike audio reproduction.",
      "From the carefully tuned Sandy Coated Paper Cone to its robust craftsmanship, this speaker delivers an elevated listening experience for true music enthusiasts.",
      "Natural Sound, Refined Dynamics:",
      "Durable Design for Pure Performance:",
      "Balanced Frequency for Complete Soundstage:",
      "Effortless Installation, Perfect Fit:",
      "Refined Elegance, Unmistakable Identity:"
    ],
    "images": [
      "https://cadencesound.com/wp-content/uploads/2024/12/qrs65r.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/qrs65r-01.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/qrs65r-04.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/qrs65r-03.jpg"
    ],
    "categoryId": "coaxial",
    "additionalInfo": [
      "Application Type: Car",
      "Size & Type: 6.5″ 2-Way Coaxial",
      "Power Handling: 75W RMS / 320W Peak",
      "Frequency Response: 65 Hz – 20 kHz",
      "SPL @ 1w/1m: 90 dB",
      "Impedance: 4 Ohm",
      "Sold as pair with mounting hardware.",
      "Durable rubber surround for longer life.",
      "1 year warranty for peace of mind."
    ],
    "price": 17099,
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  },

  //13
  {
    "id": "component-qrs6k2",
    "name": "COMPONENT - QRS6K2-GI",
    "description": [
      "QRS6K2 – Precision, Power, and Pure Resonance",
      "Crafted under the philosophy of “Quartz Resonance Supreme,” the QRS6K2 Component Speakers bring together precision engineering and modern aesthetics.",
      "With its striking orange-accented tweeter shield and meticulously crafted woofer cone, the QRS6K2 is designed for those who demand a superior audio experience.",
      "From its refined appearance to its flawless performance, it redefines car audio with uncompromising attention to detail.",
      "Engineered for Sonic Perfection:",
      "Built with Premium Materials:",
      "Immersive Audio with Expansive Range:",
      "Customizable and Versatile Installation:",
      "A Fusion of Style and Performance:"
    ],
    "images": [
      "https://cadencesound.com/wp-content/uploads/2024/12/qrs6k2.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/qrs6k2-02.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/qrs6k2-03.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/qrs6k2-05.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/qrs6k2-04.jpg"
    ],
    "categoryId": "component",
    "additionalInfo": [
      "Application Type: Car",
      "Size & Type: 6.5″ 2-Way Component Kit",
      "Power Handling: 85W RMS / 200W Peak",
      "Frequency Response: 65 Hz – 20 kHz",
      "SPL @ 1w/1m: 91 dB",
      "Impedance: 4 Ohm",
      "Includes all wiring and mounting accessories.",
      "Crossover network ensures optimal sound flow.",
      "Full 1 year manufacturer warranty."
    ],
    "price": 30499,
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  },


  // new Speakers
  {
    "id": "cdf82sa",
    "name": "Subwoofer - CDF82SA",
    "price": 32399,
    "description": [
      "The CDF82SA is a premium dual 10-inch active sealed subwoofer designed to deliver impactful, deep bass.",
      "Encased in aviation-grade black carpet with embroidered logos, it offers both durability and style.",
      "Laminated Butyl rubber surround ensures long-lasting performance and enhanced low-frequency accuracy.",
      "Black matte finish poly-mica cone and dust cap deliver clear, punchy bass response.",
      "Ideal for enthusiasts seeking immersive low-end reinforcement with sleek aesthetics."
    ],
    "images": ["/images/subwoofer/cdf8.png"],
    "categoryId": "subwoofer",
    "additionalInfo": [
      "Model Number: CDF82SA",
      "Type: Dual 10-inch Active Sealed Subwoofer",
      "Power Handling: 300W RMS / 900W Max",
      "Frequency Response: 40 Hz – 3 kHz",
      "SPL @ 1w/1m: 92 dB",
      "Impedance: 4 Ohm",
      "Dimensions (L x W x H): 25.91 x 11.02 x 5.12 in",
      "Exterior: Aviation grade black carpet with embroidered logos",
      "Surround: Laminated Butyl rubber",
      "Dust Cap/Cone: Black matte finish poly-mica",
      "Includes: 1 x CDF82SA Subwoofer",
      "Product visuals are indicative",
      "Support: +91 9278411411. Replacement only for defects"
    ],
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  },

  ////////////////////
  {
    "id": "bm12d1",
    "name": "Subwoofer - BM12D1",
    "price": 134449,
    "description": [
      "The BM12D1 from the Beast Master series is a masterpiece of power and precision, designed for those who crave bass that doesn’t just shake the ground but reverberates through the soul.",
      "With its bold 12-inch profile and striking deep black and fiery orange accents, this subwoofer isn’t just a speaker—it’s a declaration of dominance.",
      "Dual 1-ohm voice coils offer flexible wiring options to unlock its full potential—2000W RMS and 5000W Peak.",
      "Precision-crafted black paper cone with high-density foam surround delivers dynamic clarity and bass depth.",
      "With 21mm Xmax and ported box optimization, the BM12D1 ensures every beat hits with controlled power and immersive impact."
    ],
    "images": [
      "https://cadencesound.com/wp-content/uploads/2024/12/bm12d1.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/bm12d1-02.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/bm12d1-05.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/bm12d1-04.jpg"
    ],
    "categoryId": "subwoofer",
    "additionalInfo": [
      "Application Type: Car",
      "Size & Type: 12″ Subwoofer",
      "Power Handling: 2000W RMS / 5000W Peak",
      "Frequency Response: 25 Hz – 2.5 kHz",
      "SPL @ 1w/1m: 88 dB",
      "Impedance: Dual 1 Ohm",
      "Xmax: 21mm (0.827 inch)",
      "Recommended Enclosure: 5 cu. ft. ported box",
      "Port Specs: 6\" diameter x 5.63\" length",
      "Cone: Black paper",
      "Surround: High-density foam",
      "Design: Beast Master series with lion emblem",
      "Includes: 1 x BM12D1 Subwoofer",
      "Support: +91 9278411411",
      "Images for illustration only"
    ],
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  }
  ,

  {
    "id": "bm12d2",
    "name": "Subwoofer - BM12D2",
    "price": 134449,
    "description": [
      "The BM12D2 from the Beast Master series is your ticket to a world where sound transcends its boundaries.",
      "Majestic 12-inch profile with bold black and orange accents and a lion emblem etched at the center—this subwoofer is designed to dominate.",
      "Dual 2-ohm voice coils provide wiring flexibility—from 1-ohm high power setups to balanced 4-ohm configurations.",
      "Engineered with a black paper cone and high-density foam surround for accurate, resilient bass reproduction.",
      "Delivers up to 2000W RMS and 5000W Peak power, with an Xmax of 21mm to achieve dynamic, deep bass impact.",
      "Optimized for a 5 cu. ft. ported enclosure (6\" port diameter x 5.63\" length) to ensure clean, resonant bass in every beat."
    ],
    "images": [
      "https://cadencesound.com/wp-content/uploads/2024/12/bm12d2.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/bm12d2-02.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/bm12d2-03.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/bm12d2-05.jpg"
    ],
    "categoryId": "subwoofer",
    "additionalInfo": [
      "Application Type: Car",
      "Size & Type: 12″ Subwoofer",
      "Power Handling: 2000W RMS / 5000W Peak",
      "Frequency Response: 25 Hz – 2.5 kHz",
      "SPL @ 1w/1m: 88 dB",
      "Impedance: Dual 2 Ohm",
      "Xmax: 21mm (0.827 inch)",
      "Recommended Enclosure: 5 cu. ft. ported box",
      "Port Specs: 6\" diameter x 5.63\" length",
      "Cone: Black paper",
      "Surround: High-density foam",
      "Design: Beast Master series with lion emblem",
      "Includes: 1 x BM12D2 Subwoofer",
      "Support: +91 9278411411",
      "Product visuals may vary"
    ],
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  }
  ,

  {
    "id": "bm15d1",
    "name": "Subwoofer - BM15D1",
    "price": 148709,
    "description": [
      "The BM15D1 from the Beast Master series is a true giant of sound, standing tall with its commanding 15-inch profile.",
      "Wrapped in bold black with fiery orange accents, this subwoofer is a visual and auditory powerhouse marked with the iconic lion emblem.",
      "Equipped with dual 1-ohm voice coils, it offers flexible wiring options—0.5-ohm for maximum output or 2-ohm for balanced stability.",
      "With a massive 2500W RMS and 6500W Peak power handling, the BM15D1 delivers thunderous bass with authority.",
      "The non-pressed black paper cone and high-density foam surround ensure precision, durability, and powerful sound reproduction.",
      "An Xmax of 21mm (0.827 inch) provides deep low-end response with dynamic range and vibration control.",
      "Optimized for a 7 cu. ft. ported enclosure with a 6\" diameter x 3\" port, it delivers refined, room-filling bass output.",
      "Covers a wide 25Hz – 2.5kHz frequency range with 90 dB sensitivity, making every bassline and low-end detail come alive.",
      "The BM15D1 isn’t just a sub—it’s a declaration of sonic supremacy for the serious audio enthusiast."
    ],
    "images": [
      "https://cadencesound.com/wp-content/uploads/2024/12/bm15d1.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/bm15d1-02.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/bm15d1-05.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/bm15d1-04.jpg"
    ],
    "categoryId": "subwoofer",
    "additionalInfo": [
      "Application Type: Car",
      "Size & Type: 15″ Subwoofer",
      "Power Handling: 2500W RMS / 6500W Peak",
      "Frequency Response: 25 Hz – 2.5 kHz",
      "SPL @ 1w/1m: 90 dB",
      "Impedance: Dual 1 Ohm",
      "Xmax: 21mm (0.827 inch)",
      "Recommended Enclosure: 7 cu. ft. ported box",
      "Port Specs: 6\" diameter x 3\" length",
      "Cone: Non-pressed black paper",
      "Surround: High-density foam",
      "Design: Beast Master series with lion emblem",
      "Package: 1 x BM15D1 Subwoofer",
      "Image for reference purposes only",
      "Contact: +91 9278411411 for support"
    ],
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  }
  ,

  {
    "id": "bm15d2",
    "name": "Subwoofer - BM15D2",
    "price": 148709,
    "description": [
      "The BM15D2 from the Beast Master series is a true giant of sound, standing tall with its commanding 15-inch profile.",
      "Wrapped in bold black with fiery orange accents and marked with the iconic lion emblem, it blends visual intensity with auditory excellence.",
      "Dual 1-ohm voice coils provide wiring flexibility—from 0.5-ohm setups for max output to 2-ohm for stable performance.",
      "Handles a staggering 2500W RMS and 6500W Peak power, ensuring relentless and immersive bass delivery.",
      "Built with a non-pressed black paper cone and high-density foam surround for sonic accuracy and durability.",
      "Xmax of 21mm enables powerful low-end extension and dynamic vibration reproduction.",
      "Optimized for a 7 cu. ft. ported enclosure with a 6\" port diameter and 3\" length, tuned for precision and depth.",
      "Covers 25Hz to 2.5kHz with 90dB sensitivity, ensuring every bass note resonates clearly and deeply."
    ],
    "images": [
      "https://cadencesound.com/wp-content/uploads/2024/12/bm15d1.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/bm15d1-02.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/bm15d1-04.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/bm15d1-05.jpg"
    ],
    "categoryId": "subwoofer",
    "additionalInfo": [
      "Application Type: Car",
      "Size & Type: 15″ Subwoofer",
      "Power Handling: 2500W RMS / 6500W Peak",
      "Frequency Response: 25 Hz – 2.5 kHz",
      "SPL @ 1w/1m: 90 dB",
      "Impedance: Dual 1 Ohm",
      "Xmax: 21mm (0.827 inch)",
      "Recommended Enclosure: 7 cu. ft. ported box",
      "Port Specs: 6\" diameter x 3\" length",
      "Cone: Non-pressed black paper",
      "Surround: High-density foam",
      "Design: Beast Master series with lion emblem",
      "Includes: 1 x BM15D2 Subwoofer",
      "Helpline: +91 9278411411",
      "Images for illustration purposes only"
    ],
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  },


  {
    "id": "cmw124d",
    "name": "SubWoofer - CMW124D",
    "price": 19979,
    "description": [
      "Unleash Dynamic Flexibility with the CMW124D Subwoofer from Cadence’s Momentum Series.",
      "This 12-inch powerhouse features a bold black matte cone with the signature orange Momentum logo, combining style and substance.",
      "With dual 4-ohm voice coils, it supports flexible wiring—2-ohm for max output or 8-ohm for multi-driver configurations.",
      "Delivers up to 400W RMS and 800W Peak power, ensuring strong, distortion-free bass in any setup.",
      "Built with a durable pressed paper cone and resilient butyl rubber surround for precise, long-lasting performance.",
      "An Xmax of 10.25mm (0.404 inches) allows the CMW124D to reproduce even the deepest low-end vibrations with finesse.",
      "Optimized for a 1.75 cu. ft. ported enclosure with 4-inch diameter and 8.75-inch port length for deep, resonant output.",
      "Covers a wide frequency range of 30Hz to 1.8kHz with 91dB sensitivity for powerful, detailed bass delivery.",
      "Whether you're tuning for accuracy or thunderous presence, the CMW124D adapts effortlessly to your audio goals."
    ],
    "images": [
      "https://cadencesound.com/wp-content/uploads/2024/12/cmw124d.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/cmw124d-02.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/cmw124d-05.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/cmw124d-03.jpg"
    ],
    "categoryId": "subwoofer",
    "additionalInfo": [
      "Application Type: Car",
      "Size & Type: 12″ Subwoofer",
      "Power Handling: 400W RMS / 800W Peak",
      "Frequency Response: 30 Hz – 1.8 kHz",
      "SPL @ 1w/1m: 91 dB",
      "Impedance: Dual 4 Ohm",
      "Xmax: 10.25mm (0.404 inch)",
      "Recommended Enclosure: 1.75 cu. ft. ported box",
      "Port Specs: 4\" diameter x 8.75\" length",
      "Cone: Pressed black matte paper",
      "Surround: Butyl rubber",
      "Design: Momentum Series with orange logo",
      "In The Package: 1 x CMW124D Subwoofer Unit",
      "Note: Product images are for reference only. Actual product may vary slightly.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  },


  {
    "id": "slw12s4",
    "name": "SubWoofer - SLW12S4",
    "price": 20649,
    "description": [
      "Discover the Slim Bass Revolution with the SLW12S4 Subwoofer from the Supernova Slim Series.",
      "This 12-inch subwoofer features a sleek, space-saving design ideal for compact installations without compromising on performance.",
      "With a bold orange metallic frame and a sleek black cone, it adds visual flair to any car audio system.",
      "Equipped with a single 4-ohm voice coil, it offers simplified wiring for seamless amplifier integration.",
      "Delivers 250W RMS and 500W Peak power to ensure rich, distortion-free bass at all volume levels.",
      "The ultra-stiff composite paper cone and butyl rubber surround enhance sound clarity and durability under pressure.",
      "An Xmax of 9.0mm enables deep, articulate bass extension, ideal for genres demanding precise low-frequency response.",
      "Optimized for sealed enclosures, it thrives in a 0.88 cu. ft. box and fits tight spaces with a 4.17-inch mounting depth.",
      "Covers 31 Hz to 500 Hz with 88 dB sensitivity to deliver full-bodied bass that’s felt as much as heard."
    ],
    "images": [
      "https://cadencesound.com/wp-content/uploads/2024/12/slw12s4.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/slw12s4-02.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/slw12s4-04.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/slw12s4-05.jpg"
    ],
    "categoryId": "subwoofer",
    "additionalInfo": [
      "Application Type: Car",
      "Size & Type: 12″ Subwoofer",
      "Power Handling: 250W RMS / 500W Peak",
      "Frequency Response: 31 Hz – 500 Hz",
      "SPL @ 1w/1m: 88 dB",
      "Impedance: 4 Ohm",
      "Xmax: 9.0 mm",
      "Mounting Depth: 4.17 inches",
      "Recommended Enclosure: 0.88 cu. ft. sealed box",
      "Cone: Ultra-stiff composite paper",
      "Surround: Butyl rubber",
      "Frame: Orange metallic finish",
      "In The Package: 1 x SLW12S4 Subwoofer Unit.",
      "Note: Product images are for reference only. Actual product may vary slightly.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  },

  {
    "id": "us6d4",
    "name": "SubWoofer - US6D4",
    "price": 14469,
    "description": [
      "The US6D4 is a compact powerhouse from the Ultra Slim Series, designed for performance where space is a premium.",
      "Its 6-inch profile fits perfectly into tight enclosures, making it ideal for under-seat or stealth installations.",
      "Dual 4-ohm voice coils offer flexible wiring for custom audio setups, whether you want to maximize amplifier output or ensure stable impedance.",
      "With a rugged composite cone and butyl rubber surround, it delivers surprisingly deep bass for its size while resisting wear from heavy use.",
      "Despite its compact size, the US6D4 punches above its weight class with a powerful low-frequency response, dynamic impact, and reliable daily performance."
    ],
    "images": [
      "https://cadencesound.com/wp-content/uploads/2024/12/us6d4.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/us6d4-02.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/us6d4-05.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/us6d4-03.jpg"
    ],
    "categoryId": "subwoofer",
    "additionalInfo": [
      "Application Type: Car",
      "Size & Type: 6″",
      "Power Handling: 150W RMS / 300W Peak",
      "Frequency Response: 40 Hz – 1 kHz",
      "SPL @ 1w/1m: 87 dB",
      "Impedance: Dual 4 Ohm",
      "In The Package: 1 x US6D4 Subwoofer Unit.",
      "Note: Product images are for reference only. Actual product may vary slightly.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  },

  {
    "id": "us8d4",
    "name": "SubWoofer - US8D4",
    "price": 20719,
    "description": [
      "Feel the Depths with the US8D4 Ultra Shock Series Subwoofer.",
      "The US8D4 continues the tradition of excellence within the Ultra Shock (US) series, delivering unmatched bass performance in a compact 8-inch design.",
      "Wrapped in a bold orange frame, this subwoofer exudes confidence and craftsmanship. Whether you’re a casual listener or a bass aficionado, the US8D4 elevates your audio experience to new heights.",
      "Equipped with dual 4-ohm voice coils, the US8D4 provides outstanding wiring flexibility. Configure it to 2 ohms for dynamic, high-impact bass perfect for spirited drives, or wire it to 8 ohms for seamless compatibility with multi-speaker systems.",
      "Its 400 watts RMS and 800 watts peak power ensure reliability and power in any setup.",
      "The Kevlar Reinforced Ultra Stiff Paper Composite cone and High Excursion Butyl Rubber surround offer a perfect blend of durability and responsiveness. This premium construction ensures the US8D4 consistently delivers deep, resonant bass with accuracy and control.",
      "With its exceptional Xmax capability, the US8D4 brings low frequencies to life with incredible detail and depth.",
      "Designed for ported enclosures, the US8D4 thrives in a 0.7 cubic foot box with a 4-inch diameter, 5.75-inch-long port. This setup ensures powerful yet distortion-free bass.",
      "Operating within a frequency range of 38Hz to 500Hz and featuring a sensitivity of 92dB, the US8D4 captures every nuance of your favorite music.",
      "The US8D4 Ultra Shock subwoofer is the perfect balance of precision and performance for those who demand versatility and power."
    ],
    "images": [
      "https://cadencesound.com/wp-content/uploads/2024/12/us8d4.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/us8d4-02.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/us8d4-05.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/us8d4-04.jpg"
    ],
    "categoryId": "subwoofer",
    "additionalInfo": [
      "Application Type: Car",
      "Size & Type: 8″",
      "Power Handling: 400W RMS / 800W Peak",
      "Frequency Response: 40 Hz – 800 Hz",
      "SPL @ 1w/1m: 87 dB",
      "Impedance: Dual 4 Ohm",
      "In The Package: 1 x US8D4 Subwoofer Unit.",
      "Note: Product images are for reference only. Actual product may vary slightly.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  },

  {
    "id": "us10d4",
    "name": "SubWoofer - US10D4",
    "price": 28949,
    "description": [
      "Feel the Power of Precision with the US10D4 Ultra Shock Series Subwoofer.",
      "The US10D4 brings bold design and unmatched performance to the Ultra Shock (US) series. With its striking 10-inch profile and signature orange frame, this subwoofer combines aesthetics and power to deliver bass that is both deep and dynamic. Whether you’re cruising or stationary, the US10D4 makes every track an immersive sonic experience.",
      "The dual 4-ohm voice coils in the US10D4 offer versatile wiring options. Configure it to 2 ohms for dynamic, high-impact bass that energizes your system, or wire it to 8 ohms for compatibility with multi-speaker setups, achieving consistent performance and balanced soundstage.",
      "Crafted with a Kevlar Reinforced Ultra Stiff Paper Composite cone and High Excursion Butyl Rubber surround, the US10D4 is built for durability and precision. This advanced design enables accurate sound reproduction while enduring high-powered audio demands, perfect for any music genre.",
      "With its impressive Xmax capability, the US10D4 delivers low frequencies with depth and definition. From the resonant rumble of bass guitars to the explosive dynamics of cinematic scores, this subwoofer ensures every note is felt as much as heard.",
      "Optimized for ported enclosures, the US10D4 thrives in a 1.15 cubic foot box with a 3-inch diameter, 9.5-inch-long port. This setup ensures distortion-free bass that brings your favorite tracks to life with crisp, impactful energy.",
      "Operating within a frequency range of 31Hz to 500Hz and featuring a sensitivity of 91dB, the US10D4 delivers a full spectrum of bass performance. Whether it’s subtle audio textures or thunderous low-end drops, this subwoofer delivers unparalleled clarity and impact."
    ],
    "images": [
      "https://cadencesound.com/wp-content/uploads/2024/12/us10d4.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/us10d4-02.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/us10d4-04.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/us10d4-05.jpg"
    ],
    "categoryId": "subwoofer",
    "additionalInfo": [
      "Application Type: Car",
      "Size & Type: 10″",
      "Power Handling: 600W RMS / 1200W Peak",
      "Frequency Response: 30 Hz – 800 Hz",
      "SPL @ 1w/1m: 87 dB",
      "Impedance: Dual 4 Ohm",
      "In The Package: 1 x US10D4 Subwoofer Unit.",
      "Note: Product images are for reference only. Actual product may vary slightly.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  },


  {
    "id": "us12d4",
    "name": "SubWoofer - US12D4",
    "price": 34489,
    "description": [
      "Experience Deep, Thunderous Bass with the US12D4 Ultra Shock Subwoofer.",
      "This 12-inch subwoofer features dual 4-ohm voice coils for flexible wiring—ideal for both high-impact setups and multi-speaker systems.",
      "Its Kevlar-reinforced cone and butyl rubber surround ensure precision, power, and durability at high volumes.",
      "Optimized for ported enclosures (1.34 cu ft with 3\"x6.25\" port), it delivers clean, distortion-free bass.",
      "With 750W RMS and 1500W Peak power, a wide frequency response of 28Hz–500Hz, and 93dB sensitivity, the US12D4 delivers clear, resonant audio in any car audio setup."
    ],
    "images": [
      "https://cadencesound.com/wp-content/uploads/2024/12/us12d4.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/us12d4-02.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/us12d4-04.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/us12d4-05.jpg"
    ],
    "categoryId": "subwoofer",
    "additionalInfo": [
      "Application Type: Car",
      "Size & Type: 12″",
      "Power Handling: 750W RMS / 1500W Peak",
      "Frequency Response: 28 Hz – 800 Hz",
      "SPL @ 1w/1m: 87 dB",
      "Impedance: Dual 4 Ohm",
      "In The Package: 1 x US12D4 Subwoofer Unit.",
      "Note: Product images are for reference only. Actual product may vary slightly.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  },

  {
    "id": "wb12d2",
    "name": "SubWoofer - WB12D2",
    "price": 72139,
    "description": [
      "Unleash Thunderous Bass with the WB12D2 Subwoofer.",
      "With dual 2-ohm coils, this 12-inch beast delivers up to 2400W peak power, offering wiring flexibility for max output or precision.",
      "A non-pressed paper cone with high-roll foam surround ensures clean, deep bass with excellent control and durability.",
      "Optimized for sealed (1.5 cu ft) or ported (2.25 cu ft) enclosures, it offers immersive sound for serious audiophiles.",
      "Handles a wide frequency range from 20Hz–500Hz with an Xmax of 18.5mm, delivering powerful lows and rich details at 87dB sensitivity."
    ],
    "images": [
      "https://cadencesound.com/wp-content/uploads/2024/12/wb12d2.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/wb12d2-02.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/wb12d2-05.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/wb12d2-04.jpg"
    ],
    "categoryId": "subwoofer",
    "additionalInfo": [
      "Application Type: Car",
      "Size & Type: 12″",
      "Power Handling: 1200W RMS / 2400W Peak",
      "Frequency Response: 20 Hz – 500 Hz",
      "SPL @ 1w/1m: 87 dB",
      "Impedance: Dual 2 Ohm",
      "Xmax: 18.5 mm",
      "Cone Material: Non-Pressed Black Paper",
      "Surround: High-Roll Foam",
      "Enclosure Type: Sealed (1.5 cu ft) / Ported (2.25 cu ft)",
      "In The Package: 1 x WB12D2 Subwoofer Unit.",
      "Note: Product images are for reference only. Actual product may vary slightly.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  },


  {
    "id": "wb12d4",
    "name": "SubWoofer - WB12D4",
    "price": 72139,
    "description": [
      "12-inch subwoofer with dual 4-ohm voice coils for flexible wiring setups.",
      "Delivers 1200W RMS and 2400W peak power with clean, deep bass.",
      "Non-pressed black paper cone and high-strength foam surround for clarity and control.",
      "High Xmax of 18.5 mm ensures powerful low-end performance without distortion.",
      "Ideal for sealed (1.5 cu ft) or ported (2.25 cu ft) enclosures for versatile bass tuning."
    ],
    "images": [
      "https://cadencesound.com/wp-content/uploads/2024/12/wb12d4.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/wb12d4-02.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/wb12d4-05.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/wb12d4-04.jpg"
    ],
    "categoryId": "subwoofer",
    "additionalInfo": [
      "Application Type: Car",
      "Size & Type: 12″",
      "Power Handling: 1200W RMS / 2400W Peak",
      "Frequency Response: 20 Hz – 500 Hz",
      "SPL @ 1w/1m: 87 dB",
      "Impedance: Dual 4 Ohm",
      "Xmax: 18.5 mm",
      "Cone Material: Non-Pressed Black Paper",
      "Surround: High-Strength Foam",
      "Enclosure Type: Sealed (1.5 cu ft) / Ported (2.25 cu ft)",
      "In The Package: 1 x WB12D4 Subwoofer Unit.",
      "Note: Product images are for reference only. Actual product may vary slightly.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  },


  {
    "id": "wb15d2",
    "name": "SubWoofer - WB15D2",
    "price": 84899,
    "description": [
      "15-inch subwoofer with dual 2-ohm voice coils for versatile wiring setups.",
      "Delivers up to 1500W RMS / 3000W peak power for extreme bass impact.",
      "Non-pressed black paper cone and high-roll foam surround ensure clarity and strength.",
      "17.5 mm Xmax enables deep, distortion-free bass reproduction.",
      "Optimized for sealed (2.5 cu ft) or ported (3.5 cu ft) enclosures for custom sound."
    ],
    "images": [
      "https://cadencesound.com/wp-content/uploads/2024/12/wb15d2.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/wb15d2-02.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/wb15d2-04.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/wb15d2-05.jpg"
    ],
    "categoryId": "subwoofer",
    "additionalInfo": [
      "Application Type: Car",
      "Size & Type: 15″",
      "Power Handling: 1500W RMS / 3000W Peak",
      "Frequency Response: 20 Hz – 500 Hz",
      "SPL @ 1w/1m: 89 dB",
      "Impedance: Dual 2 Ohm",
      "Xmax: 17.5 mm",
      "Cone Material: Non-Pressed Black Paper",
      "Surround: High-Roll Foam",
      "Enclosure Type: Sealed (2.5 cu ft) / Ported (3.5 cu ft)",
      "In The Package: 1 x WB15D2 Subwoofer Unit.",
      "Note: Product images are for reference only. Actual product may vary slightly.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  },


  {
    "id": "wb15d4",
    "name": "SubWoofer - WB15D4",
    "price": 84899,
    "description": [
      "15-inch subwoofer with dual 4-ohm voice coils for flexible wiring options.",
      "Handles up to 1500W RMS / 3000W peak power for intense bass response.",
      "Non-pressed black paper cone with high-roll foam surround ensures clarity and durability.",
      "17.5 mm Xmax delivers rich, distortion-free low-end output.",
      "Ideal for sealed (2.5 cu ft) or ported (3.5 cu ft) enclosures, offering controlled or powerful bass."
    ],
    "images": [
      "https://cadencesound.com/wp-content/uploads/2024/12/wb15d4.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/wb15d4-02.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/wb15d4-04.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/wb15d4-05.jpg"
    ],
    "categoryId": "subwoofer",
    "additionalInfo": [
      "Application Type: Car",
      "Size & Type: 15″",
      "Power Handling: 1500W RMS / 3000W Peak",
      "Frequency Response: 20 Hz – 500 Hz",
      "SPL @ 1w/1m: 89 dB",
      "Impedance: Dual 4 Ohm",
      "Xmax: 17.5 mm",
      "Cone Material: Non-Pressed Black Paper",
      "Surround: High-Roll Foam",
      "Enclosure Type: Sealed (2.5 cu ft) / Ported (3.5 cu ft)",
      "In The Package: 1 x WB15D4 Subwoofer Unit.",
      "Note: Product images are for reference only. Actual product may vary slightly.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  },

  {
    "id": "cvx12d4",
    "name": "SubWoofer - CVX12D4",
    "price": 16579,
    "description": [
      "12-inch subwoofer with dual 4-ohm voice coils for flexible wiring options.",
      "Handles up to 350W RMS / 700W peak power for intense bass response.",
      "Non-pressed black paper cone with high-roll foam surround ensures clarity and durability.",
      "11 mm Xmax delivers rich, distortion-free low-end output.",
      "Ideal for sealed (1.25 cu ft) or ported (1.71 cu ft) enclosures, offering controlled or powerful bass."
    ],
    "images": [
      "https://cadencesound.com/wp-content/uploads/2024/12/cvx12d4.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/cvx12d4-02.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/cvx12d4-04.jpg",
      "https://cadencesound.com/wp-content/uploads/2024/12/cvx12d4-05.jpg"
    ],
    "categoryId": "subwoofer",
    "additionalInfo": [
      "Application Type: Car",
      "Size & Type: 12″",
      "Power Handling: 350W RMS / 700W Peak",
      "Frequency Response: 34 Hz – 1.7 KHz",
      "SPL @ 1w/1m: 86 dB",
      "Impedance: Dual 4 Ohm",
      "Xmax: 11 mm",
      "Cone Material: Non-Pressed Black Paper",
      "Surround: High-Roll Foam",
      "Enclosure Type: Sealed (1.25 cu ft) / Ported (1.71 cu ft)",
      "In The Package: 1 x CVX12D4 Subwoofer Unit.",
      "Note: Product images are for reference only. Actual product may vary slightly.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    "inStock": true,
    "rating": 5.0,
    "reviews": reviews["1"]
  },

  //// Speakers Products end-------------------------------------------
























  //product for the dvr
  //e-101
  {
    id: "k32-f1-single-lens",
    name: "E-101",
    price: 11869,
    description: [
      "3.2 Inch full-degree IPS screen for wide and clear visibility.",
      "Screen resolution: 268×800 pixels.",
      "2K Front Camera with image and video resolution of 2560×1440.",
      "Supports H.264 (MOV/AVI) format for movies and JPG for photos.",
      "Built-in 2.4G Wi-Fi for easy wireless connectivity and file transfer.",
      "Auto Recording: Start recording automatically when powered.",
      "Loop Recording: Continuous recording without missing frames.",
      "Voice Recording: Captures audio along with video.",
      "Seamless Recording: No frame drops or second skipping.",
      "Supports up to 256GB TF card for extended recording capacity.",
      "Power Cable: Cigar charger compatible with most vehicles."
    ],
    images: [
      "/images/K32渲染-2.jpg",
      "/images/K32渲染-3.jpg",
      "/images/K32渲染-1.jpg",
      "/images/K32渲染-8.jpg",
    ],
    categoryId: "dvr",
    additionalInfo: [
      "In The Package: 1 x K32(F1) Dashcam, power cable, user manual.",
      "Note: Product images are for reference only. Actual product may vary slightly.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 5.0,
    reviews: reviews["1"]
  },

  // e-102
  // {
  //   id: "g900b-dual-dvr",
  //   name: "E-102",
  //   price: 0,
  //   description: [
  //     "Powered by XM032 chipset for stable performance and high-quality recording.",
  //     "Records at 2K (2560×1440) @30fps using .TS video format; images stored in JPEG format.",
  //     "External storage support: C10 TF Card up to 256GB.",
  //     "Built-in microphone and speaker for voice recording and playback.",
  //     "3.0\" IPS non-touch screen with 2.5D curved glass for clear display.",
  //     "Front Camera: 4MP sensor (0411AM), F2.0 aperture, 150° wide-angle lens, 2K resolution at 30fps.",
  //     "Rear Camera: 5050 sensor, 6M cable, 480P MOV format, 120° wide-angle lens.",
  //     "Includes G-Sensor for collision detection and automatic recording lock.",
  //     "Parking Monitor for surveillance when the vehicle is parked.",
  //     "Supports Auto Time-Lapse Video triggered via hardware kit.",
  //     "Seamless loop recording and mirrored rear camera image function.",
  //     "Wi-Fi enabled for smartphone access and preview.",
  //     "Voice control functionality with manually adjustable screen brightness.",
  //     "Bracket & Interface: Suction cup bracket, AV-IN for rear camera, USB-C car charger interface.",
  //     "Battery: 200mAh lithium-ion with 5V/2A DC car charger input.",
  //     "Dimensions: 85×50×15mm; black ABS body with 2.5D glass shell."
  //   ],
  //   images: [
  //     "/images/bannersforcataloguewebsite/DVR-E102.jpg",
  //     "/images/dvr/ChatGPT Image Jun 17, 2025, 11_48_49 AM.png",
  //     "/images/dvr/ChatGPT Image Jun 17, 2025, 11_46_11 AM.png",

  //   ],
  //   categoryId: "dvr",
  //   additionalInfo: [
  //     "In The Package:",
  //     "- Suction Cup Bracket x1",
  //     "- 5V/2A Car Charger x1",
  //     "- 3M Bracket x1",
  //     "- Instruction Manual x1",
  //     "- Warranty Card x1",
  //     "- Installation Kit Accessory Bag x1",
  //     "- 1080P External Rear Camera x1",
  //     "Note: Product images are for reference only. Actual design may vary slightly.",
  //     "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
  //   ],
  //   inStock: true,
  //   rating: 5.0,
  //   reviews: reviews["1"]
  // }
  // ,

  // product for the Damping sheet
  {
    id: "car-damping-sheet",
    name: "Car Damping Sheets",
    price: 11299,
    description: [
      "High-quality car damping sheets designed to reduce road noise and vibrations inside the vehicle.",
      "Enhances in-car audio experience by minimizing panel resonance and external sound interference.",
      "Made from durable and heat-resistant materials for long-lasting performance.",
      "Self-adhesive backing for easy peel-and-stick installation on doors, floors, roofs, and trunks.",
      "Improves overall cabin comfort and thermal insulation by creating a more acoustically controlled environment."
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/damping-sheet.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/damping-sheet.jpg"
    ],
    categoryId: "damping",
    additionalInfo: [
      "In The Package: 1 x Set of Car Damping Sheets (suitable for multiple panels).",
      "Note: Product images are for reference only. Actual material texture or thickness may vary based on availability.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 5.0,
    reviews: reviews["1"]
  },
  // products for the Light and utility
  {
    id: "led-head-lamp-for-car",
    name: "LED Head Lamp for Car",
    price: 7999,
    description: [
      "High-performance LED headlamp designed to enhance nighttime visibility and driving safety.",
      "Features powerful, energy-efficient LEDs with a long lifespan and consistent brightness.",
      "Plug-and-play installation with universal fitment for most car models.",
      "Shockproof and water-resistant construction for reliable performance in all weather conditions.",
      "Stylish and modern look to upgrade the overall appearance of your vehicle.",
      "The Products may Vary as Per the Car Specific"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/led-head-lamp.png",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/led-head-lamp.png"
    ],
    categoryId: "light-utility",
    additionalInfo: [
      "In The Package: 1 x Pair of LED Head Lamps.",
      "Note: Product images are for reference only. Actual product may vary based on model and availability.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 5.0,
    reviews: reviews["1"]
  },


  {
    id: "led-fog-lamp",
    name: "LED Fog Lamp for Car",
    price: 7999,
    description: [
      "High-performance LED fog lamps designed to cut through fog, rain, and low-visibility conditions.",
      "Equipped with energy-efficient LEDs that provide a focused, wide beam pattern for better road visibility.",
      "Durable, shockproof, and water-resistant housing ensures long-lasting performance in all weather.",
      "Easy plug-and-play installation with universal or vehicle-specific fitment.",
      "Enhances both safety and style with a modern, sleek design.",
      "Note: Products may vary as per specific car models."
    ],
    images: [
      "/images/fog lamp/fog_light_2_resized.png",
      "/images/fog lamp/fog_light_1_resized.png",
      "/images/fog lamp/fog_light_3_resized.png",
      "/images/fog lamp/fog_light_4_resized.png",

    ],
    categoryId: "light-utility",
    additionalInfo: [
      "In The Package: 1 x Pair of LED Fog Lamps.",
      "Note: Product images are for reference only. Actual product may vary based on model and availability.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 5.0,
    reviews: reviews["1"]
  },


  //air inflator 
  {
    id: "tyre-inflator",
    name: "EMPORIO Auto Cut Air Inflator – 150W Power",
    price: 4099,
    description: [
      "Auto Cut-Off Function – Prevents over-inflation by automatically stopping at the desired pressure.",
      "Powerful 150W Motor – Delivers efficient and quick inflation.",
      "Maximum Pressure: 150 PSI – Suitable for inflating car, bike, and other vehicle tires effortlessly.",
      "Air Flow: 35 LPM – Ensures rapid inflation for a hassle-free experience.",
      "Voltage: DC 12V – Easily plugs into your car’s cigarette lighter socket for instant use.",
      "Compact & Lightweight – Designed for easy storage in your car without taking up much space.",
      "Digital display shows accurate pressure readings in PSI, BAR, KPA, and KG/CM².",
      "Built-in LED light provides visibility in low-light or emergency situations.",
      "Easy to use – just connect, set the pressure, and let the inflator do the work."
    ],
    images: [
      "/images/inflator/Tyre-Inflator.png",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/tire-inflator-1.jpg",


    ],
    categoryId: "light-utility",
    additionalInfo: [
      "In The Package: 1 x EMPORIO Auto Cut Air Inflator with power cord and nozzle attachments.",
      "Note: Product images are for reference only. Actual product may vary slightly based on stock availability.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 5.0,
    reviews: reviews["1"]
  },

  //portable tyre inflator
  {
    id: "portable-tyre-inflator",
    name: "EMPORIO Portable Car Compressor – Compact & Efficient Tire Inflator",
    price: 3499,
    description: [
      "Powerful 150W motor for quick and efficient tyre inflation – ideal for cars, bikes, and SUVs.",
      "Automatic shut-off feature stops inflation when the desired pressure is reached for safe operation.",
      "Digital display shows accurate pressure readings in PSI, BAR, KPA, and KG/CM².",
      "Compact and portable design with built-in LED light for night-time or emergency use.",
      "Easy to use – just plug into the car’s 12V socket and start inflating instantly."
    ],
    images: [
      "/images/inflator/Tyre-Inflator02.png",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Small-Inflator-1.jpg",

    ],
    categoryId: "light-utility",
    additionalInfo: [
      "In The Package: 1 x EMPORIO Portable Car Compressor with power cord and nozzle attachments.",
      "Note: Product images are for reference only. Actual product may vary slightly based on stock availability.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 5.0,
    reviews: reviews["1"]
  },

  // vaccum cleaner
  {
    id: "portable-vaccum-cleaner",
    name: "EMPORIO Portable Car Vacuum Cleaner – Wet & Dry Cleaning",
    price: 2499,
    description: [
      "Wet & Dry Cleaning – Versatile for liquid spills and dry debris",
      "High Suction Power – Ensures effective and quick cleaning",
      "Lightweight & Portable – Easy to carry and store",
      "HEPA Filter – Captures fine dust and allergens",
      "Deep Cleaning – Reaches tight spaces for thorough results"
    ],
    images: [
      "/images/car-uti/Vacuum-Cleaner.png"
    ],
    categoryId: "light-utility",
    additionalInfo: [
      "In The Package: 1 x EMPORIO Portable Vacuum Cleaner",
      "Note: Product images are for reference only. Actual product may vary slightly based on stock availability.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 5.0,
    reviews: reviews["1"]
  },
  // car charger
  {
    id: "car-charger",
    name: "EMPORIO Car Charger",
    price: 1799,
    description: [
      "High-Speed Charging: 100W output for rapid charging.",
      "Dual Port Design: USB + PD for simultaneous charging.",
      "Wide Compatibility: Supports Apple, Micro USB, and Type-C devices.",
      "Quick Charge 3.0 Technology: Faster and more efficient than standard chargers.",
      "Power Delivery (PD): Enhanced speed and safety with advanced protection features.",
      "Compact & Stylish Design: Premium silver finish for a modern look."
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/charger.jpg",
      "/images/car-uti/Screenshot 2025-06-12 125812.png"
    ],
    categoryId: "light-utility",
    additionalInfo: [
      "**Technical Specifications:**",
      "Input Voltage: 12-24V",
      "Output Power: 100W",
      "USB Output: 5V3A / 9V3A / 12V2.5A",
      "PD Output: 5V3A / 9V3A / 12V2.5A",
      "Size: 9.3 x 15 x 3.2 cm",
      "Weight: 120g",
      "Color: Silver",
      "**Package Includes:**",
      "1 x EMPORIO EXO Pro Car Charger",
      "1 x Cable",
      "Note: Product images are for reference only. Actual product may vary slightly based on stock availability.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 5.0,
    reviews: reviews["1"]
  },
  {
    id: "nebula-2w-led-light",
    name: "Nebula 2 Wheeler Led- 10W",
    price: 855,
    description: [
      "Powerful 10W LED for enhanced night visibility and road safety.",
      "Weather-resistant build ideal for 2-wheeler outdoor usage.",
      "Low power consumption with high brightness output.",
      "Easy to install with durable housing and stable fitting.",
      "Improves aesthetics while providing focused beam lighting.",
      "Compact design suitable for most bikes and scooters."
    ],
    images: [
      "/images/2w-body-cover/Screenshot 2025-06-13 122319.png",
      "/images/2w-body-cover/Screenshot 2025-06-13 122521.png",
      "/images/2w-body-cover/Screenshot 2025-06-13 122637.png"
    ],
    categoryId: "light-utility  ",
    additionalInfo: [
      "In The Package: Set of 2 Nebula 10W LED lights for 2-wheelers.",
      "Note: Product images are for representation purposes only. Actual color and appearance may vary slightly depending on screen settings and lighting.",
      "Disclaimer: Ensure compatibility before installation. Manufacturing defects will be replaced; refunds are not applicable."
    ],
    inStock: true,
    rating: 4.6,
    reviews: reviews["1"]
  },







  // products for the mats 
  //1
  {
    id: "12mm-care",
    name: "12mm Care Mat",
    price: {
      twoRow: 3299,
      threeRow: 4999
    },
    description: [
      "Premium 2D car floor mat with 12mm thickness for superior comfort and protection.",
      "Crafted from high-quality, water-resistant materials to keep your car interior clean.",
      "Anti-skid backing ensures the mat stays in place during rides.",
      "Custom-fit design for enhanced coverage and a sleek interior look.",
      "Easy to clean – simply wipe with a damp cloth or rinse with water."
    ],
    images: [
      "/images/mats/12 MM CARE.jpg"
    ],
    categoryId: "pu-pvc",
    additionalInfo: [
      "In The Package: 1 x Set of 2D 12mm Car Mats (Full Set).",
      "Note: Product images are for reference only. Actual color or pattern may vary based on availability.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 4.5,
    reviews: reviews["1"]
  },

  //2
  {
    id: "care-18-mm-universal",
    name: "18mm Care Universal ",
    price: {
      twoRow: 3299,
      threeRow: 4999
    },
    description: [
      "Heavy-duty 2D car floor mat with 18mm thickness for enhanced cushioning and durability.",
      "Made from high-quality, water-resistant material to protect against dirt, spills, and wear.",
      "Anti-skid bottom layer prevents movement and ensures driving safety.",
      "Universal fit design – compatible with most car models for a hassle-free installation.",
      "Low-maintenance and easy to clean – just shake off dirt or wipe with a damp cloth."
    ],
    images: [
      "/images/mats/18 mm Universal  (4).jpg",
      "/images/mats/18 mm Universal  (3).jpg",
      "/images/mats/18 mm Universal  (2).jpg",
      "/images/mats/18 mm Universal  (1).jpg"
    ],
    categoryId: "pu-pvc",
    additionalInfo: [
      "In The Package: 1 x Set of 2D 18mm Car Mats (Full Set).",
      "Note: Product images are for reference only. Actual color or pattern may vary based on availability.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 4.5,
    reviews: reviews["1"]
  },


  //3
  {
    id: "spike",
    name: "Spike Mat",
    price: {
      twoRow: 4899,
      threeRow: 6799
    },
    description: [
      "Stylish 2D car floor mat with a unique spike-texture design for superior grip and protection.",
      "Constructed using durable, water-resistant materials to keep your car interior clean and dry.",
      "Spiked surface helps trap dirt and debris, making it ideal for all-weather use.",
      "Universal fit with anti-skid backing ensures the mat stays securely in place.",
      "Effortless cleaning – shake off dust or rinse with water for a fresh look."
    ],
    images: [
      "/images/mats/SPIKE01.jpg",
      "/images/mats/SPIKE.jpg",

    ],
    categoryId: "pu-pvc",
    additionalInfo: [
      "In The Package: 1 x Set of 2D Spike Design Car Mats (Full Set).",
      "Note: Product images are for reference only. Actual color or pattern may vary based on availability.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 4.5,
    reviews: reviews["1"]
  },


  //4
  {
    id: "u-max-plus-arrow",
    name: "U Max Plus Arrow",
    price: {
      twoRow: 6999,
      threeRow: 9999
    },
    description: [
      "2D U Max Plus Arrow Mat with 12mm thickness designed for ultimate interior protection and comfort.",
      "Features a modern arrow-pattern texture that enhances grip and adds a stylish look to your car.",
      "Made from high-grade, water-resistant material to guard against dust, spills, and wear.",
      "Anti-skid bottom layer ensures the mat stays firmly in place during daily use.",
      "Effortless to maintain – just wipe with a damp cloth or rinse clean."
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U-MAX PLUS ARROW (1).JPG",
      "/images/mats/U-MAX PLUS ARROW (2).JPG",
      "/images/mats/U-MAX PLUS ARROW (3).JPG"
    ],
    categoryId: "pu-pvc",
    additionalInfo: [
      "In The Package: 1 x Set of 2D U Max Plus Arrow Car Mats (Full Set).",
      "Note: Product images are for reference only. Actual color or pattern may vary based on availability.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 4.5,
    reviews: reviews["1"]
  },


  //7D mats
  //1
  {
    id: "u-max-arrow",
    name: "U Max Arrow ",
    price: {
      twoRow: 11999,
      threeRow: 14999
    },
    description: [
      "Premium 7D car floor mat designed for 2-row vehicles, offering full coverage and luxury protection.",
      "Features a stylish U Max Arrow design that enhances the interior aesthetics.",
      "Multi-layer construction includes a soft cushioned top, durable middle layer, and anti-skid bottom for maximum stability.",
      "Waterproof, dustproof, and scratch-resistant – ideal for daily use in all weather conditions.",
      "Custom-fit design ensures a snug fit and easy installation. Cleaning is effortless – simply wipe or rinse."
    ],
    images: [
      "/images/mats/U-MAX ARROW.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/7D-Umax-arrow-Black-silver.jpg"
    ],
    categoryId: "pu-pvc",
    additionalInfo: [
      "In The Package: 1 x Set of 7D U Max Arrow Mats (2-Row Full Set).",
      "Note: Product images are for reference only. Actual color or pattern may vary based on availability.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 4.5,
    reviews: reviews["1"]
  },


  //2
  {
    id: "u-max-nhb",
    name: "U Max NHB",
    price: {
      twoRow: 11999,
      threeRow: 14999
    },
    description: [
      "Premium 7D U Max NHB car floor mat designed for 2-row vehicles, offering high-end protection and elegant styling.",
      "Crafted with a quilted top layer, cushioned foam center, and anti-skid bottom to provide comfort and stability.",
      "Water-resistant and scratch-proof materials keep your car’s interior clean and protected in all weather.",
      "U Max NHB pattern enhances the aesthetic appeal while maintaining functional grip.",
      "Custom-fit for 2-row vehicles – easy to install and clean with a simple wipe or rinse."
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U Max NHB.jpg",
      "/images/mats/U Max NHB01.jpg",

    ],
    categoryId: "pu-pvc",
    additionalInfo: [
      "In The Package: 1 x Set of 7D U Max NHB Mats (2-Row Full Set).",
      "Note: Product images are for reference only. Actual color or pattern may vary based on availability.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 4.5,
    reviews: reviews["1"]
  }
  ,

  {
    id: "u-max-emboss",
    name: "U Max Emboss",
    price: {
      twoRow: 8499,
      threeRow: 10999
    }, description: [
      "Premium 7D U Max Emboss floor mat tailored for 2-row vehicles, delivering both luxury and protection.",
      "Features a unique Emboss design for a stylish and elevated cabin appearance.",
      "Constructed with multi-layered materials: a textured embossed top, cushioned foam center, and anti-skid backing for added safety and comfort.",
      "Resistant to water, dust, and daily wear – ideal for all-season use.",
      "Custom-fit for 2-row vehicles, easy to install, remove, and clean with a simple wipe or rinse."
    ],
    images: [
      "/images/mats/U Max Emboss01.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/7D-Umax-Emboss-Black-grey.jpg"
    ],
    categoryId: "pu-pvc",
    additionalInfo: [
      "In The Package: 1 x Set of 7D U Max Emboss Mats (2-Row Full Set).",
      "Note: Product images are for reference only. Actual color or pattern may vary based on availability.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  //TPe Mats 

  {
    id: "cabin-mats-tpe",
    name: "TPE Cabin Mat",
    price: {
      twoRow: 4899,
      threeRow: 8699
    }, description: [
      "Premium TPE Cabin Mats designed for Both 2-row and 3-row vehicles, offering exceptional durability and a custom-fit experience.",
      "Engineered with a 3-layer structure: textured TPE surface for maximum grip, cushioned foam for comfort, and anti-skid backing for stability.",
      "Waterproof, dust-proof, and scratch-resistant – ideal for all-weather protection.",
      "Modern U Max NHB pattern enhances your car’s interior aesthetics while ensuring easy maintenance.",
      "Quick to install, remove, and clean with just a simple wipe or rinse."
    ],
    images: [
      "/images/mats/TPE-Mat.png",

    ],
    categoryId: "tpe",
    additionalInfo: [
      "In The Package: 1 x Set of TPE Cabin Mats (2-Row Full Set).",
      "Note: Product images are for reference only. Actual color or pattern may vary based on availability.",
      "Price For the 2 Row Thar/Thar Roxx :5699",
      "Price For the 3 Row Hycross : 8699",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 4.5,
    reviews: reviews['1']
  },

  {
    id: "boot-mat-tpe",
    name: "TPE Boot Mat",
    price: {
      twoRow: 2750,
      threeRow: 2250
    }, description: [
      "High-quality TPE Boot Mat custom-made for a perfect fit, providing reliable protection for your car’s luggage area.",
      "Features a durable TPE surface with embossed texture for a premium look and non-slip functionality.",
      "Waterproof, dust-proof, and resistant to spills – ensures easy maintenance and long-lasting performance.",
      "Designed for heavy-duty use, keeping your trunk clean and protected from dirt, scratches, and moisture.",
      "Simple installation and hassle-free cleaning – just wipe or rinse for a fresh look."
    ],
    images: [
      "/images/mats/BOOT MAT (1).png",
      "/images/mats/Boot mat.jpg",

    ],
    categoryId: "tpe",
    additionalInfo: [
      "In The Package: 1 x TPE Boot Mat.",
      "Note: Product images are for reference only. Actual color or pattern may vary based on availability.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews['1']
  },



  // 2w bag 
  {
    id: "seat-bag-black",
    name: "Seat Bag",
    price: 1013,
    description: [
      "Spacious and compact seat bag perfect for daily commuting and long rides.",
      "Made with premium water-resistant material to keep contents safe and dry.",
      "Strong zippers and adjustable straps for secure attachment to bike seats.",
      "Lightweight yet durable design – built to withstand regular use.",
      "Suitable for storing tools, documents, gloves, or small personal items.",
      "Compatible for the Bullet"
    ],
    images: [
      "/images/2w-body-cover/Picture23.jpg"
    ],
    categoryId: "bag",
    additionalInfo: [
      "In The Package: 1 x Seat Bag (Black).",
      "Note: Product images are for reference only. Color or design may slightly vary based on stock.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 4.5,
    reviews: reviews["1"]
  },
  {
    id: "round-saddle-bag",
    name: "Round Saddle Bag",
    price: 736,
    description: [
      "Classic round saddle bag designed for enhanced storage during rides.",
      "Durable and water-resistant material for reliable protection in all weather conditions.",
      "Spacious main compartment ideal for carrying tools, documents, and personal items.",
      "Easy strap-on mounting system compatible with most motorcycles.",
      "Stylish leather-like design – adds a vintage look to your ride.",
      "Secure buckle closure to keep your items safe on bumpy roads.",
      "Compatible for the Bullet"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/saddle-bag-2wheeler.jpg",
      "/images/2w-body-cover/Picture25.jpg"
    ],
    categoryId: "bag",
    additionalInfo: [
      "In The Package: 1 x Round Saddle Bag (Black).",
      "Material: Faux leather with durable stitching and secure buckle straps.",
      "Note: Product images are for reference. Slight variation may occur based on availability.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 4.5,
    reviews: reviews["1"]
  }
  ,

  {
    id: "magnetic-bag-small",
    name: "Magnetic Bag - Small",
    price: 2861,
    description: [
      "Compact magnetic tank bag designed for easy access and convenience during rides.",
      "Powerful built-in magnets ensure a secure grip on metal fuel tanks.",
      "Made with durable, water-resistant fabric to protect your belongings.",
      "Ideal for storing mobile phones, wallets, documents, and small accessories.",
      "Clear top window for mobile/GPS visibility while riding.",
      "Easy to remove and reattach – perfect for city and touring use.",
      "Compatible for the Bullet"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Megnatic bag-RE.jpg",
      "/images/2w-body-cover/Picture24.jpg"
    ],
    categoryId: "bag",
    additionalInfo: [
      "In The Package: 1 x Magnetic Tank Bag (Small, Black).",
      "Note: Ensure your tank surface is clean before use for optimal grip.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 4.5,
    reviews: reviews["1"]
  },

  {
    id: "premium-saddle-bag",
    name: "Premium Saddle Bag (L&R) Side",
    price: 4835,
    description: [
      "Spacious & Dual-Sided – Large capacity for carrying travel essentials.",
      "Durable & Water-Resistant – Protects belongings from rain and dust.",
      "Secure Fit & Easy Installation – Adjustable straps for a stable attachment.",
      "Ideal for storing mobile phones, wallets, documents, and small accessories.",
      "Stylish & Functional Design – Enhances the look of your bike while adding utility.",
      "Easy to remove and reattach – perfect for city and touring use.",
      "Universal Compatibility – Fits most motorcycles and scooters.",
      "Compatible for the Bullet"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/PREMIUM-SADDLE-BAG-both-side-2wheeler.jpg",
      "/images/2w-body-cover/Picture26.jpg"
    ],
    categoryId: "bag",
    additionalInfo: [
      "Additional Information: In The Package: PREMIUM SADDLE BAG on both side",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
      "Note: Ensure your tank surface is clean before use for optimal grip.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 4.5,
    reviews: reviews["1"]
  },
  {
    id: "premium-side-bag",
    name: "Premium Side Bag (PVC)",
    price: 2079,
    description: [
      "Spacious & Dual-Sided – Large capacity for carrying travel essentials.",
      "Durable & Water-Resistant – Protects belongings from rain and dust.",
      "Secure Fit & Easy Installation – Adjustable straps for a stable attachment.",
      "Ideal for storing mobile phones, wallets, documents, and small accessories.",
      "Stylish & Functional Design – Enhances the look of your bike while adding utility.",
      "Easy to remove and reattach – perfect for city and touring use.",
      "Universal Compatibility – Fits most motorcycles and scooters."
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/PREMIUM-SADDLE-BAG-both-side-2wheeler.jpg",
      "/images/2w-body-cover/Picture26.jpg"
    ],
    categoryId: "bag",
    additionalInfo: [
      "Additional Information: In The Package: PREMIUM SADDLE BAG on both sides.",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s).",
      "Ensure mounting surfaces are clean before use for optimal grip.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 4.5,
    reviews: reviews["1"]
  },





  {
    id: "eco-round-rope",
    name: "Eco Round Rope",
    price: 1050,
    description: [
      "High-Quality Material – Durable, long-lasting, and resistant to breakage.",
      "Strong Grip & Flexibility – Ensures a secure hold for luggage and accessories.",
      "Weather-Resistant – Suitable for all weather conditions, preventing wear over time.",
      "Easy to Use & Store – Lightweight and compact design for hassle-free usage.",
      "Universal Fit – Compatible with all bikes and scooters.",

    ],
    images: [
      "/images/2w-body-cover/Picture18.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Eco-ROUND-ROPE-(2)--2wheler.jpg",
    ],
    categoryId: "ropes",
    additionalInfo: [

      "Additional Information: In The Package: Pack of 10. ",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
      "Disclaimer: All Seat covers are tailor-made as per order. If there is any Manufacturing defect, the same will be taken care of by the team. Only replacement is possible and, no refunds will be entertained. "
    ],
    inStock: true,
    rating: 4.5,
    reviews: reviews["1"]
  },

  {
    id: "eco-flat-rope",
    name: "Eco Flat Rope",
    price: 900,
    description: [
      "High-Quality Material – Durable, long-lasting, and resistant to breakage.",
      "Strong Grip & Flexibility – Ensures a secure hold for luggage and accessories.",
      "Weather-Resistant – Suitable for all weather conditions, preventing wear over time.",
      "Easy to Use & Store – Lightweight and compact design for hassle-free usage.",
      "Universal Fit – Compatible with all bikes and scooters.",

    ],
    images: [
      "/images/2w-body-cover/Picture19.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Eco-Flat-rope-blue-2wheeler.jpg",
    ],
    categoryId: "ropes",
    additionalInfo: [

      "Additional Information: In The Package: Pack of 10. ",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
      "Disclaimer: All Seat covers are tailor-made as per order. If there is any Manufacturing defect, the same will be taken care of by the team. Only replacement is possible and, no refunds will be entertained. "
    ],
    inStock: true,
    rating: 4.5,
    reviews: reviews["1"]
  },
  {
    id: "bike-net",
    name: "Bike Net",
    price: 1800,
    description: [
      "Strong and stretchable elastic net ideal for securing luggage on bikes.",
      "Heavy-duty hooks ensure tight grip and reliable hold during rides.",
      "Perfect for carrying helmets, bags, and parcels on the rear seat or carrier.",
      "Weather-resistant material – performs well in sun, rain, and dust.",
      "Compact and lightweight – easy to fold and store when not in use.",
      "Universal design fits all motorcycles."
    ],
    images: [
      "/images/2w-body-cover/Picture20.jpg",
      "/images/2w-body-cover/Picture20.jpg"
    ],
    categoryId: "ropes",
    additionalInfo: [

      "Material: High-quality stretchable nylon with metal/plastic hooks",
      "Note: Product images are for reference only. Actual color or hook type may vary based on stock.",
      "Disclaimer: For any product issues, contact support at +91 9278411411. Replacement only in case of manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 4.4,
    reviews: reviews["1"]
  },

  {
    id: "premium-round-rope",
    name: "Premium Round Rope",
    price: 1900,
    description: [
      "Premium quality rope made from durable and high-tensile fibers.",
      "Round design offers excellent grip and flexibility for secure tying.",
      "Ideal for fastening luggage, covers, or towing lightweight items.",
      "Weather-resistant and UV-stable – built to endure outdoor conditions.",
      "Soft texture prevents scratching surfaces while ensuring strong hold.",
      "Suitable for both bike and general utility use."
    ],
    images: [
      "/images/2w-body-cover/Picture21.jpg",
      "/images/2w-body-cover/Picture21.jpg"
    ],
    categoryId: "ropes",
    additionalInfo: [
      "Material: Premium nylon blend with enhanced stretch and durability.",
      "Color: Black (or subject to stock availability).",
      "Length: Approx. 1.5 meters per rope (custom lengths may vary).",
      "In The Package: Set of 5 Premium Round Ropes.",
      "Note: Actual product color and finish may slightly differ from images shown.",
      "Disclaimer: For any concerns, contact support at +91 9278411411. Manufacturing defects eligible for replacement only. No refunds."
    ],
    inStock: true,
    rating: 4.4,
    reviews: reviews["1"]
  },
  {
    id: "premium-flat-rope",
    name: "Premium Flat Rope",
    price: 1420,
    description: [
      "Premium quality rope made from durable and high-tensile fibers.",
      "Flat design offers excellent grip and flexibility for secure tying.",
      "Ideal for fastening luggage, covers, or towing lightweight items.",
      "Weather-resistant and UV-stable – built to endure outdoor conditions.",
      "Soft texture prevents scratching surfaces while ensuring strong hold.",
      "Suitable for both bike and general utility use."
    ],
    images: [
      "/images/2w-body-cover/Picture22.jpg",
      "/images/2w-body-cover/Picture22.jpg"
    ],
    categoryId: "ropes",
    additionalInfo: [
      "Note: Actual product color and finish may slightly differ from images shown.",
      "Disclaimer: For any concerns, contact support at +91 9278411411. Manufacturing defects eligible for replacement only. No refunds."
    ],
    inStock: true,
    rating: 4.4,
    reviews: reviews["1"]
  },

  //2w foot mat
  {
    id: "quilting-mat",
    name: "Quilting Mat",
    price: 355,
    description: [
      "Premium quilted texture for a luxurious look and feel.",
      "Durable material protects vehicle floor from dust and dirt.",
      "Anti-slip design ensures mat stays in place during rides.",
      "Universal fit for most two-wheelers and scooters.",
      "Easy to clean and maintain – washable and water-resistant.",

    ],
    images: [
      "/images/2w-body-cover/Picture16.png",
      "/images/2w-body-cover/IMG-20230415-WA0002.jpg",
    ],
    categoryId: "foot-mat",
    additionalInfo: [

      "Quantity: 1 Unit",
      "Note: Actual product color may slightly vary due to lighting and screen settings.",
      "Disclaimer: Returns only accepted for manufacturing defects. For assistance, contact +91 9278411411."
    ],
    inStock: true,
    rating: 4.9,
    reviews: reviews["1"]
  },
  {
    id: "quilted-spike-mat",
    name: "Quilted Spike (Black)",
    price: 685,
    description: [
      "Bold spike design with quilted finish for added grip and style.",
      "Designed to protect foot area from mud, dust, and spills.",
      "Heavy-duty, water-resistant material for long-term durability.",
      "Fits perfectly on all major two-wheelers and scooters.",
      "Non-slip base keeps the mat stable on rough roads.",
    ],
    images: [
      "/images/2w-body-cover/Picture17.png"
    ],
    categoryId: "foot-mat",
    additionalInfo: [
      "Color: Black",
      "Quantity: 1 Unit",
      "Note: Product image is for reference. Color/fabric may slightly differ based on availability.",
      "Disclaimer: Product is non-refundable. Manufacturing defects will be replaced. Helpline: +91 9278411411."
    ],
    inStock: true,
    rating: 4.9,
    reviews: reviews["1"]
  },





  //  back rest pad
  {
    id: "beack-rest-pad",
    name: "Back Rest Pad - Bullet",
    price: 526,
    description: [
      "Ergonomic Design – Provides excellent lumbar support for long rides.",
      "High-quality cushioning – Soft padding for maximum comfort.",
      "Durable & Weather-Resistant – Built to withstand all road conditions.",
      "Easy Installation – Hassle-free mounting on your two-wheeler.",
      "Universal Compatibility – Ideal for Royal Enfield and similar motorcycles.",
      "Enhance your ride with this Back Rest Pad and enjoy superior comfort on every journey!",
      "Colors Available : Available in 2 Colors Black and Brown.",
    ],
    images: [
      "/images/2w-body-cover/Picture13.png",
      "/images/2w-body-cover/81p63Z0jV3L._AC_UC200,200_CACC,200,200_QL85_.jpg",
      "/images/2w-body-cover/back-rest.jpg"

    ],
    categoryId: "back-rest-pad",
    additionalInfo: [
      "Additional Information: STD Pack of 5pcs. ",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
      "Disclaimer: All Seat covers are tailor-made as per order. If there is any Manufacturing defect, the same will be taken care of by the team. Only replacement is possible and, no refunds will be entertained. "
    ],
    inStock: true,
    rating: 4.6,
    reviews: reviews["1"]
  },




  //Led Lights 2w
  {
    id: "nebula-2w-led-light",
    name: "Nebula 2 Wheeler Led- 10W",
    price: 855,
    description: [
      "Powerful 10W LED for enhanced night visibility and road safety.",
      "Weather-resistant build ideal for 2-wheeler outdoor usage.",
      "Low power consumption with high brightness output.",
      "Easy to install with durable housing and stable fitting.",
      "Improves aesthetics while providing focused beam lighting.",
      "Compact design suitable for most bikes and scooters."
    ],
    images: [
      "/images/2w-body-cover/Screenshot 2025-06-13 122319.png",
      "/images/2w-body-cover/Screenshot 2025-06-13 122521.png",
      "/images/2w-body-cover/Screenshot 2025-06-13 122637.png"
    ],
    categoryId: "2w-electronics",
    additionalInfo: [
      "In The Package: Set of 2 Nebula 10W LED lights for 2-wheelers.",
      "Note: Product images are for representation purposes only. Actual color and appearance may vary slightly depending on screen settings and lighting.",
      "Disclaimer: Ensure compatibility before installation. Manufacturing defects will be replaced; refunds are not applicable."
    ],
    inStock: true,
    rating: 4.6,
    reviews: reviews["1"]
  },







  //cleaning kit
  {
    id: "2w-cleaning-kit",
    name: "Micro Fiber Multipurpose Cloth",
    price: 342,
    description: [
      "Ultra-Soft & Non-Abrasive – Safe for car and bike surfaces without scratches.",

      "Highly Absorbent – Quickly soaks up water, dust, and dirt for effective cleaning.",

      "Multipurpose Use – Ideal for cars, bikes, home, and electronic gadgets.",

      "Durable & Reusable – Washable and long-lasting for multiple uses.",

      "Weather-Resistant & Durable – Built to withstand tough riding conditions.",

      "Lint-Free & Streak-Free – Leaves no residue or scratches on surfaces.",

    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/micro-fibre-cloth-uni.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/micro-fibre-cloth-2.jpg",
      "/images/2w-body-cover/Screenshot 2025-06-13 121754.png",


    ],
    categoryId: "cleaning-kit",
    additionalInfo: [
      "Additional Information: In The Package:  Set of 2, Micro Fiber Cloth.  ",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
      "Disclaimer: All Seat covers are tailor-made as per order. If there is any Manufacturing defect, the same will be taken care of by the team. Only replacement is possible and, no refunds will be entertained. ",
    ],
    inStock: true,
    rating: 4.6,
    reviews: reviews["1"]
  },


  // chest guard 
  {
    id: "eco-chest-guard",
    name: "Eco Chest Guard",
    price: 495,
    description: [
      "Impact Protection – Protects your chest from wind, debris, and minor impacts.",

      "Lightweight & Comfortable – Made with breathable, padded material for all-day wear.",

      "Adjustable Straps – Ensures a secure and customized fit.",

      "Front Storage Pocket – Conveniently store small essentials like a phone or wallet.",

      "Weather-Resistant & Durable – Built to withstand tough riding conditions.",

      "Upgrade your riding gear with this Chest Guard and enjoy a safer, more comfortable journey every time you hit the road!",

    ],
    images: [
      "/images/2w-body-cover/Picture11.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/chest-guard-2wheller.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Premium chest-guard - Universal.jpg",


    ],
    categoryId: "chest-guard",
    additionalInfo: [
      "Additional Information: In The Package: One chest guard 2-wheller. ",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
      "Disclaimer: All Seat covers are tailor-made as per order. If there is any Manufacturing defect, the same will be taken care of by the team. Only replacement is possible and, no refunds will be entertained. ",
    ],
    inStock: true,
    rating: 4.6,
    reviews: reviews["1"]
  },

  {
    id: "premium-chest-guard",
    name: "Premium Chest Guard",
    price: 670,
    description: [
      "Impact Protection – Protects your chest from wind, debris, and minor impacts.",

      "Lightweight & Comfortable – Made with breathable, padded material for all-day wear.",

      "Adjustable Straps – Ensures a secure and customized fit.",

      "Front Storage Pocket – Conveniently store small essentials like a phone or wallet.",

      "Weather-Resistant & Durable – Built to withstand tough riding conditions.",

      "Upgrade your riding gear with this Chest Guard and enjoy a safer, more comfortable journey every time you hit the road!",

    ],
    images: [
      "/images/2w-body-cover/Picture12.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/chest-guard-2wheller.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Premium chest-guard - Universal.jpg",


    ],
    categoryId: "chest-guard",
    additionalInfo: [
      "Additional Information: In The Package: One chest guard 2-wheller. ",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
      "Disclaimer: All Seat covers are tailor-made as per order. If there is any Manufacturing defect, the same will be taken care of by the team. Only replacement is possible and, no refunds will be entertained. ",
    ],
    inStock: true,
    rating: 4.6,
    reviews: reviews["1"]
  },
  //2w tank covers 
  {
    id: "universal-tank-cover",
    name: "Universal Tank Cover - 100cc",
    price: 516,
    description: [
      "Superior Protection – Shields the fuel tank from scratches, dust, and weather damage.",
      "Premium Quality Material – Durable and long-lasting leatherette/fabric construction.",
      "Full Flap Design – Ensures complete coverage for maximum protection.",
      "Extra Storage Pockets – Conveniently carry small essentials while riding.",
      "Stylish & Universal Fit – Enhances the look of your bike and fits most models.",
      "STD. PKG - 2 PCs",

    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/fullflap-tank-cover.jpg",
      "/images/2w-body-cover/Picture6.jpg",
      "/images/2w-body-cover/Picture7.jpg",

    ],
    categoryId: "tank-cover",
    additionalInfo: [
      "Additional Information: In The Package: One Tank Cover.",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
      "Disclaimer: All Seat covers are tailor-made as per order. If there is any manufacturing defect, the same will be taken care of by the team. Only replacement is possible and, no refunds will be entertained. ",
    ],
    inStock: true,
    rating: 4.6,
    reviews: reviews["1"]
  },
  {
    id: "tank-cover-dual",
    name: "Tank Cover - XL100 - Dual Pocket",
    price: 725,
    description: [
      "Superior Protection – Shields the fuel tank from scratches, dust, and weather damage.",
      "Premium Quality Material – Durable and long-lasting leatherette/fabric construction.",
      "Full Flap Design – Ensures complete coverage for maximum protection.",
      "Extra Storage Pockets – Conveniently carry small essentials while riding.",
      "Stylish & Universal Fit – Enhances the look of your bike and fits most models.",
      "STD. PKG - 2 PCs",
      "Available Packets: Dual Pocket"

    ],
    images: [

      "/images/2w-body-cover/Picture9.jpg",
      "/images/2w-body-cover/Picture10.jpg",
      "/images/2w-body-cover/Picture8.jpg",

    ],
    categoryId: "tank-cover",
    additionalInfo: [
      "Additional Information: In The Package: One Tank Cover.",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
      "Disclaimer: All Seat covers are tailor-made as per order. If there is any manufacturing defect, the same will be taken care of by the team. Only replacement is possible and, no refunds will be entertained. ",
    ],
    inStock: true,
    rating: 4.6,
    reviews: reviews["1"]
  },


  {
    id: "tank-cover-single",
    name: "Tank Cover - XL100 - Single Pocket",
    price: 516,
    description: [
      "Superior Protection – Shields the fuel tank from scratches, dust, and weather damage.",
      "Premium Quality Material – Durable and long-lasting leatherette/fabric construction.",
      "Full Flap Design – Ensures complete coverage for maximum protection.",
      "Extra Storage Pockets – Conveniently carry small essentials while riding.",
      "Stylish & Universal Fit – Enhances the look of your bike and fits most models.",
      "STD. PKG - 2 PCs",
      "Available Packets: Single Pocket"

    ],
    images: [

      "/images/2w-body-cover/Picture8.jpg",
      "/images/2w-body-cover/Picture9.jpg",
      "/images/2w-body-cover/Picture10.jpg",

    ],
    categoryId: "tank-cover",
    additionalInfo: [
      "Additional Information: In The Package: One Tank Cover.",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
      "Disclaimer: All Seat covers are tailor-made as per order. If there is any manufacturing defect, the same will be taken care of by the team. Only replacement is possible and, no refunds will be entertained. ",
    ],
    inStock: true,
    rating: 4.6,
    reviews: reviews["1"]
  },




  {
    id: "tank-cover-bullet-wf",
    name: "Tank Cover Without Flap (Bullet)",
    price: 510,
    description: [
      "Premium Protection – Guards the fuel tank against scratches, dust, and weather effects.",
      "Durable & Weather-Resistant – Made from high-quality materials for long-lasting use.",
      "Added Storage Pockets – Convenient compartments for carrying small essentials.",
      "Easy to Install & Secure Fit – Strong strap system ensures a snug and stable attachment.",
      "Stylish & Functional Design – Enhances the bike’s overall look while improving functionality.",
      "Qty-1 Unit",
      "Color - Black & Brown",
      "Only For Bullet"
    ],
    images: [

      "/images/2w-body-cover/Picture33.jpg",

    ],
    categoryId: "tank-cover",
    additionalInfo: [
      "Additional Information: In The Package: One Tank Cover.",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
      "Disclaimer: All Seat covers are tailor-made as per order. If there is any manufacturing defect, the same will be taken care of by the team. Only replacement is possible and, no refunds will be entertained. ",
    ],
    inStock: true,
    rating: 4.6,
    reviews: reviews["1"]
  },
  {
    id: "tank-cover-bullet-hf",
    name: "Tank Cover Half Flap (Bullet)",
    price: 605,
    description: [
      "Premium Protection – Guards the fuel tank against scratches, dust, and weather effects.",
      "Durable & Weather-Resistant – Made from high-quality materials for long-lasting use.",
      "Added Storage Pockets – Convenient compartments for carrying small essentials.",
      "Easy to Install & Secure Fit – Strong strap system ensures a snug and stable attachment.",
      "Stylish & Functional Design – Enhances the bike’s overall look while improving functionality.",
      "Qty-1 Unit",
      "Color - Black & Brown",
      "Only For Bullet"

    ],
    images: [

      "/images/2w-body-cover/Picture44.jpg",

    ],
    categoryId: "tank-cover",
    additionalInfo: [
      "Additional Information: In The Package: One Tank Cover.",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
      "Disclaimer: All Seat covers are tailor-made as per order. If there is any manufacturing defect, the same will be taken care of by the team. Only replacement is possible and, no refunds will be entertained. ",

    ],
    inStock: true,
    rating: 4.6,
    reviews: reviews["1"]
  },
  {
    id: "tank-cover-bullet-ff",
    name: "Tank Cover Full Flap (Bullet)",
    price: 745,
    description: [
      "Premium Protection – Guards the fuel tank against scratches, dust, and weather effects.",
      "Durable & Weather-Resistant – Made from high-quality materials for long-lasting use.",
      "Added Storage Pockets – Convenient compartments for carrying small essentials.",
      "Easy to Install & Secure Fit – Strong strap system ensures a snug and stable attachment.",
      "Stylish & Functional Design – Enhances the bike’s overall look while improving functionality.",
      "Qty-1 Unit",
      "Color - Black & Brown",
      "Only For Bullet"

    ],
    images: [

      "/images/2w-body-cover/Picture5.jpg",

    ],
    categoryId: "tank-cover",
    additionalInfo: [
      "Additional Information: In The Package: One Tank Cover.",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
      "Disclaimer: All Seat covers are tailor-made as per order. If there is any manufacturing defect, the same will be taken care of by the team. Only replacement is possible and, no refunds will be entertained. ",

    ],
    inStock: true,
    rating: 4.6,
    reviews: reviews["1"]
  },

  // body cover 2w 
  {
    id: "body-cover-wp-xl",
    name: "Body Cover 100% Water Proof XL",
    price: 1300,
    description: [
      "High Quality.",
      "Product Type-2 wheeler Specific Bike/Scooter Body Cover",
      "Fabric Type-33% Cotton + 33% Non-Woven + 33% Plastic.",
      "Qty-1 Unit",
      "Color - Black"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Bike-Body-Cover.jpg",
      "/images/2w-body-cover/Picture1.jpg",

    ],
    categoryId: "body-cover",
    additionalInfo: [
      "Product Highlights ",
      "Mirror Pocket",
      "Heavy Buckle ",
      "High Quality Elastic ",
      "100% Water Proof ",
    ],
    inStock: true,
    rating: 4.4,
    reviews: reviews["1"]
  },
  {
    id: "body-cover-wp-xxl",
    name: "Body Cover 100% Water Proof XXL",
    price: 1500,
    description: [
      "High Quality.",
      "Product Type-2 wheeler Specific Bike/Scooter Body Cover",
      "Fabric Type-33% Cotton + 33% Non-Woven + 33% Plastic.",
      "Qty-1 Unit",
      "Color - Black"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Bike-Body-Cover.jpg",
      "/images/2w-body-cover/Picture1.jpg",

    ],
    categoryId: "body-cover",
    additionalInfo: [
      "Product Highlights ",
      "Mirror Pocket",
      "Heavy Buckle ",
      "High Quality Elastic ",
      "100% Water Proof ",
    ],
    inStock: true,
    rating: 4.4,
    reviews: reviews["1"]
  },
  {
    id: "body-cover-wr-xl",
    name: "Body Cover Water Repellent XL",
    price: 840,
    description: [
      "High Quality.",
      "Product Type-2 wheeler Specific Bike/Scooter Body Cover",
      "Fabric Type-33% Cotton + 33% Non-Woven + 33% Plastic.",
      "Qty-1 Unit",
      "Color - Black"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Bike-Body-Cover.jpg",
      "/images/2w-body-cover/Picture2.jpg",

    ],
    categoryId: "body-cover",
    additionalInfo: [
      "Product Highlights ",
      "Mirror Pocket",
      "Heavy Buckle ",
      "High Quality Elastic ",
      "Water Repellent ",
    ],
    inStock: true,
    rating: 4.4,
    reviews: reviews["1"]
  },
  {
    id: "body-cover-wr-xxl",
    name: "Body Cover Water Repellent XXL",
    price: 1090,
    description: [
      "High Quality.",
      "Product Type-2 wheeler Specific Bike/Scooter Body Cover",
      "Fabric Type-33% Cotton + 33% Non-Woven + 33% Plastic.",
      "Qty-1 Unit",
      "Color - Black"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Bike-Body-Cover.jpg",
      "/images/2w-body-cover/Picture2.jpg",

    ],
    categoryId: "body-cover",
    additionalInfo: [
      "Product Highlights ",
      "Mirror Pocket",
      "Heavy Buckle ",
      "High Quality Elastic ",
      "Water Repellent ",
    ],
    inStock: true,
    rating: 4.4,
    reviews: reviews["1"]
  },
  //  car body cover 4w
  {
    id: "trilayer-body-cover",
    name: "Trilayer Body cover",
    price: 3699,
    description: [
      "High Quality.",
      "Product Type-Car Specific Car Body Cover",
      "Fabric Type-33% Cotton + 33% Non-Woven + 33% Plastic.",
      "Qty-1 Unit",
      "Color - Blue"
    ],
    images: [
      "/images/body-cover/Trilayer Body Cover.png",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/TRILAYER-BODY-COVER.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/WhatsApp Image 2023-11-28 at 4.35.40 PM (1).jpeg",

    ],
    categoryId: "car-body-cover",
    additionalInfo: [
      "Product Highlights ",
      "Mirror Pocket",
      "Heavy Buckle ",
      "High Quality Elastic ",
      "100% Water Resistant ",
    ],
    inStock: true,
    rating: 4.4,
    reviews: reviews["1"]
  },
  {
    id: "sparko-jungle-body-cover",
    name: "Sparko Jungle Body Cover",
    price: 2699,
    description: [
      "Car specific design ensures a perfect fit.",
      "Made with high-quality materials for long-lasting durability.",
      "100% water repellent to protect against rain and moisture.",
      "Double-layer fabric: polyester outer layer with cotton backing.",
      "Triple stitched seams with overlapped construction for strength.",
      "High-quality elastic sewn into front and rear hems for secure hold.",
      "Includes durable belt to enhance protection during windy conditions."
    ],
    images: [
      "/images/body-cover/Sparko Jungle Body Cover.png",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/SPARKO-JUNGLE-BODY-COVER.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/WhatsApp Image 2023-11-28 at 4.35.41 PM.jpeg",

    ],
    categoryId: "car-body-cover",
    additionalInfo: [
      "Fabric Type: Polyester",
      "Product Name: Sparko Jungle",
      "Color: Jungle Print",
      "Quantity: 1 Unit",
      "Protects body paint from external damage",
      "Offers effective UV protection",
      "Made with soft, high-quality fabric",
      "Customized fitting for specific car models",
      "Dust-proof and weather-resistant",
      "100% water repellent material",
      "Shields from bird droppings",
      "Helps keep car interior cool"
    ],
    inStock: true,
    rating: 4.6,
    reviews: reviews["1"]
  },
  {
    id: "sparko-silver-body-cover",
    name: "Sparko Silver Body Cover",
    price: 2499,
    description: [
      "High-quality double-layer fabric with a polyester outer and cotton inner lining.",
      "100% water repellent for maximum protection in rain.",
      "Triple-stitched seams with overlap for enhanced durability.",
      "Elastic hems at front and rear ensure a snug fit.",
      "Includes high-quality securing belt for extra wind protection.",
      "Ideal for long-term outdoor and indoor use."
    ],
    images: [
      "/images/body-cover/Sparko Silver Body Cover.png",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/SPARKO-SILVER-BODY-COVER.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/WhatsApp Image 2023-11-28 at 4.35.40 PM.jpeg",


    ],
    categoryId: "car-body-cover",
    additionalInfo: [
      "Fabric Type: Polyester",
      "Product Name: Sparko Jungle",
      "Color: Jungle Print",
      "Quantity: 1 Unit",
      "In The Package: 1 Sparko Jungle Body Cover",
      "Note: Check size guide before purchase for best fit."
    ],
    inStock: true,
    rating: 4.5,
    reviews: reviews["1"]
  },
  //easyfit(diy)
  {
    id: "venus",
    name: "Venus",
    price: 8709,
    description: [
      "Premium easy-fit seat cover with stylish stitching pattern.",
      "Designed for hassle-free installation and snug fit.",
      "Made with durable material to withstand daily use.",
      "Enhances both aesthetics and comfort of your car interior."
    ],
    images: [
      "/images/EasyFit/Easy Fit Venus.jpg",


    ],
    categoryId: "Easy-fit",
    additionalInfo: [
      "In The Package: 1 Set of Venus Seat Covers",
      "Note: Suitable for most car models. Check compatibility before purchase."
    ],
    inStock: true,
    rating: 4.5,
    reviews: reviews["1"]
  },
  {
    id: "tauras",
    name: "Tauras",
    price: 8709,
    description: [
      "Easy-fit Tauras seat cover with dual-tone design.",
      "Soft-touch fabric with high-density padding for comfort.",
      "Fade-resistant colors with lasting finish.",
      "Tool-free installation for a quick interior upgrade."
    ],
    images: [
      "/images/EasyFit/Easy Fit Tauras.jpg",

    ],
    categoryId: "Easy-fit",
    additionalInfo: [
      "In The Package: 1 Set of Tauras Seat Covers",
      "Note: Machine washable. Follow care instructions on label."
    ],
    inStock: true,
    rating: 4.6,
    reviews: reviews["1"]
  },
  {
    id: "black-and-silver-sprint",
    name: "Sprint(Black & Silver)",
    price: 8709,
    description: [
      "Striking black and silver seat covers from the Sprint series.",
      "Engineered to fit most hatchback and sedan seats.",
      "PU leather finish for sleek appearance and durability.",
      "Breathable mesh zones for extra comfort in summer."
    ],
    images: [
      "/images/EasyFit/Easy Fit Srint (Black & Silver).jpg",


    ],
    categoryId: "Easy-fit",
    additionalInfo: [
      "In The Package: 1 Set of Black & Silver Sprint Covers",
      "Note: May require minor adjustments for SUVs."
    ],
    inStock: true,
    rating: 4.4,
    reviews: reviews["1"]
  },
  {
    id: "sprint",
    name: "Sprint",
    price: 8709,
    description: [
      "Modern Sprint seat cover with minimalist styling.",
      "Crafted from premium PU and breathable mesh inserts.",
      "Supports long drives with ergonomic cushioning.",
      "No-tool required for fitting; DIY-friendly."
    ],
    images: [
      "/images/EasyFit/Easy Fit Sprint.jpg",

    ],
    categoryId: "Easy-fit",
    additionalInfo: [
      "In The Package: 1 Set of Sprint Seat Covers",
      "Note: Includes universal hooks and fitting guide."
    ],
    inStock: true,
    rating: 4.5,
    reviews: reviews["1"]
  },
  {
    id: "florence",
    name: "Florence",
    price: 2999,
    description: [
      "Elegant Florence seat covers with soft-touch finish.",
      "Fits most car models with bucket seats.",
      "Designed to resist spills, stains, and UV damage.",
      "Adds sophistication and comfort to car interiors."
    ],
    images: [
      "/images/EasyFit/Easy Fit Florence.jpg",

    ],
    categoryId: "Easy-fit",
    additionalInfo: [
      "In The Package: 1 Set of Florence Seat Covers",
      "Note: Recommended for dry clean only."
    ],
    inStock: true,
    rating: 4.7,
    reviews: reviews["1"]
  },
  //car care Products
  {
    id: "Microfibre-clothcar",
    name: "Microfibre Cloth",
    price: 342,
    description: [
      "Ultra-soft Microfibre cloth ideal for car detailing and cleaning.",
      "Highly absorbent and lint-free for streak-free shine.",
      "Safe for use on paint, glass, dashboard, and chrome.",
      "Machine washable and reusable multiple times."
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/micro-fibre-cloth-2.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/micro-fibre-cloth-uni.jpg",

    ],
    categoryId: "car-care-products",
    additionalInfo: [
      "In The Package: 1 x Microfibre Cloth (Approx. 40x40 cm)",
      "Note: Color may vary depending on stock availability."
    ],
    inStock: true,
    rating: 4.5,
    reviews: reviews["1"]
  },
  {
    id: "car-duster",
    name: "Car Duster (WAX)",
    price: 899,
    description: [
      "Wax-treated duster easily removes dust without scratching.",
      "Ideal for daily dusting of car exteriors and interiors.",
      "Reusable and long-lasting with proper care.",
      "Ergonomic handle ensures comfortable grip during cleaning."
    ],
    images: [
      "/images/car-uti/Duster-png.png",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/duster.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/burssh-duster.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/duste1.jpg",

    ],
    categoryId: "car-care-products",
    additionalInfo: [
      "In The Package: 1 x Wax Car Duster",
      "Note: Do not wash to retain wax coating effectiveness."
    ],
    inStock: true,
    rating: 4.6,
    reviews: reviews["1"]
  },
  {
    id: "car-odour-eliminator",
    name: "Car Odour Eliminator",
    price: 399,
    description: [
      "Neutralizes bad odours and refreshes car interiors instantly.",
      "Long-lasting formula ideal for smoke, food, and pet smells.",
      "Non-toxic and safe for use around children and pets.",
      "Compact spray bottle fits conveniently in glove compartment."
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/CAR-ODOUR-ELIMINATOR.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/CAR-ODOUR-ELIMINATOR.jpg",

    ],
    categoryId: "car-care-products",
    additionalInfo: [
      "In The Package: 1 x Odour Eliminator Spray (100ml)",
      "Note: Use only as directed, avoid direct contact with eyes."
    ],
    inStock: true,
    rating: 4.7,
    reviews: reviews["1"]
  },

  {
    id: "car-odour-eliminatorc",
    name: "Car Odour Eliminator",
    price: 399,
    description: [
      "Neutralizes bad odours and refreshes car interiors instantly.",
      "Long-lasting formula ideal for smoke, food, and pet smells.",
      "Non-toxic and safe for use around children and pets.",
      "Compact spray bottle fits conveniently in glove compartment."
    ],
    images: [
      "/images/care&Fregrance/Car-Oduor.png",

    ],
    categoryId: "odour-eliminator",
    additionalInfo: [
      "In The Package: 1 x Odour Eliminator Spray (100ml)",
      "Note: Use only as directed, avoid direct contact with eyes."
    ],
    inStock: true,
    rating: 4.7,
    reviews: reviews["1"]
  },
  //Car /utility
  {
    id: "Letherette-Perfume",
    name: "Letherette Perfume",
    price: 599,
    description: [
      "Premium letherette car perfume with long-lasting fragrance.",
      "Stylish design that blends well with car interiors.",
      "Easy to place on dashboard or AC vents.",
      "Non-spill and eco-friendly ingredients."
    ],
    images: [
      "/images/car-uti/LEATHERETTE PERFUME.png",

    ],
    categoryId: "car-utility",
    additionalInfo: [
      "In The Package: 1 x Letherette Car Perfume",
      "Note: Fragrance and bottle design may vary slightly by batch."
    ],
    inStock: true,
    rating: 4.5,
    reviews: reviews["1"]
  },
  {
    id: "car-seat-hook",
    name: "Car Seat Hook With Mobile Holder",
    price: 649,
    description: [
      "Dual-purpose seat hook with built-in mobile holder.",
      "Easily hangs bags, bottles, and more behind headrests.",
      "360° rotation for flexible mobile viewing angles.",
      "Made with durable, high-strength plastic."
    ],
    images: [
      "/images/car-uti/Screenshot 2025-06-12 124428.png",

    ],
    categoryId: "car-utility",
    additionalInfo: [
      "In The Package: 1 x Car Seat Hook with Mobile Holder",
      "Note: Ensure compatibility with headrest poles before purchase."
    ],
    inStock: true,
    rating: 4.6,
    reviews: reviews["1"]
  },
  {
    id: "steeringwheel-dining-tray",
    name: "Steering Wheel Dining Tray",
    price: 1499,
    description: [
      "Transforms your car into a mobile office or dining space.",
      "Fits most standard steering wheels for stable mounting.",
      "Double-sided: one for meals, one for laptop use.",
      "Lightweight, sturdy, and easy to install/remove."
    ],
    images: [
      "/images/car-uti/Steering-Wheel-Dining-Tray.png",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/STEERING-WHEEL-DINING-TRAY.jpg",


    ],
    categoryId: "car-utility",
    additionalInfo: [
      "In The Package: 1 x Steering Wheel Dining Tray",
      "Note: Not recommended to use while driving."
    ],
    inStock: true,
    rating: 4.7,
    reviews: reviews["1"]
  },
  {
    id: "car-air-purifier",
    name: "Car Air Purifier",
    price: 799,
    description: [
      "Effectively removes odors, smoke, and airborne pollutants.",
      "USB powered with silent operation and compact design.",
      "Built-in ionizer for fresher and cleaner air.",
      "Ideal for people with allergies or sensitivity to dust."
    ],
    images: [
      "/images/car-uti/Car-Air-Purifier.png",

    ],
    categoryId: "car-utility",
    additionalInfo: [
      "In The Package: 1 x Car Air Purifier + USB Cable",
      "Note: Regular cleaning of the filter is recommended."
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },


  //4w-electronic-accessories
  {
    id: "car-mobile-chargerE",
    name: "Car Mobile Charger",
    price: 1799,
    description: [
      "High-speed 3.1AMP output for fast charging of multiple devices.",
      "Includes a 3-in-1 cable compatible with Micro USB, Type-C, and Lightning ports.",
      "Wide Compatibility: Supports Apple, Micro USB, and Type-C devices.",
      "Quick Charge 3.0 Technology: Faster and more efficient than standard chargers.",
      "Power Delivery (PD): Enhanced speed and safety with advanced protection features.",
      "Compact & Stylish Design: Premium silver finish for a modern look."
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/charger.jpg",
      "/images/car-uti/Screenshot 2025-06-12 125812.png",

    ],
    categoryId: "Electronic-accessories",
    additionalInfo: [
      "Input Voltage: 12–24V",
      "Output Power: 100W",
      "USB Output: 5V 3A / 9V 3A / 12V 2.5A",
      "PD Output: 5V 3A / 9V 3A / 12V 2.5A",
      "Size: 9.3 x 15 x 3.2 cm",
      "Weight: 120g",
      "Color: Silver",
      "Package Includes: 1 x EMPORIO EXO Pro Car Charger, 1 x Cable"
    ],
    inStock: true,
    rating: 4.6,
    reviews: reviews["1"]
  },


  {
    id: "led-head-lamp-for-carE",
    name: "LED Head Lamp for Car",
    price: 7999,
    description: [
      "High-performance LED headlamp designed to enhance nighttime visibility and driving safety.",
      "Features powerful, energy-efficient LEDs with a long lifespan and consistent brightness.",
      "Plug-and-play installation with universal fitment for most car models.",
      "Shockproof and water-resistant construction for reliable performance in all weather conditions.",
      "Stylish and modern look to upgrade the overall appearance of your vehicle.",
      "The Products may Vary as Per the Car Specific"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/led-head-lamp.png",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/led-head-lamp.png"
    ],
    categoryId: "Electronic-accessories",
    additionalInfo: [
      "In The Package: 1 x Pair of LED Head Lamps.",
      "Note: Product images are for reference only. Actual product may vary based on model and availability.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 5.0,
    reviews: reviews["1"]
  },


  {
    id: "led-fog-lampE",
    name: "LED Fog Lamp for Car",
    price: 7999,
    description: [
      "High-performance LED fog lamps designed to cut through fog, rain, and low-visibility conditions.",
      "Equipped with energy-efficient LEDs that provide a focused, wide beam pattern for better road visibility.",
      "Durable, shockproof, and water-resistant housing ensures long-lasting performance in all weather.",
      "Easy plug-and-play installation with universal or vehicle-specific fitment.",
      "Enhances both safety and style with a modern, sleek design.",
      "Note: Products may vary as per specific car models."
    ],
    images: [
      "/images/fog lamp/fog_light_2_resized.png",
      "/images/fog lamp/fog_light_1_resized.png",
      "/images/fog lamp/fog_light_3_resized.png",
      "/images/fog lamp/fog_light_4_resized.png",

    ],
    categoryId: "Electronic-accessories",
    additionalInfo: [
      "In The Package: 1 x Pair of LED Fog Lamps.",
      "Note: Product images are for reference only. Actual product may vary based on model and availability.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 5.0,
    reviews: reviews["1"]
  },


  //Inflato Bot inflator
  {
    id: "tyre-inflatore-cordless",
    name: "Inflato Bot Total Tyre Control",
    price: 4099,
    description: [
      "Metal Cylinder: 19mm for durability and consistent performance.",
      "Voltage: 7.4V – Efficient power for cordless operation.",
      "Max Pressure: 150 PSI – Capable of inflating car's tires.",
      "Power: 40W – Strong motor ensures quick inflation.",
      "Airflow: 20 LPM – Delivers steady airflow for fast results.",
      "Lithium Battery: Dual 2000 mAh batteries for longer usage.",
      "Air Hose: 25cm hose for flexible reach.",
      "LED Light: Equipped with Light & SOS modes for emergencies.",
      "Charger Type: Type-C for convenient and fast charging.",
      "Charge Time: 4-5 hours for a full charge.",
      "4 Modes: Bicycle, Motorcycle, Car, Basketball.",
      "Inflate Time: 8 minutes for a 205/55R16 tire from 0-35 PSI."
    ],
    images: [
      "/images/bannersforcataloguewebsite/Inflator.jpg",
    ],
    categoryId: "Electronic-accessories",
    additionalInfo: [
      "Package Includes: 1 x Inflato Bot Total Tyre Control, Type-C charger, air hose, and nozzle attachments.",
      "Charging: Type-C cable included; full charge in 4-5 hours.",
      "LED Feature: Dual-mode Light & SOS for emergency use.",
      "Inflation Compatibility: Suitable for Bicycle, Motorcycle, Car, and Basketball.",
      "Note: Images are for reference only; actual product may vary slightly.",
      "Support: Contact +91 9278411411 for assistance. Replacement only for manufacturing defects."
    ],
    inStock: true,
    rating: 5.0,
    reviews: reviews["1"]
  },


  //cordless tyre inflator light and utility
  {
    id: "tyre-inflatore-cordlessU",
    name: "Inflato Bot Total tyre Control",
    price: 4099,
    description: [
      "Auto Cut-Off Function – Prevents over-inflation by automatically stopping at the desired pressure.",
      "Powerful 150W Motor – Delivers efficient and quick inflation.",
      "Maximum Pressure: 150 PSI – Suitable for inflating car's tires effortlessly.",
      "Air Flow: 35 LPM – Ensures rapid inflation for a hassle-free experience.",
      "Voltage: DC 12V – Easily plugs into your car’s cigarette lighter socket for instant use.",
      "Compact & Lightweight – Designed for easy storage in your car without taking up much space.",
      "Digital display shows accurate pressure readings in PSI, BAR, KPA, and KG/CM².",
      "Built-in LED light provides visibility in low-light or emergency situations.",
      "Easy to use – just connect, set the pressure, and let the inflator do the work."
    ],
    images: [
      "/images/bannersforcataloguewebsite/Inflator.jpg",


    ],
    categoryId: "light-utility",
    additionalInfo: [
      "In The Package: 1 x EMPORIO Auto Cut Air Inflator with power cord and nozzle attachments.",
      "Note: Product images are for reference only. Actual product may vary slightly based on stock availability.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 5.0,
    reviews: reviews["1"]
  },


  //air inflator 
  {
    id: "tyre-inflatore",
    name: "EMPORIO Auto Cut Air Inflator – 150W Power",
    price: 4099,
    description: [
      "Auto Cut-Off Function – Prevents over-inflation by automatically stopping at the desired pressure.",
      "Powerful 150W Motor – Delivers efficient and quick inflation.",
      "Maximum Pressure: 150 PSI – Suitable for inflating car, bike, and other vehicle tires effortlessly.",
      "Air Flow: 35 LPM – Ensures rapid inflation for a hassle-free experience.",
      "Voltage: DC 12V – Easily plugs into your car’s cigarette lighter socket for instant use.",
      "Compact & Lightweight – Designed for easy storage in your car without taking up much space.",
      "Digital display shows accurate pressure readings in PSI, BAR, KPA, and KG/CM².",
      "Built-in LED light provides visibility in low-light or emergency situations.",
      "Easy to use – just connect, set the pressure, and let the inflator do the work."
    ],
    images: [
      "/images/inflator/Tyre-Inflator.png",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/tire-inflator-1.jpg"


    ],
    categoryId: "Electronic-accessories",
    additionalInfo: [
      "In The Package: 1 x EMPORIO Auto Cut Air Inflator with power cord and nozzle attachments.",
      "Note: Product images are for reference only. Actual product may vary slightly based on stock availability.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 5.0,
    reviews: reviews["1"]
  },

  //portable tyre inflator
  {
    id: "portable-tyre-inflatorE",
    name: "EMPORIO Portable Car Compressor – Compact & Efficient Tire Inflator",
    price: 3499,
    description: [
      "Powerful 150W motor for quick and efficient tyre inflation – ideal for cars, bikes, and SUVs.",
      "Automatic shut-off feature stops inflation when the desired pressure is reached for safe operation.",
      "Digital display shows accurate pressure readings in PSI, BAR, KPA, and KG/CM².",
      "Compact and portable design with built-in LED light for night-time or emergency use.",
      "Easy to use – just plug into the car’s 12V socket and start inflating instantly."
    ],
    images: [
      "/images/inflator/Tyre-Inflator02.png",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Small-Inflator-1.jpg",

    ],
    categoryId: "Electronic-accessories",
    additionalInfo: [
      "In The Package: 1 x EMPORIO Portable Car Compressor with power cord and nozzle attachments.",
      "Note: Product images are for reference only. Actual product may vary slightly based on stock availability.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 5.0,
    reviews: reviews["1"]
  },

  // vaccum cleaner
  {
    id: "portable-vaccum-cleanerE",
    name: "EMPORIO Portable Car Vacuum Cleaner – Wet & Dry Cleaning",
    price: 2499,
    description: [
      "Wet & Dry Cleaning – Versatile for liquid spills and dry debris",
      "High Suction Power – Ensures effective and quick cleaning",
      "Lightweight & Portable – Easy to carry and store",
      "HEPA Filter – Captures fine dust and allergens",
      "Deep Cleaning – Reaches tight spaces for thorough results"
    ],
    images: [
      "/images/car-uti/Vacuum-Cleaner.png"
    ],
    categoryId: "Electronic-accessories",
    additionalInfo: [
      "In The Package: 1 x EMPORIO Portable Vacuum Cleaner",
      "Note: Product images are for reference only. Actual product may vary slightly based on stock availability.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 5.0,
    reviews: reviews["1"]
  },
  // car charger

  // Ventilated seat cover
  //cool ventilated Seat cover 
  {
    id: "ventilated-seat-cool",
    name: "Cool Ventilated Seat Cover",
    price: 5999,
    description: [
      "Powered by DC 12V – Easily plugs into your car’s power socket for hassle-free operation.",
      "Three-Level Airflow Control – Choose between High, Medium, or Low airflow settings with a simple control switch",
      "Built-In Fan System – Located at the bottom of the seat, the fan absorbs surrounding air and circulates it throughout the cushion for consistent ventilation.",
      "Cooling, Not A/C – While it doesn’t replace your air conditioning system, it significantly boosts seat comfort by reducing heat buildup.",
      "Perfect Fit – With dimensions of 127cm x 40cm, it fits most standard car seats.",
      "Low Power Consumption – Operates efficiently between 6W to 9W, making it energy-friendly for continuous use."
    ],
    images: [
      "/images/car-uti/Cooling-Seat.png",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/vent-sheet.jpg",
      // Replace with actual ventilated seat image
      "/images/car-uti/Power Plug.jpg",
      "/images/car-uti/Cooling-Seat.jpg",
    ],
    categoryId: "Electronic-accessories",
    additionalInfo: [
      "In The Package: 1 x Cool Ventilated Seat Cover",
      "Note: Product images are for reference only. Actual product may vary slightly based on stock availability.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 5.0,
    reviews: reviews["1"]
  },
  //heat ventilated seat cover
  {
    id: "ventilated-seat-heat",
    name: "Heat Ventilated Seat Cover",
    price: 3599,
    description: [
      "Dual Function – Provides both heating and ventilation for ultimate comfort in all seasons.",
      "Powered by DC 12V – Plugs directly into your car’s power socket for easy operation.",
      "Three-Level Heat Control – Adjust heat intensity between Low, Medium, and High for personalized comfort.",
      "Built-In Fan System – Maintains airflow while heating, preventing overheating and ensuring balanced temperature.",
      "Universal Fit – Designed to fit most car seats with secure straps for easy installation.",
      "Energy Efficient – Consumes low power (6W to 9W) for extended use without draining your battery."
    ],
    images: [
      "/images/car-uti/Heating Seat AC.png",
      "/images/car-uti/Power Plug.jpg",
      "/images/car-uti/Heating Seat AC.JPG"

      // "https://autoform-image.s3.ap-south-1.amazonaws.com/products/WhatsApp Image 2025-04-10 at 13.28.33.jpeg",
      // "https://autoform-image.s3.ap-south-1.amazonaws.com/products/vent-sheet02.jpg"
    ],
    categoryId: "Electronic-accessories",
    additionalInfo: [
      "In The Package: 1 x Heat Ventilated Seat Cover",
      "Note: Product images are for reference only. Actual product may vary slightly based on stock availability.",
      "Safety: Do not use the heating function without supervision or for prolonged periods.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 5.0,
    reviews: reviews["1"]
  },


  //Snail Horn
  {
    id: "snail-horn",
    name: "Emporio Snail Horn",
    price: 899,
    description: [
      "High Sound Output – Delivers a powerful tone between 105dB to 118dB for maximum audibility.",
      "Dual Frequency – Operates at 410±20Hz and 510±20Hz for a strong and clear dual-tone sound.",
      "Compact Design – 88mm diameter for easy installation on most vehicles.",
      "12V Operation – Compatible with standard car electrical systems.",
      "Durable Build – Designed to withstand various weather conditions.",
      "Energy Efficient – Low amp draw (3.6–4.0A per horn) ensures minimal battery strain."
    ],
    images: [
      "/images/car-uti/E201.png"
    ],
    categoryId: "Electronic-accessories",
    additionalInfo: [
      "Technical Specifications:",
      "• Diameter: 88mm",
      "• Sound Level: 105–118dB",
      "• Frequency: 410±20Hz & 510±20Hz",
      "• Voltage: 12V",
      "• Current: (3.6–4.0)A × 2",
      "• Model No: E202",
      "",
      "In The Package: 1 Pair of Emporio Snail Horns",
      "Note: Product images are for reference only. Actual product may vary slightly based on stock availability.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 5.0,
    reviews: reviews["1"]
  },


  // for the light and utility products'

  {
    id: "ventilated-seat-coolu",
    name: "Cool Ventilated Seat Cover",
    price: 5999,
    description: [
      "Powered by DC 12V – Easily plugs into your car’s power socket for hassle-free operation.",
      "Three-Level Airflow Control – Choose between High, Medium, or Low airflow settings with a simple control switch",
      "Built-In Fan System – Located at the bottom of the seat, the fan absorbs surrounding air and circulates it throughout the cushion for consistent ventilation.",
      "Cooling, Not A/C – While it doesn’t replace your air conditioning system, it significantly boosts seat comfort by reducing heat buildup.",
      "Perfect Fit – With dimensions of 127cm x 40cm, it fits most standard car seats.",
      "Low Power Consumption – Operates efficiently between 6W to 9W, making it energy-friendly for continuous use."
    ],
    images: [
      "/images/car-uti/Cooling-Seat.png",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/vent-sheet.jpg",
      // Replace with actual ventilated seat image
      "/images/car-uti/Power Plug.jpg",
      "/images/car-uti/Cooling-Seat.jpg",
    ],
    categoryId: "light-utility",
    additionalInfo: [
      "In The Package: 1 x Cool Ventilated Seat Cover",
      "Note: Product images are for reference only. Actual product may vary slightly based on stock availability.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 5.0,
    reviews: reviews["1"]
  },
  //heat ventilated seat cover
  {
    id: "ventilated-seat-heatu",
    name: "Heat Ventilated Seat Cover",
    price: 3599,
    description: [
      "Dual Function – Provides both heating and ventilation for ultimate comfort in all seasons.",
      "Powered by DC 12V – Plugs directly into your car’s power socket for easy operation.",
      "Three-Level Heat Control – Adjust heat intensity between Low, Medium, and High for personalized comfort.",
      "Built-In Fan System – Maintains airflow while heating, preventing overheating and ensuring balanced temperature.",
      "Universal Fit – Designed to fit most car seats with secure straps for easy installation.",
      "Energy Efficient – Consumes low power (6W to 9W) for extended use without draining your battery."
    ],
    images: [
      "/images/car-uti/Heating Seat AC.png",
      "/images/car-uti/Power Plug.jpg",
      "/images/car-uti/Heating Seat AC.JPG"

      // "https://autoform-image.s3.ap-south-1.amazonaws.com/products/WhatsApp Image 2025-04-10 at 13.28.33.jpeg",
      // "https://autoform-image.s3.ap-south-1.amazonaws.com/products/vent-sheet02.jpg"
    ],
    categoryId: "light-utility",
    additionalInfo: [
      "In The Package: 1 x Heat Ventilated Seat Cover",
      "Note: Product images are for reference only. Actual product may vary slightly based on stock availability.",
      "Safety: Do not use the heating function without supervision or for prolonged periods.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 5.0,
    reviews: reviews["1"]
  },


  //Snail Horn
  {
    id: "snail-hornu",
    name: "Emporio Snail Horn",
    price: 899,
    description: [
      "High Sound Output – Delivers a powerful tone between 105dB to 118dB for maximum audibility.",
      "Dual Frequency – Operates at 410±20Hz and 510±20Hz for a strong and clear dual-tone sound.",
      "Compact Design – 88mm diameter for easy installation on most vehicles.",
      "12V Operation – Compatible with standard car electrical systems.",
      "Durable Build – Designed to withstand various weather conditions.",
      "Energy Efficient – Low amp draw (3.6–4.0A per horn) ensures minimal battery strain."
    ],
    images: [
      "/images/car-uti/E201.png"
    ],
    categoryId: "light-utility",
    additionalInfo: [
      "Technical Specifications:",
      "• Diameter: 88mm",
      "• Sound Level: 105–118dB",
      "• Frequency: 410±20Hz & 510±20Hz",
      "• Voltage: 12V",
      "• Current: (3.6–4.0)A × 2",
      "• Model No: E202",
      "",
      "In The Package: 1 Pair of Emporio Snail Horns",
      "Note: Product images are for reference only. Actual product may vary slightly based on stock availability.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 5.0,
    reviews: reviews["1"]
  },
































  /////////////////////////////////////////////////
  // padded seat cover
  {
    id: "padded-seat-cover-bt",
    name: "Padded Seat Cover (Black and Tan)",
    price: 5799,
    description: [
      "Stylish black and tan combination for a luxury feel.",
      "Extra padding for enhanced seating comfort on long drives.",
      "Universal fit for most car seats with easy installation straps.",
      "Durable material resistant to spills and wear."
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/PADDED-PLUS02.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/PADDED-PLUS02.jpg",

    ],
    categoryId: "padded-seat-covers",
    additionalInfo: [
      "In The Package: 1 Set of Padded Seat Covers (Front + Rear)",
      "Note: Color may slightly vary due to lighting. Designed for a snug fit."
    ],
    inStock: true,
    rating: 4.7,
    reviews: reviews["1"]
  },
  {
    id: "padded-seat-cover-b",
    name: "Padded Seat Cover Black",
    price: 5999,
    description: [
      "Sleek all-black design for a modern, elegant interior look.",
      "Extra soft padding ensures superior seating comfort.",
      "Universal design fits most vehicles with adjustable fasteners.",
      "Long-lasting fabric that is easy to clean and maintain."
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/PADDED-PLUS01.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/PADDED-PLUS01.jpg",

    ],
    categoryId: "padded-seat-covers",
    additionalInfo: [
      "In The Package: 1 Set of Padded Seat Covers (Front + Rear)",
      "Note: Product color may appear slightly different on screen."
    ],
    inStock: true,
    rating: 4.7,
    reviews: reviews["1"]
  },

  //organizers
  {
    id: "quilted-organizer",
    name: "Quilted Organizer",
    price: 1349,
    description: [
      "Elegant quilted design that complements premium car interiors.",
      "Multiple compartments for holding gadgets, documents, and more.",
      "Easy to attach to the back of seats with adjustable straps."
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Organiser-1.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Organiser-3.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Car-Seat-Organisied-5.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Organiser-2.jpg"
    ],
    categoryId: "innovative-organizers",
    additionalInfo: [
      "In The Package: 1 x Quilted Car Organizer",
      "Note: Color tone may slightly vary. Universal fit for most cars."
    ],
    inStock: true,
    rating: 4.7,
    reviews: reviews["1"]
  },
  {
    id: "tray-organizer",
    name: "Tray Organizer",
    price: 2195,
    description: [
      "Convenient fold-down tray for working or dining in the car.",
      "Includes storage pockets for small items and bottles.",
      "Lightweight yet sturdy design with easy strap installation."
    ],
    images: [
      "/images/car-uti/TRAY ORGANIZER.png",
      "/images/car-uti/Screenshot 2025-06-12 131107.png",

    ],
    categoryId: "innovative-organizers",
    additionalInfo: [
      "In The Package: 1 x Tray Organizer",
      "Note: Suitable for rear seat installation. Easy to clean and store."
    ],
    inStock: true,
    rating: 4.6,
    reviews: reviews["1"]
  },


  //tissue boxes 
  {
    id: "eco-curve",
    name: "Eco Curve",
    price: 999,
    description: [
      "Introducing the Autoformindia Car Tissue Box, the perfect solution for keeping tissues within easy reach while on the go. This innovative holder is designed to fit snugly in your car & holder, making it ideal for use during travel. Its versatile design also makes it suitable for use in the office or at home, providing convenient access to tissues whenever you need them. Stay organized and prepared with this practical accessory that seamlessly integrates into your daily routine."
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/TISSUE-BOX-(ECOCURVE).jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Ecucurve-grey.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/ecocure-brown-1.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/ecocure-blue-1.jpg"
    ],
    categoryId: "essential-tissue-box",
    additionalInfo: [
      "In The Package: 1 x Eco Curve Tissue Box with Starter Tissues",
      "Note: Tissues are replaceable. Color may vary slightly from images."
    ],
    inStock: true,
    rating: 4.6,
    reviews: reviews["1"]
  },
  {
    id: "cup-tissue",
    name: "Cup Tissue",
    price: 899,
    description: [
      "Compact and convenient cup-shaped tissue dispenser.",
      "Perfect for cup holders in cars and SUVs.",
      "Refillable design with easy pop-up tissue mechanism."
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Cup-tissue-Black-Red-1.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Cup-tissue-Black-green.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Cup-tissue-Black-white-1.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Cup-tissue-tan-1.jpg"
    ],
    categoryId: "essential-tissue-box",
    additionalInfo: [
      "In The Package: 1 x Cup Tissue Dispenser with Tissues",
      "Note: Fits standard car cup holders. Reusable with refill packs."
    ],
    inStock: true,
    rating: 4.5,
    reviews: reviews["1"]
  },
  {
    id: "quilting-tissue-box",
    name: "Quilting Tissue Box",
    price: 999,
    description: [
      "Introducing the Autoformindia Quilted Car Tissue Box,",
      "the perfect solution for keeping tissues within easy reach while on the go.",
      "This innovative holder is designed to fit snugly in your car holder, making it ideal for use during travel.",
      "Its versatile design also makes it suitable for use in the office or at home, providing convenient access to tissues whenever you need them.",
      "Stay organized and prepared with this practical accessory that seamlessly integrates into your daily routine."
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/quilted-yellow-black-1.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/quilted-tan-tan-1.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/quilted-silver-black.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/quilted-blakc-red-1.jpg"
    ],
    categoryId: "essential-tissue-box",
    additionalInfo: [
      "In The Package: 1 x Quilting Tissue Box with Tissue Starter Pack",
      "Note: Ideal for gifting. Available in multiple colors upon request.",
      "Introducing the sleek and practical Quilted Car Tissue Box from Autoformindia!",
      "Whether you are on the road, traveling, in the office, or at home, this handy accessory is designed to keep your tissues within easy reach and neatly organized.",
      "The Car Tissue Box Holder is the perfect solution for keeping your tissues handy and preventing them from getting scattered around your car, making it ideal for car owners and travelers.",
      " With its compact and versatile design, it can also be used in the office or at home, adding convenience to your daily routine."
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "premium-tissue-box",
    name: "Premium Tissue Box Holder",
    price: 999,
    description: [
      "Elegant Black & Red Design – A stylish addition to any car, home, or office.",
      "Premium PU Leather Finish – Durable, easy to clean, and scratch-resistant.",
      "Compact & Versatile – Ideal for cars, desks, dining tables, and offices.",
      "Easy-Access Slot – Convenient tissue dispensing while driving or at home.",
      "Sturdy & Long-Lasting – Built for everyday use with a strong structure.",
      "Perfect for adding a touch of luxury and convenience to your space. Order now and keep tissues within easy reach in style!."
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Tissue-box-premium-Black-Red-1.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Tissue-box-premium-Black-yellow.jpg",

    ],
    categoryId: "essential-tissue-box",
    additionalInfo: [
      "In The Package: 1 x Quilting Tissue Box with Tissue Starter Pack",
      "Note: Ideal for gifting. Available in multiple colors upon request.",
      "Add a touch of sophistication to your car, home, or office with the Premium Tissue Box. Designed with a sleek black PU leather finish accented by bold yellow detailing, this tissue box enhances any space while keeping tissues easily accessible. Built for durability and style, it offers a modern and functional design that seamlessly blends with luxury interiors."
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  //Steering wheel covers 
  {
    id: "car-specific",
    name: "Car Specific",
    price: 799,
    description: [
      "Tailor-made steering cover for a snug fit on your car model.",
      "Enhanced grip and comfort with premium PU leather finish.",
      "Long-lasting and fade-resistant even under sunlight.",
    ],
    images: [
      "/images/car-uti/Steering-wheel01.png",


    ],
    categoryId: "premium-steering-covers",
    additionalInfo: [
      "In The Package: 1 x Car-Specific Steering Cover",
      "Note: Compatible only with selected car models. Contact us to confirm fitment before ordering."
    ],
    inStock: true,
    rating: 4.7,
    reviews: reviews["comfort"]
  },
  {
    id: "unistitch",
    name: "Uni Stitch",
    price: 699,
    description: [
      "Universal fit with easy stitch-on installation.",
      "PU leather texture with anti-slip surface for safety.",
      "Double-stitched edges for long-lasting durability.",
    ],
    images: [
      "/images/car-uti/Steering-wheel.png",

    ],
    categoryId: "premium-steering-covers",
    additionalInfo: [
      "In The Package: 1 x Uni Stitch Steering Cover with Needle & Thread",
      "Note: Fits most standard-size steering wheels. DIY-friendly with included stitching kit."
    ],
    inStock: true,
    rating: 4.6,
    reviews: reviews["comfort"]
  },





  //Polyfill products

  {
    id: "neck-rest",
    name: "Neck Rest",
    price: 999,
    description: [
      "Ergonomically designed to support your neck during long drives.",
      "Polyfill stuffing for a soft, plush feel.",
      "Easy to attach to any car seat headrest.",
    ],
    images: [
      "/images/neckrest/neck-rest-pollyfill-beige-1.jpg",
      "/images/neckrest/neck-rest-pollyfill-beige-2.jpg",
      "/images/neckrest/neck-rest-pollyfill-beige-4.jpg",
      "/images/neckrest/neck-rest-pollyfill-black-1.jpg"

    ],
    categoryId: "polyfill-range",
    additionalInfo: [
      "In The Package: 1 x Polyfill Neck Rest",
      "Note: Color may vary slightly from images based on availability.",
    ],
    inStock: true,
    rating: 4.6,
    reviews: reviews["1"]
  },
  {
    id: "neck-rest-q",
    name: "Neck Rest (Quilting)",
    price: 999,
    description: [
      "Stylish quilted design for luxury and support.",
      "Filled with soft polyfill for extra comfort.",
      "Matches most premium seat covers and interiors.",
    ],
    images: [
      "/images/neckrest/Neck Rest Quilted.png",
      "/images/neckrest/NK I 1.png",

    ],
    categoryId: "polyfill-range",
    additionalInfo: [
      "In The Package: 1 x Quilted Neck Rest",
      "Note: Subject to availability. For custom color options, contact support.",
    ],
    inStock: true,
    rating: 4.7,
    reviews: reviews["2"]
  },
  {
    id: "passenger-neck-rest",
    name: "Passenger Neck Rest",
    price: 2195,
    description: [
      "Designed specifically for front passenger comfort.",
      "Soft polyfill interior for a plush experience.",
      "Fits securely on headrests with elastic band.",
    ],
    images: [
      "/images/neckrest/Polyfill-Orthopedic-Head-Rest-Black-1.jpg",
      "/images/neckrest/Polyfill-Orthopedic-Head-Rest-Black-2.jpg",
      "/images/neckrest/Polyfill-Orthopedic-Head-Rest-Black-3.jpg",

    ],
    categoryId: "polyfill-range",
    additionalInfo: [
      "In The Package: 2 x Passenger Neck Rest comes in pair",
      "Note: Actual shade may slightly differ from images.",
    ],
    inStock: true,
    rating: 4.5,
    reviews: reviews["2"]
  },
  {
    id: "cushion-pillow-q",
    name: "Cushion Pillow (Quilting)",
    price: 1749,
    description: [
      "Introducing the ultra-comfortable Cushion Pillow Memory Foam Car Back Rest Support from",
      "Autoformindia! Whether you&#39;re a frequent traveler, an office chair enthusiast, or simply enjoy",
      "relaxing at home, this innovative pillow provides the perfect support for your back. Crafted with",
      "high-quality memory foam, this pillow molds to the contours of your back, offering customized",
      "comfort and alleviating any discomfort caused by prolonged sitting. Its ergonomic design promotes",
      "proper spine alignment, reducing strain and fatigue during long drives, work hours, or relaxation at home.",
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/CUSHION-PILLOW-QUILTING.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/CUSHION-PILLOW-QUILTING.jpg",

    ],
    categoryId: "polyfill-range",
    additionalInfo: [
      "In The Package: 1 x Quilted Cushion Pillow",
      "Note: Contact us for custom embroidery or logo stitching.",
      "Say goodbye to back pain and hello to relaxation with the Autoformindia Cushion Pillow MemoryFoam Car Back Rest Support. Experience the ultimate in comfort and support, wherever your journey takes you."

    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "cushion-pillow-p",
    name: "Cushion Pillow (Polyfill)",
    price: 1549,
    description: [
      "Introducing the ultra-comfortable Cushion Pillow Polyfill Car Back Rest Support from Autoformindia! Whether you&#39;re a frequent traveler, an office chair enthusiast, or simply enjoy relaxing at home, this innovative pillow provides the perfect support for your back. Crafted with high-quality memory foam, this pillow molds to the contours of your back, offering customized comfort and alleviating any discomfort caused by prolonged sitting. Its ergonomic design promotes proper spine alignment, reducing strain and fatigue during long drives, work hours, or relaxation at home.",
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/CUSHION-PILLOW-POLYFILL.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/CUSHION-PILLOW-POLYFILL.jpg",

    ],
    categoryId: "polyfill-range",
    additionalInfo: [
      "In The Package: 1 x Polyfill Cushion Pillow",
      "Note: Suitable for daily use in all types of vehicles.",
      "Say goodbye to back pain and hello to relaxation with the Autoformindia Cushion Pillow Polyfill Foam Car Back Rest Support. Experience the ultimate in comfort and support, wherever your journey takes you."
    ],
    inStock: true,
    rating: 4.6,
    reviews: reviews["3"]
  },
  {
    id: "car-seat-cushion",
    name: "Car Seat Cushion",
    price: 1549,
    description: [
      `Introducing the new Autoformindia Car Seat Cushion Pillow, designed to elevate your travel
experience with unparalleled comfort and support. Crafted with premium materials, this innovative
cushion provides the perfect balance of softness and firmness, ensuring a relaxing journey, whether
you are embarking on a short commute or a long road trip. The ergonomic design helps alleviate
pressure on your lower back and promotes healthy posture, making it an essential companion for
every traveler. Upgrade your driving or passenger seat with the Autoformindia Car Seat Cushion
Pillow and indulge in a blissful ride every time.`
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/CAR-SEAT-CUSHION (1).jpg",
      "/images/neckrest/cushion.jpg",

    ],
    categoryId: "polyfill-range",
    additionalInfo: [
      `Introducing the Autoformindia Car Seat Cushion Pillow and Car Back Rest Support, designed to
provide ultimate comfort and support for travelers on their journeys. This innovative cushion pillow
and back rest support are meticulously crafted to enhance your driving or riding experience,
ensuring a pleasant and relaxing travel experience.The Autoformindia Car Seat Cushion Pillow and
Car Back Rest Support are meticulously designed to provide ergonomic support to the lower back,
promoting proper posture and reducing discomfort during long drives. The premium materials used
in construction ensure durability and long-lasting comfort, making it an essential addition to any
traveler's vehicle.`,
      `Whether you&#39;re embarking on a road trip or simply commuting to work, this cushion pillow and back
rest support will transform your driving experience. Say goodbye to discomfort and hello to
unparalleled relaxation with Autoformindia's39;s innovative car accessories.`,
      `Experience the difference with Autoformindia's Car Seat Cushion Pillow and Car Back Rest Support,
and elevate your travel comfort to new heights.`


    ],
    inStock: true,
    rating: 4.9,
    reviews: reviews["1"]
  },


  //healthy-memory-for-comfort products
  {
    id: "lumber-support-l1",
    name: "Lumber Support L1",
    price: 1749,
    description: [
      `Lumbar Support Back Rest Cushion, the perfect solution for anyone in need of ergonomic support
while traveling or working in an office. This innovative cushion is designed to provide exceptional
lumbar support, promoting proper posture and reducing discomfort during extended periods of
sitting. Whether you&#39;re on the go or stationed at your desk, this cushion offers the ideal combination
of comfort and support to keep you feeling refreshed and energized. Say goodbye to back strain and
hello to superior lumbar support with the Lumbar Support Back Rest Cushion by Lumber Support L1.`,
    ],
    images: ["https://autoform-image.s3.ap-south-1.amazonaws.com/products/L1.jpg", "/images/L1/L1-D1.jpg", "/images/L1/L1-D2.jpg"],
    categoryId: "healthy-memory-for-comfort",
    additionalInfo: [
      `Lumbar Support Back Rest Cushion by Autoformindia, the perfect solution for anyone seeking
comfort and support while traveling or working in the office. This ergonomically designed cushion
provides excellent lumbar support, promoting proper posture and reducing discomfort. Whether
you&#39;re a frequent traveler or spend long hours at the office, this lumbar support cushion is designed
to alleviate strain on your lower back, making your journey or workday more comfortable and
enjoyable.`,
    ],
    inStock: true,
    rating: 4.7,
    reviews: reviews["1"]
  },
  {
    id: "lumber-support-l2",
    name: "Lumber Support L2",
    price: 1749,
    description: [
      `Lumbar Support Back Rest Cushion by Autoformindia, the perfect solution for anyone seeking
comfort and support while traveling or working in the office. This ergonomically designed cushion
provides excellent lumbar support, promoting proper posture and reducing discomfort. Whether
you&#39;re a frequent traveler or spend long hours at the office, this lumbar support cushion is designed
to alleviate strain on your lower back, making your journey or workday more comfortable and
enjoyable.`,
    ],
    images: ["https://autoform-image.s3.ap-south-1.amazonaws.com/products/L2.jpg", "https://autoform-image.s3.ap-south-1.amazonaws.com/products/L2.jpg"],
    categoryId: "healthy-memory-for-comfort",
    additionalInfo: [
      `With its sleek and modern design, the Lumbar Support L2 Back Rest Cushion seamlessly blends into
any environment, providing the support you need without sacrificing style. Say goodbye to back pain
and hello to a more comfortable and ergonomic seating experience with the Lumbar Support Back
Rest Cushion by Autoformindia.`,
      "In The Package: 1 x Memory Foam Lumbar Cushion",
      "Note: Color and design may slightly differ based on stock.",
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["2"]
  },
  {
    id: "lumber-support-l3",
    name: "Lumber Support L3",
    price: 1749,
    description: [
      "Enhance your comfort and productivity with the Lumbar Support L3 – Black. Say goodbye to back pain and enjoy better posture.",
      "Ergonomic Design: Supports natural spinal alignment and reduces lower back strain.",
      "High-Density Memory Foam: Adapts to your back’s shape for personalized comfort.",
      "Breathable & Washable Cover: Soft, skin-friendly fabric keeps you cool and fresh.",
      "Adjustable Straps: Ensures a secure fit for office chairs, car seats, and home furniture.",
      "Sleek Black Design: Stylish and versatile to complement any seating setup.",
    ],
    images: ["https://autoform-image.s3.ap-south-1.amazonaws.com/products/L3-black.jpg", "/images/L1/L3-black.jpg", "/images/L1/Screenshot 2025-06-12 155723.png"],
    categoryId: "healthy-memory-for-comfort",
    additionalInfo: [
      "Improve your posture and relieve back pain with the Lumbar Support L3 – Black. Designed for optimal spinal alignment, this ergonomic backrest provides firm yet comfortable support for your lower back, reducing strain during long hours of sitting. Whether you're at work, driving, or relaxing at home, the L3 Lumbar Support ensures proper posture and enhanced comfort.",
      "Note: The images represent the actual product, though color of the image and the product may slightly differ. Subject to availability of the fabric(s).",
      "In The Package: 1 x Contoured Lumbar Support",
      "Note: Call +91 9278411411 for more details.",
    ],
    inStock: true,
    rating: 4.6,
    reviews: reviews["2"]
  },
  {
    id: "lumber-support-l4",
    name: "Lumber Support L4",
    price: 1749,
    description: [
      "Full Back Support: Intelligent car seat back support design providing comfort and support to your entire back. Integrated Lumbar Support: Ergonomically designed lumbar support for making car rides super comfortable.",
      "Adjustable & Secure Straps: Adjustable straps to accommodate car riders with all heights, ensuring it stays put supporting your back throughout the ride.",
      "Made with eco-friendly memory foam.",
      "Comes in vibrant fabric cover which is breathable, removable and washable.",
      "Experience targeted support with our proprietary, precisely engineered by orthopedic experts for optimal comfort and reduced back pain.  Excellent for improving your body posture, reduce stress to the back, and alleviate lower back pain."
    ],
    images: ["https://autoform-image.s3.ap-south-1.amazonaws.com/products/L4-grey.jpg", "https://autoform-image.s3.ap-south-1.amazonaws.com/products/L4-beige.jpg",],
    categoryId: "healthy-memory-for-comfort",
    additionalInfo: [
      "In The Box: LUMBAR SUPPORT (L4).",
      "Note: The images represent the actual product though color of the image and product may slightly differ. We will also call you to confirm your seat cover color once you order the product. You can also reach us at +91 9278411411.",
    ],
    inStock: true,
    rating: 4.7,
    reviews: reviews["1"]
  },
  {
    id: "cushion-pillow-memory",
    name: "Cushion Pillow Memory",
    price: 2499,
    description: [
      `Introducing the ultra-comfortable Cushion Pillow Memory Foam Car Back Rest Support from
Autoformindia! Whether you are a frequent traveler, an office chair enthusiast, or simply enjoy
relaxing at home, this innovative pillow provides the perfect support for your back. Crafted with
high-quality memory foam, this pillow molds to the contours of your back, offering customized
comfort and alleviating any discomfort caused by prolonged sitting. Its ergonomic design promotes
proper spine alignment, reducing strain and fatigue during long drives, work hours, or relaxation at
home.`,
    ],
    images: ["https://autoform-image.s3.ap-south-1.amazonaws.com/products/CUSHION-MEMORY-PILLOW.jpg", "https://autoform-image.s3.ap-south-1.amazonaws.com/products/CUSHION-MEMORY-PILLOW.jpg"],
    categoryId: "healthy-memory-for-comfort",
    additionalInfo: [
      "Say goodbye to back pain and hello to relaxation with the Autoformindia Cushion Pillow MemoryFoam Car Back Rest Support. Experience the ultimate in comfort and support, wherever your journeytakes you.",
      "Note: Design subject to change with fabric availability.",
    ],
    inStock: true,
    rating: 4.5,
    reviews: reviews["1"]
  },
  {
    id: "cockpit-neck-pillow",
    name: "Cockpit Neck Pillow",
    price: 1799,
    description: [
      "Car Headrest - Cockpit Style genuinely enhances your driving experience by combining comfort with cutting-edge design. It's more than just an accessory; it reflects a savvy appreciation for functionality and aesthetics. If you spend a lot of time behind the wheel, investing in one of these headrests isn't just a luxury; it's a smart move for your well-being. Remember, a comfortable drive can make all the difference in your daily routine. So, give it a shot and see how it transforms your car's cockpi",
    ],
    images: ["https://autoform-image.s3.ap-south-1.amazonaws.com/products/Cockpit-neck-pillow-AF.jpg", "/images/neckrest/Screenshot 2025-06-12 161805.png"],
    categoryId: "healthy-memory-for-comfort",
    additionalInfo: [
      "1. Daily driving to your long-distance workplace can be difficult on your neck. car neck cushion provides optimum support to the neck, cervical spine, and head making your travel pain-free and comfortable.",
      "2. This Memory Foam Headrest Cushion is ergonomically designed to support your cervical spine and head. The car headrest pillow relieves muscle tension and keeps your neck comfortable and pain-free.",
      "3. FIT FOR ALL CARS: This universal-fit car headrest cushion is suitable for all types of cars. The elastic strap makes it easy to install on any car seat. The elastic strap keeps the headrest in place and prevents it from sliding.",
      "4. 100% MEMORY FOAM WITH BALANCED SOFTNESS: It is made of 100% pure memory foam. Despite prolonged use, the memory foam doesn't flatten. It molds to the neck and keeps the muscles relaxed.",
      "5. The ergonomic design of the car neck pillow promotes proper posture while reducing stress on the neck and head."
    ],
    inStock: true,
    rating: 4.6,
    reviews: reviews["2"]
  },
  {
    id: "c-neck-rest-memory",
    name: "C NeckRest Memory",
    price: 1549,
    description: [
      "Upgrade your comfort with the Memory Foam Orthopedic C Neckrest – Beige and enjoy better posture and relaxation wherever you go. Order now!",
      "High-Density Memory Foam: Molds to the shape of your neck for personalized support.",
      "Ergonomic C-Shaped Design: Provides optimal alignment and relieves neck fatigue.",
      "Breathable & Washable Cover: Soft, skin-friendly fabric ensures long-lasting freshness.",
      "Multipurpose Use: Perfect for driving, working, and relaxation.",
      "Lightweight & Travel-Friendly: Easy to carry and store."
    ],
    images: ["https://autoform-image.s3.ap-south-1.amazonaws.com/products/Memory-Foam-Orthopedic-C-Neckrest-Black-1.jpg", "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Memory-Foam-Orthopedic-C-Neckrest-Beige-1.jpg"],
    categoryId: "healthy-memory-for-comfort",
    additionalInfo: [
      "In The Package: 1 x C NeckRest Memory Pillow",
      "Note: Wash cover separately. Avoid direct sunlight.",
      "Note: The images represent the actual product, though color of the image and the product may slightly differ. Subject to availability of the fabric(s).  You can also reach us at +91 9278411411."
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "arm-rest-memory",
    name: "Arm Rest Memory",
    price: 1549,
    description: [
      "Premium Memory Foam: Adapts to your arm’s natural shape for superior comfort.",
      "Ergonomic Design: Reduces strain on elbows and forearms, improving posture.",
      "Soft & Breathable Cover: Skin-friendly, removable, and washable for lasting freshness.",
      "Versatile Use: Ideal for office chairs, gaming chairs, car armrests, and home furniture.",
      "Easy Installation: Adjustable straps ensure a secure fit on various armrests.",
      "Enjoy maximum comfort and support with the Memory Foam Orthopedic Armrest—perfect for office work, gaming, and long drives."
    ],
    images: ["https://autoform-image.s3.ap-south-1.amazonaws.com/products/Memory-Foam-Orthopedic-Armr-Rest-1.jpg", "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Memory-Foam-Orthopedic-Armr-Rest.jpg", "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Memory-Foam-Orthopedic-Armr-Rest.jpg"],
    categoryId: "healthy-memory-for-comfort",
    additionalInfo: [
      "Upgrade your arm support with the Memory Foam Orthopedic Armrest, designed for enhanced comfort and ergonomic relief. Made with high-density memory foam, this armrest cushion reduces pressure on your elbows and forearms, preventing fatigue and discomfort during long hours of work, driving, or gaming.",
      "In The Box: Memory Foam Orthopedic Armrest Black (Pack of 1).",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411."
    ],
    inStock: true,
    rating: 4.5,
    reviews: reviews["2"]
  },
  {
    id: "premium-travel-pillow",
    name: "Premium Travel Pillow",
    price: 1649,
    description: [
      "Introducing the Autoformindia Neck Rest Memory Foam Travel Pillow, the ultimate travel companion for both your on-the-go adventures and long days at the office.",
      "This ergonomically designed pillow provides unparalleled support and comfort, allowing you to relax and unwind wherever you are.",
      " Crafted with high-quality memory foam, this travel pillow contours to the shape of your neck, providing optimal support and reducing strain.",
      "The plush, soft exterior ensures a cozy experience, while the adjustable closure allows for a customizable fit."
    ],
    images: ["https://autoform-image.s3.ap-south-1.amazonaws.com/products/PREMIUM-TRAVEL-PILLOW.jpg", "https://autoform-image.s3.ap-south-1.amazonaws.com/products/PREMIUM-TRAVEL-PILLOW.jpg"],
    categoryId: "healthy-memory-for-comfort",
    additionalInfo: [
      "In The Package: 1 x Premium Travel Memory Pillow",
      "Note: Reach us at +91 9278411411 for queries.",
    ],
    inStock: true,
    rating: 4.9,
    reviews: reviews["1"]
  },
  {
    id: "neck-cushion-memory",
    name: "Neck Cushion Memory",
    price: 1749,
    description: [
      "Compact cushion supports neck posture for long sitting hours.",
      "Durable fabric and memory foam blend.",
      "Lightweight and travel-friendly.",
    ],
    images: ["https://autoform-image.s3.ap-south-1.amazonaws.com/products/neckrest-6.jpg", "https://autoform-image.s3.ap-south-1.amazonaws.com/products/neckrest-4.jpg", "https://autoform-image.s3.ap-south-1.amazonaws.com/products/neckrest-1.jpg", "https://autoform-image.s3.ap-south-1.amazonaws.com/products/neckrest-7.jpg"],
    categoryId: "healthy-memory-for-comfort",
    additionalInfo: [
      "In The Package: 1 x Neck Cushion Memory Foam",
      "Note: Product images may slightly differ in tone.",
    ],
    inStock: true,
    rating: 4.7,
    reviews: reviews["2"]
  },
  {
    id: "seat-cushion-memory",
    name: "Seat Cushion Memory",
    price: 2195,
    description: [
      "Relieves tailbone and lower back pain when sitting.",
      "Engineered with orthopedic-grade memory foam.",
      "Non-slip bottom with breathable mesh cover.",
      "Experience unparalleled comfort and relief with our Coccyx Cushion, specially designed to alleviate tailbone pain and enhance your sitting posture. Whether you're working from home, driving, or relaxing, this cushion provides the support you need for a pain-free experience.",
    ],
    images: ["https://autoform-image.s3.ap-south-1.amazonaws.com/products/coccx-banner.jpg", "/images/neckrest/Memory-Foam-Orthopedic-Coccyx-Cushion-Black-3.jpg", "/images/neckrest/Memory-Foam-Orthopedic-Coccyx-Cushion-Black-2.jpg", "/images/neckrest/Memory-Foam-Orthopedic-Coccyx-Cushion-Black-1.jpg"],
    categoryId: "healthy-memory-for-comfort",
    additionalInfo: [
      "Ergonomic Design: The U-shaped, cut-out design reduces pressure on your tailbone and supports spinal alignment, promoting healthy posture.",
      "High-Quality Materials: Made from premium memory foam that conforms to your body shape, ensuring lasting comfort and durability.",
      "Portable and Lightweight: Easy to carry and fits most chairs, car seats, and wheelchairs, making it perfect for use at home, in the office, or on the go.",
      "Non-Slip Bottom: The non-slip rubber bottom keeps the cushion securely in place, so you don’t have to adjust it constantly.",
      "Removable and Washable Cover: The soft, breathable cover is easy to remove and machine washable, keeping your cushion fresh and clean.",
      "In The Package: 1 x Seat Cushion Memory Foam",
      "Note: Best used on flat surfaces for maximum support.",
      "Versatile Use: Ideal for office chairs, car seats, wheelchairs, airplanes, or even on the couch at home. Specifications: Material: Memory foam Color: Available in Black, and Beige"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["2"]
  },
  {
    id: "neck-d-memory",
    name: "Neck D Memory",
    price: 2195,
    description: [
      "D-shaped design supports natural neck curvature.",
      "Soft memory foam interior with breathable fabric.",
      "Perfect for car, office, or flight use.",
      `Introducing the Neck D, Neck Rest Memory Foam from Autoformindia - the perfect travel companion
for those on the go. Designed with your comfort in mind, this memory foam neckrest provides
unparalleled support for your neck during long journeys. Whether you are traveling by car, plane, or
train, this ergonomically shaped neck rest ensures that you arrive at your destination feeling
refreshed and rejuvenated. Experience the ultimate in travel comfort with the Neck D, Neck Rest
Memory Foam from Autoformindia.`,
    ],
    images: ["https://autoform-image.s3.ap-south-1.amazonaws.com/products/NECK-D-MEMORY.jpg", "https://autoform-image.s3.ap-south-1.amazonaws.com/products/NECK-D-MEMORY.jpg"],
    categoryId: "healthy-memory-for-comfort",
    additionalInfo: [
      "In The Package: 1 x D Neck Pillow with Memory Foam",
      "Note: Washable cover included. Handle with care.",
    ],
    inStock: true,
    rating: 4.6,
    reviews: reviews["1"]
  },



  //products for the Bullet Category of the 2 wheeler starts-------------------------------------

  //u-impress ----------------------------------------------
  {
    id: "1b",
    name: "U-Impress - Black",
    price: 625,
    description: [
      "Premium Material: Automotive-grade PU/PVC with a thickness of 0.90mm to 0.95mm for superior durability.",
      "Perfect Fit: Designed to ensure wrinkle-free fitment for a seamless look.",
      "High Strength & Comfort: Features high tear strength and high-density pure foam for unmatched comfort.",
      "Safe & Eco-Friendly: Contains no hazardous materials or chemical odors.",
      "Weather-Resistant: UV-resistant thread and water-resistant properties for durability in any condition.",
      "Easy Maintenance: Simple to clean, even during rainy seasons.",
      "Enhanced Features: Backed by 100 gsm fabric with anti-fungal properties for added hygiene.",

    ],
    images: [
      "/images/bullet/u-impress-black.png",
      "/images/bullet/u-impress-black.png",
      "/images/bullet/u-impress-black.png",
      "/images/bullet/u-impress-black.png",


    ],
    categoryId: "u-impress",
    additionalInfo: [
      "In The Package: One Set of U-Impress PU/PVC Leather Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "2b",
    name: "U-Impress - Brown",
    price: 625,
    description: [
      "Premium Material: Automotive-grade PU/PVC with a thickness of 0.90mm to 0.95mm for superior durability.",
      "Perfect Fit: Designed to ensure wrinkle-free fitment for a seamless look.",
      "High Strength & Comfort: Features high tear strength and high-density pure foam for unmatched comfort.",
      "Safe & Eco-Friendly: Contains no hazardous materials or chemical odors.",
      "Weather-Resistant: UV-resistant thread and water-resistant properties for durability in any condition.",
      "Easy Maintenance: Simple to clean, even during rainy seasons.",
      "Enhanced Features: Backed by 100 gsm fabric with anti-fungal properties for added hygiene.",

    ],
    images: [
      "/images/bullet/u-impress-brown.png",
      "/images/bullet/u-impress-brown.png",
      "/images/bullet/u-impress-brown.png",
      "/images/bullet/u-impress-brown.png",

    ],
    categoryId: "u-impress",
    additionalInfo: [
      "In The Package: One Set of U-Impress PU/PVC Leather Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  //u-impress - ends---------------------------------------------


  // u-drive statrs---------------------

  {
    id: "1d",
    name: "U-Dive - Brown",
    price: 860,
    description: [
      "Premium Material: Automotive-grade PU/PVC with a thickness of 0.90mm to 0.95mm for superior durability.",
      "Perfect Fit: Designed to ensure wrinkle-free fitment for a seamless look.",
      "High Strength & Comfort: Features high tear strength and high-density pure foam for unmatched comfort.",
      "Safe & Eco-Friendly: Contains no hazardous materials or chemical odors.",
      "Weather-Resistant: UV-resistant thread and water-resistant properties for durability in any condition.",
      "Easy Maintenance: Simple to clean, even during rainy seasons.",
      "Enhanced Features: Backed by 100 gsm fabric with anti-fungal properties for added hygiene.",

    ],
    images: [
      "/images/bullet/u-drive-brown.png",
      "/images/bullet/u-drive-brown.png",
      "/images/bullet/u-drive-brown.png",
      "/images/bullet/u-drive-brown.png",
    ],
    categoryId: "u-drive",
    additionalInfo: [
      "In The Package: One Set of U-Impress PU/PVC Leather Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  {
    id: "2d",
    name: "U-Dive - Black",
    price: 860,
    description: [
      "Premium Material: Automotive-grade PU/PVC with a thickness of 0.90mm to 0.95mm for superior durability.",
      "Perfect Fit: Designed to ensure wrinkle-free fitment for a seamless look.",
      "High Strength & Comfort: Features high tear strength and high-density pure foam for unmatched comfort.",
      "Safe & Eco-Friendly: Contains no hazardous materials or chemical odors.",
      "Weather-Resistant: UV-resistant thread and water-resistant properties for durability in any condition.",
      "Easy Maintenance: Simple to clean, even during rainy seasons.",
      "Enhanced Features: Backed by 100 gsm fabric with anti-fungal properties for added hygiene.",

    ],
    images: [
      "/images/bullet/u-drive-black.png",
      "/images/bullet/u-drive-black.png",
      "/images/bullet/u-drive-black.png",
      "/images/bullet/u-drive-black.png",
    ],
    categoryId: "u-drive",
    additionalInfo: [
      "In The Package: One Set of U-Impress PU/PVC Leather Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  // u-drive ends---------------------

  //products for the u-pyramid starts----------------------------------------------

  {
    id: "1p",
    name: "U-Pyramid - Black",
    price: 950,
    description: [
      "Premium Material: Automotive-grade PU/PVC with a thickness of 0.90mm to 0.95mm for superior durability.",
      "Perfect Fit: Designed to ensure wrinkle-free fitment for a seamless look.",
      "High Strength & Comfort: Features high tear strength and high-density pure foam for unmatched comfort.",
      "Safe & Eco-Friendly: Contains no hazardous materials or chemical odors.",
      "Weather-Resistant: UV-resistant thread and water-resistant properties for durability in any condition.",
      "Easy Maintenance: Simple to clean, even during rainy seasons.",
      "Enhanced Features: Backed by 100 gsm fabric with anti-fungal properties for added hygiene.",

    ],
    images: [
      "/images/bullet/u-pyramid-black.png",
      "/images/bullet/u-pyramid-black.png",
      "/images/bullet/u-pyramid-black.png",
      "/images/bullet/u-pyramid-black.png",
    ],
    categoryId: "u-pyramid",
    additionalInfo: [
      "In The Package: One Set of U-Impress PU/PVC Leather Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  {
    id: "2p",
    name: "U-Pyramid - Brown",
    price: 950,
    description: [
      "Premium Material: Automotive-grade PU/PVC with a thickness of 0.90mm to 0.95mm for superior durability.",
      "Perfect Fit: Designed to ensure wrinkle-free fitment for a seamless look.",
      "High Strength & Comfort: Features high tear strength and high-density pure foam for unmatched comfort.",
      "Safe & Eco-Friendly: Contains no hazardous materials or chemical odors.",
      "Weather-Resistant: UV-resistant thread and water-resistant properties for durability in any condition.",
      "Easy Maintenance: Simple to clean, even during rainy seasons.",
      "Enhanced Features: Backed by 100 gsm fabric with anti-fungal properties for added hygiene.",

    ],
    images: [
      "/images/bullet/u-pyramid-brown.png",
      "/images/bullet/u-pyramid-brown.png",
      "/images/bullet/u-pyramid-brown.png",
      "/images/bullet/u-pyramid-brown.png",
    ],
    categoryId: "u-pyramid",
    additionalInfo: [
      "In The Package: One Set of U-Impress PU/PVC Leather Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  //products for the u-pyramid end----------------------------------------------

  // products for the u-cross starts --------------------------
  {
    id: "1c",
    name: "U-Cross",
    price: 950,
    description: [
      "Premium Material: Automotive-grade PU/PVC with a thickness of 0.90mm to 0.95mm for superior durability.",
      "Perfect Fit: Designed to ensure wrinkle-free fitment for a seamless look.",
      "High Strength & Comfort: Features high tear strength and high-density pure foam for unmatched comfort.",
      "Safe & Eco-Friendly: Contains no hazardous materials or chemical odors.",
      "Weather-Resistant: UV-resistant thread and water-resistant properties for durability in any condition.",
      "Easy Maintenance: Simple to clean, even during rainy seasons.",
      "Enhanced Features: Backed by 100 gsm fabric with anti-fungal properties for added hygiene.",

    ],
    images: [
      "/images/bullet/u-cross.png",
      "/images/bullet/u-cross2.png",
      "/images/bullet/u-cross3.jpg",
      "/images/bullet/u-cross.png",
    ],
    categoryId: "u-cross",
    additionalInfo: [
      "In The Package: One Set of U-Impress PU/PVC Leather Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  // products for the u-cross ends --------------------------

  // products for the bike starts------------------------------

  //u-impress ----------------------------------------------
  {
    id: "1bi",
    name: "U-Impress - Black Color With Dual Tone Stiching",
    price: 345,
    description: [
      "Premium Material: Automotive-grade PU/PVC with a thickness of 0.90mm to 0.95mm for superior durability.",
      "Perfect Fit: Designed to ensure wrinkle-free fitment for a seamless look.",
      "High Strength & Comfort: Features high tear strength and high-density pure foam for unmatched comfort.",
      "Safe & Eco-Friendly: Contains no hazardous materials or chemical odors.",
      "Weather-Resistant: UV-resistant thread and water-resistant properties for durability in any condition.",
      "Easy Maintenance: Simple to clean, even during rainy seasons.",
      "Enhanced Features: Backed by 100 gsm fabric with anti-fungal properties for added hygiene.",

    ],
    images: [
      "/images/bike/u-impress.png",
      "/images/bike/u-impress.png",
      "/images/bike/u-impress.png",
      "/images/bike/u-impress.png",


    ],
    categoryId: "u-impressb",
    additionalInfo: [
      "In The Package: One Set of U-Impress PU/PVC Leather Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "2bi",
    name: "U-Impress - Dual Seat Black Color With Dual Tone",
    price: 395,
    description: [
      "Premium Material: Automotive-grade PU/PVC with a thickness of 0.90mm to 0.95mm for superior durability.",
      "Perfect Fit: Designed to ensure wrinkle-free fitment for a seamless look.",
      "High Strength & Comfort: Features high tear strength and high-density pure foam for unmatched comfort.",
      "Safe & Eco-Friendly: Contains no hazardous materials or chemical odors.",
      "Weather-Resistant: UV-resistant thread and water-resistant properties for durability in any condition.",
      "Easy Maintenance: Simple to clean, even during rainy seasons.",
      "Enhanced Features: Backed by 100 gsm fabric with anti-fungal properties for added hygiene.",

    ],
    images: [
      "/images/bike/u-impress1.png",
      "/images/bike/u-impress1.png",
      "/images/bike/u-impress1.png",
      "/images/bike/u-impress1.png",

    ],
    categoryId: "u-impressb",
    additionalInfo: [
      "In The Package: One Set of U-Impress PU/PVC Leather Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  //u-impress - ends---------------------------------------------

  //u-sportz starts------------------------------------------------
  {
    id: "1sbi",
    name: "U-Sportz - Black Colour With Embossing In Dual Tone Stitching ",
    price: 395,
    description: [
      "Premium Material: Automotive-grade PU/PVC with a thickness of 0.90mm to 0.95mm for superior durability.",
      "Perfect Fit: Designed to ensure wrinkle-free fitment for a seamless look.",
      "High Strength & Comfort: Features high tear strength and high-density pure foam for unmatched comfort.",
      "Safe & Eco-Friendly: Contains no hazardous materials or chemical odors.",
      "Weather-Resistant: UV-resistant thread and water-resistant properties for durability in any condition.",
      "Easy Maintenance: Simple to clean, even during rainy seasons.",
      "Enhanced Features: Backed by 100 gsm fabric with anti-fungal properties for added hygiene.",

    ],
    images: [
      "/images/bike/u-sportz1.png",
      "/images/bike/u-sportz1.png",
      "/images/bike/u-sportz1.png",
      "/images/bike/u-sportz1.png",


    ],
    categoryId: "u-sportzb",
    additionalInfo: [
      "In The Package: One Set of U-Impress PU/PVC Leather Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "2sbi",
    name: "U-Sportz - Dual Seat Black Colour With Embossing In Dual Tone Stitching ",
    price: 470,
    description: [
      "Premium Material: Automotive-grade PU/PVC with a thickness of 0.90mm to 0.95mm for superior durability.",
      "Perfect Fit: Designed to ensure wrinkle-free fitment for a seamless look.",
      "High Strength & Comfort: Features high tear strength and high-density pure foam for unmatched comfort.",
      "Safe & Eco-Friendly: Contains no hazardous materials or chemical odors.",
      "Weather-Resistant: UV-resistant thread and water-resistant properties for durability in any condition.",
      "Easy Maintenance: Simple to clean, even during rainy seasons.",
      "Enhanced Features: Backed by 100 gsm fabric with anti-fungal properties for added hygiene.",

    ],
    images: [
      "/images/bike/u-sportz2.png",
      "/images/bike/u-sportz2.png",
      "/images/bike/u-sportz2.png",
      "/images/bike/u-sportz2.png",

    ],
    categoryId: "u-sportzb",
    additionalInfo: [
      "In The Package: One Set of U-Impress PU/PVC Leather Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  //u-sportz ends------------------------------------------------

  //products for the u-active starts-------------------------

  {
    id: "1act",
    name: "U-Active - Black Colour With Red Stripe With 3mm High Density Foam and Single Tone Embossing",
    price: 560,
    description: [
      "Premium Material: Automotive-grade PU/PVC with a thickness of 0.90mm to 0.95mm for superior durability.",
      "Perfect Fit: Designed to ensure wrinkle-free fitment for a seamless look.",
      "High Strength & Comfort: Features high tear strength and high-density pure foam for unmatched comfort.",
      "Safe & Eco-Friendly: Contains no hazardous materials or chemical odors.",
      "Weather-Resistant: UV-resistant thread and water-resistant properties for durability in any condition.",
      "Easy Maintenance: Simple to clean, even during rainy seasons.",
      "Enhanced Features: Backed by 100 gsm fabric with anti-fungal properties for added hygiene.",

    ],
    images: [
      "/images/bike/u-active1.png",
      "/images/bike/u-active1.png",
      "/images/bike/u-active1.png",
      "/images/bike/u-active1.png",

    ],
    categoryId: "u-activeb",
    additionalInfo: [
      "In The Package: One Set of U-Impress PU/PVC Leather Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  {
    id: "2act",
    name: "U-Active - Black Colour With Blue Stripe With 3mm High Density Foam and Single Tone Embossing",
    price: 560,
    description: [
      "Premium Material: Automotive-grade PU/PVC with a thickness of 0.90mm to 0.95mm for superior durability.",
      "Perfect Fit: Designed to ensure wrinkle-free fitment for a seamless look.",
      "High Strength & Comfort: Features high tear strength and high-density pure foam for unmatched comfort.",
      "Safe & Eco-Friendly: Contains no hazardous materials or chemical odors.",
      "Weather-Resistant: UV-resistant thread and water-resistant properties for durability in any condition.",
      "Easy Maintenance: Simple to clean, even during rainy seasons.",
      "Enhanced Features: Backed by 100 gsm fabric with anti-fungal properties for added hygiene.",

    ],
    images: [
      "/images/bike/u-active2.png",
      "/images/bike/u-active2.png",
      "/images/bike/u-active2.png",
      "/images/bike/u-active2.png",


    ],
    categoryId: "u-activeb",
    additionalInfo: [
      "In The Package: One Set of U-Impress PU/PVC Leather Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  //products for the u-active ends-------------------------

  //products for the u-active plus starts------------------------------

  {
    id: "1actp",
    name: "U-Active Plus - Black Colour With White Stripe With 6mm High Density Foam and Dual Tone Embossing",
    price: 660,
    description: [
      "Premium Material: Automotive-grade PU/PVC with a thickness of 0.90mm to 0.95mm for superior durability.",
      "Perfect Fit: Designed to ensure wrinkle-free fitment for a seamless look.",
      "High Strength & Comfort: Features high tear strength and high-density pure foam for unmatched comfort.",
      "Safe & Eco-Friendly: Contains no hazardous materials or chemical odors.",
      "Weather-Resistant: UV-resistant thread and water-resistant properties for durability in any condition.",
      "Easy Maintenance: Simple to clean, even during rainy seasons.",
      "Enhanced Features: Backed by 100 gsm fabric with anti-fungal properties for added hygiene.",

    ],
    images: [
      "/images/bike/u-active-plus1-white.png",
      "/images/bike/u-active-plus1-white.png",
      "/images/bike/u-active-plus1-white.png",
      "/images/bike/u-active-plus1-white.png",

    ],
    categoryId: "u-activeplusb",
    additionalInfo: [
      "In The Package: One Set of U-Impress PU/PVC Leather Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  {
    id: "2actp",
    name: "U-Active Plus- Black Colour With Blue Stripe With 6mm High Density Foam and Dual Tone Embossing",
    price: 660,
    description: [
      "Premium Material: Automotive-grade PU/PVC with a thickness of 0.90mm to 0.95mm for superior durability.",
      "Perfect Fit: Designed to ensure wrinkle-free fitment for a seamless look.",
      "High Strength & Comfort: Features high tear strength and high-density pure foam for unmatched comfort.",
      "Safe & Eco-Friendly: Contains no hazardous materials or chemical odors.",
      "Weather-Resistant: UV-resistant thread and water-resistant properties for durability in any condition.",
      "Easy Maintenance: Simple to clean, even during rainy seasons.",
      "Enhanced Features: Backed by 100 gsm fabric with anti-fungal properties for added hygiene.",

    ],
    images: [
      "/images/bike/u-active-plus-blue.png",
      "/images/bike/u-active2.png",
      "/images/bike/u-active2.png",
      "/images/bike/u-active2.png",


    ],
    categoryId: "u-activeplusb",
    additionalInfo: [
      "In The Package: One Set of U-Impress PU/PVC Leather Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  {
    id: "3actp",
    name: "U-Active Plus- Black Colour With Red Stripe With 6mm High Density Foam and Dual Tone Embossing",
    price: 660,
    description: [
      "Premium Material: Automotive-grade PU/PVC with a thickness of 0.90mm to 0.95mm for superior durability.",
      "Perfect Fit: Designed to ensure wrinkle-free fitment for a seamless look.",
      "High Strength & Comfort: Features high tear strength and high-density pure foam for unmatched comfort.",
      "Safe & Eco-Friendly: Contains no hazardous materials or chemical odors.",
      "Weather-Resistant: UV-resistant thread and water-resistant properties for durability in any condition.",
      "Easy Maintenance: Simple to clean, even during rainy seasons.",
      "Enhanced Features: Backed by 100 gsm fabric with anti-fungal properties for added hygiene.",

    ],
    images: [
      "/images/bike/u-active-plus-red.png",
      "/images/bike/u-active-plus-red.png",
      "/images/bike/u-active-plus-red.png",
      "/images/bike/u-active-plus-red.png",


    ],
    categoryId: "u-activeplusb",
    additionalInfo: [
      "In The Package: One Set of U-Impress PU/PVC Leather Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  {
    id: "4actp",
    name: "U-Active Plus - Dual Seat With 6mm High Density Foam and Dual Tone Embossing",
    price: 775,
    description: [
      "Premium Material: Automotive-grade PU/PVC with a thickness of 0.90mm to 0.95mm for superior durability.",
      "Perfect Fit: Designed to ensure wrinkle-free fitment for a seamless look.",
      "High Strength & Comfort: Features high tear strength and high-density pure foam for unmatched comfort.",
      "Safe & Eco-Friendly: Contains no hazardous materials or chemical odors.",
      "Weather-Resistant: UV-resistant thread and water-resistant properties for durability in any condition.",
      "Easy Maintenance: Simple to clean, even during rainy seasons.",
      "Enhanced Features: Backed by 100 gsm fabric with anti-fungal properties for added hygiene.",

    ],
    images: [
      "/images/bike/u-active-plus-dual.png",
      "/images/bike/u-active-plus-dual.png",
      "/images/bike/u-active-plus-dual.png",
      "/images/bike/u-active-plus-dual.png",


    ],
    categoryId: "u-activeplusb",
    additionalInfo: [
      "In The Package: One Set of U-Impress PU/PVC Leather Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },


  //products for the u-active plus ends------------------------------


  // products for the bike end------------------------------


  // products for the Scooty starts--------------------------------------------------
  // products for the u-impress scooty starts------------------------------


  //products for the u-impress scooty ends-----------------------------

  {
    id: "1sc",
    name: "U-Impress - Black Color With Dual Tone Stitching",
    price: 395,
    description: [
      "Premium Material: Automotive-grade PU/PVC with a thickness of 0.90mm to 0.95mm for superior durability.",
      "Perfect Fit: Designed to ensure wrinkle-free fitment for a seamless look.",
      "High Strength & Comfort: Features high tear strength and high-density pure foam for unmatched comfort.",
      "Safe & Eco-Friendly: Contains no hazardous materials or chemical odors.",
      "Weather-Resistant: UV-resistant thread and water-resistant properties for durability in any condition.",
      "Easy Maintenance: Simple to clean, even during rainy seasons.",
      "Enhanced Features: Backed by 100 gsm fabric with anti-fungal properties for added hygiene.",

    ],
    images: [
      "/images/Scooty/u-impressScooty.png",
      "/images/Scooty/u-impressScooty.png",
      "/images/Scooty/u-impressScooty.png",
      "/images/Scooty/u-impressScooty.png",


    ],
    categoryId: "u-impresss",
    additionalInfo: [
      "In The Package: One Set of U-Impress PU/PVC Leather Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  // u-sportz scooty starts----------------------------------------------------

  {
    id: "1spc",
    name: "U-Sportz - Black Color With Embossing in Dual Tone Stitching",
    price: 435,
    description: [
      "Premium Material: Automotive-grade PU/PVC with a thickness of 0.90mm to 0.95mm for superior durability.",
      "Perfect Fit: Designed to ensure wrinkle-free fitment for a seamless look.",
      "High Strength & Comfort: Features high tear strength and high-density pure foam for unmatched comfort.",
      "Safe & Eco-Friendly: Contains no hazardous materials or chemical odors.",
      "Weather-Resistant: UV-resistant thread and water-resistant properties for durability in any condition.",
      "Easy Maintenance: Simple to clean, even during rainy seasons.",
      "Enhanced Features: Backed by 100 gsm fabric with anti-fungal properties for added hygiene.",

    ],
    images: [
      "/images/Scooty/u-sportzScooty.png",
      "/images/Scooty/u-sportzScooty.png",
      "/images/Scooty/u-sportzScooty.png",
      "/images/Scooty/u-sportzScooty.png",


    ],
    categoryId: "u-sportzs",
    additionalInfo: [
      "In The Package: One Set of U-Impress PU/PVC Leather Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  // u-sportz scooty ends------------------------------------------------------

  // u-active scooty starts-----------------------
  {
    id: "1acts",
    name: "U-Active - Black Colour With Red Stripe With 3mm High Density Foam and Single Tone Embossing",
    price: 660,
    description: [
      "Premium Material: Automotive-grade PU/PVC with a thickness of 0.90mm to 0.95mm for superior durability.",
      "Perfect Fit: Designed to ensure wrinkle-free fitment for a seamless look.",
      "High Strength & Comfort: Features high tear strength and high-density pure foam for unmatched comfort.",
      "Safe & Eco-Friendly: Contains no hazardous materials or chemical odors.",
      "Weather-Resistant: UV-resistant thread and water-resistant properties for durability in any condition.",
      "Easy Maintenance: Simple to clean, even during rainy seasons.",
      "Enhanced Features: Backed by 100 gsm fabric with anti-fungal properties for added hygiene.",

    ],
    images: [
      "/images/Scooty/u-activeScooty.png",
      "/images/Scooty/u-activeScooty.png",
      "/images/Scooty/u-activeScooty.png",
      "/images/Scooty/u-activeScooty.png",

    ],
    categoryId: "u-actives",
    additionalInfo: [
      "In The Package: One Set of U-Impress PU/PVC Leather Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  {
    id: "2acts",
    name: "U-Active - Black Colour With Blue Stripe With 3mm High Density Foam and Single Tone Embossing",
    price: 660,
    description: [
      "Premium Material: Automotive-grade PU/PVC with a thickness of 0.90mm to 0.95mm for superior durability.",
      "Perfect Fit: Designed to ensure wrinkle-free fitment for a seamless look.",
      "High Strength & Comfort: Features high tear strength and high-density pure foam for unmatched comfort.",
      "Safe & Eco-Friendly: Contains no hazardous materials or chemical odors.",
      "Weather-Resistant: UV-resistant thread and water-resistant properties for durability in any condition.",
      "Easy Maintenance: Simple to clean, even during rainy seasons.",
      "Enhanced Features: Backed by 100 gsm fabric with anti-fungal properties for added hygiene.",

    ],
    images: [
      "/images/Scooty/u-activeScootyBluew.png",
      "/images/Scooty/u-activeScootyBluew.png",
      "/images/Scooty/u-activeScootyBluew.png",
      "/images/Scooty/u-activeScootyBluew.png",


    ],
    categoryId: "u-actives",
    additionalInfo: [
      "In The Package: One Set of U-Impress PU/PVC Leather Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  // u-active scooty ends---------------------------

  //u-active-plus-scooty starts-------------------------------------------


  {
    id: "1actpsc",
    name: "U-Active Plus - Black Colour With White Stripe With 6mm High Density Foam and Dual Tone Embossing",
    price: 765,
    description: [
      "Premium Material: Automotive-grade PU/PVC with a thickness of 0.90mm to 0.95mm for superior durability.",
      "Perfect Fit: Designed to ensure wrinkle-free fitment for a seamless look.",
      "High Strength & Comfort: Features high tear strength and high-density pure foam for unmatched comfort.",
      "Safe & Eco-Friendly: Contains no hazardous materials or chemical odors.",
      "Weather-Resistant: UV-resistant thread and water-resistant properties for durability in any condition.",
      "Easy Maintenance: Simple to clean, even during rainy seasons.",
      "Enhanced Features: Backed by 100 gsm fabric with anti-fungal properties for added hygiene.",

    ],
    images: [
      "/images/Scooty/u-active-plus-white.png",
      "/images/Scooty/u-active-plus-white.png",
      "/images/Scooty/u-active-plus-white.png",
      "/images/Scooty/u-active-plus-white.png",

    ],
    categoryId: "u-activeplusc",
    additionalInfo: [
      "In The Package: One Set of U-Impress PU/PVC Leather Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  {
    id: "2actpsc",
    name: "U-Active Plus- Black Colour With Blue Stripe With 6mm High Density Foam and Dual Tone Embossing",
    price: 765,
    description: [
      "Premium Material: Automotive-grade PU/PVC with a thickness of 0.90mm to 0.95mm for superior durability.",
      "Perfect Fit: Designed to ensure wrinkle-free fitment for a seamless look.",
      "High Strength & Comfort: Features high tear strength and high-density pure foam for unmatched comfort.",
      "Safe & Eco-Friendly: Contains no hazardous materials or chemical odors.",
      "Weather-Resistant: UV-resistant thread and water-resistant properties for durability in any condition.",
      "Easy Maintenance: Simple to clean, even during rainy seasons.",
      "Enhanced Features: Backed by 100 gsm fabric with anti-fungal properties for added hygiene.",

    ],
    images: [
      "/images/Scooty/u-active-plus-blue.png",
      "/images/Scooty/u-active-plus-blue.png",
      "/images/Scooty/u-active-plus-blue.png",
      "/images/Scooty/u-active-plus-blue.png",


    ],
    categoryId: "u-activeplusc",
    additionalInfo: [
      "In The Package: One Set of U-Impress PU/PVC Leather Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  {
    id: "3actpssc",
    name: "U-Active Plus- Black Colour With Red Stripe With 6mm High Density Foam and Dual Tone Embossing",
    price: 765,
    description: [
      "Premium Material: Automotive-grade PU/PVC with a thickness of 0.90mm to 0.95mm for superior durability.",
      "Perfect Fit: Designed to ensure wrinkle-free fitment for a seamless look.",
      "High Strength & Comfort: Features high tear strength and high-density pure foam for unmatched comfort.",
      "Safe & Eco-Friendly: Contains no hazardous materials or chemical odors.",
      "Weather-Resistant: UV-resistant thread and water-resistant properties for durability in any condition.",
      "Easy Maintenance: Simple to clean, even during rainy seasons.",
      "Enhanced Features: Backed by 100 gsm fabric with anti-fungal properties for added hygiene.",

    ],
    images: [
      "/images/Scooty/u-active-plus-red.png",
      "/images/Scooty/u-active-plus-red.png",
      "/images/Scooty/u-active-plus-red.png",
      "/images/Scooty/u-active-plus-red.png",


    ],
    categoryId: "u-activeplusc",
    additionalInfo: [
      "In The Package: One Set of U-Impress PU/PVC Leather Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ. Subject to availability of the fabric(s). You can also reach us at +91 9278411411. ",
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },


  //u-active-plus-scooty ends---------------------------------------------
  // products for the Scooty ends--------------------------------------------------

  //products for the bullet Category of the 2 wheeler ends here-------------------------------------


  // products for the riviera series-------------------------
  {
    id: "1r",
    name: "D3 Artificial Leather Seat Covers",
    price: {
      twoRow: 11999,
      threeRow: 14999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/D3%20Nutmeg.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/D3%20Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/D3%20H%20Brown.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/D3%20Black.jpg"
    ],
    categoryId: "riviera",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of D3 Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and avoids hassle",
      "A professional will have the right tools and experience to install it quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  {
    id: "2r",
    name: "D5 Artificial Leather Seat Covers",
    price: {
      twoRow: 11999,
      threeRow: 14999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/D5%20Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/D5%20Nutmeg.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/D5%20Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/D5%20Black.jpg"
    ],
    categoryId: "riviera",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of D5 Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  {
    id: "3r",
    name: "Q2 Artificial Leather Seat Covers",
    price: {
      twoRow: 11999,
      threeRow: 14999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Comes in a complete set with front seat cover, rear seat cover, and headrest (if applicable)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Q2%20Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Q2%20Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Q2%20Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Q2%20Silver.jpg"
    ],
    categoryId: "riviera",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of Q2 Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product. Color may slightly differ depending on fabric availability",
      "Contact: +91 9278411411 for any queries",
      "Disclaimer: All seat covers are tailor-made as per order. Only replacement possible — no refunds",
      "Automotive Seat Cover Installation: Not included. Please get it installed by a professional for best results"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  {
    id: "4r",
    name: "H Cross Artificial Leather Seat Covers",
    price: {
      twoRow: 11999,
      threeRow: 14999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/H%20Cross%20Black.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/H%20Cross%20Nutmeg.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/H%20Cross%20Silver.jpg"
    ],
    categoryId: "riviera",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of H Cross Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  {
    id: "5r",
    name: "U Focus Artificial Leather Seat Covers",
    price: {
      twoRow: 11999,
      threeRow: 14999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Focus%20Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Focus%20Black.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Focus%20Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Focus%20Nutmeg.jpg"
    ],
    categoryId: "riviera",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of U Focus Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  {
    id: "6r",
    name: "U Highway Artificial Leather Seat Covers",
    price: {
      twoRow: 11999,
      threeRow: 14999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Highway%20Nutmeg.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Highway%20Black.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Highway%20Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Highway%20Silver.jpg"
    ],
    categoryId: "riviera",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of U Highway Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  {
    id: "7r",
    name: "U-Arrow Artificial Leather Car Seat Covers",
    price: {
      twoRow: 11999,
      threeRow: 14999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Arrow%20Red%20(1).jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Arrow%20Red%20(1).jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Arrow%20Red%20(1).jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Arrow%20Red%20(1).jpg"
    ],
    categoryId: "riviera",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of U-Arrow Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  {
    id: "8r",
    name: "Amaze Plus Artificial Leather Seat Covers",
    price: {
      twoRow: 11999,
      threeRow: 14999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Amazeplus%20%20Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Amazeplus%20%20Nutmeg.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Amazeplus%20%20Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Amazeplus%20%20Black.jpg"
    ],
    categoryId: "riviera",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of Amaze Plus Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  {
    id: "9r",
    name: "Amaze Duo Plus Artificial Leather Seat Covers",
    price: {
      twoRow: 11999,
      threeRow: 14999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Amaze%20Duo%20Plus%20Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Amaze%20Duo%20Plus%20Nutmeg.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Amaze%20Duo%20Plus%20Black%20(1).jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Amaze%20Duo%20Plus%20Tan.jpg"
    ],
    categoryId: "riviera",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of Amaze Duo Plus Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  {
    id: "10r",
    name: "E1 Artificial Leather Seat Covers",
    price: {
      twoRow: 11999,
      threeRow: 14999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E1 Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E1%20Black.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E1 Nutmeg.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E1%20Tan.png"
    ],
    categoryId: "riviera",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of E1 Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  {
    id: "11r",
    name: "E2 Artificial Leather Seat Covers",
    price: {
      twoRow: 11999,
      threeRow: 14999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E2 Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E2 Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E2 Black.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E2 Nutmeg.jpg"
    ],
    categoryId: "riviera",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of E2 Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  {
    id: "12r",
    name: "E4 Artificial Leather Seat Covers",
    price: {
      twoRow: 11999,
      threeRow: 14999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E4 Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E4 Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E4 Black.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E4%20Brown.jpg"
    ],
    categoryId: "riviera",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of E4 Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  {
    id: "13r",
    name: "E5 Artificial Leather Seat Covers",
    price: {
      twoRow: 11999,
      threeRow: 14999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E5 Nutmeg.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E5 Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E5 Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E5 Black.jpg"
    ],
    categoryId: "riviera",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of E5 Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  }
  ,
  // product for the Riviera series ends---------------------------------
















  // product for the  lucenzo---------starts-------------------

  {
    id: "1l",
    name: "D3 Artificial Leather Seat Covers",
    price: {
      twoRow: 11999,
      threeRow: 14999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/D3%20Nutmeg.jpg",
      // "https://autoform-image.s3.ap-south-1.amazonaws.com/products/D3%20Red.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/D3%20Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/D3%20H%20Brown.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/D3%20Black.jpg"
    ],
    categoryId: "lucenzo",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of D3 Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and avoids hassle",
      "A professional will have the right tools and experience to install it quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "2l",
    name: "D5 Artificial Leather Seat Covers",
    price: {
      twoRow: 11999,
      threeRow: 14999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/D5%20Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/D5%20Nutmeg.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/D5%20Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/D5%20Black.jpg"
    ],
    categoryId: "lucenzo",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of D5 Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "3l",
    name: "Q2 Artificial Leather Seat Covers",
    price: {
      twoRow: 11999,
      threeRow: 14999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Comes in a complete set with front seat cover, rear seat cover, and headrest (if applicable)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Q2%20Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Q2%20Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Q2%20Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Q2%20Silver.jpg"
    ],
    categoryId: "lucenzo",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of Q2 Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product. Color may slightly differ depending on fabric availability",
      "Contact: +91 9278411411 for any queries",
      "Disclaimer: All seat covers are tailor-made as per order. Only replacement possible — no refunds",
      "Automotive Seat Cover Installation: Not included. Please get it installed by a professional for best results"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "4l",
    name: "H Cross Artificial Leather Seat Covers",
    price: {
      twoRow: 11999,
      threeRow: 14999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/H%20Cross%20Black.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/H%20Cross%20Nutmeg.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/H%20Cross%20Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Focus%20Brown.jpg"
    ],
    categoryId: "lucenzo",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of H Cross Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "5l",
    name: "U Focus Artificial Leather Seat Covers",
    price: {
      twoRow: 11999,
      threeRow: 14999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Focus%20Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Focus%20Black.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Focus%20Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Focus%20Nutmeg.jpg"
    ],
    categoryId: "lucenzo",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of U Focus Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "6l",
    name: "U Highway Artificial Leather Seat Covers",
    price: {
      twoRow: 11999,
      threeRow: 14999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Highway%20Nutmeg.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Highway%20Black.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Highway%20Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Highway%20Silver.jpg"
    ],
    categoryId: "lucenzo",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of U Highway Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "7l",
    name: "U-Arrow Artificial Leather Car Seat Covers",
    price: {
      twoRow: 11999,
      threeRow: 14999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Arrow%20Red%20(1).jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Arrow%20Red%20(1).jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Arrow%20Red%20(1).jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Arrow%20Red%20(1).jpg"
    ],
    categoryId: "lucenzo",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of U-Arrow Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "8l",
    name: "Amaze Plus Artificial Leather Seat Covers",
    price: {
      twoRow: 11999,
      threeRow: 14999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Amazeplus%20%20Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Amazeplus%20%20Nutmeg.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Amazeplus%20%20Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Amazeplus%20%20Black.jpg"
    ],
    categoryId: "lucenzo",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of Amaze Plus Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "9l",
    name: "Amaze Duo Plus Artificial Leather Seat Covers",
    price: {
      twoRow: 11999,
      threeRow: 14999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Amaze%20Duo%20Plus%20Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Amaze%20Duo%20Plus%20Nutmeg.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Amaze%20Duo%20Plus%20Black%20(1).jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Amaze%20Duo%20Plus%20Tan.jpg"
    ],
    categoryId: "lucenzo",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of Amaze Duo Plus Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "10l",
    name: "E1 Artificial Leather Seat Covers",
    price: {
      twoRow: 11999,
      threeRow: 14999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E1 Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E1%20Black.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E1 Nutmeg.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E1%20Tan.png"
    ],
    categoryId: "lucenzo",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of E1 Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "11l",
    name: "E2 Artificial Leather Seat Covers",
    price: {
      twoRow: 11999,
      threeRow: 14999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E2 Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E2 Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E2 Black.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E2 Nutmeg.jpg"
    ],
    categoryId: "lucenzo",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of E2 Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "12l",
    name: "E4 Artificial Leather Seat Covers",
    price: {
      twoRow: 11999,
      threeRow: 14999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E4 Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E4 Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E4 Black.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E4%20Brown.jpg"
    ],
    categoryId: "lucenzo",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of E4 Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "13l",
    name: "E5 Artificial Leather Seat Covers",
    price: {
      twoRow: 11999,
      threeRow: 14999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E5 Nutmeg.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E5 Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E5 Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E5 Black.jpg"
    ],
    categoryId: "lucenzo",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of E5 Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },


  // product for the  lucenzo---------ends-------------------


  // products for the signature starts here-------------------------------------

  {
    id: "1s",
    name: "U-Ladder Artificial Leather Seat Covers",
    price: {
      twoRow: 18999,
      threeRow: 22999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable.",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Ladder%20Tan%20(1).jpg",
      // "https://autoform-image.s3.ap-south-1.amazonaws.com/products/D3%20Red.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Ladder%20Tan%20(1).jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Ladder%20Tan%20(1).jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Ladder%20Tan%20(1).jpg"
    ],
    categoryId: "signature",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of U-Ladder Custom PU Leather Car Seat Covers.",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and avoids hassle",
      "A professional will have the right tools and experience to install it quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "2s",
    name: "U-BLADE Artificial Leather Seat Covers",
    price: {
      twoRow: 18999,
      threeRow: 22999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable.",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "***Air-bag friendly seat covers",
      "U-Blade Car Seat Covers gives perfect 3D Bucket Fitting made to custom fit for specified Car Models. This seat cover comes in a complete set with a front seat cover, rear seat cover, and headrest (if applicable in the car). Made of fine quality automotive-grade PU Leather.",
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable. High-density foam padding for comfort and durability. Easy to clean and maintain - you can just wipe it with a wet cloth. Accurate size that fits perfectly on the original car seat. A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment.",
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Blade%20Silver%20(1).jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Blade%20Silver%20(1).jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Blade%20Silver%20(1).jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Blade%20Silver%20(1).jpg"
    ],
    categoryId: "signature",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of U Blade PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "3s",
    name: "U-Volt Artificial Leather Seat Covers",
    price: {
      twoRow: 18999,
      threeRow: 22999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "U-Volt Car Seat Covers gives perfect 3D Bucket Fitting made to custom fit for specified Car Models. This seat cover comes in a complete set with a front seat cover, rear seat cover, and headrest (if applicable in the car). Made of fine quality automotive-grade PU Leather.",
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable. High-density foam padding for comfort and durability. Easy to clean and maintain - you can just wipe it with a wet cloth. Accurate size that fits perfectly on the original car seat. A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment."
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Volt%20Tan%20(1).jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Volt%20Tan%20(1).jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Volt%20Tan%20(1).jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Volt%20Tan%20(1).jpg"
    ],
    categoryId: "signature",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of U Volt Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product. Color may slightly differ depending on fabric availability",
      "Contact: +91 9278411411 for any queries",
      "Disclaimer: All seat covers are tailor-made as per order. Only replacement possible — no refunds",
      "Automotive Seat Cover Installation: Not included. Please get it installed by a professional for best results"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "4s",
    name: "H-Grand Artificial Leather Car Seat Covers",
    price: {
      twoRow: 18999,
      threeRow: 22999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "H-Grand Car Seat Covers gives perfect 3D Bucket Fitting made to custom fit for specified Car Models. This seat cover comes in a complete set with a front seat cover, rear seat cover, and headrest (if applicable in the car). Made of fine quality automotive-grade PU Leather.",
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable. High-density foam padding for comfort and durability. Easy to clean and maintain - you can just wipe it with a wet cloth. Accurate size that fits perfectly on the original car seat. A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment.",

    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/H Grand Black.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/H Grand Nutmeg.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/H Grand Tan.jpg",
      // "https://autoform-image.s3.ap-south-1.amazonaws.com/products/H Grand Brown.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/H Grand Red.jpg"
    ],
    categoryId: "signature",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of H Grand Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "5s",
    name: "Navigation+ Artificial Leather Car Seat Covers",
    price: {
      twoRow: 18999,
      threeRow: 22999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Navigation+ Car Seat Covers gives perfect 3D Bucket Fitting made to custom fit for specified Car Models. This seat cover comes in a complete set with a front seat cover, rear seat cover, and headrest (if applicable in the car). Made of fine quality automotive-grade PU Leather.",
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable. High-density foam padding for comfort and durability. Easy to clean and maintain - you can just wipe it with a wet cloth. Accurate size that fits perfectly on the original car seat. A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment.",

    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U Navigation plus Red - Copy.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U Navigation plus Silver - Copy.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U Navigation plus Black - Copy.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U Navigationplus Brown - Copy.jpg  "
    ],
    categoryId: "signature",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: Navigation+ Artificial Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "6s",
    name: "XCLUSIVE Artificial Leather Seat Covers",
    price: {
      twoRow: 18999,
      threeRow: 22999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "XCLUSIVE Car Seat Cover gives perfect 3D Bucket Fitting made to custom fit for specified Car Models. This seat cover comes in a complete set with a front seat cover, rear seat cover, and headrest (if applicable in the car). Made of fine quality automotive-grade PU Leather.",
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable. High-density foam padding for comfort and durability. Easy to clean and maintain - you can just wipe it with a wet cloth. Accurate size that fits perfectly on the original car seat. A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment.",

    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/X Clusive Red.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/X Clusive Red.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/X Clusive Red.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/X Clusive Red.jpg"
    ],
    categoryId: "signature",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of XCLUSIVE Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "7s",
    name: "XCLUSIVE Plus Artificial Leather Seat Covers",
    price: {
      twoRow: 18999,
      threeRow: 22999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "XCLUSIVE + Car Seat Cover gives perfect 3D Bucket Fitting made to custom fit for specified Car Models. This seat cover comes in a complete set with a front seat cover, rear seat cover, and headrest (if applicable in the car). Made of fine quality automotive-grade PU Leather.",
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable. High-density foam padding for comfort and durability. Easy to clean and maintain - you can just wipe it with a wet cloth. Accurate size that fits perfectly on the original car seat. A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment.",
      // "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/X Clusiveplus Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/X Clusiveplus Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/X Clusiveplus Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/X Clusiveplus Tan.jpg"
    ],
    categoryId: "signature",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of XCLUSIVE Plus Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "8s",
    name: "U-Impress Artificial Leather Car Seat Covers",
    price: {
      twoRow: 18999,
      threeRow: 22999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      " U-Impress  Car Seat Covers gives perfect 3D Bucket Fitting made to custom fit for specified Car Models. This seat cover comes in a complete set with a front seat cover, rear seat cover, and headrest (if applicable in the car). Made of fine quality automotive-grade PU Leather.",
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable. High-density foam padding for comfort and durability. Easy to clean and maintain - you can just wipe it with a wet cloth. Accurate size that fits perfectly on the original car seat. A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      // "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Impress%20Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Impress%20Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Impress%20Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Impress%20Tan.jpg",
    ],
    categoryId: "signature",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of Amaze Plus Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "9s",
    name: "Polo Artificial Leather Seat Covers",
    price: {
      twoRow: 18999,
      threeRow: 22999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      " Polo Car Seat Covers gives perfect 3D Bucket Fitting made to custom fit for specified Car Models. This seat cover comes in a complete set with a front seat cover, rear seat cover, and headrest (if applicable in the car). Made of fine quality automotive-grade PU Leather.",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Amaze%20Duo%20Plus%20Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Amaze%20Duo%20Plus%20Nutmeg.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Amaze%20Duo%20Plus%20Black%20(1).jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Amaze%20Duo%20Plus%20Tan.jpg"
    ],
    categoryId: "signature",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of Amaze Duo Plus Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "10s",
    name: "X-Cross Artificial Leather Seat Covers",
    price: {
      twoRow: 18999,
      threeRow: 22999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      " Polo Car Seat Covers gives perfect 3D Bucket Fitting made to custom fit for specified Car Models. This seat cover comes in a complete set with a front seat cover, rear seat cover, and headrest (if applicable in the car). Made of fine quality automotive-grade PU Leather.-",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E1 Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E1%20Black.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E1 Nutmeg.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E1%20Tan.png"
    ],
    categoryId: "signature",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of E1 Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },


  // products for the signature end here-------------------------------------

  // products for the Emporio starts------------------------------------------

  {
    id: "1e",
    name: "D3 Artificial Leather Seat Covers",
    price: {
      twoRow: 21499,
      threeRow: 30999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/D3%20Nutmeg.jpg",
      // "https://autoform-image.s3.ap-south-1.amazonaws.com/products/D3%20Red.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/D3%20Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/D3%20H%20Brown.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/D3%20Black.jpg"
    ],
    categoryId: "emporio",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of D3 Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and avoids hassle",
      "A professional will have the right tools and experience to install it quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "2e",
    name: "D5 Artificial Leather Seat Covers",
    price: {
      twoRow: 21499,
      threeRow: 30999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/D5%20Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/D5%20Nutmeg.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/D5%20Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/D5%20Black.jpg"
    ],
    categoryId: "emporio",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of D5 Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  {
    id: "3e",
    name: "Q2 Artificial Leather Seat Covers",
    price: {
      twoRow: 21499,
      threeRow: 30999
    }, description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Comes in a complete set with front seat cover, rear seat cover, and headrest (if applicable)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Q2%20Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Q2%20Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Q2%20Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Q2%20Silver.jpg"
    ],
    categoryId: "emporio",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of Q2 Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product. Color may slightly differ depending on fabric availability",
      "Contact: +91 9278411411 for any queries",
      "Disclaimer: All seat covers are tailor-made as per order. Only replacement possible — no refunds",
      "Automotive Seat Cover Installation: Not included. Please get it installed by a professional for best results"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  {
    id: "4e",
    name: "H Cross Artificial Leather Seat Covers",
    price: {
      twoRow: 21499,
      threeRow: 30999
    }, description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/H%20Cross%20Black.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/H%20Cross%20Nutmeg.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/H%20Cross%20Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Focus%20Brown.jpg"
    ],
    categoryId: "emporio",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of H Cross Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  {
    id: "5e",
    name: "U Focus Artificial Leather Seat Covers",
    price: {
      twoRow: 21499,
      threeRow: 30999
    }, description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Focus%20Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Focus%20Black.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Focus%20Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Focus%20Nutmeg.jpg"
    ],
    categoryId: "emporio",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of U Focus Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  {
    id: "6e",
    name: "U Highway Artificial Leather Seat Covers",
    price: {
      twoRow: 21499,
      threeRow: 30999
    }, description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Highway%20Nutmeg.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Highway%20Black.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Highway%20Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Highway%20Silver.jpg"
    ],
    categoryId: "emporio",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of U Highway Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "7e",
    name: "U-Arrow Artificial Leather Car Seat Covers",
    price: {
      twoRow: 21499,
      threeRow: 30999
    }, description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Arrow%20Red%20(1).jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Arrow%20Red%20(1).jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Arrow%20Red%20(1).jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Arrow%20Red%20(1).jpg"
    ],
    categoryId: "emporio",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of U-Arrow Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  {
    id: "8e",
    name: "U-Ladder Artificial Leather Seat Covers",
    price: {
      twoRow: 21499,
      threeRow: 30999
    }, description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable.",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Perfect 3D Bucket Fitting made to custom fit for specified Car Models",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Ladder%20Tan%20(1).jpg",
      // "https://autoform-image.s3.ap-south-1.amazonaws.com/products/D3%20Red.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Ladder%20Tan%20(1).jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Ladder%20Tan%20(1).jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Ladder%20Tan%20(1).jpg"
    ],
    categoryId: "emporio",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of U-Ladder Custom PU Leather Car Seat Covers.",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and avoids hassle",
      "A professional will have the right tools and experience to install it quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  {
    id: "9e",
    name: "U-BLADE Artificial Leather Seat Covers",
    price: {
      twoRow: 21499,
      threeRow: 30999
    }, description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable.",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "***Air-bag friendly seat covers",
      "U-Blade Car Seat Covers gives perfect 3D Bucket Fitting made to custom fit for specified Car Models. This seat cover comes in a complete set with a front seat cover, rear seat cover, and headrest (if applicable in the car). Made of fine quality automotive-grade PU Leather.",
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable. High-density foam padding for comfort and durability. Easy to clean and maintain - you can just wipe it with a wet cloth. Accurate size that fits perfectly on the original car seat. A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment.",
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Blade%20Silver%20(1).jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Blade%20Silver%20(1).jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Blade%20Silver%20(1).jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Blade%20Silver%20(1).jpg"
    ],
    categoryId: "emporio",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of U Blade PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "10e",
    name: "U-Volt Artificial Leather Seat Covers",
    price: {
      twoRow: 21499,
      threeRow: 30999
    }, description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "U-Volt Car Seat Covers gives perfect 3D Bucket Fitting made to custom fit for specified Car Models. This seat cover comes in a complete set with a front seat cover, rear seat cover, and headrest (if applicable in the car). Made of fine quality automotive-grade PU Leather.",
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable. High-density foam padding for comfort and durability. Easy to clean and maintain - you can just wipe it with a wet cloth. Accurate size that fits perfectly on the original car seat. A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment."
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Volt%20Tan%20(1).jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Volt%20Tan%20(1).jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Volt%20Tan%20(1).jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Volt%20Tan%20(1).jpg"
    ],
    categoryId: "emporio",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of U Volt Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product. Color may slightly differ depending on fabric availability",
      "Contact: +91 9278411411 for any queries",
      "Disclaimer: All seat covers are tailor-made as per order. Only replacement possible — no refunds",
      "Automotive Seat Cover Installation: Not included. Please get it installed by a professional for best results"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "11e",
    name: "H-Grand Artificial Leather Car Seat Covers",
    price: {
      twoRow: 21499,
      threeRow: 30999
    }, description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "H-Grand Car Seat Covers gives perfect 3D Bucket Fitting made to custom fit for specified Car Models. This seat cover comes in a complete set with a front seat cover, rear seat cover, and headrest (if applicable in the car). Made of fine quality automotive-grade PU Leather.",
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable. High-density foam padding for comfort and durability. Easy to clean and maintain - you can just wipe it with a wet cloth. Accurate size that fits perfectly on the original car seat. A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment.",

    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/H Grand Black.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/H Grand Nutmeg.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/H Grand Tan.jpg",
      // "https://autoform-image.s3.ap-south-1.amazonaws.com/products/H Grand Brown.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/H Grand Red.jpg"
    ],
    categoryId: "emporio",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of H Grand Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "12e",
    name: "Navigation+ Artificial Leather Car Seat Covers",
    price: {
      twoRow: 21499,
      threeRow: 30999
    }, description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "Navigation+ Car Seat Covers gives perfect 3D Bucket Fitting made to custom fit for specified Car Models. This seat cover comes in a complete set with a front seat cover, rear seat cover, and headrest (if applicable in the car). Made of fine quality automotive-grade PU Leather.",
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable. High-density foam padding for comfort and durability. Easy to clean and maintain - you can just wipe it with a wet cloth. Accurate size that fits perfectly on the original car seat. A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment.",

    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U Navigation plus Red - Copy.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U Navigation plus Silver - Copy.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U Navigation plus Black - Copy.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U Navigationplus Brown - Copy.jpg  "
    ],
    categoryId: "emporio",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: Navigation+ Artificial Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  {
    id: "13e",
    name: "X-Cross Artificial Leather Seat Covers",
    price: {
      twoRow: 21499,
      threeRow: 30999
    }, description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      " Polo Car Seat Covers gives perfect 3D Bucket Fitting made to custom fit for specified Car Models. This seat cover comes in a complete set with a front seat cover, rear seat cover, and headrest (if applicable in the car). Made of fine quality automotive-grade PU Leather.-",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E1 Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E1%20Black.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E1 Nutmeg.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/E1%20Tan.png"
    ],
    categoryId: "emporio",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of E1 Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "14e",
    name: "Polo Artificial Leather Seat Covers",
    price: {
      twoRow: 21499,
      threeRow: 30999
    }, description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      " Polo Car Seat Covers gives perfect 3D Bucket Fitting made to custom fit for specified Car Models. This seat cover comes in a complete set with a front seat cover, rear seat cover, and headrest (if applicable in the car). Made of fine quality automotive-grade PU Leather.",
      "Complete set with front seat cover, rear seat cover, and headrest (if applicable in the car)",
      "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Amaze%20Duo%20Plus%20Silver.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Amaze%20Duo%20Plus%20Nutmeg.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Amaze%20Duo%20Plus%20Black%20(1).jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Amaze%20Duo%20Plus%20Tan.jpg"
    ],
    categoryId: "emporio",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of Amaze Duo Plus Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

  {
    id: "15e",
    name: "XCLUSIVE Artificial Leather Seat Covers",
    price: {
      twoRow: 21499,
      threeRow: 30999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "XCLUSIVE Car Seat Cover gives perfect 3D Bucket Fitting made to custom fit for specified Car Models. This seat cover comes in a complete set with a front seat cover, rear seat cover, and headrest (if applicable in the car). Made of fine quality automotive-grade PU Leather.",
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable. High-density foam padding for comfort and durability. Easy to clean and maintain - you can just wipe it with a wet cloth. Accurate size that fits perfectly on the original car seat. A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment.",

    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/X Clusive Red.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/X Clusive Red.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/X Clusive Red.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/X Clusive Red.jpg"
    ],
    categoryId: "emporio",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of XCLUSIVE Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "16e",
    name: "XCLUSIVE Plus Artificial Leather Seat Covers",
    price: {
      twoRow: 21499,
      threeRow: 30999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      "XCLUSIVE + Car Seat Cover gives perfect 3D Bucket Fitting made to custom fit for specified Car Models. This seat cover comes in a complete set with a front seat cover, rear seat cover, and headrest (if applicable in the car). Made of fine quality automotive-grade PU Leather.",
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable. High-density foam padding for comfort and durability. Easy to clean and maintain - you can just wipe it with a wet cloth. Accurate size that fits perfectly on the original car seat. A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment.",
      // "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/X Clusiveplus Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/X Clusiveplus Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/X Clusiveplus Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/X Clusiveplus Tan.jpg"
    ],
    categoryId: "emporio",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of XCLUSIVE Plus Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },
  {
    id: "17e",
    name: "U-Impress Artificial Leather Car Seat Covers",
    price: {
      twoRow: 21499,
      threeRow: 30999
    },
    description: [
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable",
      "High-density foam padding for comfort and durability",
      "Easy to clean and maintain - you can wipe it with a wet cloth",
      "Accurate size that fits perfectly on the original car seat",
      "A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      "Air-bag friendly seat covers",
      " U-Impress  Car Seat Covers gives perfect 3D Bucket Fitting made to custom fit for specified Car Models. This seat cover comes in a complete set with a front seat cover, rear seat cover, and headrest (if applicable in the car). Made of fine quality automotive-grade PU Leather.",
      "PU leather with a protective coating that is soft to the touch, water resistant, and durable. High-density foam padding for comfort and durability. Easy to clean and maintain - you can just wipe it with a wet cloth. Accurate size that fits perfectly on the original car seat. A fitment process that involves the use of multiple tape wires that are manually tied to the seat for bucket (original) fitment",
      // "Made of fine quality automotive-grade PU Leather"
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Impress%20Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Impress%20Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Impress%20Tan.jpg",
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/U%20Impress%20Tan.jpgg"
    ],
    categoryId: "emporio",
    additionalInfo: [
      "Warranty: 1-year standard and 1-year extended warranty via online Manufacturing Defect Warranty",
      "In The Package: One Set of Amaze Plus Custom PU Leather Car Seat Covers",
      "Note: The images represent the actual product though color of the image and product may slightly differ",
      "Subject to availability of the fabric(s)",
      "Contact: You can reach us at +91 9278411411",
      "Disclaimer: All seat covers are tailor-made as per order",
      "If there is any fitment issue, the same will be taken care of by the team",
      "Only replacement is possible and no refunds will be entertained for these seat covers",
      "Automotive Seat Cover Installation - Not Included",
      "We do not provide seat cover installation but recommend getting it installed by a professional",
      "Professional installation saves time and frees you from the hassle of interpreting unclear installation instructions",
      "A professional will have the right tools and experience to do the installation quickly, correctly, and safely the first time"
    ],
    inStock: true,
    rating: 4.8,
    reviews: reviews["1"]
  },

















  // products for the Emporio ends------------------------------------------


  {
    id: "3",
    name: "3D Premium Car Mat",
    price: 149.99,
    description: "Custom-fit 3D car mat with superior protection. These mats are designed with raised edges to contain spills and debris, keeping your vehicle's interior clean. The precise fit ensures complete floor coverage and protection.",
    images: [
      "https://images.unsplash.com/photo-1606028638131-29913d642c04?q=80&w=1972&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1597007466934-2cf33ac13db9?q=80&w=1974&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1603811478698-7e15b7d724b9?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1618333258404-f509733839c4?q=80&w=1780&auto=format&fit=crop"
    ],
    categoryId: "3d-mat",
    additionalInfo: "Waterproof. Anti-slip bottom. Heavy-duty material for maximum durability. Easy to clean with water and mild soap.",
    inStock: true,
    rating: 4.9,
    reviews: reviews["3"]
  },



  {
    id: "android-e90",
    name: "Ultima Smart Multimedia Screen - Model E90",
    price: 26999,
    description: [
      "9-inch QLED HD touchscreen (1280 x 720 resolution) with 2.5D glass for a premium viewing experience.",
      "Powered by Android 14 with a quad-core processor for smooth and responsive performance.",
      "Memory: 2GB RAM and 64GB ROM for ample app and media storage.",
      "Audio Output: 50W x 4 (Max Power Rated: 200W) with 5.1 channel out and 16-band equalizer.",
      "Bluetooth 4.0 with support for AHD rear camera, external mic, and steering wheel controls.",
      "Supports Android Auto, Apple CarPlay, Mirror Link, and Split Screen functionality.",
      "Integrated GPS navigation with real-time routing and traffic updates.",
      "Manual control buttons optimized for right-hand drive vehicles.",
      "USB and AUX inputs for flexible media connectivity.",
      "Cooling fan technology activates based on temperature and volume level for system longevity.",
      "Rear-view camera input for parking assistance and safety."
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Android-2.jpg",
    ],
    categoryId: "android",
    additionalInfo: [
      "In The Package: 1 x Ultima Smart Multimedia Screen (Model E90), Wiring Kit, Mounting Frame, and User Manual.",
      "External Mic Support",
      "Made in India , Made For india, Right Hand Side Controlls",
      "Powered By 4 Core Processor",
      "Note: Product images are for reference only. Actual product specifications may vary slightly.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 4.5,
    reviews: reviews["1"]
  }
  ,
  {
    id: "android-e990",
    name: "Ultima Smart Multimedia Screen - Model E990",
    price: 45999,
    description: [
      "9-inch QLED touchscreen with 1280 x 720 high-definition resolution and 2.5D glass display.",
      "Runs on Android 14 OS, powered by a quad-core processor for ultra-smooth performance.",
      "4GB RAM and 64GB ROM ensure high-speed operation and generous storage capacity.",
      "55W x 4 audio output (Max rated power: 220W) with 5.1 channel surround sound and DSP 48-band equalizer.",
      "360-degree camera support and AHD rear camera compatibility for enhanced parking assistance.",
      "Bluetooth 5.1 connectivity for seamless pairing and external microphone support.",
      "Mirror Link / Screen Cast, Split Screen, and GPS Navigation functionalities built-in.",
      "Manual control buttons designed for right-hand drive vehicle setup.",
      "Supports steering wheel controls for added convenience and safer operation.",
      "Cooling Fan Technology that adapts to volume and temperature for extended system durability.",
      "Rear view camera input included for full safety and reverse monitoring."
    ],
    images: [
      "https://autoform-image.s3.ap-south-1.amazonaws.com/products/Android-2.jpg"
    ],
    categoryId: "android",
    additionalInfo: [
      "In The Package: 1 x Ultima Smart Multimedia Screen (Model E990), Wiring Kit, Mounting Frame, and User Manual.",
      "Note: Product images are for reference only. Actual product specifications may vary slightly.",
      "For support, contact +91 9278411411. Replacement only for manufacturing defects. No refunds."
    ],
    inStock: true,
    rating: 4.5,
    reviews: reviews["1"]
  }
  ,





];

export const getProduct = (id: string): Product | undefined => {
  return products.find(product => product.id === id);
};

export const getProductsByCategory = (categoryId: string): Product[] => {
  return products.filter(product => product.categoryId === categoryId);
};

export const getMainCategories = (): Category[] => {
  return categories.filter(category => !category.parentId);
};

export const getSubcategories = (parentId: string): Category[] => {
  return categories.filter(category => category.parentId === parentId);
};

export const getAllCategoryIds = (parentId: string): string[] => {
  const subcats = getSubcategories(parentId);
  let ids = [parentId];
  subcats.forEach(sub => {
    ids = [...ids, ...getAllCategoryIds(sub.id)];
  });
  return ids;
};

export const getProductsByDeepCategory = (parentId: string): Product[] => {
  const allIds = getAllCategoryIds(parentId);
  return products.filter(product => allIds.includes(product.categoryId));
};

export const getRelatedProducts = (productId: string, limit: number = 4): Product[] => {
  const product = getProduct(productId);
  if (!product) return [];

  // Get products in the same category, excluding the current product
  let related = products
    .filter(p => p.categoryId === product.categoryId && p.id !== productId);

  // If we don't have enough related products in the same category, add some from other categories
  if (related.length < limit) {
    const otherProducts = products
      .filter(p => p.categoryId !== product.categoryId && p.id !== productId)
      .slice(0, limit - related.length);

    related = [...related, ...otherProducts];
  }

  return related.slice(0, limit);
};
