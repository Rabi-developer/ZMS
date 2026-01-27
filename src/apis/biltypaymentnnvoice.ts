import apiFetch from "@/components/utils/fetchInstance";

// BiltyPaymentInvoice-create
const createBiltyPaymentInvoice = async (BiltyPaymentInvoice : any) => {
  try {
    const response = await apiFetch('BiltyPaymentInvoice', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(BiltyPaymentInvoice),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// BiltyPaymentInvoice-list
const getAllBiltyPaymentInvoice  = async (pageIndex:any=1,pageSize:any=10000) => {
  try {
    const response = await apiFetch(`BiltyPaymentInvoice?PageIndex=${pageIndex}&PageSize=10000`, {
      method: 'GET',
      headers: {}, 
    }, true);
    if (response?.data && Array.isArray(response.data)) {
      response.data.sort((a: any, b: any) => {
        const invoiceNoA = a.invoiceNo || 0;
        const invoiceNoB = b.invoiceNo || 0;
        return invoiceNoA - invoiceNoB;
      });
    }
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllBiltyPaymentInvoicePositions = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`BiltyPaymentInvoicePositions?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-BiltyPaymentInvoice-data
const getSingleBiltyPaymentInvoice  = async (id: string) => {
  try {
    const response = await apiFetch(`BiltyPaymentInvoice/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const updateBiltyPaymentInvoice = async (BiltyPaymentInvoice: any, data?: { lines: { vehicleNo: string; orderNo: string; amount: number; munshayana?: string | undefined; remarks?: string | undefined; broker?: string | undefined; dueDate?: string | undefined; }[]; paymentDate: string; invoiceNo?: string | undefined; }) => {
  try {
    const response = await apiFetch(`BiltyPaymentInvoice`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(BiltyPaymentInvoice),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-BiltyPaymentInvoice-data
const deleteBiltyPaymentInvoice  = async (id: string) => {
  try {
    const response = await apiFetch(`BiltyPaymentInvoice/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }   
};

const updateBiltyPaymentInvoiceStatus = async (BiltyPaymentInvoiceStatus: { id: string; status: string }) => {
  try {
    const response = await apiFetch('BiltyPaymentInvoice/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Id: BiltyPaymentInvoiceStatus.id, Status: BiltyPaymentInvoiceStatus.status }),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};
const updateBiltyPaymentInvoiceFiles = async ({ id, files }: { id: string; files: string }) => {
  try {
    if (!id) throw new Error('updateBiltyPaymentInvoiceFiles: id is required');
    if (typeof files !== 'string') throw new Error('updateBiltyPaymentInvoiceFiles: files must be a comma-separated string');

    // Try partial update first (PATCH only Files field)
    try {
      const patchResponse = await apiFetch(`BiltyPaymentInvoice/Files/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, files }),
      }, true);
      return patchResponse;
    } catch (patchErr) {
      console.warn('PATCH BiltyPaymentInvoice/{id} failed, falling back to merge+PUT:', patchErr);
    }

    // Fallback: fetch existing order and merge Files, then PUT full payload
    const existing = await getSingleBiltyPaymentInvoice(id);
    const existingOrder = (existing as any)?.data || existing;
    if (!existingOrder) throw new Error('updateBiltyPaymentInvoiceFiles: existing order not found');

    const payload = { ...existingOrder, files };
    const response = await apiFetch(`BiltyPaymentInvoice`, {
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
export { createBiltyPaymentInvoice , getAllBiltyPaymentInvoice , getAllBiltyPaymentInvoicePositions , getSingleBiltyPaymentInvoice , updateBiltyPaymentInvoice , deleteBiltyPaymentInvoice, updateBiltyPaymentInvoiceStatus , updateBiltyPaymentInvoiceFiles  };