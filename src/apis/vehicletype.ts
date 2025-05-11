import apiFetch from "@/components/utils/fetchInstance";

// Create VehicleType
const createVehicleType = async (VehicleType: any) => {
  try {
    const response = await apiFetch('VehicleType', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(VehicleType),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All VehicleTypes
const getAllVehicleTypes = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`VehicleType?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single VehicleType
const getSingleVehicleType = async (id: string) => {
  try {
    const response = await apiFetch(`VehicleType/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update VehicleType
const updateVehicleType = async (id: string, VehicleType: any) => {
  try {
    const response = await apiFetch(`VehicleType/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(VehicleType),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete VehicleType
const deleteVehicleType = async (id: string) => {
  try {
    const response = await apiFetch(`VehicleType/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createVehicleType,
  getAllVehicleTypes,
  getSingleVehicleType,
  updateVehicleType,
  deleteVehicleType,
};