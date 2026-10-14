
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getAdminProducts,
    deleteAdminProduct,
} from "../api/admin";

function AdminProducts() {
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [deletingId, setDeletingId] = useState(null);

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getAdminProducts();
            setProducts(data.products || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to load products."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleDelete = async (product) => {
        if (deletingId) return;

        const confirmed = window.confirm(
            `Permanently delete "${product.title}"?\n\n` +
            "This will delete the product and its related conversations, " +
            "messages, reservations, and linked orders. This action cannot be undone."
        );

        if (!confirmed) return;

        try {
            setDeletingId(product._id);
            setError("");
            setMessage("");

            const result = await deleteAdminProduct(product._id);

            setMessage(
                result.message || "Product permanently deleted."
            );

            setProducts((currentProducts) =>
                currentProducts.filter(
                    (item) => item._id !== product._id
                )
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to delete product."
            );
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (date) => {
        if (!date) return "N/A";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "N/A";
        }

        return parsedDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const statusStyle = (status) => {
        switch (status) {
            case "Available":
                return styles.available;
            case "Reserved":
                return styles.reserved;
            case "Sold":
                return styles.sold;
            default:
                return styles.status;
        }
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div>
                    <h1 style={styles.title}>Manage Products</h1>
                    <p style={styles.subtitle}>
                        Review and manage marketplace listings.
                    </p>
                </div>

                <button
                    style={styles.backButton}
                    onClick={() => navigate("/admin/dashboard")}
                >
                    Back to Dashboard
                </button>
            </header>

            <div style={styles.summary}>
                <h3>Total Products</h3>
                <p style={styles.count}>
                    {loading ? "..." : products.length}
                </p>
            </div>

            {message && (
                <div style={styles.success} role="status">
                    {message}
                </div>
            )}

            {error && (
                <div style={styles.error} role="alert">
                    <p>{error}</p>

                    <button
                        style={styles.retryButton}
                        onClick={fetchProducts}
                    >
                        Retry
                    </button>
                </div>
            )}

            {loading && <p>Loading products...</p>}

            {!loading && !error && products.length === 0 && (
                <div style={styles.empty}>
                    <h3>No products found</h3>
                    <p>Student listings will appear here.</p>
                </div>
            )}

            {!loading && products.length > 0 && (
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>No.</th>
                                <th style={styles.th}>Product</th>
                                <th style={styles.th}>Seller</th>
                                <th style={styles.th}>Price</th>
                                <th style={styles.th}>Condition</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Posted On</th>
                                <th style={styles.th}>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {products.map((product, index) => (
                                <tr key={product._id}>
                                    <td style={styles.td}>
                                        {index + 1}
                                    </td>

                                    <td style={styles.td}>
                                        <div style={styles.productCell}>
                                            {product.images?.[0]?.url && (
                                                <img
                                                    src={product.images[0].url}
                                                    alt={product.title || "Product"}
                                                    style={styles.image}
                                                />
                                            )}

                                            <span>
                                                {product.title || "Untitled product"}
                                            </span>
                                        </div>
                                    </td>

                                    <td style={styles.td}>
                                        <div>
                                            <div>
                                                {product.seller?.name ||
                                                    "Unknown user"}
                                            </div>

                                            {product.seller?.email && (
                                                <small style={styles.email}>
                                                    {product.seller.email}
                                                </small>
                                            )}
                                        </div>
                                    </td>

                                    <td style={styles.td}>
                                        ₹
                                        {Number(product.price || 0).toLocaleString(
                                            "en-IN"
                                        )}
                                    </td>

                                    <td style={styles.td}>
                                        {product.condition || "N/A"}
                                    </td>

                                    <td style={styles.td}>
                                        <span style={statusStyle(product.status)}>
                                            {product.status || "N/A"}
                                        </span>
                                    </td>

                                    <td style={styles.td}>
                                        {formatDate(product.createdAt)}
                                    </td>

                                    <td style={styles.td}>
                                        <button
                                            style={{
                                                ...styles.deleteButton,
                                                opacity:
                                                    deletingId === product._id
                                                        ? 0.6
                                                        : 1,
                                            }}
                                            disabled={deletingId !== null}
                                            onClick={() => handleDelete(product)}
                                        >
                                            {deletingId === product._id
                                                ? "Deleting..."
                                                : "Delete"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "30px",
        color: "#222",
        boxSizing: "border-box",
    },

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
        marginBottom: "25px",
    },

    title: {
        margin: 0,
        fontSize: "30px",
        color: "#5b2c83",
    },

    subtitle: {
        color: "#666",
        marginTop: "8px",
    },

    backButton: {
        padding: "10px 16px",
        backgroundColor: "#5b2c83",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
    },

    summary: {
        padding: "20px",
        backgroundColor: "#f3edff",
        borderRadius: "10px",
        marginBottom: "25px",
        maxWidth: "260px",
    },

    count: {
        fontSize: "30px",
        fontWeight: "bold",
        color: "#5b2c83",
        margin: "8px 0",
    },

    tableContainer: {
        overflowX: "auto",
        border: "1px solid #ddd",
        borderRadius: "8px",
    },

    table: {
        width: "100%",
        borderCollapse: "collapse",
        backgroundColor: "white",
        textAlign: "left",
    },

    th: {
        padding: "14px",
        backgroundColor: "#5b2c83",
        color: "white",
        whiteSpace: "nowrap",
    },

    td: {
        padding: "12px",
        borderBottom: "1px solid #eee",
        verticalAlign: "middle",
    },

    productCell: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        minWidth: "180px",
    },

    image: {
        width: "55px",
        height: "55px",
        objectFit: "cover",
        borderRadius: "6px",
        flexShrink: 0,
    },

    email: {
        color: "#666",
    },

    status: {
        padding: "5px 9px",
        borderRadius: "12px",
        backgroundColor: "#eee",
        whiteSpace: "nowrap",
    },

    available: {
        padding: "5px 9px",
        borderRadius: "12px",
        backgroundColor: "#e8f5e9",
        color: "#237a35",
        whiteSpace: "nowrap",
    },

    reserved: {
        padding: "5px 9px",
        borderRadius: "12px",
        backgroundColor: "#fff3cd",
        color: "#856404",
        whiteSpace: "nowrap",
    },

    sold: {
        padding: "5px 9px",
        borderRadius: "12px",
        backgroundColor: "#e3e8ff",
        color: "#3346a8",
        whiteSpace: "nowrap",
    },

    deleteButton: {
        padding: "8px 12px",
        backgroundColor: "#dc3545",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        whiteSpace: "nowrap",
    },

    success: {
        padding: "12px",
        backgroundColor: "#e8f5e9",
        color: "#237a35",
        borderRadius: "6px",
        marginBottom: "15px",
    },

    error: {
        padding: "12px",
        backgroundColor: "#fff0ef",
        color: "#b42318",
        borderRadius: "6px",
        marginBottom: "15px",
    },

    retryButton: {
        marginTop: "10px",
        padding: "8px 12px",
        border: "none",
        borderRadius: "5px",
        backgroundColor: "#5b2c83",
        color: "white",
        cursor: "pointer",
    },

    empty: {
        padding: "35px",
        textAlign: "center",
        backgroundColor: "#f8f8f8",
        borderRadius: "8px",
    },
};

export default AdminProducts;