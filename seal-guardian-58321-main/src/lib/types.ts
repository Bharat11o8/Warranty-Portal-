export interface WarrantyData {
  productType: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  carMake: string;
  carModel: string;
  carYear: string;
  purchaseDate: string;
  warrantyType: string;
  installerName?: string;
  installerContact?: string;
  productDetails: any;
}