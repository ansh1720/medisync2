import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { 
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarDaysIcon,
  MapPinIcon,
  HeartIcon,
  ShieldCheckIcon,
  BellIcon,
  EyeIcon,
  KeyIcon,
  CameraIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'];
const ACTIVITY_LEVELS = ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'];

function UserProfile() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
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

  // Health information state
  const [healthData, setHealthData] = useState({
    bloodType: '',
    height: '',
    weight: '',
    activityLevel: '',
    allergies: [],
    medications: [],
    medicalConditions: [],
    smokingStatus: 'never',
    alcoholConsumption: 'never'
  });

  // Privacy & Notifications state
  const [preferences, setPreferences] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false,
      healthReminders: true,
      appointmentReminders: true,
      communityUpdates: false
    },
    privacy: {
      profileVisibility: 'private',
      shareHealthData: false,
      allowResearch: false
    }
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
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

      setHealthData({
        bloodType: user.healthInfo?.bloodType || '',
        height: user.healthInfo?.height || '',
        weight: user.healthInfo?.weight || '',
        activityLevel: user.healthInfo?.activityLevel || '',
        allergies: user.healthInfo?.allergies || [],
        medications: user.healthInfo?.medications || [],
        medicalConditions: user.healthInfo?.medicalConditions || [],
        smokingStatus: user.healthInfo?.smokingStatus || 'never',
        alcoholConsumption: user.healthInfo?.alcoholConsumption || 'never'
      });

      setPreferences({
        notifications: user.preferences?.notifications || {
          email: true,
          push: true,
          sms: false,
          healthReminders: true,
          appointmentReminders: true,
          communityUpdates: false
        },
        privacy: user.preferences?.privacy || {
          profileVisibility: 'private',
          shareHealthData: false,
          allowResearch: false
        }
      });
    }
  }, [user]);

  // Handle profile update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updateData = {
        ...profileData,
        healthInfo: healthData,
        preferences: preferences
      };

      console.log('Updating profile:', updateData);
      
      const response = await authAPI.updateProfile(updateData);
      console.log('Profile update response:', response.data);
      
      // Update user context
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

  // Handle password change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      toast.success('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
    } catch (error) {
      console.error('Password change error:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  // Add/remove array items (allergies, medications, etc.)
  const addArrayItem = (field, value) => {
    if (value.trim() && !healthData[field].includes(value.trim())) {
      setHealthData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
    }
  };

  const removeArrayItem = (field, index) => {
    setHealthData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const tabs = [
    { id: 'profile', label: 'Personal Info', icon: UserIcon },
    { id: 'health', label: 'Health Info', icon: HeartIcon },
    { id: 'privacy', label: 'Privacy & Notifications', icon: ShieldCheckIcon },
    { id: 'security', label: 'Security', icon: KeyIcon }
  ];

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
            Manage your account settings and health information
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Personal Information Tab */}
        {activeTab === 'profile' && (
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
        )}

        {/* Health Information Tab */}
        {activeTab === 'health' && (
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Health Information</h2>
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
                  <label className="label">Blood Type</label>
                  <select
                    className="input"
                    value={healthData.bloodType}
                    onChange={(e) => setHealthData({ ...healthData, bloodType: e.target.value })}
                    disabled={!isEditing}
                  >
                    <option value="">Select Blood Type</option>
                    {BLOOD_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Activity Level</label>
                  <select
                    className="input"
                    value={healthData.activityLevel}
                    onChange={(e) => setHealthData({ ...healthData, activityLevel: e.target.value })}
                    disabled={!isEditing}
                  >
                    <option value="">Select Activity Level</option>
                    <option value="sedentary">Sedentary</option>
                    <option value="lightly_active">Lightly Active</option>
                    <option value="moderately_active">Moderately Active</option>
                    <option value="very_active">Very Active</option>
                    <option value="extremely_active">Extremely Active</option>
                  </select>
                </div>

                <div>
                  <label className="label">Height (cm)</label>
                  <input
                    type="number"
                    className="input"
                    value={healthData.height}
                    onChange={(e) => setHealthData({ ...healthData, height: e.target.value })}
                    disabled={!isEditing}
                    placeholder="170"
                  />
                </div>

                <div>
                  <label className="label">Weight (kg)</label>
                  <input
                    type="number"
                    className="input"
                    value={healthData.weight}
                    onChange={(e) => setHealthData({ ...healthData, weight: e.target.value })}
                    disabled={!isEditing}
                    placeholder="70"
                  />
                </div>

                <div>
                  <label className="label">Smoking Status</label>
                  <select
                    className="input"
                    value={healthData.smokingStatus}
                    onChange={(e) => setHealthData({ ...healthData, smokingStatus: e.target.value })}
                    disabled={!isEditing}
                  >
                    <option value="never">Never smoked</option>
                    <option value="former">Former smoker</option>
                    <option value="current">Current smoker</option>
                  </select>
                </div>

                <div>
                  <label className="label">Alcohol Consumption</label>
                  <select
                    className="input"
                    value={healthData.alcoholConsumption}
                    onChange={(e) => setHealthData({ ...healthData, alcoholConsumption: e.target.value })}
                    disabled={!isEditing}
                  >
                    <option value="never">Never</option>
                    <option value="rarely">Rarely</option>
                    <option value="occasionally">Occasionally</option>
                    <option value="regularly">Regularly</option>
                  </select>
                </div>
              </div>

              {/* Allergies, Medications, Conditions */}
              <div className="mt-8 space-y-6">
                {['allergies', 'medications', 'medicalConditions'].map((field) => (
                  <div key={field}>
                    <label className="label capitalize">
                      {field === 'medicalConditions' ? 'Medical Conditions' : field}
                    </label>
                    <div className="space-y-2">
                      {healthData[field].map((item, index) => (
                        <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                          <span className="flex-1">{item}</span>
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => removeArrayItem(field, index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {isEditing && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            className="input flex-1"
                            placeholder={`Add ${field === 'medicalConditions' ? 'medical condition' : field.slice(0, -1)}`}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addArrayItem(field, e.target.value);
                                e.target.value = '';
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
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
                </div>
              )}
            </form>
          </div>
        )}

        {/* Privacy & Notifications Tab */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            {/* Notifications */}
            <div className="card">
              <div className="flex items-center mb-6">
                <BellIcon className="h-6 w-6 text-gray-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
              </div>

              <div className="space-y-4">
                {Object.entries(preferences.notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <p className="text-xs text-gray-500">
                        {key === 'email' && 'Receive notifications via email'}
                        {key === 'push' && 'Receive push notifications in browser'}
                        {key === 'sms' && 'Receive SMS notifications'}
                        {key === 'healthReminders' && 'Reminders for medication and health checks'}
                        {key === 'appointmentReminders' && 'Reminders for upcoming appointments'}
                        {key === 'communityUpdates' && 'Updates from community forum'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={value}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          notifications: {
                            ...preferences.notifications,
                            [key]: e.target.checked
                          }
                        })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="card">
              <div className="flex items-center mb-6">
                <EyeIcon className="h-6 w-6 text-gray-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Privacy Settings</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Profile Visibility</label>
                  <select
                    className="input"
                    value={preferences.privacy.profileVisibility}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      privacy: {
                        ...preferences.privacy,
                        profileVisibility: e.target.value
                      }
                    })}
                  >
                    <option value="private">Private</option>
                    <option value="friends">Friends Only</option>
                    <option value="public">Public</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">Share Health Data</label>
                    <p className="text-xs text-gray-500">Allow anonymized health data for research</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.privacy.shareHealthData}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        privacy: {
                          ...preferences.privacy,
                          shareHealthData: e.target.checked
                        }
                      })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">Research Participation</label>
                    <p className="text-xs text-gray-500">Allow participation in medical research studies</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.privacy.allowResearch}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        privacy: {
                          ...preferences.privacy,
                          allowResearch: e.target.checked
                        }
                      })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleUpdateProfile}
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
                      Save Preferences
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="card">
            <div className="flex items-center mb-6">
              <KeyIcon className="h-6 w-6 text-gray-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="space-y-6">
                <div>
                  <label className="label">Current Password</label>
                  <input
                    type="password"
                    className="input"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="label">New Password</label>
                  <input
                    type="password"
                    className="input"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="label">Confirm New Password</label>
                  <input
                    type="password"
                    className="input"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Changing Password...
                    </div>
                  ) : (
                    'Change Password'
                  )}
                </button>
              </div>
            </form>

            {/* Account Actions */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Actions</h3>
              <div className="space-y-4">
                <button className="btn btn-secondary">
                  Download My Data
                </button>
                <button className="btn btn-secondary text-red-600 border-red-300 hover:bg-red-50">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserProfile;