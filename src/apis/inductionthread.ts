
import apiFetch from "@/components/utils/fetchInstance";

// Create InductionThread
const createInductionThread = async (InductionThread: any) => {
  try {
    const response = await apiFetch('InductionThread', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(InductionThread),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All InductionThreads
const getAllInductionThreads = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`InductionThread?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single InductionThread
const getSingleInductionThread = async (id: string) => {
  try {
    const response = await apiFetch(`InductionThread/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update InductionThread
const updateInductionThread = async (id: string, InductionThread: any) => {
  try {
    const response = await apiFetch(`InductionThread/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(InductionThread),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete InductionThread
const deleteInductionThread = async (id: string) => {
  try {
    const response = await apiFetch(`InductionThread/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createInductionThread,
  getAllInductionThreads,
  getSingleInductionThread,
  updateInductionThread,
  deleteInductionThread,
};