
import apiFetch from "@/components/utils/fetchInstance";

// Create CostsSales
const createCostsSales = async (CostsSales: any) => {
  try {
    const response = await apiFetch('CostsSales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(CostsSales),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All CostsSaless
const getAllCostsSales = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`CostsSales?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single CostsSales
const getSingleCostsSales = async (id: string) => {
  try {
    const response = await apiFetch(`CostsSales/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update CostsSales
const updateCostsSales = async (id: string, CostsSales: any) => {
  try {
    const response = await apiFetch(`CostsSales/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(CostsSales),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete CostsSales
const deleteCostsSales = async (id: string) => {
  try {
    const response = await apiFetch(`CostsSales/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createCostsSales,
  getAllCostsSales,
  getSingleCostsSales,
  updateCostsSales,
  deleteCostsSales,
};