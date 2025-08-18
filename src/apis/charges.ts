import apiFetch from "@/components/utils/fetchInstance";

// Charges-create
const createCharges = async (Charges : any) => {
  try {
    const response = await apiFetch('Charges', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(Charges),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Charges-list
const getAllCharges  = async (pageIndex:any=1,pageSize:any=10, filters:any={}) => {
  try {
    let queryParams = `PageIndex=${pageIndex}&PageSize=${pageSize}`;
    
    // Add filters if provided
    if (filters.orderNo) {
      queryParams += `&OrderNo=${filters.orderNo}`;
    }
    
    const response = await apiFetch(`Charges?${queryParams}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllChargesPositions = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`ChargesPositions?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-Charges-data
const getSingleCharges  = async (id: string) => {
  try {
    const response = await apiFetch(`Charges/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const updateCharges = async (Charges: any, data: { chargeDate: string; orderNo: string; lines: { contact?: string | undefined; date?: string | undefined; charge?: string | undefined; biltyNo?: string | undefined; vehicle?: string | undefined; paidTo?: string | undefined; remarks?: string | undefined; amount?: number | undefined; }[]; payments: { paidAmount?: number | undefined; bankCash?: string | undefined; chqNo?: string | undefined; chqDate?: string | undefined; payNo?: string | undefined; }[]; chargeNo?: string | undefined; }) => {
  try {
    const response = await apiFetch(`Charges`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(Charges),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-Charges-data
const deleteCharges  = async (id: string) => {
  try {
    const response = await apiFetch(`Charges/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }   
};
const updateChargesStatus = async (ChargesStatus: { id: string; status: string }) => {
  try {
    const response = await apiFetch('Charges/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Id: ChargesStatus.id, Status: ChargesStatus.status }),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};
export { createCharges , getAllCharges , getAllChargesPositions , getSingleCharges , updateCharges , deleteCharges, updateChargesStatus  };
