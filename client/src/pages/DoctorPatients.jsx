import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { consultationAPI } from '../utils/api';

function DoctorPatients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPatient, setExpandedPatient] = useState(null);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setIsLoading(true);

      const response = await consultationAPI.getDoctorConsultations({});
      const consultations = Array.isArray(response.data?.data) ? response.data.data : [];

      if (consultations.length > 0) {
        // Group all consultations by patient
        const patientMap = {};
        consultations.forEach(c => {
          const p = c.userId;
          if (!p) return;
          const pid = p._id;
          if (!patientMap[pid]) {
            patientMap[pid] = {
              id: pid,
              name: p.name || 'Patient',
              email: p.email || '',
              phone: p.phone || '',
              consultations: [],
            };
          }
          patientMap[pid].consultations.push({
            _id: c._id,
            scheduledAt: c.scheduledAt,
            status: c.status,
            chiefComplaint: c.chiefComplaint || '',
            diagnosis: c.diagnosis || '',
            symptoms: c.symptoms || [],
            feedback: c.feedback || null,
            doctorNotes: c.doctorNotes || '',
          });
        });

        // Sort consultations per patient (newest first) and compute summary fields
        const patientList = Object.values(patientMap).map(pt => {
          pt.consultations.sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));
          pt.totalConsultations = pt.consultations.length;
          pt.lastVisit = pt.consultations[0]?.scheduledAt;
          pt.latestCondition = pt.consultations[0]?.chiefComplaint || pt.consultations[0]?.diagnosis || 'Consultation';
          // Next upcoming appointment
          const upcoming = pt.consultations.filter(c => ['requested', 'confirmed'].includes(c.status) && new Date(c.scheduledAt) > new Date());
          pt.nextAppointment = upcoming.length > 0 ? upcoming[upcoming.length - 1].scheduledAt : null;
          return pt;
        });

        // Sort patients by last visit (most recent first)
        patientList.sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit));
        setPatients(patientList);
      } else {
        setPatients([]);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Failed to load patients');
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const term = searchTerm.toLowerCase();
    return patient.name.toLowerCase().includes(term) ||
           patient.email.toLowerCase().includes(term) ||
           patient.latestCondition.toLowerCase().includes(term);
  });

  const handleViewMedicalRecords = (patient) => {
    navigate('/health-records', {
      state: { patientId: patient.id, patientName: patient.name, doctorView: true }
    });
  };

  const handleScheduleAppointment = (patient) => {
    // Navigate to consultation history filtered for this patient so doctor can manage
    toast.success(`To schedule a new appointment, ask ${patient.name} to book via the patient portal.`);
  };

  const handleCall = (patient) => {
    if (patient.phone) {
      window.open(`tel:${patient.phone}`, '_self');
    } else {
      toast.error('No phone number available for this patient');
    }
  };

  const handleMessage = (patient) => {
    if (patient.email) {
      window.open(`mailto:${patient.email}?subject=Regarding your consultation - MediSync`, '_blank');
    } else {
      toast.error('No email available for this patient');
    }
  };

  const handleJoinConsultation = (consultationId) => {
    navigate(`/consultation/room/${consultationId}`);
  };

  const getStatusBadge = (status) => {
    const colors = {
      requested: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-orange-100 text-orange-800',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace(/_/g, ' ').toUpperCase()}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'N/A';
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'N/A';
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <UserGroupIcon className="h-8 w-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">My Patients</h1>
          </div>
          <p className="text-gray-600">Manage and view your patient records &amp; consultation history</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search patients by name, email, or condition..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <span className="text-sm text-gray-500">
              {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''} · {patients.reduce((sum, p) => sum + p.totalConsultations, 0)} total consultations
            </span>
          </div>
        </div>

        {/* Patients List */}
        <div className="space-y-4">
          {filteredPatients.map((patient) => (
            <div key={patient.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Patient Card */}
              <div className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Left: Patient Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg flex-shrink-0">
                      {patient.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900">{patient.name}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
                        {patient.email && <span>{patient.email}</span>}
                        {patient.phone && <span>{patient.phone}</span>}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mt-2">
                        <span className="text-gray-500">
                          <strong>{patient.totalConsultations}</strong> consultation{patient.totalConsultations !== 1 ? 's' : ''}
                        </span>
                        <span className="text-gray-500">Last visit: <strong>{formatDate(patient.lastVisit)}</strong></span>
                        {patient.nextAppointment && (
                          <span className="text-green-600">Next: <strong>{formatDate(patient.nextAppointment)}</strong></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mt-1">Latest: {patient.latestCondition}</p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap gap-2 flex-shrink-0">
                    <button onClick={() => handleViewMedicalRecords(patient)}
                      className="flex items-center space-x-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm">
                      <DocumentTextIcon className="h-4 w-4" />
                      <span>Records</span>
                    </button>
                    <button onClick={() => handleCall(patient)}
                      className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                      <PhoneIcon className="h-4 w-4" />
                      <span>Call</span>
                    </button>
                    <button onClick={() => handleMessage(patient)}
                      className="flex items-center space-x-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm">
                      <ChatBubbleLeftRightIcon className="h-4 w-4" />
                      <span>Email</span>
                    </button>
                    <button
                      onClick={() => setExpandedPatient(expandedPatient === patient.id ? null : patient.id)}
                      className="flex items-center space-x-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                      <ClockIcon className="h-4 w-4" />
                      <span>History</span>
                      {expandedPatient === patient.id
                        ? <ChevronUpIcon className="h-4 w-4" />
                        : <ChevronDownIcon className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Consultation History */}
              {expandedPatient === patient.id && (
                <div className="border-t border-gray-200 bg-gray-50 p-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Consultation History</h4>
                  <div className="space-y-3">
                    {patient.consultations.map((c) => (
                      <div key={c._id} className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-gray-900">{formatDateTime(c.scheduledAt)}</span>
                              {getStatusBadge(c.status)}
                            </div>
                            {c.chiefComplaint && (
                              <p className="text-sm text-gray-600 mt-1">Concern: {c.chiefComplaint}</p>
                            )}
                            {c.diagnosis && (
                              <p className="text-sm text-gray-700 mt-1">Diagnosis: <strong>{c.diagnosis}</strong></p>
                            )}
                            {c.doctorNotes && (
                              <p className="text-sm text-gray-500 mt-1 italic">Notes: {c.doctorNotes}</p>
                            )}
                            {c.symptoms?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {c.symptoms.map((s, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{s}</span>
                                ))}
                              </div>
                            )}
                            {c.feedback?.rating && (
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-yellow-500 text-sm">{'★'.repeat(c.feedback.rating)}{'☆'.repeat(5 - c.feedback.rating)}</span>
                                {c.feedback.comment && <span className="text-xs text-gray-500">— {c.feedback.comment}</span>}
                              </div>
                            )}
                          </div>
                          {['confirmed', 'in_progress'].includes(c.status) && (
                            <button onClick={() => handleJoinConsultation(c._id)}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                              Join Video
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredPatients.length === 0 && (
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
            <p className="text-gray-600">
              {searchTerm
                ? 'Try adjusting your search criteria'
                : 'Your patients will appear here once you start seeing them'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DoctorPatients;