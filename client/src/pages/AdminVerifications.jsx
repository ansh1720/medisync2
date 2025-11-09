import { useState, useEffect } from 'react';
import { verificationAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import {
  ShieldCheckIcon,
  XCircleIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

function AdminVerifications() {
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPendingVerifications();
  }, []);

  const loadPendingVerifications = async () => {
    try {
      setIsLoading(true);
      console.log('Loading pending verifications...');
      const response = await verificationAPI.getPendingVerifications({ limit: 50 });
      console.log('Pending verifications response:', response);
      if (response.data.success) {
        console.log('Pending doctors:', response.data.data.doctors);
        setPendingVerifications(response.data.data.doctors);
      }
    } catch (error) {
      console.error('Error loading pending verifications:', error);
      console.error('Error response:', error.response);
      toast.error('Failed to load pending verifications');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDoctorDetails = async (doctorId) => {
    try {
      const response = await verificationAPI.getVerificationDetails(doctorId);
      if (response.data.success) {
        setSelectedDoctor(response.data.data.doctor);
      }
    } catch (error) {
      console.error('Error loading doctor details:', error);
      toast.error('Failed to load doctor details');
    }
  };

  const handleApprove = async (doctorId) => {
    if (!window.confirm('Are you sure you want to approve this doctor\'s verification?')) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await verificationAPI.approveVerification(doctorId);
      if (response.data.success) {
        toast.success('Doctor verified successfully!');
        loadPendingVerifications();
        setSelectedDoctor(null);
      }
    } catch (error) {
      console.error('Error approving verification:', error);
      toast.error(error.response?.data?.message || 'Failed to approve verification');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setActionLoading(true);
      const response = await verificationAPI.rejectVerification(
        selectedDoctor._id,
        rejectionReason
      );
      if (response.data.success) {
        toast.success('Verification rejected');
        loadPendingVerifications();
        setSelectedDoctor(null);
        setShowRejectModal(false);
        setRejectionReason('');
      }
    } catch (error) {
      console.error('Error rejecting verification:', error);
      toast.error(error.response?.data?.message || 'Failed to reject verification');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading verifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Doctor Verifications</h1>
          <p className="text-gray-600 mt-2">Review and approve doctor verification requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Verifications</p>
                <p className="text-3xl font-bold text-gray-900">{pendingVerifications.length}</p>
              </div>
              <ClockIcon className="h-10 w-10 text-yellow-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List of Pending Verifications */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Pending Requests</h2>
              </div>
              
              <div className="divide-y divide-gray-200 max-h-[calc(100vh-300px)] overflow-y-auto">
                {pendingVerifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="text-gray-600">No pending verifications</p>
                  </div>
                ) : (
                  pendingVerifications.map((doctor) => (
                    <button
                      key={doctor._id}
                      onClick={() => loadDoctorDetails(doctor._id)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedDoctor?._id === doctor._id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-lg font-semibold text-blue-600">
                              {doctor.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            Dr. {doctor.name}
                          </p>
                          <p className="text-xs text-gray-600 capitalize">
                            {doctor.specialty.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(doctor.verificationSubmittedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Doctor Details */}
          <div className="lg:col-span-2">
            {!selectedDoctor ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a verification request to review details</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Dr. {selectedDoctor.name}</h2>
                      <p className="text-blue-100 capitalize mt-1">
                        {selectedDoctor.specialty.replace('_', ' ')}
                      </p>
                      {selectedDoctor.experience > 0 && (
                        <p className="text-blue-100 text-sm mt-1">
                          {selectedDoctor.experience} years of experience
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApprove(selectedDoctor._id)}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium flex items-center space-x-2 disabled:opacity-50"
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium flex items-center space-x-2 disabled:opacity-50"
                      >
                        <XCircleIcon className="h-5 w-5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-6 space-y-6 max-h-[calc(100vh-400px)] overflow-y-auto">
                  {/* Contact Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <p className="text-sm">
                        <span className="font-medium text-gray-700">Email:</span>{' '}
                        <span className="text-gray-600">{selectedDoctor.email}</span>
                      </p>
                      <p className="text-sm">
                        <span className="font-medium text-gray-700">Phone:</span>{' '}
                        <span className="text-gray-600">{selectedDoctor.contact?.phone}</span>
                      </p>
                    </div>
                  </div>

                  {/* Bio */}
                  {selectedDoctor.bio && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Professional Bio</h3>
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
                        {selectedDoctor.bio}
                      </p>
                    </div>
                  )}

                  {/* Medical License */}
                  {selectedDoctor.medicalLicense?.number && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <ShieldCheckIcon className="h-5 w-5 mr-2 text-blue-600" />
                        Medical License
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <p className="text-sm">
                          <span className="font-medium text-gray-700">License Number:</span>{' '}
                          <span className="text-gray-600">{selectedDoctor.medicalLicense.number}</span>
                        </p>
                        <p className="text-sm">
                          <span className="font-medium text-gray-700">Issuing Authority:</span>{' '}
                          <span className="text-gray-600">{selectedDoctor.medicalLicense.issuingAuthority}</span>
                        </p>
                        <p className="text-sm">
                          <span className="font-medium text-gray-700">Country:</span>{' '}
                          <span className="text-gray-600">{selectedDoctor.medicalLicense.issuingCountry}</span>
                        </p>
                        {selectedDoctor.medicalLicense.issuingState && (
                          <p className="text-sm">
                            <span className="font-medium text-gray-700">State:</span>{' '}
                            <span className="text-gray-600">{selectedDoctor.medicalLicense.issuingState}</span>
                          </p>
                        )}
                        <p className="text-sm">
                          <span className="font-medium text-gray-700">Valid:</span>{' '}
                          <span className="text-gray-600">
                            {new Date(selectedDoctor.medicalLicense.issueDate).toLocaleDateString()} -{' '}
                            {new Date(selectedDoctor.medicalLicense.expiryDate).toLocaleDateString()}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Medical Council Registration */}
                  {selectedDoctor.medicalCouncilRegistration?.registrationNumber && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Medical Council Registration</h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <p className="text-sm">
                          <span className="font-medium text-gray-700">Registration Number:</span>{' '}
                          <span className="text-gray-600">{selectedDoctor.medicalCouncilRegistration.registrationNumber}</span>
                        </p>
                        <p className="text-sm">
                          <span className="font-medium text-gray-700">Council:</span>{' '}
                          <span className="text-gray-600">{selectedDoctor.medicalCouncilRegistration.councilName}</span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {selectedDoctor.education && selectedDoctor.education.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <AcademicCapIcon className="h-5 w-5 mr-2 text-blue-600" />
                        Education
                      </h3>
                      <div className="space-y-3">
                        {selectedDoctor.education.map((edu, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <p className="font-medium text-gray-900">{edu.degree}</p>
                            <p className="text-sm text-gray-600">{edu.institution}</p>
                            {edu.fieldOfStudy && (
                              <p className="text-sm text-gray-600">Field: {edu.fieldOfStudy}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {edu.startYear} - {edu.endYear} {edu.country && `• ${edu.country}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Professional Experience */}
                  {selectedDoctor.professionalExperience && selectedDoctor.professionalExperience.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <BriefcaseIcon className="h-5 w-5 mr-2 text-blue-600" />
                        Professional Experience
                      </h3>
                      <div className="space-y-3">
                        {selectedDoctor.professionalExperience.map((exp, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <p className="font-medium text-gray-900">{exp.position}</p>
                            <p className="text-sm text-gray-600">{exp.institution}</p>
                            {exp.department && (
                              <p className="text-sm text-gray-600">Department: {exp.department}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(exp.startDate).toLocaleDateString()} -{' '}
                              {exp.isCurrent ? 'Present' : new Date(exp.endDate).toLocaleDateString()}
                            </p>
                            {exp.description && (
                              <p className="text-sm text-gray-600 mt-2">{exp.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {selectedDoctor.specialtyCertifications && selectedDoctor.specialtyCertifications.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Specialty Certifications</h3>
                      <div className="space-y-3">
                        {selectedDoctor.specialtyCertifications.map((cert, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <p className="font-medium text-gray-900">{cert.certificationName}</p>
                            <p className="text-sm text-gray-600">{cert.issuingOrganization}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Issued: {new Date(cert.issueDate).toLocaleDateString()}
                              {cert.expiryDate && ` • Expires: ${new Date(cert.expiryDate).toLocaleDateString()}`}
                            </p>
                            {cert.credentialId && (
                              <p className="text-xs text-gray-500">ID: {cert.credentialId}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Consultation Fee */}
                  {selectedDoctor.consultationFee && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Consultation Details</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm">
                          <span className="font-medium text-gray-700">Consultation Fee:</span>{' '}
                          <span className="text-gray-600">
                            {selectedDoctor.consultationFee.currency} {selectedDoctor.consultationFee.amount}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">Reject Verification</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this verification request. This will be sent to the doctor.
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              placeholder="Enter rejection reason..."
            />

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="btn btn-secondary"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="btn btn-primary bg-red-600 hover:bg-red-700"
                disabled={actionLoading || !rejectionReason.trim()}
              >
                {actionLoading ? 'Rejecting...' : 'Reject Verification'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminVerifications;
