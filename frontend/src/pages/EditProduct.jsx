import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProductById, updateProduct } from "../api/products";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    condition: "",
  });

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await getProductById(id);
        const product = data.product;

        setFormData({
          title: product.title || "",
          description: product.description || "",
          price: product.price || "",
          category: product.category || "",
          condition: product.condition || "",
        });
      } catch (err) {
        console.error(err);

        setError(
          err.response?.data?.message ||
            "Failed to load product"
        );
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      const data = new FormData();

      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("price", formData.price);
      data.append("category", formData.category);
      data.append("condition", formData.condition);

      images.forEach((image) => {
        data.append("images", image);
      });

      await updateProduct(id, data);

      alert("Product updated successfully!");

      navigate(`/products/${id}`);

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to update product"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        Loading product...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">

      <h1 className="text-2xl font-bold text-slate-800 mb-6">
        Edit Item
      </h1>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5"
      >

        {/* TITLE */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Title
          </label>

          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5"
            required
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Description
          </label>

          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="5"
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5"
            required
          />
        </div>

        {/* PRICE */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Price
          </label>

          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            min="0"
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5"
            required
          />
        </div>

        {/* CATEGORY */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Category
          </label>

          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5"
          />
        </div>

        {/* CONDITION */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Condition
          </label>

          <input
            type="text"
            name="condition"
            value={formData.condition}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5"
          />
        </div>

        {/* IMAGES */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Replace Images
          </label>

          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="w-full"
          />

          <p className="text-xs text-slate-500 mt-2">
            Leave empty if you don't want to change the images.
          </p>
        </div>

        {/* BUTTONS */}
        <div className="flex gap-3 pt-3">

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-2.5 rounded-xl border border-slate-300 font-semibold hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

        </div>

      </form>
    </div>
  );
};

export default EditProduct;