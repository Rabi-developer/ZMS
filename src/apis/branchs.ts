import apiFetch from "@/components/utils/fetchInstance";

// Branch-create
const createBranch = async (branch: any) => {
  try {
    const response = await apiFetch('Branch', {
      method: 'POST',
      headers: {}, // Ensure headers property is present
      body: JSON.stringify(branch),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Branch-list
const getAllBranch = async (pageIndex:any=1,pageSize:any=10) => {
  try {
    const response = await apiFetch(`Branch?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, // Ensure headers property is present
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-Branch-data
const getSingleBranch = async (id: string) => {
  try {
    const response = await apiFetch(`Branch/${id}`, {
      method: 'GET',
      headers: {}, // Ensure headers property is present
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Branch-update
const updateBranch = async (id: string, branch: any) => {
  try {
    const response = await apiFetch(`Branch`, {
      method: 'PUT',
      headers: {}, // Ensure headers property is present
      body: JSON.stringify(branch),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-Branch-data
const deleteBranch = async (id: string) => {
  try {
    const response = await apiFetch(`Branch/${id}`, {
      method: 'DELETE',
      headers: {}, // Ensure headers property is present
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Branch-setting-create
const createBranchSetting = async (branch: FormData) => {
  try {
    const response = await apiFetch('Branch/Setting', {
      method: 'POST',
      headers: {}, // Ensure headers property is present
      body: branch,
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};
// Branch-setting-get
const getBranchSetting = async (id: FormData) => {
  try {
    const response = await apiFetch(`Branch/Setting/${id}`, {
      method: 'Get',
      headers: {}, // Ensure headers property is present
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};
// Branch-logo-get
const getBranchLogo = async (id: FormData) => {
  try {
    const response = await apiFetch(`Branch/logo/${id}`, {
      method: 'Get',
      headers: {}, // Ensure headers property is present
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};
export { createBranch, getAllBranch, getSingleBranch, updateBranch, deleteBranch, createBranchSetting,getBranchSetting,getBranchLogo };
