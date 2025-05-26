import apiFetch from "@/components/utils/fetchInstance";

// Invoice-create
const createInvoice = async (Invoice : any) => {
  try {
    const response = await apiFetch('Invoice', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(Invoice),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Invoice-list
const getAllInvoice  = async (pageIndex:any=1,pageSize:any=10) => {
  try {
    const response = await apiFetch(`Invoice?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllInvoicePositions = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`InvoicePositions?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-Invoice-data
const getSingleInvoice  = async (id: string) => {
  try {
    const response = await apiFetch(`Invoice/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const updateInvoice = async (Invoice : any) => {
  try {
    const response = await apiFetch(`Invoice`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(Invoice),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-Invoice-data
const deleteInvoice  = async (id: string) => {
  try {
    const response = await apiFetch(`Invoice/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }   
};
const updateInvoiceStatus = async (InvoiceStatus: { id: string; status: string }) => {
  try {
    const response = await apiFetch('Invoice/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Id: InvoiceStatus.id, Status: InvoiceStatus.status }),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};
export { createInvoice , getAllInvoice , getAllInvoicePositions , getSingleInvoice , updateInvoice , deleteInvoice, updateInvoiceStatus  };
