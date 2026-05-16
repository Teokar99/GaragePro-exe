import React, { useState } from "react";
import { customersRepository } from "../../lib/repositories/customersRepository";
import type { Customer } from "../../types";
import { logError } from "../../utils/errorHandler";

interface CustomerFormProps {
  customer?: Customer;
  onClose: () => void;
  onSave: () => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  customer,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: customer?.name || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    afm: customer?.afm || "",
    address: customer?.address || "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    afm?: string;
  }>({});

  const NAME_MIN = 2;
  const NAME_MAX = 60;

  const digitsOnly = (s: string) => s.replace(/\D/g, "");

  const validate = (data: typeof formData) => {
    const next: { name?: string; phone?: string; afm?: string } = {};

    const nameTrimmed = data.name.trim();
    if (nameTrimmed.length < NAME_MIN)
      next.name = `Name must be at least ${NAME_MIN} characters.`;
    else if (nameTrimmed.length > NAME_MAX)
      next.name = `Name cannot exceed ${NAME_MAX} characters.`;

    const phoneDigits = digitsOnly(data.phone);
    if (phoneDigits.length !== 10)
      next.phone = "Phone must be exactly 10 digits.";

    const afmDigits = digitsOnly(data.afm);
    if (afmDigits.length > 0 && afmDigits.length !== 9)
      next.afm = "AFM must be exactly 9 digits.";

    return next;
  };

  const hasErrors = (e: typeof errors) => Boolean(e.name || e.phone || e.afm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1) validate πριν αποθήκευση
    const nextErrors = validate(formData);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: digitsOnly(formData.phone),
        address: formData.address.trim(),
        afm: digitsOnly(formData.afm),
      };

      if (customer) {
        await customersRepository.updateCustomer(customer.id, payload);
      } else {
        await customersRepository.createCustomer(payload);
      }

      void onSave();
      onClose();
    } catch (error) {
      logError("Error saving customer", error);
      alert("Error saving customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Name *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => {
            const value = e.target.value.slice(0, NAME_MAX);
            const next = { ...formData, name: value };
            setFormData(next);
            setErrors(validate(next));
          }}
          maxLength={NAME_MAX}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.name ? (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {errors.name}
          </p>
        ) : (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {formData.name.trim().length}/{NAME_MAX}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Phone *
        </label>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          maxLength={10}
          value={formData.phone}
          onChange={(e) => {
            const cleaned = digitsOnly(e.target.value).slice(0, 10);
            const next = { ...formData, phone: cleaned };
            setFormData(next);
            setErrors(validate(next));
          }}
          placeholder="10 digits (e.g., 6912345678)"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.phone ? (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {errors.phone}
          </p>
        ) : null}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          AFM
        </label>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={9}
          value={formData.afm}
          onChange={(e) => {
            const cleaned = digitsOnly(e.target.value).slice(0, 9);
            const next = { ...formData, afm: cleaned };
            setFormData(next);
            setErrors(validate(next));
          }}
          placeholder="9 digits AFM (optional)"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {errors.afm ? (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {errors.afm}
          </p>
        ) : null}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Address
        </label>
        <textarea
          value={formData.address}
          onChange={(e) =>
            setFormData({ ...formData, address: e.target.value })
          }
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Customer address (optional)"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="submit"
          disabled={loading || hasErrors(errors)}
          className="sm:flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Saving..." : customer ? "Update" : "Add Customer"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="sm:flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
