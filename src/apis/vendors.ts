import apiFetch from "@/components/utils/fetchInstance";

// Vendor-create
const createVendor = async (Vendor : any) => {
  try {
    const response = await apiFetch('Vendor', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(Vendor),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Vendor-list
const getAllVendor  = async (pageIndex:any=1,pageSize:any=10) => {
  try {
    const response = await apiFetch(`Vendor?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllVendorPositions = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`VendorPositions?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-Vendor-data
const getSingleVendor  = async (id: string) => {
  try {
    const response = await apiFetch(`Vendor/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const updateVendor = async (Vendor : any) => {
  try {
    const response = await apiFetch(`Vendor`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(Vendor),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-Vendor-data
const deleteVendor  = async (id: string) => {
  try {
    const response = await apiFetch(`Vendor/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }   
};
const updateVendorStatus = async (VendorStatus: { id: string; status: string }) => {
  try {
    const response = await apiFetch('Vendor/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Id: VendorStatus.id, Status: VendorStatus.status }),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};
export { createVendor , getAllVendor , getAllVendorPositions , getSingleVendor , updateVendor , deleteVendor, updateVendorStatus  };
