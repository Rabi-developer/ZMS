import apiFetch from "@/components/utils/fetchInstance";

// Create TransporterCompany
const createTransporterCompany = async (TransporterCompany: any) => {
  try {
    const response = await apiFetch('TransporterCompany', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TransporterCompany),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All TransporterCompanys
const getAllTransporterCompanys = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`TransporterCompany?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single TransporterCompany
const getSingleTransporterCompany = async (id: string) => {
  try {
    const response = await apiFetch(`TransporterCompany/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update TransporterCompany
const updateTransporterCompany = async (id: string, TransporterCompany: any) => {
  try {
    const response = await apiFetch(`TransporterCompany/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TransporterCompany),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete TransporterCompany
const deleteTransporterCompany = async (id: string) => {
  try {
    const response = await apiFetch(`TransporterCompany/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createTransporterCompany,
  getAllTransporterCompanys,
  getSingleTransporterCompany,
  updateTransporterCompany,
  deleteTransporterCompany,
};