import apiFetch from "@/components/utils/fetchInstance";

// Create Project Target
const createPickInsertion = async (PickInsertion: any) => {
  try {
    const response = await apiFetch('PickInsertion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(PickInsertion),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All Project Targets
const getAllPickInsertions = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`PickInsertion?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single Project Target
const getSinglePickInsertion = async (id: string) => {
  try {
    const response = await apiFetch(`PickInsertion/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update Project Target
const updatePickInsertion = async (id: string, PickInsertion: any) => {
  try {
    const response = await apiFetch(`PickInsertion/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(PickInsertion),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete Project Target
const deletePickInsertion = async (id: string) => {
  try {
    const response = await apiFetch(`PickInsertion/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createPickInsertion,
  getAllPickInsertions,
  getSinglePickInsertion,
  updatePickInsertion,
  deletePickInsertion,
};