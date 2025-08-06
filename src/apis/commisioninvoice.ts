import apiFetch from "@/components/utils/fetchInstance";

// CommisionInvoice-create
const createCommisionInvoice = async (CommisionInvoice : any) => {
  try {
    const response = await apiFetch('CommisionInvoice', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(CommisionInvoice),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// CommisionInvoice-list
const getAllCommisionInvoice  = async (pageIndex:any=1,pageSize:any=10) => {
  try {
    const response = await apiFetch(`CommisionInvoice?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllCommisionInvoicePositions = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`CommisionInvoicePositions?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-CommisionInvoice-data
const getSingleCommisionInvoice  = async (id: string) => {
  try {
    const response = await apiFetch(`CommisionInvoice/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const updateCommisionInvoice = async (CommisionInvoice : any) => {
  try {
    const response = await apiFetch(`CommisionInvoice`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(CommisionInvoice),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-CommisionInvoice-data
const deleteCommisionInvoice  = async (id: string) => {
  try {
    const response = await apiFetch(`CommisionInvoice/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }   
};
const updateCommisionInvoiceStatus = async (CommisionInvoiceStatus: { id: string; status: string }) => {
  try {
    const response = await apiFetch('CommisionInvoice/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Id: CommisionInvoiceStatus.id, Status: CommisionInvoiceStatus.status }),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};
export { createCommisionInvoice , getAllCommisionInvoice , getAllCommisionInvoicePositions , getSingleCommisionInvoice , updateCommisionInvoice , deleteCommisionInvoice, updateCommisionInvoiceStatus  };
