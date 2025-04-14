
import apiFetch from "@/components/utils/fetchInstance";

// Create FabricTypes
const createFabricTypes = async (FabricTypes: any) => {
  try {
    const response = await apiFetch('FabricTypes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(FabricTypes),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All FabricTypess
const getAllFabricTypess = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`FabricTypes?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single FabricTypes
const getSingleFabricTypes = async (id: string) => {
  try {
    const response = await apiFetch(`FabricTypes/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update FabricTypes
const updateFabricTypes = async (id: string, FabricTypes: any) => {
  try {
    const response = await apiFetch(`FabricTypes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(FabricTypes),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete FabricTypes
const deleteFabricTypes = async (id: string) => {
  try {
    const response = await apiFetch(`FabricTypes/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createFabricTypes,
  getAllFabricTypess,
  getSingleFabricTypes,
  updateFabricTypes,
  deleteFabricTypes,
};