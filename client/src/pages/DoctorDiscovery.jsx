import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { consultationAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

const SPECIALTIES = [
  { value: 'all', label: 'All Specialties' },
  { value: 'general', label: 'General' },
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'neurology', label: 'Neurology' },
  { value: 'pediatrics', label: 'Pediatrics' },
  { value: 'orthopedics', label: 'Orthopedics' },
  { value: 'dermatology', label: 'Dermatology' },
  { value: 'psychiatry', label: 'Psychiatry' },
  { value: 'internal_medicine', label: 'Internal Medicine' },
  { value: 'obstetrics', label: 'Obstetrics' },
  { value: 'ophthalmology', label: 'Ophthalmology' },
  { value: 'family_medicine', label: 'Family Medicine' },
  { value: 'gastroenterology', label: 'Gastroenterology' },
  { value: 'pulmonology', label: 'Pulmonology' },
  { value: 'endocrinology', label: 'Endocrinology' },
  { value: 'surgery', label: 'Surgery' },
];

function DoctorDiscovery() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchDoctors();
  }, [specialty, page]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 12 };
      if (specialty !== 'all') params.specialty = specialty;
      if (search.trim()) params.search = search.trim();

      const res = await consultationAPI.getDoctors(params);
      const docs = Array.isArray(res.data?.data) ? res.data.data : [];
      setDoctors(docs);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDoctors();
  };

  const formatSpecialty = (s) => {
    if (!s) return 'General';
    return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Find a Doctor</h1>
          <p className="text-muted-foreground mt-2">Search doctors by specialization, availability, and rating</p>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name or specialty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <select
              value={specialty}
              onChange={(e) => { setSpecialty(e.target.value); setPage(1); }}
              className="px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary"
            >
              {SPECIALTIES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition"
            >
              Search
            </button>
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">No doctors found</p>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doc) => (
                <div key={doc._id} className="bg-card rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-md transition">
                  <div className="p-6">
                    {/* Doctor Info */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                        {doc.name?.charAt(0) || 'D'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-lg truncate">Dr. {doc.name}</h3>
                        <p className="text-primary text-sm font-medium">{formatSpecialty(doc.specialty)}</p>
                        {doc.experience && (
                          <p className="text-muted-foreground text-xs mt-1">{doc.experience} years experience</p>
                        )}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map(star => (
                          <svg key={star} className={`w-4 h-4 ${star <= (doc.rating?.average || 0) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="ml-1 text-sm text-muted-foreground">
                          {(doc.rating?.average || 0).toFixed(1)} ({doc.rating?.reviewCount || 0})
                        </span>
                      </div>
                    </div>

                    {/* Bio snippet */}
                    {doc.bio && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{doc.bio}</p>
                    )}

                    {/* Fee & Hospital */}
                    <div className="space-y-2 mb-4">
                      {doc.consultationFee?.amount > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Fee:</span>
                          <span className="font-semibold text-foreground">
                            {doc.consultationFee.currency === 'INR' ? '₹' : '$'}{doc.consultationFee.amount}
                          </span>
                        </div>
                      )}
                      {doc.hospitalAffiliation?.name && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Hospital:</span>
                          <span className="text-foreground">{doc.hospitalAffiliation.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Action */}
                    <button
                      onClick={() => navigate(`/consultation/book/${doc._id}`)}
                      className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition"
                    >
                      Book Consultation
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 rounded-lg border border-border text-foreground disabled:opacity-50 hover:bg-accent transition"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 rounded-lg border border-border text-foreground disabled:opacity-50 hover:bg-accent transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default DoctorDiscovery;
