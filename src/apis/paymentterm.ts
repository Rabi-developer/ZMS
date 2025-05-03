
import apiFetch from "@/components/utils/fetchInstance";

// Create PaymentTerm
const createPaymentTerm = async (PaymentTerm: any) => {
  try {
    const response = await apiFetch('PaymentTerm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(PaymentTerm),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All PaymentTerms
const getAllPaymentTerms = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`PaymentTerm?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single PaymentTerm
const getSinglePaymentTerm = async (id: string) => {
  try {
    const response = await apiFetch(`PaymentTerm/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update PaymentTerm
const updatePaymentTerm = async (id: string, PaymentTerm: any) => {
  try {
    const response = await apiFetch(`PaymentTerm/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(PaymentTerm),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete PaymentTerm
const deletePaymentTerm = async (id: string) => {
  try {
    const response = await apiFetch(`PaymentTerm/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createPaymentTerm,
  getAllPaymentTerms,
  getSinglePaymentTerm,
  updatePaymentTerm,
  deletePaymentTerm,
};