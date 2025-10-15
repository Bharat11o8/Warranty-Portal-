export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'vendor';
  phoneNumber: string;
  isValidated?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  phoneNumber: string;
  role: 'customer' | 'vendor';
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface WarrantyData {
  productType: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  carMake: string;
  carModel: string;
  carYear: string;
  registrationNumber: string;
  purchaseDate: string;
  installerName?: string;
  installerContact?: string;
  productDetails: any;
}