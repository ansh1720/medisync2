import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { consultationAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

function ConsultationHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedConsultation, setSelectedConsultation] = useState(null);

  // Feedback state
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackId, setFeedbackId] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchConsultations();
  }, [filter]);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') params.status = filter;
      const res = await consultationAPI.getMyConsultations(params);
      setConsultations(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load consultation history');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this consultation?')) return;
    try {
      await consultationAPI.cancelConsultation(id, 'Cancelled by patient');
      toast.success('Consultation cancelled');
      fetchConsultations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const handleJoin = (id) => {
    navigate(`/consultation/room/${id}`);
  };

  const handleFeedback = async () => {
    try {
      await consultationAPI.addFeedback(feedbackId, { rating, comment });
      toast.success('Thank you for your feedback!');
      setShowFeedback(false);
      setFeedbackId(null);
      fetchConsultations();
    } catch (err) {
      toast.error('Failed to submit feedback');
    }
  };

  const formatSpecialty = (s) => s ? s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';

  const getStatusBadge = (status) => {
    const colors = {
      requested: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-orange-100 text-orange-800'
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace(/_/g, ' ').toUpperCase()}
      </span>
    );
  };

  const canJoin = (c) => {
    return ['confirmed', 'in_progress', 'requested'].includes(c.status);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Consultations</h1>
            <p className="text-muted-foreground mt-1">View your appointment history and upcoming consultations</p>
          </div>
          <button
            onClick={() => navigate('/consultations')}
            className="mt-4 sm:mt-0 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition"
          >
            + Book New Consultation
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'confirmed', 'in_progress', 'completed', 'cancelled'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                filter === f ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:bg-accent'
              }`}
            >
              {f === 'all' ? 'All' : f.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Consultation list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : consultations.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <p className="text-xl text-muted-foreground">No consultations found</p>
            <p className="text-sm text-muted-foreground mt-2">Book your first consultation with a doctor</p>
          </div>
        ) : (
          <div className="space-y-4">
            {consultations.map(c => (
              <div key={c._id} className="bg-card rounded-xl border border-border p-5 hover:shadow-sm transition">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {c.doctorId?.name?.charAt(0) || 'D'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Dr. {c.doctorId?.name || 'Doctor'}</h3>
                      <p className="text-sm text-primary">{formatSpecialty(c.doctorId?.specialty)}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(c.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        {' at '}
                        {new Date(c.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {c.chiefComplaint && (
                        <p className="text-sm text-muted-foreground mt-1">Concern: {c.chiefComplaint}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(c.status)}
                    <div className="flex gap-2 mt-1">
                      {canJoin(c) && (
                        <button onClick={() => handleJoin(c._id)}
                          className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition">
                          Join Video
                        </button>
                      )}
                      {['requested', 'confirmed'].includes(c.status) && (
                        <button onClick={() => handleCancel(c._id)}
                          className="px-4 py-1.5 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition">
                          Cancel
                        </button>
                      )}
                      {c.status === 'completed' && !c.feedback?.rating && (
                        <button onClick={() => { setFeedbackId(c._id); setShowFeedback(true); setRating(5); setComment(''); }}
                          className="px-4 py-1.5 border border-blue-300 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition">
                          Leave Feedback
                        </button>
                      )}
                      <button onClick={() => setSelectedConsultation(selectedConsultation?._id === c._id ? null : c)}
                        className="px-4 py-1.5 border border-border text-foreground rounded-lg text-sm hover:bg-accent transition">
                        {selectedConsultation?._id === c._id ? 'Hide' : 'Details'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {selectedConsultation?._id === c._id && (
                  <div className="mt-4 pt-4 border-t border-border space-y-3">
                    {c.symptoms?.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-foreground">Symptoms: </span>
                        <span className="text-sm text-muted-foreground">{c.symptoms.join(', ')}</span>
                      </div>
                    )}
                    {c.diagnosis && (
                      <div>
                        <span className="text-sm font-medium text-foreground">Diagnosis: </span>
                        <span className="text-sm text-muted-foreground">{c.diagnosis}</span>
                      </div>
                    )}
                    {c.doctorNotes && (
                      <div>
                        <span className="text-sm font-medium text-foreground">Doctor Notes: </span>
                        <span className="text-sm text-muted-foreground">{c.doctorNotes}</span>
                      </div>
                    )}
                    {c.prescription?.medications?.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-foreground block mb-2">Prescription:</span>
                        <div className="bg-muted rounded-lg p-3">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-muted-foreground">
                                <th className="text-left pb-1">Medicine</th>
                                <th className="text-left pb-1">Dosage</th>
                                <th className="text-left pb-1">Frequency</th>
                                <th className="text-left pb-1">Duration</th>
                              </tr>
                            </thead>
                            <tbody className="text-foreground">
                              {c.prescription.medications.map((m, i) => (
                                <tr key={i}>
                                  <td className="py-1">{m.name}</td>
                                  <td className="py-1">{m.dosage}</td>
                                  <td className="py-1">{m.frequency}</td>
                                  <td className="py-1">{m.duration}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {c.prescription.generalInstructions && (
                            <p className="text-sm text-muted-foreground mt-2 pt-2 border-t border-border">
                              {c.prescription.generalInstructions}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {c.payment && (
                      <div className="flex gap-4 text-sm">
                        <span><span className="font-medium text-foreground">Payment:</span> {c.payment.currency} {c.payment.amount}</span>
                        <span className={c.payment.status === 'paid' ? 'text-green-600' : c.payment.status === 'refunded' ? 'text-orange-600' : 'text-yellow-600'}>
                          ({c.payment.status})
                        </span>
                      </div>
                    )}
                    {c.feedback?.rating && (
                      <div className="text-sm">
                        <span className="font-medium text-foreground">Your Rating: </span>
                        {'⭐'.repeat(c.feedback.rating)} {c.feedback.comment && `- ${c.feedback.comment}`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Feedback Modal */}
        {showFeedback && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl border border-border p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-foreground mb-4">Rate Your Consultation</h3>
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setRating(star)} className="text-2xl">
                    {star <= rating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
              <textarea
                rows={3}
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Share your experience..."
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground resize-none mb-4"
              />
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowFeedback(false)} className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-accent">
                  Cancel
                </button>
                <button onClick={handleFeedback} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90">
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ConsultationHistory;
