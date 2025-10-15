import api from './api';
import { WarrantyData } from './types';

export const submitWarranty = async (data: WarrantyData) => {
  const response = await api.post('/warranty/submit', data);
  return response.data;
};

export const getWarranties = async () => {
  const response = await api.get('/warranty');
  return response.data;
};

export const getWarrantyById = async (id: string) => {
  const response = await api.get(`/warranty/${id}`);
  return response.data;
};