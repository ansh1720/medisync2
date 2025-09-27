import { useState, useEffect } from 'react';
import { consultationAPI } from '../utils/api';
import { CalendarIcon, ClockIcon, UserIcon, AcademicCapIcon, StarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

const SPECIALTIES = [
  { value: 'all', label: 'All Specialties' },
  { value: 'general_practice', label: 'General Practice' },
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'dermatology', label: 'Dermatology' },
  { value: 'pediatrics', label: 'Pediatrics' },
  { value: 'psychiatry', label: 'Psychiatry' },
  { value: 'orthopedics', label: 'Orthopedics' },
  { value: 'gynecology', label: 'Gynecology' },
  { value: 'neurology', label: 'Neurology' },
  { value: 'oncology', label: 'Oncology' },
  { value: 'ophthalmology', label: 'Ophthalmology' },
  { value: 'endocrinology', label: 'Endocrinology' }
];

const CONSULTATION_TYPES = [
  { value: 'video', label: 'Video Call', icon: '📹', description: 'Online video consultation' },
  { value: 'phone', label: 'Phone Call', icon: '📞', description: 'Audio consultation' },
  { value: 'in_person', label: 'In-Person', icon: '🏥', description: 'Visit doctor\'s office' }
];

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30'
];

function DoctorConsultation() {
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  
  // Booking form state
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [consultationType, setConsultationType] = useState('video');
  const [symptoms, setSymptoms] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  // Get available doctors
  useEffect(() => {
    fetchDoctors();
  }, [selectedSpecialty]);

  const fetchDoctors = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (selectedSpecialty !== 'all') {
        params.specialty = selectedSpecialty;
      }
      
      console.log('Fetching doctors with params:', params);
      const response = await consultationAPI.getAvailableDoctors(params);
      console.log('Doctors response:', response.data);
      
      // Extract doctors array from nested response structure
      const doctorsArray = response.data.data?.doctors || response.data.doctors || [];
      console.log('Extracted doctors array:', doctorsArray);
      setDoctors(doctorsArray);
      
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error(error.response?.data?.message || 'Failed to load doctors');
      setDoctors([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get next available dates (next 14 days)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends for now (can be customized per doctor)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push({
          value: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          })
        });
      }
    }
    
    return dates;
  };

  // Handle booking submission
  const handleBookConsultation = async (e) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime || !symptoms.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsBooking(true);
    
    try {
      const bookingData = {
        doctorId: selectedDoctor._id,
        date: selectedDate,
        time: selectedTime,
        type: consultationType,
        symptoms: symptoms.trim(),
        notes: `Consultation requested via MediSync platform`
      };

      console.log('Booking consultation:', bookingData);
      
      const response = await consultationAPI.bookConsultation(bookingData);
      console.log('Booking response:', response.data);
      
      toast.success('Consultation booked successfully!');
      
      // Reset form
      setShowBooking(false);
      setSelectedDoctor(null);
      setSelectedDate('');
      setSelectedTime('');
      setSymptoms('');
      
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.message || 'Failed to book consultation');
    } finally {
      setIsBooking(false);
    }
  };

  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <StarIcon key={i} className="h-4 w-4 text-yellow-400 fill-current" />
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <StarIcon key="half" className="h-4 w-4 text-yellow-400 fill-current opacity-50" />
      );
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <StarIcon key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
      );
    }
    
    return stars;
  };

  // Format consultation fee
  const formatFee = (fee) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(fee);
  };

  if (showBooking && selectedDoctor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <button
              onClick={() => setShowBooking(false)}
              className="text-blue-600 hover:text-blue-800 mb-4"
            >
              ← Back to Doctors
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Book Consultation with Dr. {selectedDoctor.name}
            </h1>
            <p className="text-gray-600">
              {selectedDoctor.specialty} • {selectedDoctor.hospital || 'Medical Center'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Doctor Info */}
            <div className="lg:col-span-1">
              <div className="card">
                <div className="text-center mb-4">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserIcon className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Dr. {selectedDoctor.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedDoctor.specialty}
                  </p>
                  
                  {selectedDoctor.rating?.average && (
                    <div className="flex items-center justify-center mt-2">
                      <div className="flex mr-1">
                        {renderStars(selectedDoctor.rating.average)}
                      </div>
                      <span className="text-sm text-gray-600">
                        {selectedDoctor.rating.average.toFixed(1)} ({selectedDoctor.rating.reviewCount || 0} reviews)
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Experience:</span>
                    <span className="ml-2 text-gray-600">{selectedDoctor.experience || 'N/A'} years</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Education:</span>
                    <span className="ml-2 text-gray-600">{selectedDoctor.education || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Languages:</span>
                    <span className="ml-2 text-gray-600">{selectedDoctor.languages?.join(', ') || 'English'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Consultation Fee:</span>
                    <span className="ml-2 text-gray-600">{formatFee(selectedDoctor.consultationFee || 50)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleBookConsultation} className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Book Your Consultation
                </h3>

                {/* Consultation Type */}
                <div className="mb-6">
                  <label className="label">Consultation Type *</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {CONSULTATION_TYPES.map((type) => (
                      <label
                        key={type.value}
                        className={`
                          relative flex cursor-pointer rounded-lg border p-4 focus:outline-none
                          ${consultationType === type.value
                            ? 'border-blue-600 bg-blue-50 text-blue-900'
                            : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="consultation-type"
                          value={type.value}
                          className="sr-only"
                          checked={consultationType === type.value}
                          onChange={(e) => setConsultationType(e.target.value)}
                        />
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{type.icon}</span>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-sm opacity-75">{type.description}</div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Date Selection */}
                <div className="mb-6">
                  <label htmlFor="date" className="label">
                    Preferred Date *
                  </label>
                  <select
                    id="date"
                    className="input"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required
                  >
                    <option value="">Select a date</option>
                    {getAvailableDates().map((date) => (
                      <option key={date.value} value={date.value}>
                        {date.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time Selection */}
                <div className="mb-6">
                  <label htmlFor="time" className="label">
                    Preferred Time *
                  </label>
                  <select
                    id="time"
                    className="input"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    required
                  >
                    <option value="">Select a time</option>
                    {TIME_SLOTS.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Symptoms/Reason */}
                <div className="mb-6">
                  <label htmlFor="symptoms" className="label">
                    Reason for Consultation *
                  </label>
                  <textarea
                    id="symptoms"
                    rows={4}
                    className="input"
                    placeholder="Please describe your symptoms or reason for consultation..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This information helps the doctor prepare for your consultation
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowBooking(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isBooking}
                    className="btn btn-primary flex-1"
                  >
                    {isBooking ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Booking...
                      </div>
                    ) : (
                      'Book Consultation'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Doctor Consultations
          </h1>
          <p className="text-lg text-gray-600">
            Book appointments with qualified healthcare professionals
          </p>
        </div>

        {/* Specialty Filter */}
        <div className="card mb-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Find Doctors</h3>
            <div className="flex items-center space-x-4">
              <label htmlFor="specialty" className="text-sm font-medium text-gray-700">
                Filter by Specialty:
              </label>
              <select
                id="specialty"
                className="input max-w-xs"
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
              >
                {SPECIALTIES.map((specialty) => (
                  <option key={specialty.value} value={specialty.value}>
                    {specialty.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Doctors Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading doctors...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor) => (
              <div key={doctor._id} className="card hover:shadow-lg transition-shadow">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <UserIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Dr. {doctor.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {doctor.specialty}
                  </p>
                  
                  {doctor.rating?.average && (
                    <div className="flex items-center justify-center mt-2">
                      <div className="flex mr-1">
                        {renderStars(doctor.rating.average)}
                      </div>
                      <span className="text-sm text-gray-600">
                        {doctor.rating.average.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Doctor Details */}
                <div className="space-y-2 mb-4 text-sm">
                  {doctor.experience && (
                    <div className="flex items-center">
                      <AcademicCapIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span>{doctor.experience} years experience</span>
                    </div>
                  )}
                  
                  {doctor.hospital && (
                    <div className="flex items-center">
                      <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span>{doctor.hospital}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span>Available {
                      doctor.availability && Array.isArray(doctor.availability) && doctor.availability.length > 0
                        ? doctor.availability.map(a => a.dayOfWeek).join(', ')
                        : 'Mon-Fri'
                    }</span>
                  </div>
                </div>

                {/* Consultation Fee */}
                {doctor.consultationFee && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <div className="text-center">
                      <span className="text-sm text-green-600">Consultation Fee</span>
                      <div className="text-lg font-semibold text-green-800">
                        {formatFee(doctor.consultationFee)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Available Services */}
                {doctor.services && doctor.services.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">SERVICES</p>
                    <div className="flex flex-wrap gap-1">
                      {doctor.services.slice(0, 2).map((service, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded"
                        >
                          {service}
                        </span>
                      ))}
                      {doctor.services.length > 2 && (
                        <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                          +{doctor.services.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Book Button */}
                <button
                  onClick={() => {
                    setSelectedDoctor(doctor);
                    setShowBooking(true);
                  }}
                  className="btn btn-primary w-full"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Book Consultation
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && doctors.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
            <p className="text-gray-600 mb-4">
              Try selecting a different specialty or check back later
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DoctorConsultation;