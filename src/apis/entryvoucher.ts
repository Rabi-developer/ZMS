import apiFetch from "@/components/utils/fetchInstance";

// EntryVoucher-create
const createEntryVoucher = async (EntryVoucher : any) => {
  try {
    const response = await apiFetch('EntryVoucher', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(EntryVoucher),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// EntryVoucher-list
const getAllEntryVoucher  = async (pageIndex: any = 1, pageSize: any = 10, filters: any = {}) => {
  try {
    let queryParams = `PageIndex=${pageIndex}&PageSize=${pageSize}`;
    if (filters.orderNo) {
      queryParams += `&OrderNo=${filters.orderNo}`;
    }
    const response = await apiFetch(`EntryVoucher?${queryParams}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllEntryVoucherPositions = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`EntryVoucherPositions?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-EntryVoucher-data
const getSingleEntryVoucher  = async (id: string) => {
  try {
    const response = await apiFetch(`EntryVoucher/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const updateEntryVoucher = async (EntryVoucher: any) => {
  try {
    const response = await apiFetch(`EntryVoucher`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(EntryVoucher),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-EntryVoucher-data
const deleteEntryVoucher  = async (id: string) => {
  try {
    const response = await apiFetch(`EntryVoucher/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }   
};
const updateEntryVoucherStatus = async (EntryVoucherStatus: { id: string; status: string }) => {
  try {
    const response = await apiFetch('EntryVoucher/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Id: EntryVoucherStatus.id, Status: EntryVoucherStatus.status }),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};
const updateEntryVoucherFiles = async ({ id, files }: { id: string; files: string }) => {
  try {
    if (!id) throw new Error('updateEntryVoucherFiles: id is required');
    if (typeof files !== 'string') throw new Error('updateEntryVoucherFiles: files must be a comma-separated string');

    // Try partial update first (PATCH only Files field)
    try {
      const patchResponse = await apiFetch(`EntryVoucher/Files/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, files }),
      }, true);
      return patchResponse;
    } catch (patchErr) {
      console.warn('PATCH EntryVoucher/{id} failed, falling back to merge+PUT:', patchErr);
    }

    // Fallback: fetch existing order and merge Files, then PUT full payload
    const existing = await getSingleEntryVoucher(id);
    const existingOrder = (existing as any)?.data || existing;
    if (!existingOrder) throw new Error('updateEntryVoucherFiles: existing order not found');

    const payload = { ...existingOrder, files };
    const response = await apiFetch(`EntryVoucher`, {
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
export { createEntryVoucher , getAllEntryVoucher , getAllEntryVoucherPositions , getSingleEntryVoucher , updateEntryVoucher , deleteEntryVoucher, updateEntryVoucherStatus , updateEntryVoucherFiles  };
