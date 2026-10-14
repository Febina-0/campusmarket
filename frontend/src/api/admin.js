
import axios from "axios";

const API_URL = "http://localhost:5001/api/admin";

// ========================================
// AUTH CONFIGURATION
// ========================================
const getAuthConfig = () => {
    const token = localStorage.getItem("token");

    if (!token) {
        throw new Error("Please log in to access admin features.");
    }

    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

// ========================================
// ERROR HANDLING
// ========================================
const handleAdminRequest = async (request) => {
    try {
        const response = await request;
        return response.data;
    } catch (error) {
        const message =
            error.response?.data?.message ||
            error.message ||
            "An unexpected error occurred.";

        console.error("Admin API error:", message);

        throw new Error(message);
    }
};

// ========================================
// GET ADMIN DASHBOARD
// ========================================
export const getAdminDashboard = async () => {
    return handleAdminRequest(
        axios.get(
            `${API_URL}/dashboard`,
            getAuthConfig()
        )
    );
};

// ========================================
// GET ALL STUDENTS
// ========================================
export const getAdminUsers = async () => {
    return handleAdminRequest(
        axios.get(
            `${API_URL}/users`,
            getAuthConfig()
        )
    );
};

// ========================================
// GET ALL PRODUCTS
// ========================================
export const getAdminProducts = async () => {
    return handleAdminRequest(
        axios.get(
            `${API_URL}/products`,
            getAuthConfig()
        )
    );
};

// ========================================
// GET A STUDENT'S PRODUCTS
// ========================================
export const getStudentProducts = async (userId) => {
    if (!userId) {
        throw new Error("Student ID is required.");
    }

    return handleAdminRequest(
        axios.get(
            `${API_URL}/users/${encodeURIComponent(userId)}/products`,
            getAuthConfig()
        )
    );
};

// ========================================
// PERMANENTLY DELETE A STUDENT
// ========================================
export const deleteAdminUser = async (userId) => {
    if (!userId) {
        throw new Error("Student ID is required.");
    }

    return handleAdminRequest(
        axios.delete(
            `${API_URL}/users/${encodeURIComponent(userId)}`,
            getAuthConfig()
        )
    );
};

// ========================================
// DELETE OR ARCHIVE A PRODUCT
// ========================================
export const deleteAdminProduct = async (productId) => {
    if (!productId) {
        throw new Error("Product ID is required.");
    }

    return handleAdminRequest(
        axios.delete(
            `${API_URL}/products/${encodeURIComponent(productId)}`,
            getAuthConfig()
        )
    );
};