import apiFetch from "@/components/utils/fetchInstance";

// PaymentABL-create
const createPaymentABL = async (PaymentABL : any) => {
  try {
    const response = await apiFetch('PaymentABL', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(PaymentABL),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// PaymentABL-list
const getAllPaymentABL  = async (pageIndex:any=1,pageSize:any=10) => {
  try {
    const response = await apiFetch(`PaymentABL?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllPaymentABLPositions = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`PaymentABLPositions?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-PaymentABL-data
const getSinglePaymentABL  = async (id: string) => {
  try {
    const response = await apiFetch(`PaymentABL/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const updatePaymentABL = async (PaymentABL : any) => {
  try {
    const response = await apiFetch(`PaymentABL`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(PaymentABL),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-PaymentABL-data
const deletePaymentABL  = async (id: string) => {
  try {
    const response = await apiFetch(`PaymentABL/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }   
};

const updatePaymentABLStatus = async (PaymentABLStatus: { id: string; status: string }) => {
  try {
    const response = await apiFetch('PaymentABL/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Id: PaymentABLStatus.id, Status: PaymentABLStatus.status }),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export { createPaymentABL , getAllPaymentABL , getAllPaymentABLPositions , getSinglePaymentABL , updatePaymentABL , deletePaymentABL, updatePaymentABLStatus  };