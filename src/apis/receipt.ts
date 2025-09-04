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
const getAllReceipt  = async (pageIndex: any = 1, pageSize: any = 10, p0?: { orderNo: string; }) => {
  try {
    const response = await apiFetch(`Receipt?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
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
export { createReceipt , getAllReceipt , getAllReceiptPositions , getSingleReceipt , updateReceipt , deleteReceipt, updateReceiptStatus  };
