import { toast } from 'react-toastify';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface FetchOptions extends RequestInit {
  headers: Record<string, string>; // Define headers with a flexible type
}

const isClient = typeof window !== 'undefined';

const apiFetch = async (
  endpoint: string,
  options: FetchOptions = { headers: {} },
  requireAuth = false
) => {
  if (!isClient) {
    // If running on server, do not attempt to access browser APIs
    throw new Error('apiFetch cannot be called on the server');
  }

  const url = `${BASE_URL}${endpoint}`;

  // Prepare headers
  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers, // Ensure any additional headers are included
  };

  // If authentication is required, add the token to the headers
  if (requireAuth) {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      handleUnauthorizedError();
      throw new Error('No token found');
    }
  }

  // Merge the options
  const defaultOptions: FetchOptions = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, defaultOptions);
    if (response.status === 401) {
      // Handle 401 Unauthorized error
      handleUnauthorizedError();
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.statusMessage || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
};

// Function to handle 401 Unauthorized errors
function handleUnauthorizedError() {
  // Clear the token from local storage
  // Redirect to login page or display a message
  if (isClient) {
    localStorage.clear();
    // Redirect to the login page
    window.location.href = "/signin";
    toast("Unauthorized", {
      type: "error",
    });
  }
}

export default apiFetch;
