import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Shield,
  Building,
  Calendar,
  Lock,
  CheckCircle2,
  Save,
  Edit2,
  X,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const MyProfile = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    // Simulate API call
    setTimeout(() => {
      // TODO: Implement actual API call to update user profile
      console.log('Saving profile:', formData);
      setIsSaving(false);
      setIsEditing(false);

      // Show success message
      alert('Profile updated successfully!');
    }, 1000);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      department: user?.department || '',
    });
    setIsEditing(false);
  };

  return (
    <DashboardLayout user={user} logout={logout}>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-primaryText mb-2">My Profile</h1>
        <p className="text-secondaryText text-base">
          View and manage your account information and preferences.
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white border border-border rounded-xl p-6 shadow-sm mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primaryAccent to-secondaryAccent flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {formData.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primaryText">{formData.name || 'User'}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center px-3 py-1.5 bg-primaryAccent/10 text-primaryAccent text-sm font-semibold rounded-lg border border-primaryAccent/20 capitalize">
                  {user?.role || 'Employee'}
                </span>
              </div>
            </div>
          </div>

          {/* Edit Button */}
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primaryAccent text-white font-semibold rounded-lg hover:bg-primaryAccent/90 transition-all"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-primaryText font-semibold rounded-lg hover:bg-gray-300 transition-all"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-success text-white font-semibold rounded-lg hover:bg-success/90 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Profile Fields */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Name Field */}
          <div className="flex items-start gap-3 p-4 bg-mainBg rounded-lg">
            <User className="w-5 h-5 text-secondaryText mt-3 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-secondaryText uppercase tracking-wide mb-2">
                Full Name
              </p>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm font-medium text-primaryText focus:outline-none focus:ring-2 focus:ring-primaryAccent"
                  placeholder="Enter your full name"
                />
              ) : (
                <p className="text-sm font-medium text-primaryText">{formData.name || 'N/A'}</p>
              )}
            </div>
          </div>

          {/* Email Field */}
          <div className="flex items-start gap-3 p-4 bg-mainBg rounded-lg">
            <Mail className="w-5 h-5 text-secondaryText mt-3 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-secondaryText uppercase tracking-wide mb-2">
                Email Address
              </p>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm font-medium text-primaryText focus:outline-none focus:ring-2 focus:ring-primaryAccent"
                  placeholder="Enter your email"
                />
              ) : (
                <p className="text-sm font-medium text-primaryText break-all">
                  {formData.email || 'N/A'}
                </p>
              )}
            </div>
          </div>

          {/* Department Field */}
          <div className="flex items-start gap-3 p-4 bg-mainBg rounded-lg">
            <Building className="w-5 h-5 text-secondaryText mt-3 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-secondaryText uppercase tracking-wide mb-2">
                Department
              </p>
              {isEditing ? (
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm font-medium text-primaryText focus:outline-none focus:ring-2 focus:ring-primaryAccent"
                  placeholder="Enter your department"
                />
              ) : (
                <p className="text-sm font-medium text-primaryText">{formData.department || 'N/A'}</p>
              )}
            </div>
          </div>

          {/* Role Field (Read-only) */}
          <div className="flex items-start gap-3 p-4 bg-mainBg rounded-lg">
            <Shield className="w-5 h-5 text-secondaryText mt-3 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-secondaryText uppercase tracking-wide mb-2">
                Platform Role
              </p>
              <p className="text-sm font-medium text-primaryText capitalize">
                {user?.role || 'Employee'}
              </p>
              <p className="text-xs text-secondaryText mt-1">Cannot be changed</p>
            </div>
          </div>

          {/* Registration Date (Read-only) */}
          <div className="flex items-start gap-3 p-4 bg-mainBg rounded-lg">
            <Calendar className="w-5 h-5 text-secondaryText mt-3 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-secondaryText uppercase tracking-wide mb-2">
                Member Since
              </p>
              <p className="text-sm font-medium text-primaryText">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Account & Security Section */}
      <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-primaryText mb-4">Account & Security</h3>

        <div className="space-y-4">
          {/* Security Status */}
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-success" />
              <div>
                <p className="text-sm font-semibold text-primaryText">Security Status</p>
                <p className="text-xs text-secondaryText">
                  RBAC & ABAC authentication active
                </p>
              </div>
            </div>
            <CheckCircle2 className="w-6 h-6 text-success" />
          </div>

          {/* Change Password */}
          <div className="flex items-center justify-between p-4 bg-mainBg rounded-lg">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-secondaryText" />
              <div>
                <p className="text-sm font-semibold text-primaryText">Password</p>
                <p className="text-xs text-secondaryText">Last changed 30 days ago</p>
              </div>
            </div>
            <button className="px-4 py-2 text-primaryAccent font-semibold text-sm hover:bg-primaryAccent/10 rounded-lg transition-all">
              Change Password
            </button>
          </div>

          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between p-4 bg-mainBg rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-secondaryText" />
              <div>
                <p className="text-sm font-semibold text-primaryText">Two-Factor Authentication</p>
                <p className="text-xs text-secondaryText">Add an extra layer of security</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-primaryAccent text-white font-semibold text-sm rounded-lg hover:bg-primaryAccent/90 transition-all">
              Enable 2FA
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyProfile;
