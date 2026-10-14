
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getAdminDashboard } from "../api/admin";

function AdminDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        const fetchStatistics = async () => {
            try {
                const data = await getAdminDashboard();

                if (isMounted) {
                    setStatistics(data.statistics);
                    setError("");
                }
            } catch (err) {
                if (!isMounted) return;

                const status = err.response?.status;

                if (status === 401 || status === 403) {
                    setError(
                        status === 401
                            ? "Your session has expired. Please log in again."
                            : "Access denied. Administrator privileges are required."
                    );
                } else {
                    setError(
                        err.response?.data?.message ||
                        err.message ||
                        "Failed to load dashboard statistics."
                    );
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchStatistics();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    const cards = [
        {
            title: "Total Students",
            value: statistics?.totalUsers ?? 0,
            icon: "👥",
        },
        {
            title: "Total Products",
            value: statistics?.totalProducts ?? 0,
            icon: "📦",
        },
        {
            title: "Available Products",
            value: statistics?.availableProducts ?? 0,
            icon: "✅",
        },
        {
            title: "Reserved Products",
            value: statistics?.reservedProducts ?? 0,
            icon: "🛒",
        },
        {
            title: "Sold Products",
            value: statistics?.soldProducts ?? 0,
            icon: "✔️",
        },
    ];

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div>
                    <h1 style={styles.title}>Admin Dashboard</h1>
                    <p style={styles.subtitle}>
                        Manage your Campus Marketplace
                    </p>
                </div>

                <button
                    onClick={handleLogout}
                    style={styles.logoutButton}
                >
                    Logout
                </button>
            </header>

            <section style={styles.welcome}>
                <h2>Welcome, {user?.name || "Admin"}!</h2>

                <p>
                    Manage student accounts and product listings
                    from your administrator dashboard.
                </p>

                <p>
                    <strong>Email:</strong>{" "}
                    {user?.email || "Not available"}
                </p>
            </section>

            <h2 style={styles.sectionTitle}>
                Marketplace Statistics
            </h2>

            {loading && (
                <div style={styles.infoBox}>
                    Loading dashboard statistics...
                </div>
            )}

            {!loading && error && (
                <div style={styles.errorBox}>
                    <p style={styles.error}>{error}</p>

                    {(
                        error.includes("session has expired") ||
                        error.includes("Access denied")
                    ) ? (
                        <button
                            style={styles.button}
                            onClick={handleLogout}
                        >
                            Go to Login
                        </button>
                    ) : (
                        <button
                            style={styles.button}
                            onClick={() => window.location.reload()}
                        >
                            Retry
                        </button>
                    )}
                </div>
            )}

            {!loading && !error && (
                <div style={styles.grid}>
                    {cards.map((card) => (
                        <div style={styles.card} key={card.title}>
                            <div style={styles.icon}>
                                {card.icon}
                            </div>

                            <h3 style={styles.cardTitle}>
                                {card.title}
                            </h3>

                            <p style={styles.number}>
                                {card.value}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            <h2 style={styles.sectionTitle}>
                Marketplace Management
            </h2>

            <div style={styles.managementGrid}>
                <div style={styles.card}>
                    <div style={styles.icon}>👥</div>

                    <h3 style={styles.cardTitle}>
                        Manage Students
                    </h3>

                    <p style={styles.description}>
                        View student accounts and permanently delete
                        student accounts when necessary.
                    </p>

                    <button
                        style={styles.button}
                        onClick={() => navigate("/admin/users")}
                    >
                        Manage Students
                    </button>
                </div>

                <div style={styles.card}>
                    <div style={styles.icon}>📦</div>

                    <h3 style={styles.cardTitle}>
                        Manage Products
                    </h3>

                    <p style={styles.description}>
                        View student listings and permanently delete
                        products along with their related records.
                    </p>

                    <button
                        style={styles.button}
                        onClick={() => navigate("/admin/products")}
                    >
                        Manage Products
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        padding: "30px",
        maxWidth: "1200px",
        margin: "0 auto",
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

    logoutButton: {
        padding: "10px 20px",
        backgroundColor: "#dc3545",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "600",
    },

    welcome: {
        backgroundColor: "#f3edff",
        padding: "22px",
        borderRadius: "10px",
        marginBottom: "30px",
        overflowWrap: "anywhere",
    },

    sectionTitle: {
        marginTop: "30px",
        marginBottom: "20px",
        color: "#333",
    },

    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
        gap: "20px",
    },

    managementGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "20px",
        alignItems: "stretch",
    },

    card: {
        padding: "24px",
        border: "1px solid #ddd",
        borderRadius: "10px",
        backgroundColor: "white",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        minWidth: 0,
    },

    icon: {
        fontSize: "32px",
        marginBottom: "8px",
    },

    cardTitle: {
        margin: "8px 0",
        overflowWrap: "anywhere",
    },

    number: {
        fontSize: "28px",
        fontWeight: "bold",
        color: "#5b2c83",
        marginBottom: 0,
    },

    description: {
        color: "#666",
        lineHeight: 1.6,
        flexGrow: 1,
    },

    button: {
        marginTop: "12px",
        padding: "10px 14px",
        backgroundColor: "#5b2c83",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "600",
    },

    infoBox: {
        padding: "18px",
        backgroundColor: "#f8f8f8",
        borderRadius: "8px",
        color: "#555",
    },

    errorBox: {
        padding: "18px",
        backgroundColor: "#fff5f5",
        border: "1px solid #f1caca",
        borderRadius: "8px",
    },

    error: {
        color: "#b42318",
        marginTop: 0,
    },
};

export default AdminDashboard;