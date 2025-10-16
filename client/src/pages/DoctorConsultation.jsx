import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { consultationAPI } from '../utils/api';
import { 
  CalendarIcon, 
  ClockIcon, 
  UserIcon, 
  AcademicCapIcon, 
  StarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChatBubbleLeftRightIcon,
  VideoCameraIcon,
  PhoneIcon,
  MapPinIcon,
  LanguageIcon,
  CurrencyDollarIcon,
  CheckBadgeIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
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
  { value: 'video', label: 'Video Call', icon: VideoCameraIcon, description: 'Face-to-face consultation' },
  { value: 'chat', label: 'Chat', icon: ChatBubbleLeftRightIcon, description: 'Text-based consultation' },
  { value: 'phone', label: 'Phone Call', icon: PhoneIcon, description: 'Audio consultation' }
];

const COMMON_SYMPTOMS = [
  'Fever', 'Headache', 'Cough', 'Fatigue', 'Nausea', 'Chest Pain',
  'Shortness of Breath', 'Skin Rash', 'Joint Pain', 'Dizziness',
  'Stomach Pain', 'Sleep Issues'
];

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30'
];

function DoctorConsultation() {
  const location = useLocation();
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [maxFee, setMaxFee] = useState(2000); // Updated for INR pricing
  const [availabilityFilter, setAvailabilityFilter] = useState('all'); // all, today, this_week
  const [sortBy, setSortBy] = useState('rating'); // rating, experience, fee, name
  const [showFilters, setShowFilters] = useState(false);
  const [isInstantConsult, setIsInstantConsult] = useState(false);
  
  // Booking form state
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [consultationType, setConsultationType] = useState('video');
  const [symptoms, setSymptoms] = useState('');
  const [urgency, setUrgency] = useState('medium');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  // Check if this is an instant consultation request
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    setIsInstantConsult(urlParams.get('instant') === 'true');
  }, [location]);

  // Get available doctors
  useEffect(() => {
    fetchDoctors();
  }, [selectedSpecialty, searchQuery, minRating, maxFee, availabilityFilter, sortBy]);

  const fetchDoctors = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (selectedSpecialty !== 'all') {
        params.specialty = selectedSpecialty;
      }
      
      console.log('Fetching doctors with params:', params);
      const response = await consultationAPI.getAvailableDoctors(params).catch(err => {
        console.log('API not available, using enhanced mock data');
        return null;
      });

      if (response?.data?.data?.doctors) {
        const doctorsArray = response.data.data.doctors;
        setDoctors(doctorsArray);
      } else {
        // Enhanced mock data with Indian doctors and realistic details
        const mockDoctors = [
          {
            _id: '1',
            name: 'Dr. Rajesh Kumar',
            specialty: 'Cardiology',
            subSpecialties: ['Interventional Cardiology', 'Cardiac Catheterization'],
            experience: 18,
            rating: { average: 4.9, reviewCount: 245 },
            consultationFee: { amount: 1200, currency: 'INR' },
            languages: ['hi', 'en', 'pa'],
            bio: 'Renowned interventional cardiologist with expertise in complex cardiac procedures and heart disease management.',
            qualifications: { degree: 'MBBS, DM Cardiology', university: 'AIIMS Delhi', graduationYear: 2005 },
            availability: { isOnline: true, nextSlot: new Date(Date.now() + 2 * 60 * 60 * 1000) },
            consultationTypes: ['video', 'chat', 'phone'],
            location: 'Apollo Hospitals, Delhi',
            profileImage: null,
            isVerified: true,
            hospital: 'Apollo Hospitals Delhi',
            education: 'MBBS from AIIMS Delhi, DM Cardiology from SGPGIMS Lucknow',
            awards: ['Best Cardiologist Award 2022', 'Excellence in Patient Care 2021']
          },
          {
            _id: '2',
            name: 'Dr. Priya Sharma',
            specialty: 'General Practice',
            subSpecialties: ['Family Medicine', 'Preventive Care', 'Diabetes Management'],
            experience: 12,
            rating: { average: 4.7, reviewCount: 189 },
            consultationFee: { amount: 800, currency: 'INR' },
            languages: ['hi', 'en', 'mr', 'gu'],
            bio: 'Dedicated general physician with extensive experience in family medicine and preventive healthcare.',
            qualifications: { degree: 'MBBS, MD General Medicine', university: 'JIPMER Puducherry', graduationYear: 2011 },
            availability: { isOnline: false, nextSlot: new Date(Date.now() + 24 * 60 * 60 * 1000) },
            consultationTypes: ['video', 'chat'],
            location: 'Fortis Healthcare, Mumbai',
            profileImage: null,
            isVerified: true,
            hospital: 'Fortis Healthcare Mumbai',
            education: 'MBBS from King George Medical University, MD General Medicine from JIPMER',
            awards: ['Outstanding Young Doctor 2020', 'Community Health Champion 2019']
          },
          {
            _id: '3',
            name: 'Dr. Vikram Singh',
            specialty: 'Dermatology',
            subSpecialties: ['Medical Dermatology', 'Aesthetic Procedures', 'Laser Treatments'],
            experience: 15,
            rating: { average: 4.8, reviewCount: 178 },
            consultationFee: { amount: 1000, currency: 'INR' },
            languages: ['hi', 'en', 'pa'],
            bio: 'Leading dermatologist specializing in medical and aesthetic dermatology with advanced laser treatments.',
            qualifications: { degree: 'MBBS, MD Dermatology', university: 'PGIMER Chandigarh', graduationYear: 2008 },
            availability: { isOnline: true, nextSlot: new Date(Date.now() + 1 * 60 * 60 * 1000) },
            consultationTypes: ['video', 'chat'],
            location: 'Max Super Speciality Hospital, Gurgaon',
            profileImage: null,
            isVerified: true,
            hospital: 'Max Super Speciality Hospital Gurgaon',
            education: 'MBBS from Maulana Azad Medical College, MD Dermatology from PGIMER Chandigarh',
            awards: ['Best Dermatologist Mumbai 2023', 'Innovation in Aesthetic Medicine 2022']
          },
          {
            _id: '4',
            name: 'Dr. Anjali Mehta',
            specialty: 'Pediatrics',
            subSpecialties: ['Neonatology', 'Child Development', 'Pediatric Immunization'],
            experience: 16,
            rating: { average: 4.9, reviewCount: 312 },
            consultationFee: { amount: 900, currency: 'INR' },
            languages: ['hi', 'en', 'kn', 'ta'],
            bio: 'Compassionate pediatrician with extensive experience in child healthcare and developmental pediatrics.',
            qualifications: { degree: 'MBBS, MD Pediatrics', university: 'AIIMS Delhi', graduationYear: 2007 },
            availability: { isOnline: true, nextSlot: new Date(Date.now() + 3 * 60 * 60 * 1000) },
            consultationTypes: ['video', 'phone'],
            location: 'Rainbow Children\'s Hospital, Bangalore',
            profileImage: null,
            isVerified: true,
            hospital: 'Rainbow Children\'s Hospital Bangalore',
            education: 'MBBS from Armed Forces Medical College, MD Pediatrics from AIIMS Delhi',
            awards: ['Pediatrician of the Year 2023', 'Child Care Excellence Award 2021']
          },
          {
            _id: '5',
            name: 'Dr. Arjun Nair',
            specialty: 'Orthopedics',
            subSpecialties: ['Joint Replacement', 'Sports Medicine', 'Arthroscopy'],
            experience: 14,
            rating: { average: 4.6, reviewCount: 156 },
            consultationFee: { amount: 1100, currency: 'INR' },
            languages: ['hi', 'en', 'ml', 'ta'],
            bio: 'Skilled orthopedic surgeon specializing in joint replacement and sports medicine.',
            qualifications: { degree: 'MBBS, MS Orthopedics', university: 'CMC Vellore', graduationYear: 2009 },
            availability: { isOnline: false, nextSlot: new Date(Date.now() + 24 * 60 * 60 * 1000) },
            consultationTypes: ['video', 'chat'],
            location: 'Manipal Hospital, Bangalore',
            profileImage: null,
            isVerified: true,
            hospital: 'Manipal Hospital Bangalore',
            education: 'MBBS from Government Medical College Thiruvananthapuram, MS Orthopedics from CMC Vellore',
            awards: ['Excellence in Orthopedic Surgery 2022', 'Best Sports Medicine Doctor 2021']
          },
          {
            _id: '6',
            name: 'Dr. Kavita Reddy',
            specialty: 'Gynecology',
            subSpecialties: ['High-Risk Pregnancy', 'Laparoscopic Surgery', 'Infertility Treatment'],
            experience: 13,
            rating: { average: 4.8, reviewCount: 198 },
            consultationFee: { amount: 950, currency: 'INR' },
            languages: ['hi', 'en', 'te', 'ur'],
            bio: 'Experienced gynecologist specializing in high-risk pregnancies and minimally invasive surgery.',
            qualifications: { degree: 'MBBS, MD OBG', university: 'AIIMS Delhi', graduationYear: 2010 },
            availability: { isOnline: true, nextSlot: new Date(Date.now() + 4 * 60 * 60 * 1000) },
            consultationTypes: ['video', 'chat', 'phone'],
            location: 'Fernandez Hospital, Hyderabad',
            profileImage: null,
            isVerified: true,
            hospital: 'Fernandez Hospital Hyderabad',
            education: 'MBBS from Osmania Medical College, MD Obstetrics & Gynecology from AIIMS Delhi',
            awards: ['Women\'s Health Champion 2023', 'Excellence in Maternal Care 2022']
          }
        ];

        // Apply filters
        let filteredDoctors = mockDoctors;

        if (selectedSpecialty !== 'all') {
          filteredDoctors = filteredDoctors.filter(doc => 
            doc.specialty.toLowerCase().replace(/\s+/g, '_') === selectedSpecialty
          );
        }

        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredDoctors = filteredDoctors.filter(doc => 
            doc.name.toLowerCase().includes(query) ||
            doc.specialty.toLowerCase().includes(query) ||
            doc.bio.toLowerCase().includes(query) ||
            doc.subSpecialties.some(sub => sub.toLowerCase().includes(query))
          );
        }

        if (minRating > 0) {
          filteredDoctors = filteredDoctors.filter(doc => doc.rating.average >= minRating);
        }

        if (maxFee < 2000) {
          filteredDoctors = filteredDoctors.filter(doc => doc.consultationFee.amount <= maxFee);
        }

        if (availabilityFilter === 'today') {
          filteredDoctors = filteredDoctors.filter(doc => doc.availability.isOnline);
        }

        // Sort doctors
        filteredDoctors.sort((a, b) => {
          switch (sortBy) {
            case 'rating':
              return b.rating.average - a.rating.average;
            case 'experience':
              return b.experience - a.experience;
            case 'fee':
              return a.consultationFee.amount - b.consultationFee.amount;
            case 'name':
              return a.name.localeCompare(b.name);
            default:
              return 0;
          }
        });

        setDoctors(filteredDoctors);
      }
      
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error(error.response?.data?.message || 'Failed to load doctors');
      setDoctors([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add/remove symptoms
  const toggleSymptom = (symptom) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  // Get consultation type icon
  const getConsultationIcon = (type) => {
    const typeObj = CONSULTATION_TYPES.find(t => t.value === type);
    return typeObj ? typeObj.icon : ChatBubbleLeftRightIcon;
  };

  // Format next available time
  const formatNextSlot = (date) => {
    const now = new Date();
    const diff = date - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours < 1) {
      return `Available in ${minutes} min`;
    } else if (hours < 24) {
      return `Available in ${hours}h ${minutes}m`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    }
  };

  // Handle instant consultation booking
  const handleInstantBook = (doctor) => {
    toast.success(`Starting instant consultation with ${doctor.name}...`);
    // In a real implementation, this would immediately connect to the doctor
    setTimeout(() => {
      toast.success('Connecting to consultation room...');
    }, 2000);
  };

  // Handle regular booking
  const handleBookNow = (doctor) => {
    setSelectedDoctor(doctor);
    setShowBooking(true);
  };

  // Handle view profile with enhanced mock data
  const handleViewProfile = (doctor) => {
    const profileInfo = `
🩺 Dr. ${doctor.name}
📋 Specialty: ${doctor.specialty}
🏥 Hospital: ${doctor.hospital || doctor.location}
📚 Education: ${doctor.education || doctor.qualifications?.degree + ' from ' + doctor.qualifications?.university}
🌟 Experience: ${doctor.experience} years
⭐ Rating: ${doctor.rating?.average}/5 (${doctor.rating?.reviewCount} reviews)
💰 Consultation Fee: ${formatFee(doctor.consultationFee || { amount: doctor.consultationFee, currency: 'INR' })}
🗣️ Languages: ${doctor.languages?.map(lang => {
      const langMap = { 'hi': 'Hindi', 'en': 'English', 'pa': 'Punjabi', 'mr': 'Marathi', 'gu': 'Gujarati', 'kn': 'Kannada', 'ta': 'Tamil', 'te': 'Telugu', 'ur': 'Urdu', 'ml': 'Malayalam' };
      return langMap[lang] || lang;
    }).join(', ') || 'English, Hindi'}
🏆 Awards: ${doctor.awards?.join(', ') || 'Multiple recognitions for excellence in patient care'}
💊 Specializations: ${doctor.subSpecialties?.join(', ') || 'General practice and patient care'}

📝 About: ${doctor.bio || `Dr. ${doctor.name} is a dedicated healthcare professional committed to providing excellent patient care.`}
    `;
    
    // Create a custom modal or use alert for now
    alert(profileInfo);
    
    // Log for debugging
    console.log('Doctor Profile:', doctor);
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
    if (typeof fee === 'object' && fee.amount && fee.currency) {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: fee.currency === 'INR' ? 'INR' : 'USD'
      }).format(fee.amount);
    }
    // Fallback for legacy format
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
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
                    <span className="ml-2 text-gray-600">{selectedDoctor.languages?.map(lang => {
                      const langMap = { 
                        'hi': 'Hindi', 'en': 'English', 'pa': 'Punjabi', 'mr': 'Marathi', 
                        'gu': 'Gujarati', 'kn': 'Kannada', 'ta': 'Tamil', 'te': 'Telugu', 
                        'ur': 'Urdu', 'ml': 'Malayalam' 
                      };
                      return langMap[lang] || lang;
                    }).join(', ') || 'English'}</span>
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
                          <type.icon className="h-6 w-6 mr-3" />
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
            {isInstantConsult ? 'Instant Consultation' : 'Doctor Consultations'}
          </h1>
          <p className="text-lg text-gray-600">
            {isInstantConsult 
              ? 'Connect with available doctors immediately' 
              : 'Book appointments with qualified healthcare professionals'
            }
          </p>
        </div>

        {/* Enhanced Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-2xl mx-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Search doctors by name, specialty, or symptoms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Quick Symptom Tags */}
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <span className="text-sm font-medium text-gray-700 mr-3">Common Symptoms:</span>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center text-sm text-primary-600 hover:text-primary-700"
              >
                <FunnelIcon className="h-4 w-4 mr-1" />
                {showFilters ? 'Hide Filters' : 'More Filters'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {COMMON_SYMPTOMS.map((symptom) => (
                <button
                  key={symptom}
                  onClick={() => toggleSymptom(symptom)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    selectedSymptoms.includes(symptom)
                      ? 'bg-primary-100 text-primary-800 border border-primary-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {symptom}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              {/* Specialty Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialty
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Rating
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                >
                  <option value={0}>Any Rating</option>
                  <option value={4}>4+ Stars</option>
                  <option value={4.5}>4.5+ Stars</option>
                  <option value={4.8}>4.8+ Stars</option>
                </select>
              </div>

              {/* Fee Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Fee: ₹{maxFee}
                </label>
                <input
                  type="range"
                  min="500"
                  max="2000"
                  step="100"
                  className="w-full"
                  value={maxFee}
                  onChange={(e) => setMaxFee(Number(e.target.value))}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>₹500</span>
                  <span>₹2000</span>
                </div>
              </div>

              {/* Availability Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Availability
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                >
                  <option value="all">Any Time</option>
                  <option value="today">Available Today</option>
                  <option value="this_week">This Week</option>
                </select>
              </div>
            </div>
          )}

          {/* Sort Options */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <select
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="rating">Highest Rated</option>
                <option value="experience">Most Experienced</option>
                <option value="fee">Lowest Fee</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} found
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
              <div key={doctor._id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 p-6 border border-gray-100">
                <div className="text-center mb-4">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 relative">
                    <UserIcon className="h-10 w-10 text-blue-600" />
                    {doctor.availability?.isOnline && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                    {doctor.isVerified && (
                      <div className="absolute -bottom-1 -right-1">
                        <CheckBadgeIcon className="h-5 w-5 text-blue-500" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {doctor.name}
                  </h3>
                  <p className="text-sm text-blue-600 font-medium">
                    {doctor.specialty}
                  </p>
                  
                  {doctor.rating?.average && (
                    <div className="flex items-center justify-center mt-2">
                      <div className="flex mr-2">
                        {renderStars(doctor.rating.average)}
                      </div>
                      <span className="text-sm text-gray-600">
                        {doctor.rating.average.toFixed(1)} ({doctor.rating.reviewCount} reviews)
                      </span>
                    </div>
                  )}
                </div>

                {/* Doctor Details */}
                <div className="space-y-2 mb-4 text-sm">
                  {doctor.experience && (
                    <div className="flex items-center text-gray-600">
                      <AcademicCapIcon className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                      <span>{doctor.experience} years experience</span>
                    </div>
                  )}
                  
                  {doctor.qualifications && (
                    <div className="flex items-center text-gray-600">
                      <AcademicCapIcon className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                      <span>{doctor.qualifications.degree}, {doctor.qualifications.university}</span>
                    </div>
                  )}
                  
                  {doctor.languages && (
                    <div className="flex items-center text-gray-600">
                      <LanguageIcon className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                      <span>{doctor.languages.map(lang => {
                        const langMap = { 
                          'hi': 'Hindi', 'en': 'English', 'pa': 'Punjabi', 'mr': 'Marathi', 
                          'gu': 'Gujarati', 'kn': 'Kannada', 'ta': 'Tamil', 'te': 'Telugu', 
                          'ur': 'Urdu', 'ml': 'Malayalam', 'es': 'Spanish' 
                        };
                        return langMap[lang] || lang;
                      }).join(', ')}</span>
                    </div>
                  )}
                  
                  {doctor.location && (
                    <div className="flex items-center text-gray-600">
                      <MapPinIcon className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                      <span>{doctor.location}</span>
                    </div>
                  )}

                  {doctor.consultationFee && (
                    <div className="flex items-center text-gray-600">
                      <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                      <span className="font-medium">{formatFee(doctor.consultationFee)} consultation</span>
                    </div>
                  )}
                </div>

                {/* Consultation Types */}
                {doctor.consultationTypes && (
                  <div className="mb-4">
                    <div className="flex space-x-2">
                      {doctor.consultationTypes.map((type) => {
                        const IconComponent = getConsultationIcon(type);
                        return (
                          <div key={type} className="flex items-center px-2 py-1 bg-gray-100 rounded-full text-xs">
                            <IconComponent className="h-3 w-3 mr-1" />
                            <span className="capitalize">{type}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Availability Status */}
                <div className="mb-4">
                  {doctor.availability?.isOnline ? (
                    <div className="flex items-center text-green-600 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="font-medium">Available now</span>
                    </div>
                  ) : doctor.availability?.nextSlot ? (
                    <div className="text-sm text-gray-600">
                      <ClockIcon className="h-4 w-4 inline mr-1" />
                      {formatNextSlot(doctor.availability.nextSlot)}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      <ClockIcon className="h-4 w-4 inline mr-1" />
                      Schedule appointment
                    </div>
                  )}
                </div>

                {/* Bio Preview */}
                {doctor.bio && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {doctor.bio}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  {isInstantConsult && doctor.availability?.isOnline ? (
                    <button
                      onClick={() => handleInstantBook(doctor)}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      Start Instant Consultation
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBookNow(doctor)}
                      className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                      Book Consultation
                    </button>
                  )}
                  <button
                    onClick={() => handleViewProfile(doctor)}
                    className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    View Full Profile
                  </button>
                </div>

                {/* Doctor Details */}
                <div className="space-y-2 mb-4">
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