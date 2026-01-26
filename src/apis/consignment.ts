import apiFetch from "@/components/utils/fetchInstance";

// Consignment-create
const createConsignment = async (Consignment : any) => {
  try {
    const response = await apiFetch('Consignment', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(Consignment),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Consignment-list
const getAllConsignment  = async (pageIndex: any = 1, pageSize: any = 10000, filters: any = {}) => {
  try {
    let queryParams = `PageIndex=${pageIndex}&PageSize=10000`;
    if (filters.receiptNo) {
      queryParams += `&ReceiptNo=${filters.receiptNo}`;
    }
    if (filters.status) {
      queryParams += `&Status=${filters.status}`;
    }
    const response = await apiFetch(`Consignment?${queryParams}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllConsignmentPositions = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`ConsignmentPositions?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-Consignment-data
const getSingleConsignment  = async (id: string) => {
  try {
    const response = await apiFetch(`Consignment/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const updateConsignment = async ( consignment: any) => {
   try {
   
    const response = await apiFetch(`Consignment`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(consignment),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-Consignment-data
const deleteConsignment  = async (id: string) => {
  try {
    const response = await apiFetch(`Consignment/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }   
};
const updateConsignmentStatus = async (ConsignmentStatus: { id: string; status: string }) => {
  try {
    const response = await apiFetch('Consignment/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Id: ConsignmentStatus.id, Status: ConsignmentStatus.status }),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const updateConsignmentFiles = async ({ id, files }: { id: string; files: string }) => {
  try {
    if (!id) throw new Error('updateConsignmentFiles: id is required');
    if (typeof files !== 'string') throw new Error('updateConsignmentFiles: files must be a comma-separated string');

    // Try partial update first (PATCH only Files field)
    try {
      const patchResponse = await apiFetch(`Consignment/Files/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, files }),
      }, true);
      return patchResponse;
    } catch (patchErr) {
      console.warn('PATCH Consignment/{id} failed, falling back to merge+PUT:', patchErr);
    }

    // Fallback: fetch existing order and merge Files, then PUT full payload
    const existing = await getSingleConsignment(id);
    const existingOrder = (existing as any)?.data || existing;
    if (!existingOrder) throw new Error('updateConsignmentFiles: existing order not found');

    const payload = { ...existingOrder, files };
    const response = await apiFetch(`Consignment`, {
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
export { createConsignment , getAllConsignment , getAllConsignmentPositions , getSingleConsignment , updateConsignment , deleteConsignment, updateConsignmentStatus , updateConsignmentFiles };
