import apiFetch from "@/components/utils/fetchInstance";

// Create Project Target
const createProjectTarget = async (projectTarget: any) => {
  try {
    const response = await apiFetch('ProjectTarget', {
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
const getAllProjectTargets = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`ProjectTarget?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single Project Target
const getSingleProjectTarget = async (id: string) => {
  try {
    const response = await apiFetch(`ProjectTarget/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update Project Target
const updateProjectTarget = async (id: string, projectTarget: any) => {
  try {
    const response = await apiFetch(`ProjectTarget/${id}`, {
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
const deleteProjectTarget = async (id: string) => {
  try {
    const response = await apiFetch(`ProjectTarget/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createProjectTarget,
  getAllProjectTargets,
  getSingleProjectTarget,
  updateProjectTarget,
  deleteProjectTarget,
};