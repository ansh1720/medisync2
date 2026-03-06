import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { consultationAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

function BookingPage() {
  const { doctorId } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  // Booking state
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Pre-consultation data
  const [symptoms, setSymptoms] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('credit_card');

  // Step tracker
  const [step, setStep] = useState(1); // 1: date/time, 2: symptoms, 3: payment & confirm

  useEffect(() => {
    fetchDoctor();
  }, [doctorId]);

  useEffect(() => {
    if (selectedDate) fetchSlots();
  }, [selectedDate]);

  const fetchDoctor = async () => {
    try {
      const res = await consultationAPI.getDoctorProfile(doctorId);
      setDoctor(res.data.data);
      // Default date = tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSelectedDate(tomorrow.toISOString().split('T')[0]);
    } catch (err) {
      toast.error('Failed to load doctor profile');
      navigate('/consultations');
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async () => {
    try {
      setSlotsLoading(true);
      setSelectedSlot('');
      const res = await consultationAPI.getAvailableSlots(doctorId, selectedDate);
      setSlots(res.data.data || []);
    } catch (err) {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot) return toast.error('Please select a time slot');
    if (!chiefComplaint.trim()) return toast.error('Please describe your main concern');

    try {
      setBooking(true);
      const scheduledAt = new Date(`${selectedDate}T${selectedSlot}:00`);

      const res = await consultationAPI.bookConsultation({
        doctorId,
        scheduledAt: scheduledAt.toISOString(),
        symptoms: symptoms.split(',').map(s => s.trim()).filter(Boolean),
        chiefComplaint,
        additionalNotes,
        consultationType: 'video_call'
      });

      const consultationId = res.data.data._id;

      // If there's a fee, simulate payment
      if (doctor?.consultationFee?.amount > 0) {
        await consultationAPI.payConsultation(consultationId, paymentMethod);
      }

      toast.success('Consultation booked successfully!');
      navigate(`/consultation/history`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book consultation');
    } finally {
      setBooking(false);
    }
  };

  const formatSpecialty = (s) => {
    if (!s) return 'General';
    return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  // Get next 14 days for date picker
  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };
  const getMaxDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Doctor Card */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
              {doctor?.name?.charAt(0) || 'D'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Dr. {doctor?.name}</h2>
              <p className="text-primary font-medium">{formatSpecialty(doctor?.specialty)}</p>
              {doctor?.experience && <p className="text-sm text-muted-foreground">{doctor.experience} years exp.</p>}
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm">
                  ⭐ {(doctor?.rating?.average || 0).toFixed(1)} ({doctor?.rating?.reviewCount || 0} reviews)
                </span>
                {doctor?.consultationFee?.amount > 0 && (
                  <span className="text-sm font-semibold text-green-600">
                    {doctor.consultationFee.currency === 'INR' ? '₹' : '$'}{doctor.consultationFee.amount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {s}
              </div>
              <span className={`text-sm hidden sm:inline ${step >= s ? 'text-foreground' : 'text-muted-foreground'}`}>
                {s === 1 ? 'Date & Time' : s === 2 ? 'Symptoms' : 'Confirm'}
              </span>
              {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Date & Time */}
        {step === 1 && (
          <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Select Date & Time</h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">Date</label>
              <input
                type="date"
                value={selectedDate}
                min={getMinDate()}
                max={getMaxDate()}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Available Slots</label>
              {slotsLoading ? (
                <p className="text-muted-foreground">Loading slots...</p>
              ) : slots.length === 0 ? (
                <p className="text-muted-foreground">No available slots for this date. Try another day.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.time}
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot.time)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        !slot.available
                          ? 'bg-muted text-muted-foreground cursor-not-allowed line-through'
                          : selectedSlot === slot.time
                          ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                          : 'border border-border text-foreground hover:bg-accent'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                disabled={!selectedSlot}
                onClick={() => setStep(2)}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50 hover:opacity-90 transition"
              >
                Next: Add Symptoms →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Symptoms & Reports */}
        {step === 2 && (
          <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Pre-Consultation Details</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Main Concern *</label>
                <input
                  type="text"
                  placeholder="e.g., Persistent headache for 3 days"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Symptoms (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g., headache, nausea, fatigue"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Additional Notes</label>
                <textarea
                  rows={3}
                  placeholder="Any other details the doctor should know..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(1)} className="px-6 py-2.5 border border-border rounded-lg text-foreground hover:bg-accent transition">
                ← Back
              </button>
              <button
                disabled={!chiefComplaint.trim()}
                onClick={() => setStep(3)}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50 hover:opacity-90 transition"
              >
                Next: Confirm →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment & Confirm */}
        {step === 3 && (
          <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Review & Confirm</h3>

            <div className="bg-muted rounded-lg p-4 mb-6 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Doctor</span>
                <span className="font-medium text-foreground">Dr. {doctor?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Specialty</span>
                <span className="text-foreground">{formatSpecialty(doctor?.specialty)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="text-foreground">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="text-foreground">{selectedSlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="text-foreground">Video Consultation</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Main Concern</span>
                <span className="text-foreground">{chiefComplaint}</span>
              </div>
              {doctor?.consultationFee?.amount > 0 && (
                <div className="flex justify-between border-t border-border pt-2 mt-2">
                  <span className="font-medium text-foreground">Fee</span>
                  <span className="font-bold text-lg text-primary">
                    {doctor.consultationFee.currency === 'INR' ? '₹' : '$'}{doctor.consultationFee.amount}
                  </span>
                </div>
              )}
            </div>

            {/* Payment method */}
            {doctor?.consultationFee?.amount > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">Payment Method</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: 'credit_card', label: 'Credit Card' },
                    { value: 'debit_card', label: 'Debit Card' },
                    { value: 'upi', label: 'UPI' },
                    { value: 'wallet', label: 'Wallet' },
                  ].map(m => (
                    <button
                      key={m.value}
                      onClick={() => setPaymentMethod(m.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
                        paymentMethod === m.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-foreground hover:bg-accent'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(2)} className="px-6 py-2.5 border border-border rounded-lg text-foreground hover:bg-accent transition">
                ← Back
              </button>
              <button
                onClick={handleBook}
                disabled={booking}
                className="px-8 py-2.5 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50 hover:bg-green-700 transition"
              >
                {booking ? 'Booking...' : doctor?.consultationFee?.amount > 0 ? 'Pay & Book' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingPage;
