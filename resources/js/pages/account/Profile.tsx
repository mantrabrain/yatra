import React, { useState, useEffect } from "react";
import {
  User,
  PenSquare,
  ShieldCheck,
  Mail,
  Heart,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { __ } from "../../lib/i18n";
import { formatDate, currency } from "./utils";
import type { CustomerProfile } from "./types";

interface ProfileProps {
  profile: CustomerProfile | null;
  savedTrips: any[];
  wishlistEnabled?: boolean;
}

const Profile: React.FC<ProfileProps> = ({
  profile,
  savedTrips,
  wishlistEnabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
  });

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Update formData when profile changes
  useEffect(() => {
    if (profile && !isEditing) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        country: profile.country || "",
      });
    }
  }, [profile, isEditing]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        country: profile.country || "",
      });
    }
  };

  return (
    <div className="yatra-profile-page space-y-6">
      {/* Header */}
      <div className="yatra-profile-header bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-yatra-soft dark:bg-yatra-surface-dark-muted rounded-lg">
                <User className="w-6 h-6 text-yatra-primary dark:text-yatra-on-dark" />
              </div>
              {__("Profile", "yatra")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {__(
                "Update your contact details, address, and communication preferences.",
                "yatra",
              )}
            </p>
          </div>
          {!isEditing && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => setIsEditing(true)}
              className="yatra-profile-edit-btn inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yatra-primary text-white hover:bg-yatra-primary-dark transition-colors text-sm font-medium cursor-pointer"
            >
              <PenSquare className="w-4 h-4" /> {__("Edit Profile", "yatra")}
            </div>
          )}
        </div>
      </div>

      {/* Profile Form */}
      <div className="yatra-profile-card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
        <div className="yatra-profile-fields space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="yatra-profile-field">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {__("Full Name", "yatra")}{" "}
                <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-yatra-primary focus:border-transparent"
                  placeholder={__("Enter your full name", "yatra")}
                />
              ) : (
                <p className="text-sm font-medium text-gray-900 dark:text-white py-2">
                  {formData.name || __("Not set", "yatra")}
                </p>
              )}
            </div>

            <div className="yatra-profile-field">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {__("Email Address", "yatra")}{" "}
                <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-yatra-primary focus:border-transparent"
                  placeholder={__("Enter your email address", "yatra")}
                />
              ) : (
                <p className="text-sm font-medium text-gray-900 dark:text-white py-2">
                  {formData.email || __("Not set", "yatra")}
                </p>
              )}
            </div>

            <div className="yatra-profile-field">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {__("Phone Number", "yatra")}
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-yatra-primary focus:border-transparent"
                  placeholder={__("Enter your phone number", "yatra")}
                />
              ) : (
                <p className="text-sm font-medium text-gray-900 dark:text-white py-2">
                  {formData.phone || __("Not set", "yatra")}
                </p>
              )}
            </div>

            <div className="yatra-profile-field">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {__("City", "yatra")}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-yatra-primary focus:border-transparent"
                  placeholder={__("Enter your city", "yatra")}
                />
              ) : (
                <p className="text-sm font-medium text-gray-900 dark:text-white py-2">
                  {formData.city || __("Not set", "yatra")}
                </p>
              )}
            </div>

            <div className="yatra-profile-field md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {__("Address", "yatra")}
              </label>
              {isEditing ? (
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-yatra-primary focus:border-transparent"
                  placeholder={__("Enter your address", "yatra")}
                />
              ) : (
                <p className="text-sm font-medium text-gray-900 dark:text-white py-2">
                  {formData.address || __("Not set", "yatra")}
                </p>
              )}
            </div>

            <div className="yatra-profile-field">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {__("Country", "yatra")}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-yatra-primary focus:border-transparent"
                  placeholder={__("Enter your country", "yatra")}
                />
              ) : (
                <p className="text-sm font-medium text-gray-900 dark:text-white py-2">
                  {formData.country || __("Not set", "yatra")}
                </p>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="yatra-profile-actions flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-yatra-primary text-white hover:bg-yatra-primary-dark transition-colors text-sm font-medium"
              >
                <CheckCircle className="w-4 h-4" />
                {__("Save Changes", "yatra")}
              </button>
              <div
                role="button"
                tabIndex={0}
                onClick={handleCancel}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                {__("Cancel", "yatra")}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Section */}
      <div className="yatra-profile-password bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-yatra-primary dark:text-yatra-on-dark" />
              {__("Change Password", "yatra")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {__("Update your password to keep your account secure.", "yatra")}
            </p>
          </div>
          {!isChangingPassword && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => setIsChangingPassword(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yatra-primary text-white hover:bg-yatra-primary-dark transition-colors text-sm font-medium cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              {__("Change Password", "yatra")}
            </div>
          )}
        </div>

        {isChangingPassword && (
          <div className="space-y-4">
            <div className="yatra-password-field">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {__("Current Password", "yatra")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-yatra-primary focus:border-transparent"
                placeholder={__("Enter your current password", "yatra")}
              />
            </div>

            <div className="yatra-password-field">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {__("New Password", "yatra")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-yatra-primary focus:border-transparent"
                placeholder={__("Enter new password", "yatra")}
              />
            </div>

            <div className="yatra-password-field">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {__("Confirm New Password", "yatra")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-yatra-primary focus:border-transparent"
                placeholder={__("Confirm your new password", "yatra")}
              />
              {passwordData.newPassword &&
                passwordData.confirmPassword &&
                passwordData.newPassword !== passwordData.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    {__("Passwords do not match", "yatra")}
                  </p>
                )}
            </div>

            <div className="yatra-password-actions flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  // TODO: Implement password change functionality
                  if (
                    passwordData.newPassword !== passwordData.confirmPassword
                  ) {
                    return;
                  }
                  setIsChangingPassword(false);
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
                disabled={
                  !passwordData.currentPassword ||
                  !passwordData.newPassword ||
                  !passwordData.confirmPassword ||
                  passwordData.newPassword !== passwordData.confirmPassword
                }
                className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-yatra-primary text-white hover:bg-yatra-primary-dark transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" />
                {__("Update Password", "yatra")}
              </button>
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setIsChangingPassword(false);
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                {__("Cancel", "yatra")}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Additional Sections */}
      <div className="yatra-profile-sections grid gap-6 lg:grid-cols-2">
        <div className="yatra-profile-communication bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-yatra-primary dark:text-yatra-on-dark" />
            {__("Communication Preferences", "yatra")}
          </h3>
          <div className="yatra-profile-preferences space-y-3 text-sm">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded text-yatra-primary focus:ring-yatra-primary"
              />
              <span className="text-gray-700 dark:text-gray-300">
                {__("Booking reminders", "yatra")}
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded text-yatra-primary focus:ring-yatra-primary"
              />
              <span className="text-gray-700 dark:text-gray-300">
                {__("Payment notifications", "yatra")}
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded text-yatra-primary focus:ring-yatra-primary"
              />
              <span className="text-gray-700 dark:text-gray-300">
                {__("Promotional offers", "yatra")}
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded text-yatra-primary focus:ring-yatra-primary"
              />
              <span className="text-gray-700 dark:text-gray-300">
                {__("Trip updates", "yatra")}
              </span>
            </label>
          </div>
        </div>

        {wishlistEnabled && (
          <div className="yatra-profile-saved-trips bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-600 dark:text-red-400" />
              {__("Saved Trips", "yatra")}
            </h3>
            <div className="yatra-saved-trips-list space-y-3">
              {savedTrips.length > 0 ? (
                savedTrips.map((trip: any) => (
                  <div
                    key={trip.id || trip.trip_id}
                    className="yatra-saved-trip-item flex items-center justify-between border border-gray-100 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {trip.trip_title || trip.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatDate(trip.next_departure)}
                      </p>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {__("From", "yatra")}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {currency(trip.price_from || trip.price || 0)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  {__("No saved trips yet", "yatra")}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
