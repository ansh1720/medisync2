import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { consultationAPI, verificationAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [filter, setFilter] = useState('upcoming'); // upcoming | today | all
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      loadData();
    }
  }, []);

  useEffect(() => {
    loadConsultations();
  }, [filter]);

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([loadStats(), loadConsultations(), loadVerification()]);
    setIsLoading(false);
  };

  const loadStats = async () => {
    try {
      const res = await consultationAPI.getDoctorStats();
      if (res.data.success) setStats(res.data.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadConsultations = async () => {
    try {
      const params = {};
      if (filter === 'upcoming') {
        params.status = 'requested,confirmed';
      } else if (filter === 'today') {
        params.date = new Date().toISOString().split('T')[0];
      }
      const res = await consultationAPI.getDoctorConsultations(params);
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setConsultations(list);
    } catch (err) {
      console.error('Failed to load consultations:', err);
      setConsultations([]);
    }
  };

  const loadVerification = async () => {
    try {
      const res = await verificationAPI.getVerificationStatus();
      if (res.data.success) setVerificationStatus(res.data.data);
    } catch {
      setVerificationStatus({ verificationStatus: 'not_submitted', isVerified: false });
    }
  };

  const handleAccept = async (id) => {
    try {
      await consultationAPI.acceptConsultation(id);
      toast.success('Consultation confirmed');
      loadConsultations();
      loadStats();
    } catch (err) {
      toast.error('Failed to accept consultation');
    }
  };

  const handleStartConsultation = (id) => {
    navigate(`/consultation/room/${id}`);
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this consultation?')) return;
    try {
      await consultationAPI.cancelConsultation(id, 'Cancelled by doctor');
      toast.success('Consultation cancelled');
      loadConsultations();
      loadStats();
    } catch (err) {
      toast.error('Failed to cancel');
    }
  };

  const canJoin = (c) => {
    return ['confirmed', 'in_progress', 'requested'].includes(c.status);
  };

  const getStatusBadge = (status) => {
    const colors = {
      requested: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace(/_/g, ' ').toUpperCase()}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Verification Banner */}
        {verificationStatus && verificationStatus.verificationStatus !== 'approved' && (
          <div className="mb-6">
            {verificationStatus.verificationStatus === 'not_submitted' && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-yellow-600 text-xl">⚠️</span>
                  <div>
                    <h3 className="font-medium text-yellow-800">Verification Required</h3>
                    <p className="text-sm text-yellow-700 mt-1">Submit your credentials to start accepting consultations.</p>
                    <button onClick={() => navigate('/doctor/verification')}
                      className="mt-2 px-4 py-1.5 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700">
                      Get Verified
                    </button>
                  </div>
                </div>
              </div>
            )}
            {verificationStatus.verificationStatus === 'pending' && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
                <p className="text-sm text-blue-800">⏳ <strong>Verification Pending</strong> — Your documents are being reviewed.</p>
              </div>
            )}
            {verificationStatus.verificationStatus === 'rejected' && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                <p className="text-sm text-red-800">❌ <strong>Verification Rejected</strong> — {verificationStatus.verificationRejectionReason || 'Please resubmit.'}</p>
                <button onClick={() => navigate('/doctor/verification')}
                  className="mt-2 px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
                  Resubmit
                </button>
              </div>
            )}
          </div>
        )}

        {verificationStatus?.verificationStatus === 'approved' && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-3 rounded-lg">
            <p className="text-sm text-green-800">✅ <strong>Verified Doctor</strong> — Your profile is visible to patients.</p>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Doctor Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Dr. {user?.name}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-xl border border-border p-5">
            <p className="text-sm text-muted-foreground">Today</p>
            <p className="text-3xl font-bold text-foreground">{stats?.todayAppointments || 0}</p>
            <p className="text-xs text-blue-600">appointments</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <p className="text-sm text-muted-foreground">Upcoming</p>
            <p className="text-3xl font-bold text-foreground">{stats?.upcomingConsultations?.length || 0}</p>
            <p className="text-xs text-green-600">scheduled</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-3xl font-bold text-foreground">{stats?.completedConsultations || 0}</p>
            <p className="text-xs text-purple-600">total</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-3xl font-bold text-foreground">{stats?.totalConsultations || 0}</p>
            <p className="text-xs text-gray-500">all time</p>
          </div>
        </div>

        {/* Consultations */}
        <div className="bg-card rounded-xl border border-border">
          {/* Tabs */}
          <div className="flex items-center gap-2 p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground mr-4">Consultations</h2>
            {['upcoming', 'today', 'all'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'
                }`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="p-4">
            {consultations.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No consultations found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {consultations.map(c => (
                  <div key={c._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                        {c.userId?.name?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{c.userId?.name || 'Patient'}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(c.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          {' at '}
                          {new Date(c.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {c.chiefComplaint && <p className="text-sm text-muted-foreground mt-0.5">{c.chiefComplaint}</p>}
                        {c.symptoms?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {c.symptoms.map((s, i) => (
                              <span key={i} className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getStatusBadge(c.status)}
                      {c.status === 'requested' && (
                        <button onClick={() => handleAccept(c._id)}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                          Accept
                        </button>
                      )}
                      {canJoin(c) && (
                        <button onClick={() => handleStartConsultation(c._id)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                          Join Video
                        </button>
                      )}
                      {['requested', 'confirmed'].includes(c.status) && (
                        <button onClick={() => handleCancel(c._id)}
                          className="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Link to="/doctor/patients" className="bg-card rounded-xl border border-border p-4 text-center hover:bg-accent transition">
            <span className="text-2xl">👥</span>
            <p className="text-sm font-medium text-foreground mt-2">My Patients</p>
          </Link>
          <Link to="/health-records" className="bg-card rounded-xl border border-border p-4 text-center hover:bg-accent transition">
            <span className="text-2xl">📋</span>
            <p className="text-sm font-medium text-foreground mt-2">Medical Records</p>
          </Link>
          <Link to="/prescriptions" className="bg-card rounded-xl border border-border p-4 text-center hover:bg-accent transition">
            <span className="text-2xl">💊</span>
            <p className="text-sm font-medium text-foreground mt-2">Prescriptions</p>
          </Link>
          <Link to="/doctor/verification" className="bg-card rounded-xl border border-border p-4 text-center hover:bg-accent transition">
            <span className="text-2xl">🛡️</span>
            <p className="text-sm font-medium text-foreground mt-2">Verification</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default DoctorDashboard;
