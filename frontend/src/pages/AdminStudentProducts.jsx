
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getStudentProducts } from "../api/admin";

function AdminStudentProducts() {
    const { userId } = useParams();
    const navigate = useNavigate();

    const [student, setStudent] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            if (!userId) {
                throw new Error("Student ID is missing.");
            }

            const data = await getStudentProducts(userId);

            setStudent(data.student || null);
            setProducts(
                Array.isArray(data.products) ? data.products : []
            );
        } catch (err) {
            setStudent(null);
            setProducts([]);

            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to load this student's products."
            );
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

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
                    <h1 style={styles.title}>Student Products</h1>

                    <p style={styles.subtitle}>
                        All marketplace listings posted by this student.
                    </p>
                </div>

                <button
                    type="button"
                    style={styles.backButton}
                    onClick={() => navigate("/admin/users")}
                >
                    Back to Manage Students
                </button>
            </header>

            {loading && (
                <p style={styles.loading}>
                    Loading student products...
                </p>
            )}

            {!loading && error && (
                <div style={styles.error} role="alert">
                    <p>{error}</p>

                    <button
                        type="button"
                        style={styles.retryButton}
                        onClick={fetchProducts}
                    >
                        Try Again
                    </button>
                </div>
            )}

            {!loading && !error && student && (
                <>
                    <div style={styles.studentCard}>
                        <h2 style={styles.studentName}>
                            {student.name || "Student"}
                        </h2>

                        <p>
                            <strong>Email:</strong>{" "}
                            {student.email || "N/A"}
                        </p>

                        <p>
                            <strong>Total Listings:</strong>{" "}
                            {products.length}
                        </p>
                    </div>

                    {products.length === 0 ? (
                        <div style={styles.empty}>
                            <h3>No products found</h3>
                            <p>
                                This student has not posted any products.
                            </p>
                        </div>
                    ) : (
                        <div style={styles.tableContainer}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>No.</th>
                                        <th style={styles.th}>Product</th>
                                        <th style={styles.th}>Category</th>
                                        <th style={styles.th}>Price</th>
                                        <th style={styles.th}>Condition</th>
                                        <th style={styles.th}>Status</th>
                                        <th style={styles.th}>Posted On</th>
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
                                                        {product.title ||
                                                            "Untitled product"}
                                                    </span>
                                                </div>
                                            </td>

                                            <td style={styles.td}>
                                                {product.category || "N/A"}
                                            </td>

                                            <td style={styles.td}>
                                                ₹
                                                {Number(
                                                    product.price || 0
                                                ).toLocaleString("en-IN")}
                                            </td>

                                            <td style={styles.td}>
                                                {product.condition || "N/A"}
                                            </td>

                                            <td style={styles.td}>
                                                <span
                                                    style={statusStyle(
                                                        product.status
                                                    )}
                                                >
                                                    {product.status || "N/A"}
                                                </span>
                                            </td>

                                            <td style={styles.td}>
                                                {formatDate(product.createdAt)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

const styles = {
    container: {
        maxWidth: "1250px",
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

    loading: {
        color: "#666",
        padding: "15px 0",
    },

    studentCard: {
        padding: "22px",
        backgroundColor: "#f3edff",
        borderRadius: "10px",
        marginBottom: "25px",
        overflowWrap: "anywhere",
    },

    studentName: {
        marginTop: 0,
        color: "#5b2c83",
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
        whiteSpace: "nowrap",
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

    empty: {
        padding: "35px",
        textAlign: "center",
        backgroundColor: "#f8f8f8",
        borderRadius: "8px",
    },

    error: {
        padding: "15px",
        color: "#b42318",
        backgroundColor: "#fff0ef",
        borderRadius: "8px",
        marginBottom: "15px",
    },

    retryButton: {
        padding: "8px 14px",
        backgroundColor: "#5b2c83",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
    },
};

export default AdminStudentProducts;