import apiFetch from "@/components/utils/fetchInstance";

// OpeningBalance-create
const createOpeningBalance = async (OpeningBalance : any) => {
  try {
    const response = await apiFetch('OpeningBalance', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(OpeningBalance),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// OpeningBalance-list
const getAllOpeningBalance  = async (pageIndex: any = 1, pageSize: any = 10000, filters: any = {}) => {
  try {
    let queryParams = `PageIndex=${pageIndex}&PageSize=10000`;
    if (filters.openingNo) {
      queryParams += `&OrderNo=${filters.openingNo}`;
    }
    const response = await apiFetch(`OpeningBalance?${queryParams}`, {
      method: 'GET',
      headers: {}, 
    }, true);
     if (response?.data && Array.isArray(response.data)) {
      response.data.sort((a: any, b: any) => {
        const openingNoA = a.openingNo || 0;
        const openingNoB = b.openingNo || 0;
        return openingNoA - openingNoB;
      });
    }
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllOpeningBalancePositions = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`OpeningBalancePositions?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-OpeningBalance-data
const getSingleOpeningBalance  = async (id: string) => {
  try {
    const response = await apiFetch(`OpeningBalance/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const updateOpeningBalance = async (OpeningBalance: any) => {
  try {
    const response = await apiFetch(`OpeningBalance`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(OpeningBalance),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-OpeningBalance-data
const deleteOpeningBalance  = async (id: string) => {
  try {
    const response = await apiFetch(`OpeningBalance/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }   
};
const updateOpeningBalanceStatus = async (OpeningBalanceStatus: { id: string; status: string }) => {
  try {
    const response = await apiFetch('OpeningBalance/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Id: OpeningBalanceStatus.id, Status: OpeningBalanceStatus.status }),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};
const updateOpeningBalanceFiles = async ({ id, files }: { id: string; files: string }) => {
  try {
    if (!id) throw new Error('updateOpeningBalanceFiles: id is required');
    if (typeof files !== 'string') throw new Error('updateOpeningBalanceFiles: files must be a comma-separated string');

    // Try partial update first (PATCH only Files field)
    try {
      const patchResponse = await apiFetch(`OpeningBalance/Files/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, files }),
      }, true);
      return patchResponse;
    } catch (patchErr) {
      console.warn('PATCH OpeningBalance/{id} failed, falling back to merge+PUT:', patchErr);
    }

    // Fallback: fetch existing order and merge Files, then PUT full payload
    const existing = await getSingleOpeningBalance(id);
    const existingOrder = (existing as any)?.data || existing;
    if (!existingOrder) throw new Error('updateOpeningBalanceFiles: existing order not found');

    const payload = { ...existingOrder, files };
    const response = await apiFetch(`OpeningBalance`, {
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
export { createOpeningBalance , getAllOpeningBalance , getAllOpeningBalancePositions , getSingleOpeningBalance , updateOpeningBalance , deleteOpeningBalance, updateOpeningBalanceStatus , updateOpeningBalanceFiles  };
