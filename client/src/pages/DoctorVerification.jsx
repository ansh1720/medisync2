import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { verificationAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import {
  DocumentCheckIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  TrophyIcon,
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const SPECIALTIES = [
  'general', 'cardiology', 'neurology', 'oncology', 'pediatrics',
  'orthopedics', 'dermatology', 'psychiatry', 'radiology',
  'surgery', 'emergency', 'internal_medicine', 'obstetrics',
  'urology', 'ophthalmology', 'anesthesiology', 'pathology',
  'family_medicine', 'geriatrics', 'infectious_disease',
  'endocrinology', 'gastroenterology', 'pulmonology',
  'rheumatology', 'hematology', 'nephrology', 'plastic_surgery'
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' }
];

function DoctorVerification() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [activeSection, setActiveSection] = useState('basic');

  const [formData, setFormData] = useState({
    // Basic Info
    specialty: '',
    subSpecialties: [],
    bio: '',
    experience: 0,
    languages: ['en'],
    consultationFee: { amount: 0, currency: 'USD' },

    // Medical License
    medicalLicense: {
      number: '',
      issuingAuthority: '',
      issuingCountry: '',
      issuingState: '',
      issueDate: '',
      expiryDate: ''
    },

    // Medical Council Registration
    medicalCouncilRegistration: {
      registrationNumber: '',
      councilName: '',
      registrationDate: ''
    },

    // Education
    education: [{
      degree: '',
      institution: '',
      fieldOfStudy: '',
      startYear: '',
      endYear: '',
      country: ''
    }],

    // Professional Experience
    professionalExperience: [],

    // Certifications
    specialtyCertifications: [],

    // Publications
    publications: [],

    // Awards
    awards: [],

    // Contact
    contact: {
      phone: '',
      officeAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States'
      }
    }
  });

  useEffect(() => {
    if (user?.role !== 'doctor') {
      navigate('/dashboard');
      return;
    }
    fetchVerificationStatus();
  }, [user, navigate]);

  const fetchVerificationStatus = async () => {
    try {
      const response = await verificationAPI.getVerificationStatus();
      if (response.data.success) {
        setVerificationStatus(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching verification status:', error);
    }
  };

  const handleInputChange = (section, field, value) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleNestedInputChange = (section, subsection, field, value) => {
    if (subsection) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [subsection]: {
            ...prev[section][subsection],
            [field]: value
          }
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    }
  };

  const addArrayItem = (field, emptyItem) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], emptyItem]
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const updateArrayItem = (field, index, key, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) =>
        i === index ? { ...item, [key]: value } : item
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.languages.length === 0) {
      toast.error('Please select at least one language');
      setActiveSection('basic');
      return;
    }

    if (!formData.medicalLicense.number) {
      toast.error('Medical license number is required');
      setActiveSection('license');
      return;
    }

    if (formData.education.length === 0 || !formData.education[0].degree) {
      toast.error('At least one education entry is required');
      setActiveSection('education');
      return;
    }

    if (!formData.education[0].institution) {
      toast.error('Institution name is required in education');
      setActiveSection('education');
      return;
    }

    setLoading(true);
    try {
      console.log('Submitting verification data:', formData);
      
      // Clean up the data before submitting
      const cleanedData = {
        ...formData,
        education: formData.education.map(edu => ({
          ...edu,
          startYear: edu.startYear ? parseInt(edu.startYear) : undefined,
          endYear: edu.endYear ? parseInt(edu.endYear) : undefined
        })),
        professionalExperience: formData.professionalExperience.map(exp => ({
          ...exp,
          startDate: exp.startDate || undefined,
          endDate: exp.endDate || undefined
        })),
        specialtyCertifications: formData.specialtyCertifications.map(cert => ({
          ...cert,
          issueDate: cert.issueDate || undefined,
          expiryDate: cert.expiryDate || undefined
        })),
        medicalLicense: {
          ...formData.medicalLicense,
          issueDate: formData.medicalLicense.issueDate || undefined,
          expiryDate: formData.medicalLicense.expiryDate || undefined
        },
        medicalCouncilRegistration: {
          ...formData.medicalCouncilRegistration,
          registrationDate: formData.medicalCouncilRegistration.registrationDate || undefined
        }
      };
      
      console.log('Cleaned verification data:', cleanedData);
      const response = await verificationAPI.submitVerification(cleanedData);
      console.log('Verification response:', response);
      if (response.data.success) {
        toast.success('Verification request submitted successfully!');
        navigate('/doctor/dashboard');
      }
    } catch (error) {
      console.error('Error submitting verification:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit verification';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: 'basic', name: 'Basic Information', icon: DocumentTextIcon },
    { id: 'license', name: 'Medical License', icon: DocumentCheckIcon },
    { id: 'education', name: 'Education', icon: AcademicCapIcon },
    { id: 'experience', name: 'Experience', icon: BriefcaseIcon },
    { id: 'certifications', name: 'Certifications', icon: TrophyIcon }
  ];

  // Show status if already submitted
  if (verificationStatus && verificationStatus.verificationStatus !== 'not_submitted') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center">
              {verificationStatus.verificationStatus === 'pending' && (
                <>
                  <ClockIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Pending</h2>
                  <p className="text-gray-600 mb-4">
                    Your verification request is being reviewed by our admin team.
                  </p>
                  <p className="text-sm text-gray-500">
                    Submitted on: {new Date(verificationStatus.verificationSubmittedAt).toLocaleDateString()}
                  </p>
                </>
              )}
              
              {verificationStatus.verificationStatus === 'approved' && (
                <>
                  <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Verified Doctor</h2>
                  <p className="text-gray-600 mb-4">
                    Your profile has been verified successfully!
                  </p>
                  <p className="text-sm text-gray-500">
                    Approved on: {new Date(verificationStatus.verificationApprovedAt).toLocaleDateString()}
                  </p>
                </>
              )}
              
              {verificationStatus.verificationStatus === 'rejected' && (
                <>
                  <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Rejected</h2>
                  <p className="text-gray-600 mb-4">
                    Unfortunately, your verification request was not approved.
                  </p>
                  {verificationStatus.verificationRejectionReason && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm font-medium text-red-800 mb-1">Reason:</p>
                      <p className="text-sm text-red-700">{verificationStatus.verificationRejectionReason}</p>
                    </div>
                  )}
                  <button
                    onClick={() => setVerificationStatus(null)}
                    className="mt-6 btn btn-primary"
                  >
                    Resubmit Verification
                  </button>
                </>
              )}
              
              <button
                onClick={() => navigate('/doctor/dashboard')}
                className="mt-6 btn btn-secondary"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctor Verification</h1>
          <p className="text-gray-600">
            Complete your profile verification to start accepting consultations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4 sticky top-4">
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{section.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              {activeSection === 'basic' && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
                  
                  <div className="space-y-4">
                    {/* Specialty */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Primary Specialty *
                      </label>
                      <select
                        value={formData.specialty}
                        onChange={(e) => handleInputChange(null, 'specialty', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Specialty</option>
                        {SPECIALTIES.map(spec => (
                          <option key={spec} value={spec}>
                            {spec.replace('_', ' ').toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Sub-specialties */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sub-Specialties (comma separated)
                      </label>
                      <input
                        type="text"
                        value={formData.subSpecialties.join(', ')}
                        onChange={(e) => handleInputChange(null, 'subSpecialties', e.target.value.split(',').map(s => s.trim()))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Interventional Cardiology, Heart Failure"
                      />
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Professional Bio *
                      </label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => handleInputChange(null, 'bio', e.target.value)}
                        rows="4"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe your experience, expertise, and approach to patient care..."
                        required
                      />
                    </div>

                    {/* Years of Experience */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Years of Experience *
                      </label>
                      <input
                        type="number"
                        value={formData.experience}
                        onChange={(e) => handleInputChange(null, 'experience', parseInt(e.target.value))}
                        min="0"
                        max="70"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Languages */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Languages Spoken *
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {LANGUAGES.map(lang => (
                          <label key={lang.code} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.languages.includes(lang.code)}
                              onChange={(e) => {
                                const newLanguages = e.target.checked
                                  ? [...formData.languages, lang.code]
                                  : formData.languages.filter(l => l !== lang.code);
                                handleInputChange(null, 'languages', newLanguages);
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">{lang.name}</span>
                          </label>
                        ))}
                      </div>
                      {formData.languages.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">Please select at least one language</p>
                      )}
                    </div>

                    {/* Consultation Fee */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Consultation Fee *
                        </label>
                        <input
                          type="number"
                          value={formData.consultationFee.amount}
                          onChange={(e) => handleNestedInputChange('consultationFee', null, 'amount', parseFloat(e.target.value))}
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Currency
                        </label>
                        <select
                          value={formData.consultationFee.currency}
                          onChange={(e) => handleNestedInputChange('consultationFee', null, 'currency', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="INR">INR</option>
                          <option value="CAD">CAD</option>
                        </select>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={formData.contact.phone}
                        onChange={(e) => handleNestedInputChange('contact', null, 'phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+1234567890"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Medical License */}
              {activeSection === 'license' && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Medical License Information</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        License Number *
                      </label>
                      <input
                        type="text"
                        value={formData.medicalLicense.number}
                        onChange={(e) => handleInputChange('medicalLicense', 'number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Issuing Authority *
                      </label>
                      <input
                        type="text"
                        value={formData.medicalLicense.issuingAuthority}
                        onChange={(e) => handleInputChange('medicalLicense', 'issuingAuthority', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., State Medical Board"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country *
                        </label>
                        <input
                          type="text"
                          value={formData.medicalLicense.issuingCountry}
                          onChange={(e) => handleInputChange('medicalLicense', 'issuingCountry', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State/Province
                        </label>
                        <input
                          type="text"
                          value={formData.medicalLicense.issuingState}
                          onChange={(e) => handleInputChange('medicalLicense', 'issuingState', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Issue Date *
                        </label>
                        <input
                          type="date"
                          value={formData.medicalLicense.issueDate}
                          onChange={(e) => handleInputChange('medicalLicense', 'issueDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiry Date *
                        </label>
                        <input
                          type="date"
                          value={formData.medicalLicense.expiryDate}
                          onChange={(e) => handleInputChange('medicalLicense', 'expiryDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Medical Council Registration */}
                    <div className="pt-6 border-t border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical Council Registration</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Registration Number
                          </label>
                          <input
                            type="text"
                            value={formData.medicalCouncilRegistration.registrationNumber}
                            onChange={(e) => handleInputChange('medicalCouncilRegistration', 'registrationNumber', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Council Name
                          </label>
                          <input
                            type="text"
                            value={formData.medicalCouncilRegistration.councilName}
                            onChange={(e) => handleInputChange('medicalCouncilRegistration', 'councilName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Medical Council of India"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Registration Date
                          </label>
                          <input
                            type="date"
                            value={formData.medicalCouncilRegistration.registrationDate}
                            onChange={(e) => handleInputChange('medicalCouncilRegistration', 'registrationDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Education */}
              {activeSection === 'education' && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Education</h2>
                    <button
                      type="button"
                      onClick={() => addArrayItem('education', {
                        degree: '',
                        institution: '',
                        fieldOfStudy: '',
                        startYear: '',
                        endYear: '',
                        country: ''
                      })}
                      className="btn btn-secondary btn-sm flex items-center space-x-2"
                    >
                      <PlusIcon className="h-4 w-4" />
                      <span>Add Education</span>
                    </button>
                  </div>

                  <div className="space-y-6">
                    {formData.education.map((edu, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-medium text-gray-900">Education #{index + 1}</h3>
                          {formData.education.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeArrayItem('education', index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Degree *
                            </label>
                            <input
                              type="text"
                              value={edu.degree}
                              onChange={(e) => updateArrayItem('education', index, 'degree', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g., MBBS, MD"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Institution *
                            </label>
                            <input
                              type="text"
                              value={edu.institution}
                              onChange={(e) => updateArrayItem('education', index, 'institution', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="University name"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Field of Study
                            </label>
                            <input
                              type="text"
                              value={edu.fieldOfStudy}
                              onChange={(e) => updateArrayItem('education', index, 'fieldOfStudy', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g., Medicine"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Country
                            </label>
                            <input
                              type="text"
                              value={edu.country}
                              onChange={(e) => updateArrayItem('education', index, 'country', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Start Year
                            </label>
                            <input
                              type="number"
                              value={edu.startYear}
                              onChange={(e) => updateArrayItem('education', index, 'startYear', parseInt(e.target.value))}
                              min="1950"
                              max={new Date().getFullYear()}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              End Year
                            </label>
                            <input
                              type="number"
                              value={edu.endYear}
                              onChange={(e) => updateArrayItem('education', index, 'endYear', parseInt(e.target.value))}
                              min="1950"
                              max={new Date().getFullYear() + 10}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Professional Experience */}
              {activeSection === 'experience' && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Professional Experience</h2>
                    <button
                      type="button"
                      onClick={() => addArrayItem('professionalExperience', {
                        position: '',
                        institution: '',
                        department: '',
                        startDate: '',
                        endDate: '',
                        isCurrent: false,
                        description: ''
                      })}
                      className="btn btn-secondary btn-sm flex items-center space-x-2"
                    >
                      <PlusIcon className="h-4 w-4" />
                      <span>Add Experience</span>
                    </button>
                  </div>

                  <div className="space-y-6">
                    {formData.professionalExperience.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        No experience added yet. Click "Add Experience" to begin.
                      </p>
                    ) : (
                      formData.professionalExperience.map((exp, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="font-medium text-gray-900">Experience #{index + 1}</h3>
                            <button
                              type="button"
                              onClick={() => removeArrayItem('professionalExperience', index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>

                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Position *
                                </label>
                                <input
                                  type="text"
                                  value={exp.position}
                                  onChange={(e) => updateArrayItem('professionalExperience', index, 'position', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="e.g., Senior Cardiologist"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Institution *
                                </label>
                                <input
                                  type="text"
                                  value={exp.institution}
                                  onChange={(e) => updateArrayItem('professionalExperience', index, 'institution', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Hospital/Clinic name"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Department
                                </label>
                                <input
                                  type="text"
                                  value={exp.department}
                                  onChange={(e) => updateArrayItem('professionalExperience', index, 'department', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Start Date *
                                </label>
                                <input
                                  type="date"
                                  value={exp.startDate}
                                  onChange={(e) => updateArrayItem('professionalExperience', index, 'startDate', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  End Date
                                </label>
                                <input
                                  type="date"
                                  value={exp.endDate}
                                  onChange={(e) => updateArrayItem('professionalExperience', index, 'endDate', e.target.value)}
                                  disabled={exp.isCurrent}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                />
                              </div>

                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`current-${index}`}
                                  checked={exp.isCurrent}
                                  onChange={(e) => updateArrayItem('professionalExperience', index, 'isCurrent', e.target.checked)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor={`current-${index}`} className="ml-2 text-sm text-gray-700">
                                  Currently working here
                                </label>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                              </label>
                              <textarea
                                value={exp.description}
                                onChange={(e) => updateArrayItem('professionalExperience', index, 'description', e.target.value)}
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Brief description of responsibilities and achievements..."
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {activeSection === 'certifications' && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Specialty Certifications</h2>
                    <button
                      type="button"
                      onClick={() => addArrayItem('specialtyCertifications', {
                        certificationName: '',
                        issuingOrganization: '',
                        issueDate: '',
                        expiryDate: '',
                        credentialId: ''
                      })}
                      className="btn btn-secondary btn-sm flex items-center space-x-2"
                    >
                      <PlusIcon className="h-4 w-4" />
                      <span>Add Certification</span>
                    </button>
                  </div>

                  <div className="space-y-6">
                    {formData.specialtyCertifications.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        No certifications added yet. Click "Add Certification" to begin.
                      </p>
                    ) : (
                      formData.specialtyCertifications.map((cert, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="font-medium text-gray-900">Certification #{index + 1}</h3>
                            <button
                              type="button"
                              onClick={() => removeArrayItem('specialtyCertifications', index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Certification Name *
                              </label>
                              <input
                                type="text"
                                value={cert.certificationName}
                                onChange={(e) => updateArrayItem('specialtyCertifications', index, 'certificationName', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Issuing Organization *
                              </label>
                              <input
                                type="text"
                                value={cert.issuingOrganization}
                                onChange={(e) => updateArrayItem('specialtyCertifications', index, 'issuingOrganization', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Issue Date *
                              </label>
                              <input
                                type="date"
                                value={cert.issueDate}
                                onChange={(e) => updateArrayItem('specialtyCertifications', index, 'issueDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Expiry Date
                              </label>
                              <input
                                type="date"
                                value={cert.expiryDate}
                                onChange={(e) => updateArrayItem('specialtyCertifications', index, 'expiryDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Credential ID
                              </label>
                              <input
                                type="text"
                                value={cert.credentialId}
                                onChange={(e) => updateArrayItem('specialtyCertifications', index, 'credentialId', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Optional: Publications and Awards */}
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information (Optional)</h3>
                    <p className="text-gray-600 text-sm">
                      You can add publications and awards to strengthen your profile after initial verification.
                    </p>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => navigate('/doctor/dashboard')}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </div>
                    ) : (
                      'Submit for Verification'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DoctorVerification;
