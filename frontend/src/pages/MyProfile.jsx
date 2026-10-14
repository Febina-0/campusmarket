import React, { useEffect, useState } from "react";
import { User, Mail, Phone, Save, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { updateUserProfile } from "../api/users";

const MyProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load existing user details
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  // Update profile
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setError("");

      const data = await updateUserProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
      });

      setMessage(
        data.message || "Profile updated successfully."
      );

      // Update displayed form values with backend response
      if (data.user) {
        setFormData({
          name: data.user.name || "",
          phone: data.user.phone || "",
        });
      }
    } catch (err) {
      console.error("Profile update error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to update profile."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">
          Loading profile...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* BACK */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            My Profile
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Manage your CampusMarket profile information.
          </p>
        </div>

        {/* PROFILE CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* PROFILE HEADER */}
          <div className="bg-indigo-50 px-6 py-6">
            <div className="flex items-center gap-4">

              <div className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold">
                {user.name
                  ? user.name[0].toUpperCase()
                  : "U"}
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {user.name || "User"}
                </h2>

                <p className="text-sm text-slate-500">
                  {user.email}
                </p>
              </div>

            </div>
          </div>

          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-5"
          >

            {/* NAME */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Full Name
              </label>

              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* EMAIL - READ ONLY */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

                <input
                  type="email"
                  value={user.email || ""}
                  disabled
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>

              <p className="text-xs text-slate-400 mt-1">
                Email cannot be changed.
              </p>
            </div>

            {/* PHONE */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Phone Number
              </label>

              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* ROLE */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Account Role
              </label>

              <div className="px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-sm">
                {user.role || "User"}
              </div>
            </div>

            {/* SUCCESS */}
            {message && (
              <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
                ✓ {message}
              </div>
            )}

            {/* ERROR */}
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
                {error}
              </div>
            )}

            {/* SAVE */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />

              {loading
                ? "Saving Changes..."
                : "Save Changes"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;