import apiFetch from "@/components/utils/fetchInstance";

// signup-api
const signup = async (userData:any) => {
  try {
    const response = await apiFetch('Account/Signup', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(userData),
    });
    return response;
  } catch (error: any) {
    throw error;
  }
};

// login-api
const login = async (userData: any) => {
  try {
    const response = await apiFetch('Account/Login', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(userData),
    });
    return response;
  } catch (error: any) {
    throw error
  }
};

export { login, signup };
