import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { 
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarDaysIcon,
  MapPinIcon,
  CameraIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

function UserProfile() {
  const { user, updateUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        gender: user.gender || '',
        address: user.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        },
        emergencyContact: user.emergencyContact || {
          name: '',
          phone: '',
          relationship: ''
        }
      });
    }
  }, [user]);

  // Handle profile update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updateData = { ...profileData };

      const response = await authAPI.updateProfile(updateData);
      updateUser(response.data.user);
      
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
              <UserIcon className="h-12 w-12 text-blue-600" />
            </div>
            <button className="absolute -bottom-1 -right-1 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-gray-50">
              <CameraIcon className="h-4 w-4 text-gray-600" />
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {user?.name || 'Your Profile'}
          </h1>
          <p className="text-gray-600">
            Manage your account settings
          </p>
        </div>

        {/* Personal Information */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn btn-secondary"
            >
              {isEditing ? (
                <>
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit
                </>
              )}
            </button>
          </div>

          <form onSubmit={handleUpdateProfile}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">
                  <UserIcon className="h-4 w-4 mr-2" />
                  Full Name
                </label>
                <input
                  type="text"
                  className="input"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div>
                <label className="label">
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  className="input"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div>
                <label className="label">
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="input"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="label">
                  <CalendarDaysIcon className="h-4 w-4 mr-2" />
                  Date of Birth
                </label>
                <input
                  type="date"
                  className="input"
                  value={profileData.dateOfBirth}
                  onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="label">Gender</label>
                <select
                  className="input"
                  value={profileData.gender}
                  onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                  disabled={!isEditing}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* Address Section */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <MapPinIcon className="h-5 w-5 mr-2" />
                Address
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="label">Street Address</label>
                  <input
                    type="text"
                    className="input"
                    value={profileData.address.street}
                    onChange={(e) => setProfileData({ 
                      ...profileData, 
                      address: { ...profileData.address, street: e.target.value }
                    })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="label">City</label>
                  <input
                    type="text"
                    className="input"
                    value={profileData.address.city}
                    onChange={(e) => setProfileData({ 
                      ...profileData, 
                      address: { ...profileData.address, city: e.target.value }
                    })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="label">State/Province</label>
                  <input
                    type="text"
                    className="input"
                    value={profileData.address.state}
                    onChange={(e) => setProfileData({ 
                      ...profileData, 
                      address: { ...profileData.address, state: e.target.value }
                    })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="label">ZIP/Postal Code</label>
                  <input
                    type="text"
                    className="input"
                    value={profileData.address.zipCode}
                    onChange={(e) => setProfileData({ 
                      ...profileData, 
                      address: { ...profileData.address, zipCode: e.target.value }
                    })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="label">Country</label>
                  <input
                    type="text"
                    className="input"
                    value={profileData.address.country}
                    onChange={(e) => setProfileData({ 
                      ...profileData, 
                      address: { ...profileData.address, country: e.target.value }
                    })}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Name</label>
                  <input
                    type="text"
                    className="input"
                    value={profileData.emergencyContact.name}
                    onChange={(e) => setProfileData({ 
                      ...profileData, 
                      emergencyContact: { ...profileData.emergencyContact, name: e.target.value }
                    })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input
                    type="tel"
                    className="input"
                    value={profileData.emergencyContact.phone}
                    onChange={(e) => setProfileData({ 
                      ...profileData, 
                      emergencyContact: { ...profileData.emergencyContact, phone: e.target.value }
                    })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="label">Relationship</label>
                  <input
                    type="text"
                    className="input"
                    value={profileData.emergencyContact.relationship}
                    onChange={(e) => setProfileData({ 
                      ...profileData, 
                      emergencyContact: { ...profileData.emergencyContact, relationship: e.target.value }
                    })}
                    disabled={!isEditing}
                    placeholder="e.g., Spouse, Parent, Friend"
                  />
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="mt-8 flex gap-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Logout Button */}
        <div className="mt-6">
          <button 
            onClick={logout}
            className="btn w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;