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
const getAllCharges  = async (pageIndex:any=1,pageSize:any=10000, filters:any={}) => {
  try {
    let queryParams = `PageIndex=${pageIndex}&PageSize=10000`;
    
    // Add filters if provided
    if (filters.chargeNo) {
      queryParams += `&chargeNo=${filters.chargeNo}`;
    }
    
    // Add parameter to include lines data in the response
    queryParams += `&IncludeLines=true`;
    
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

// Charges-update: expects id as first argument, payload as second
const updateCharges = async (id: string, Charges: any) => {
  try {
    if (!id) throw new Error('updateCharges: id is required');
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
const updateChargesFiles = async ({ id, files }: { id: string; files: string }) => {
  try {
    if (!id) throw new Error('updateChargesFiles: id is required');
    if (typeof files !== 'string') throw new Error('updateChargesFiles: files must be a comma-separated string');

    // Try partial update first (PATCH only Files field)
    try {
      const patchResponse = await apiFetch(`Charges/Files/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, files }),
      }, true);
      return patchResponse;
    } catch (patchErr) {
      console.warn('PATCH Charges/{id} failed, falling back to merge+PUT:', patchErr);
    }

    // Fallback: fetch existing order and merge Files, then PUT full payload
    const existing = await getSingleCharges(id);
    const existingOrder = (existing as any)?.data || existing;
    if (!existingOrder) throw new Error('updateChargesFiles: existing order not found');

    const payload = { ...existingOrder, files };
    const response = await apiFetch(`Charges`, {
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
export { createCharges , getAllCharges , getAllChargesPositions , getSingleCharges , updateCharges , deleteCharges, updateChargesStatus, updateChargesFiles  };
