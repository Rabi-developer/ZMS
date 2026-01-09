import apiFetch from "@/components/utils/fetchInstance";

// Payment-create
const createPayment = async (Payment : any) => {
  try {
    const payload = {
      model: {
        ...Payment,
        paidAmount: Payment?.paidAmount != null ? String(Payment.paidAmount) : '',
      },
    };

    const response = await apiFetch('Payment', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(payload),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Payment-list
const getAllPayment  = async (pageIndex:any=1,pageSize:any=10) => {
  try {
    const response = await apiFetch(`Payment?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllPaymentPositions = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`PaymentPositions?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-Payment-data
const getSinglePayment  = async (id: string) => {
  try {
    const response = await apiFetch(`Payment/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const updatePayment = async (Payment : any) => {
  try {
    const payload = {
      model: {
        ...Payment,
        paidAmount: Payment?.paidAmount != null ? String(Payment.paidAmount) : '',
      },
    };

    const response = await apiFetch(`Payment`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(payload),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-Payment-data
const deletePayment  = async (id: string) => {
  try {
    const response = await apiFetch(`Payment/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }   
};
const updatePaymentStatus = async (PaymentStatus: { id: string; status: string }) => {
  try {
    const response = await apiFetch('Payment/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Id: PaymentStatus.id, Status: PaymentStatus.status }),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};
export { createPayment , getAllPayment , getAllPaymentPositions , getSinglePayment , updatePayment , deletePayment, updatePaymentStatus  };
 