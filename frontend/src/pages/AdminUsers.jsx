
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getAdminUsers,
    deleteAdminUser,
} from "../api/admin";

function AdminUsers() {
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [deletingId, setDeletingId] = useState(null);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getAdminUsers();

            setUsers(Array.isArray(data.users) ? data.users : []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to load student accounts."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleDelete = async (student) => {
        if (deletingId) return;

        const studentName =
            student.name || student.email || "this student";

        const confirmed = window.confirm(
            `Permanently delete ${studentName}'s account?\n\n` +
            "This will permanently delete the student account, " +
            "their products, and related records, including linked " +
            "conversations, messages, reservations, and orders.\n\n" +
            "This action cannot be undone."
        );

        if (!confirmed) return;

        try {
            setDeletingId(student._id);
            setError("");
            setMessage("");

            const result = await deleteAdminUser(student._id);

            setUsers((previousUsers) =>
                previousUsers.filter(
                    (user) => user._id !== student._id
                )
            );

            setMessage(
                result.message ||
                "Student account permanently deleted."
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to delete the student account."
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

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div>
                    <h1 style={styles.title}>Manage Students</h1>

                    <p style={styles.subtitle}>
                        View student accounts and their marketplace listings.
                    </p>
                </div>

                <button
                    type="button"
                    style={styles.backButton}
                    onClick={() => navigate("/admin/dashboard")}
                >
                    Back to Dashboard
                </button>
            </header>

            <div style={styles.summary}>
                <h3 style={styles.summaryTitle}>Total Students</h3>

                <p style={styles.count}>
                    {loading ? "..." : users.length}
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
                        type="button"
                        style={styles.retryButton}
                        onClick={fetchUsers}
                        disabled={deletingId !== null}
                    >
                        Try Again
                    </button>
                </div>
            )}

            {loading && <p>Loading student accounts...</p>}

            {!loading && !error && users.length === 0 && (
                <div style={styles.empty}>
                    <h3>No students found</h3>
                    <p>
                        Registered student accounts will appear here.
                    </p>
                </div>
            )}

            {!loading && users.length > 0 && (
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>No.</th>
                                <th style={styles.th}>Student Name</th>
                                <th style={styles.th}>Email</th>
                                <th style={styles.th}>Registered On</th>
                                <th style={styles.th}>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {users.map((student, index) => (
                                <tr key={student._id}>
                                    <td style={styles.td}>
                                        {index + 1}
                                    </td>

                                    <td style={styles.td}>
                                        {student.name || "N/A"}
                                    </td>

                                    <td style={styles.td}>
                                        {student.email || "N/A"}
                                    </td>

                                    <td style={styles.td}>
                                        {formatDate(student.createdAt)}
                                    </td>

                                    <td style={styles.td}>
                                        <div style={styles.actions}>
                                            <button
                                                type="button"
                                                style={styles.viewButton}
                                                disabled={deletingId !== null}
                                                onClick={() =>
                                                    navigate(
                                                        `/admin/users/${student._id}/products`
                                                    )
                                                }
                                            >
                                                View Products
                                            </button>

                                            <button
                                                type="button"
                                                style={{
                                                    ...styles.deleteButton,
                                                    opacity:
                                                        deletingId !== null
                                                            ? 0.6
                                                            : 1,
                                                }}
                                                disabled={deletingId !== null}
                                                onClick={() =>
                                                    handleDelete(student)
                                                }
                                            >
                                                {deletingId === student._id
                                                    ? "Deleting..."
                                                    : "Delete Student"}
                                            </button>
                                        </div>
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
        maxWidth: "1200px",
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
        marginBottom: "20px",
        maxWidth: "260px",
    },

    summaryTitle: {
        marginTop: 0,
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
        padding: "14px",
        borderBottom: "1px solid #eee",
        verticalAlign: "middle",
    },

    actions: {
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
    },

    viewButton: {
        padding: "8px 11px",
        backgroundColor: "#5b2c83",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
    },

    deleteButton: {
        padding: "8px 11px",
        backgroundColor: "#dc3545",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
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
        padding: "8px 12px",
        backgroundColor: "#5b2c83",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
    },

    empty: {
        padding: "35px",
        textAlign: "center",
        backgroundColor: "#f8f8f8",
        borderRadius: "8px",
    },
};

export default AdminUsers;