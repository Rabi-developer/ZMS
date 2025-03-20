import apiFetch from "@/components/utils/fetchInstance";

// Create Project Target
const createpropertyAssests = async (projectTarget: any) => {
  try {
    const response = await apiFetch('propertyAssests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectTarget),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All Project Targets
const getAllpropertyAssestss = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`propertyAssests?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single Project Target
const getSinglepropertyAssests = async (id: string) => {
  try {
    const response = await apiFetch(`propertyAssests/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update Project Target
const updatepropertyAssests = async (id: string, projectTarget: any) => {
  try {
    const response = await apiFetch(`propertyAssests/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectTarget),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete Project Target
const deletepropertyAssests = async (id: string) => {
  try {
    const response = await apiFetch(`propertyAssests/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createpropertyAssests,
  getAllpropertyAssestss,
  getSinglepropertyAssests,
  updatepropertyAssests,
  deletepropertyAssests,
};