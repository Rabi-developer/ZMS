import apiFetch from "@/components/utils/fetchInstance";

// Receipt-create
const createReceipt = async (Receipt : any) => {
  try {
    const response = await apiFetch('Receipt', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(Receipt),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Receipt-list
const getAllReceipt  = async (pageIndex: any = 1, pageSize: any = 10000, p0?: { orderNo: string; }) => {
  try {
    const response = await apiFetch(`Receipt?PageIndex=${pageIndex}&PageSize=10000`, {
      method: 'GET',
      headers: {}, 
    }, true);
        if (Array.isArray(response?.data)) {
      response.data.sort((a: any, b: any) =>
        (b.receiptNo ?? "").toString().localeCompare(
          (a.receiptNo ?? "").toString(),
          undefined,
          { numeric: true, sensitivity: "base" }
        )
      );
    }
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllReceiptPositions = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`ReceiptPositions?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-Receipt-data
const getSingleReceipt  = async (id: string) => {
  try {
    const response = await apiFetch(`Receipt/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const updateReceipt = async (Receipt: any, ) => {
  try {
    const response = await apiFetch(`Receipt`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(Receipt),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-Receipt-data
const deleteReceipt  = async (id: string) => {
  try {
    const response = await apiFetch(`Receipt/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }   
};
const updateReceiptStatus = async (ReceiptStatus: { id: string; status: string }) => {
  try {
    const response = await apiFetch('Receipt/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Id: ReceiptStatus.id, Status: ReceiptStatus.status }),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};
const updateReceiptFiles = async ({ id, files }: { id: string; files: string }) => {
  try {
    if (!id) throw new Error('updateReceiptFiles: id is required');
    if (typeof files !== 'string') throw new Error('updateReceiptFiles: files must be a comma-separated string');

    // Try partial update first (PATCH only Files field)
    try {
      const patchResponse = await apiFetch(`Receipt/Files/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, files }),
      }, true);
      return patchResponse;
    } catch (patchErr) {
      console.warn('PATCH Receipt/{id} failed, falling back to merge+PUT:', patchErr);
    }

    // Fallback: fetch existing order and merge Files, then PUT full payload
    const existing = await getSingleReceipt(id);
    const existingOrder = (existing as any)?.data || existing;
    if (!existingOrder) throw new Error('updateReceiptFiles: existing order not found');

    const payload = { ...existingOrder, files };
    const response = await apiFetch(`Receipt`, {
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

const getBiltyBalance = async (biltyNo: string) => {
  try {
    const response = await apiFetch(`Receipt/bilty-balance/${biltyNo}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};
export { createReceipt , getAllReceipt , getAllReceiptPositions , getSingleReceipt , updateReceipt , deleteReceipt, updateReceiptStatus, updateReceiptFiles , getBiltyBalance};
