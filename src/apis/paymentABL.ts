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
const getAllPaymentABL  = async (pageIndex:any=1,pageSize:any=1000) => {
  try {
    const response = await apiFetch(`PaymentABL?PageIndex=${pageIndex}&PageSize=10000`, {
      method: 'GET',
      headers: {}, 
    }, true);

    // Sort PaymentABL by payment number ascending (numeric if possible), similar to other lists
    if (response?.data && Array.isArray(response.data)) {
      response.data.sort((a: any, b: any) => {
        const aVal = a.paymentNo ?? a.PaymentNo ?? a.payNo ?? a.PayNo ?? 0;
        const bVal = b.paymentNo ?? b.PaymentNo ?? b.payNo ?? b.PayNo ?? 0;
        const aNum = typeof aVal === 'number' ? aVal : parseFloat(String(aVal).replace(/[^0-9.-]/g, '')) || 0;
        const bNum = typeof bVal === 'number' ? bVal : parseFloat(String(bVal).replace(/[^0-9.-]/g, '')) || 0;
        if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
        return String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' });
      });
    }

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
const updatePaymentABLFiles = async ({ id, files }: { id: string; files: string }) => {
  try {
    if (!id) throw new Error('updatePaymentABLFiles: id is required');
    if (typeof files !== 'string') throw new Error('updatePaymentABLFiles: files must be a comma-separated string');

    // Try partial update first (PATCH only Files field)
    try {
      const patchResponse = await apiFetch(`PaymentABL/Files/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, files }),
      }, true);
      return patchResponse;
    } catch (patchErr) {
      console.warn('PATCH PaymentABL/{id} failed, falling back to merge+PUT:', patchErr);
    }

    // Fallback: fetch existing order and merge Files, then PUT full payload
    const existing = await getSinglePaymentABL(id);
    const existingOrder = (existing as any)?.data || existing;
    if (!existingOrder) throw new Error('updatePaymentABLFiles: existing order not found');

    const payload = { ...existingOrder, files };
    const response = await apiFetch(`PaymentABL`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }, true);

    return response;
  } catch (error: any) {
    throw error;
  }
};

export { createPaymentABL , getAllPaymentABL , getAllPaymentABLPositions , getSinglePaymentABL , updatePaymentABL , deletePaymentABL, updatePaymentABLStatus , updatePaymentABLFiles  };