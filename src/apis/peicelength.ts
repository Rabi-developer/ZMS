
import apiFetch from "@/components/utils/fetchInstance";

// Create PeiceLength
const createPeiceLength = async (PeiceLength: any) => {
  try {
    const response = await apiFetch('PeiceLength', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(PeiceLength),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All PeiceLengths
const getAllPeiceLengths = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`PeiceLength?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single PeiceLength
const getSinglePeiceLength = async (id: string) => {
  try {
    const response = await apiFetch(`PeiceLength/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update PeiceLength
const updatePeiceLength = async (id: string, PeiceLength: any) => {
  try {
    const response = await apiFetch(`PeiceLength/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(PeiceLength),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete PeiceLength
const deletePeiceLength = async (id: string) => {
  try {
    const response = await apiFetch(`PeiceLength/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createPeiceLength,
  getAllPeiceLengths,
  getSinglePeiceLength,
  updatePeiceLength,
  deletePeiceLength,
};