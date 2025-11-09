import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  UsersIcon, 
  UserGroupIcon, 
  ChartBarIcon, 
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  BellIcon,
  XCircleIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  UserCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { verificationAPI, forumAPI, adminAPI, diseaseAPI } from '../utils/api';

function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // overview, users, doctors, posts, diseases
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    activeConsultations: 0,
    pendingApprovals: 0,
    systemAlerts: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [diseases, setDiseases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Loading states for each tab
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isLoadingDiseases, setIsLoadingDiseases] = useState(false);
  
  // Search states
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [postSearchTerm, setPostSearchTerm] = useState('');
  const [diseaseSearchTerm, setDiseaseSearchTerm] = useState('');
  
  // Pagination states
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(0);
  const [userTotalCount, setUserTotalCount] = useState(0);
  
  const [doctorPage, setDoctorPage] = useState(1);
  const [doctorTotalPages, setDoctorTotalPages] = useState(0);
  const [doctorTotalCount, setDoctorTotalCount] = useState(0);
  
  const [postPage, setPostPage] = useState(1);
  const [postTotalPages, setPostTotalPages] = useState(0);
  const [postTotalCount, setPostTotalCount] = useState(0);
  
  const [diseasePage, setDiseasePage] = useState(1);
  const [diseaseTotalPages, setDiseaseTotalPages] = useState(0);
  const [diseaseTotalCount, setDiseaseTotalCount] = useState(0);
  
  const [showAddDiseaseModal, setShowAddDiseaseModal] = useState(false);
  const [editingDisease, setEditingDisease] = useState(null);
  const [newDisease, setNewDisease] = useState({
    name: '',
    description: '',
    symptoms: '',
    prevention: '',
    treatment: '',
    riskFactors: '',
    severity: 'medium',
    category: 'other'
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    // Load data based on active tab
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'doctors') {
      loadDoctors();
    } else if (activeTab === 'posts') {
      loadCommunityPosts();
    } else if (activeTab === 'diseases') {
      loadDiseases();
    }
  }, [activeTab]);

  // Debounced search effect for diseases
  useEffect(() => {
    if (activeTab !== 'diseases') return;
    
    const debounceTimer = setTimeout(() => {
      setDiseasePage(1); // Reset to page 1 when searching
      loadDiseases(1, diseaseSearchTerm);
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimer);
  }, [diseaseSearchTerm]);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      
      // Load real stats from API
      const statsResponse = await adminAPI.getStats();
      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }
      
      // Load real pending verifications from API
      const response = await verificationAPI.getPendingVerifications({ limit: 10 });
      if (response.data.success) {
        const pendingDoctors = response.data.data.doctors || [];
        setPendingApprovals(pendingDoctors);

        // Create real recent activities from pending verifications
        const activities = [];
        
        // Add pending verification activities
        pendingDoctors.forEach((doctor, index) => {
          if (index < 3) { // Show max 3 pending verifications
            activities.push({
              id: `pending-${doctor._id}`,
              type: 'doctor_approval',
              message: `${doctor.name} requires verification`,
              timestamp: new Date(doctor.verificationSubmittedAt),
              priority: 'warning'
            });
          }
        });

        // Add a generic activity if we have space
        if (activities.length < 4) {
          activities.push({
            id: 'consultation',
            type: 'consultation',
            message: '15 consultations completed today',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
            priority: 'success'
          });
        }

        setRecentActivities(activities);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin dashboard data');
      setIsLoading(false);
    }
  };

  const loadUsers = async (page = 1) => {
    if (isLoadingUsers) return;
    
    setIsLoadingUsers(true);
    try {
      const response = await adminAPI.getUsers({ 
        page: page, 
        limit: 100 
      });
      
      if (response.data.success) {
        const fetchedUsers = response.data.data.users || [];
        const pagination = response.data.data.pagination;
        
        setUsers(fetchedUsers);
        setUserPage(pagination?.currentPage || page);
        setUserTotalPages(pagination?.totalPages || 1);
        setUserTotalCount(pagination?.totalCount || fetchedUsers.length);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleUserPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= userTotalPages) {
      setUserPage(newPage);
      loadUsers(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const loadDoctors = async (page = 1) => {
    if (isLoadingDoctors) return;
    
    setIsLoadingDoctors(true);
    try {
      const response = await verificationAPI.getVerifiedDoctors({ 
        page: page, 
        limit: 50 
      });
      
      if (response.data.success) {
        const fetchedDoctors = response.data.data.doctors || [];
        const totalPages = response.data.data.totalPages;
        const totalCount = response.data.data.totalCount;
        
        setDoctors(fetchedDoctors);
        setDoctorPage(response.data.data.currentPage || page);
        setDoctorTotalPages(totalPages || 1);
        setDoctorTotalCount(totalCount || fetchedDoctors.length);
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  const handleDoctorPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= doctorTotalPages) {
      setDoctorPage(newPage);
      loadDoctors(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const loadCommunityPosts = async (page = 1) => {
    if (isLoadingPosts) return;
    
    setIsLoadingPosts(true);
    try {
      const response = await forumAPI.getPosts({ 
        page: page, 
        limit: 50 
      });
      
      if (response.data.success) {
        const fetchedPosts = response.data.data.posts || [];
        const pagination = response.data.data.pagination;
        
        setCommunityPosts(fetchedPosts);
        setPostPage(pagination?.currentPage || page);
        setPostTotalPages(pagination?.totalPages || 1);
        setPostTotalCount(pagination?.totalCount || fetchedPosts.length);
      }
    } catch (error) {
      console.error('Error loading community posts:', error);
      toast.error('Failed to load community posts');
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handlePostPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= postTotalPages) {
      setPostPage(newPage);
      loadCommunityPosts(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const loadDiseases = async (page = 1, searchTerm = '') => {
    if (isLoadingDiseases) return;
    
    setIsLoadingDiseases(true);
    try {
      const params = { 
        page: page, 
        limit: 100 
      };
      
      // Add search parameter if search term exists
      if (searchTerm && searchTerm.trim()) {
        params.name = searchTerm.trim();
      }
      
      const response = await diseaseAPI.getDiseases(params);
      
      if (response.data.success) {
        const fetchedDiseases = response.data.data.diseases || [];
        const pagination = response.data.data.pagination;
        
        setDiseases(fetchedDiseases);
        setDiseasePage(pagination.currentPage);
        setDiseaseTotalPages(pagination.totalPages);
        setDiseaseTotalCount(pagination.totalCount);
      }
    } catch (error) {
      console.error('Error loading diseases:', error);
      toast.error('Failed to load diseases');
    } finally {
      setIsLoadingDiseases(false);
    }
  };

  const handleDiseasePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= diseaseTotalPages) {
      setDiseasePage(newPage);
      loadDiseases(newPage, diseaseSearchTerm);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Filter functions for search
  const filteredUsers = users.filter(user => {
    if (!userSearchTerm) return true;
    const searchLower = userSearchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.role?.toLowerCase().includes(searchLower)
    );
  });

  const filteredDoctors = doctors.filter(doctor => {
    if (!doctorSearchTerm) return true;
    const searchLower = doctorSearchTerm.toLowerCase();
    return (
      doctor.name?.toLowerCase().includes(searchLower) ||
      doctor.email?.toLowerCase().includes(searchLower) ||
      doctor.specialty?.toLowerCase().includes(searchLower) ||
      doctor.medicalLicenseNumber?.toLowerCase().includes(searchLower)
    );
  });

  const filteredPosts = communityPosts.filter(post => {
    if (!postSearchTerm) return true;
    const searchLower = postSearchTerm.toLowerCase();
    return (
      post.title?.toLowerCase().includes(searchLower) ||
      post.content?.toLowerCase().includes(searchLower) ||
      post.author?.name?.toLowerCase().includes(searchLower) ||
      post.category?.toLowerCase().includes(searchLower)
    );
  });

  // For diseases, we use server-side search, so no client-side filtering
  const filteredDiseases = diseases;

  const handleAddDisease = async (e) => {
    e.preventDefault();
    
    try {
      // Convert comma-separated strings to arrays
      const diseaseData = {
        name: newDisease.name.trim(),
        description: newDisease.description.trim(),
        symptoms: newDisease.symptoms.split(',').map(s => s.trim()).filter(s => s),
        prevention: newDisease.prevention ? newDisease.prevention.split(',').map(s => s.trim()).filter(s => s) : [],
        treatment: newDisease.treatment ? newDisease.treatment.split(',').map(s => s.trim()).filter(s => s) : [],
        riskFactors: newDisease.riskFactors ? newDisease.riskFactors.split(',').map(s => s.trim()).filter(s => s) : [],
        severity: newDisease.severity,
        category: newDisease.category
      };

      if (editingDisease) {
        // Update existing disease
        const response = await diseaseAPI.updateDisease(editingDisease._id, diseaseData);
        if (response.data.success) {
          setDiseases(prev => prev.map(d => d._id === editingDisease._id ? response.data.data : d));
          toast.success('Disease updated successfully');
        }
      } else {
        // Create new disease
        const response = await diseaseAPI.createDisease(diseaseData);
        if (response.data.success) {
          setDiseases(prev => [response.data.data, ...prev]);
          toast.success('Disease added successfully');
        }
      }

      setShowAddDiseaseModal(false);
      setEditingDisease(null);
      setNewDisease({
        name: '',
        description: '',
        symptoms: '',
        prevention: '',
        treatment: '',
        riskFactors: '',
        severity: 'medium',
        category: 'other'
      });
    } catch (error) {
      console.error('Error saving disease:', error);
      toast.error(error.response?.data?.message || 'Failed to save disease');
    }
  };

  const handleEditDisease = (disease) => {
    setEditingDisease(disease);
    
    // Helper function to convert array or string to comma-separated string
    const toCommaSeparated = (value) => {
      if (!value) return '';
      if (Array.isArray(value)) return value.join(', ');
      if (typeof value === 'string') return value;
      return '';
    };
    
    setNewDisease({
      name: disease.name,
      description: disease.description,
      symptoms: toCommaSeparated(disease.symptoms),
      prevention: toCommaSeparated(disease.prevention),
      treatment: toCommaSeparated(disease.treatment),
      riskFactors: toCommaSeparated(disease.riskFactors),
      severity: disease.severity || 'medium',
      category: disease.category || 'other'
    });
    setShowAddDiseaseModal(true);
  };

  const handleDeleteDisease = async (diseaseId) => {
    if (!confirm('Are you sure you want to delete this disease?')) return;
    
    try {
      const response = await diseaseAPI.deleteDisease(diseaseId);
      if (response.data.success) {
        setDiseases(prev => prev.filter(d => d._id !== diseaseId));
        toast.success('Disease deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting disease:', error);
      toast.error('Failed to delete disease');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const response = await adminAPI.deleteUser(userId);
      if (response.data.success) {
        setUsers(prev => prev.filter(u => u._id !== userId));
        toast.success('User deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      const user = users.find(u => u._id === userId);
      const newStatus = !user.isActive;
      
      const response = await adminAPI.toggleUserStatus(userId, newStatus);
      if (response.data.success) {
        setUsers(prev => prev.map(u => 
          u._id === userId ? { ...u, isActive: newStatus } : u
        ));
        toast.success('User status updated');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      // Add API call to delete post
      setCommunityPosts(prev => prev.filter(p => p._id !== postId));
      toast.success('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleRemoveDoctor = async (doctorId) => {
    if (!confirm('Are you sure you want to remove this doctor? This will revoke their verification.')) return;
    
    try {
      // Add API call to remove doctor verification
      setDoctors(prev => prev.filter(d => d._id !== doctorId));
      toast.success('Doctor removed successfully');
    } catch (error) {
      console.error('Error removing doctor:', error);
      toast.error('Failed to remove doctor');
    }
  };

  const handleApproveDoctor = async (doctorId) => {
    try {
      const response = await verificationAPI.approveVerification(doctorId);
      if (response.data.success) {
        setPendingApprovals(prev => prev.filter(doc => doc._id !== doctorId));
        setStats(prev => ({ ...prev, pendingApprovals: prev.pendingApprovals - 1 }));
        setShowDetailsModal(false);
        setSelectedDoctor(null);
        toast.success('Doctor approved successfully');
      }
    } catch (error) {
      console.error('Error approving doctor:', error);
      toast.error(error.response?.data?.message || 'Failed to approve doctor');
    }
  };

  const handleRejectDoctor = async (doctorId) => {
    const reason = prompt('Please enter a reason for rejection:');
    if (!reason) return;
    
    try {
      const response = await verificationAPI.rejectVerification(doctorId, { reason });
      if (response.data.success) {
        setPendingApprovals(prev => prev.filter(doc => doc._id !== doctorId));
        setStats(prev => ({ ...prev, pendingApprovals: prev.pendingApprovals - 1 }));
        setShowDetailsModal(false);
        setSelectedDoctor(null);
        toast.success('Doctor application rejected');
      }
    } catch (error) {
      console.error('Error rejecting doctor:', error);
      toast.error(error.response?.data?.message || 'Failed to reject doctor application');
    }
  };

  const handleViewDetails = async (doctorId) => {
    try {
      const response = await verificationAPI.getVerificationDetails(doctorId);
      if (response.data.success) {
        setSelectedDoctor(response.data.data.doctor);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error loading doctor details:', error);
      toast.error('Failed to load doctor details');
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'success': return 'text-green-600 bg-green-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  // Reusable pagination component renderer
  const renderPagination = (currentPage, totalPages, totalCount, handlePageChange, searchTerm = '') => {
    if (searchTerm || totalPages <= 1) return null;

    return (
      <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Next
          </button>
        </div>
        
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing page <span className="font-medium">{currentPage}</span> of{' '}
              <span className="font-medium">{totalPages}</span> ({totalCount} total results)
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
                title="First page"
              >
                <span className="sr-only">First</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
                title="Previous page"
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={`page-${pageNum}`}
                    onClick={() => handlePageChange(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === pageNum
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
                title="Next page"
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
                title="Last page"
              >
                <span className="sr-only">Last</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-lg text-gray-600">Welcome back, {user?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="btn btn-outline">
                <Cog6ToothIcon className="h-5 w-5 mr-2" />
                System Settings
              </button>
              <button className="btn btn-primary">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Generate Report
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ChartBarIcon className="h-5 w-5 inline-block mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UsersIcon className="h-5 w-5 inline-block mr-2" />
              Users
            </button>
            <button
              onClick={() => setActiveTab('doctors')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'doctors'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserGroupIcon className="h-5 w-5 inline-block mr-2" />
              Doctors
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'posts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5 inline-block mr-2" />
              Community Posts
            </button>
            <button
              onClick={() => setActiveTab('diseases')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'diseases'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DocumentTextIcon className="h-5 w-5 inline-block mr-2" />
              Diseases
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Total Users */}
              <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                <p className="text-sm text-green-600">+12% from last month</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <UsersIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Total Doctors */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Doctors</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalDoctors}</p>
                <p className="text-sm text-green-600">+3 this week</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <UserGroupIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Active Consultations */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Consultations</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeConsultations}</p>
                <p className="text-sm text-blue-600">Live sessions</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <ChartBarIcon className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <Link to="/admin/verifications" className="block hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.pendingApprovals}</p>
                  <p className="text-sm text-orange-600">Require attention</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <ClockIcon className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </Link>
          </div>

          {/* System Alerts */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Alerts</p>
                <p className="text-3xl font-bold text-gray-900">{stats.systemAlerts}</p>
                <p className="text-sm text-red-600">Need review</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Status</p>
                  <p className="text-3xl font-bold text-green-600">Healthy</p>
                  <p className="text-sm text-gray-500">All systems operational</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircleIcon className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Activities */}
              <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Recent Activities</h3>
              <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View All
              </button>
            </div>
            
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${getPriorityColor(activity.priority)}`}>
                      <BellIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Doctor Approvals */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Pending Doctor Approvals</h3>
              <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {pendingApprovals.length} pending
              </span>
            </div>
            
            <div className="space-y-4">
              {pendingApprovals.map((doctor) => (
                <div key={doctor._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{doctor.name}</h4>
                      <p className="text-sm text-gray-600">{doctor.email}</p>
                      <p className="text-sm text-gray-500">
                        {doctor.specialty} • License: {doctor.medicalLicense?.number || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Submitted {formatTimeAgo(doctor.verificationSubmittedAt)}
                      </p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleViewDetails(doctor._id)}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleApproveDoctor(doctor._id)}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectDoctor(doctor._id)}
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {pendingApprovals.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No pending approvals</p>
                </div>
              )}
            </div>
          </div>
        </div>
        </>
      )}

      {/* Users Management Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
              <button className="btn btn-primary">
                <UsersIcon className="h-5 w-5 mr-2" />
                Add New User
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search by name, email, or role..."
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {isLoadingUsers ? (
                  <span className="flex items-center">
                    <svg className="animate-spin h-4 w-4 mr-2 text-blue-600" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Loading users...
                  </span>
                ) : userSearchTerm ? (
                  `Showing ${filteredUsers.length} of ${users.length} users on this page`
                ) : (
                  `Page ${userPage} of ${userTotalPages} (${userTotalCount} total users)`
                )}
              </p>
            </div>
            
            {isLoadingUsers ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading users from database...</p>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserCircleIcon className="h-10 w-10 text-gray-400" />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive !== false ? 'active' : 'inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleToggleUserStatus(user._id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {user.isActive !== false ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
            
            {/* Pagination */}
            {renderPagination(userPage, userTotalPages, userTotalCount, handleUserPageChange, userSearchTerm)}
          </div>
        )}

        {/* Doctors Management Tab */}
        {activeTab === 'doctors' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Doctor Management</h2>
              <p className="text-gray-600">{doctors.length} verified doctors</p>
            </div>
            
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={doctorSearchTerm}
                  onChange={(e) => setDoctorSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search by name, email, specialty, or license number..."
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {isLoadingDoctors ? (
                  <span>Loading...</span>
                ) : doctorSearchTerm ? (
                  `Showing ${filteredDoctors.length} of ${doctors.length} doctors on this page`
                ) : (
                  `Page ${doctorPage} of ${doctorTotalPages} (${doctorTotalCount} total doctors)`
                )}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDoctors.map((doctor) => (
                <div key={doctor._id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{doctor.name}</h3>
                      <p className="text-sm text-gray-600">{doctor.specialty}</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Verified
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    <p>📧 {doctor.email}</p>
                    {doctor.phoneNumber && <p>📞 {doctor.phoneNumber}</p>}
                    <p>🏥 {doctor.experience} years experience</p>
                  </div>
                  <div className="flex justify-between pt-3 border-t">
                    <button
                      onClick={() => handleViewDetails(doctor._id)}
                      className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View Details
                    </button>
                    <button
                      onClick={() => handleRemoveDoctor(doctor._id)}
                      className="text-red-600 hover:text-red-800 flex items-center text-sm"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              
              {filteredDoctors.length === 0 && (
                <div className="text-center py-12">
                  <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {doctorSearchTerm ? 'No doctors found matching your search' : 'No verified doctors found'}
                  </p>
                </div>
              )}
            </div>
            
            {/* Pagination */}
            {renderPagination(doctorPage, doctorTotalPages, doctorTotalCount, handleDoctorPageChange, doctorSearchTerm)}
          </div>
        )}

        {/* Community Posts Tab */}
        {activeTab === 'posts' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Community Posts Management</h2>
              <p className="text-gray-600">{communityPosts.length} total posts</p>
            </div>
            
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={postSearchTerm}
                  onChange={(e) => setPostSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search by title, content, author, or category..."
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {isLoadingPosts ? (
                  <span>Loading...</span>
                ) : postSearchTerm ? (
                  `Showing ${filteredPosts.length} of ${communityPosts.length} posts on this page`
                ) : (
                  `Page ${postPage} of ${postTotalPages} (${postTotalCount} total posts)`
                )}
              </p>
            </div>
            
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <div key={post._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <UserCircleIcon className="h-6 w-6 text-gray-400" />
                        <span className="font-medium">{post.author?.name || 'Anonymous'}</span>
                        <span className="text-sm text-gray-500">
                          {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
                      <p className="text-gray-600 mb-3">{post.content?.substring(0, 200)}...</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>👍 {post.likes?.length || 0} likes</span>
                        <span>💬 {post.comments?.length || 0} comments</span>
                        {post.category && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {post.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col space-y-2">
                      <button
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <EyeIcon className="h-5 w-5 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        className="text-red-600 hover:text-red-800 flex items-center"
                      >
                        <TrashIcon className="h-5 w-5 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredPosts.length === 0 && (
                <div className="text-center py-12">
                  <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {postSearchTerm ? 'No posts found matching your search' : 'No community posts found'}
                  </p>
                </div>
              )}
            </div>
            
            {/* Pagination */}
            {renderPagination(postPage, postTotalPages, postTotalCount, handlePostPageChange, postSearchTerm)}
          </div>
        )}

        {/* Diseases Tab */}
        {activeTab === 'diseases' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Disease Management</h2>
              <button
                onClick={() => {
                  setEditingDisease(null);
                  setNewDisease({
                    name: '',
                    description: '',
                    symptoms: '',
                    prevention: '',
                    treatment: '',
                    riskFactors: '',
                    severity: 'medium',
                    category: 'other'
                  });
                  setShowAddDiseaseModal(true);
                }}
                className="btn btn-primary flex items-center"
              >
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Add Disease
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={diseaseSearchTerm}
                  onChange={(e) => setDiseaseSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search by name, description, category, severity, or symptoms..."
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {isLoadingDiseases ? (
                  <span className="flex items-center">
                    <svg className="animate-spin h-4 w-4 mr-2 text-blue-600" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Searching diseases...
                  </span>
                ) : diseaseSearchTerm ? (
                  diseaseTotalCount > 0 
                    ? `Found ${diseaseTotalCount} results for "${diseaseSearchTerm}" - Page ${diseasePage} of ${diseaseTotalPages}`
                    : `No diseases found matching "${diseaseSearchTerm}"`
                ) : (
                  `Page ${diseasePage} of ${diseaseTotalPages} (${diseaseTotalCount} total diseases)`
                )}
              </p>
            </div>
            
            {isLoadingDiseases ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading diseases from database...</p>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Disease Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Symptoms
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDiseases.map((disease) => (
                    <tr key={disease._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{disease.name}</div>
                        <div className="text-sm text-gray-500">{disease.description?.substring(0, 60)}...</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {disease.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          disease.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          disease.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          disease.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {disease.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {disease.symptoms?.length || 0} symptoms
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditDisease(disease)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteDisease(disease._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredDiseases.length === 0 && (
                <div className="text-center py-12">
                  <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {diseaseSearchTerm ? 'No diseases found matching your search' : 'No diseases found'}
                  </p>
                  {!diseaseSearchTerm && (
                    <button
                      onClick={() => setShowAddDiseaseModal(true)}
                      className="mt-4 text-blue-600 hover:text-blue-800"
                    >
                      Add your first disease
                    </button>
                  )}
                </div>
              )}
            </div>
            )}
            
            {/* Pagination Controls - Show for both search and normal browsing */}
            {diseaseTotalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handleDiseasePageChange(diseasePage - 1)}
                    disabled={diseasePage === 1}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      diseasePage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handleDiseasePageChange(diseasePage + 1)}
                    disabled={diseasePage === diseaseTotalPages}
                    className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      diseasePage === diseaseTotalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Next
                  </button>
                </div>
                
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{diseasePage}</span> of{' '}
                      <span className="font-medium">{diseaseTotalPages}</span> ({diseaseTotalCount} total results)
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => handleDiseasePageChange(1)}
                        disabled={diseasePage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                          diseasePage === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                        title="First page"
                      >
                        <span className="sr-only">First</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => handleDiseasePageChange(diseasePage - 1)}
                        disabled={diseasePage === 1}
                        className={`relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium ${
                          diseasePage === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                        title="Previous page"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, diseaseTotalPages) }, (_, i) => {
                        let pageNum;
                        if (diseaseTotalPages <= 5) {
                          pageNum = i + 1;
                        } else if (diseasePage <= 3) {
                          pageNum = i + 1;
                        } else if (diseasePage >= diseaseTotalPages - 2) {
                          pageNum = diseaseTotalPages - 4 + i;
                        } else {
                          pageNum = diseasePage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={`disease-page-${pageNum}`}
                            onClick={() => handleDiseasePageChange(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              diseasePage === pageNum
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handleDiseasePageChange(diseasePage + 1)}
                        disabled={diseasePage === diseaseTotalPages}
                        className={`relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium ${
                          diseasePage === diseaseTotalPages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                        title="Next page"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => handleDiseasePageChange(diseaseTotalPages)}
                        disabled={diseasePage === diseaseTotalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                          diseasePage === diseaseTotalPages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                        title="Last page"
                      >
                        <span className="sr-only">Last</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          <path fillRule="evenodd" d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Disease Modal */}
      {showAddDiseaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingDisease ? 'Edit Disease' : 'Add New Disease'}
              </h2>
              <button
                onClick={() => {
                  setShowAddDiseaseModal(false);
                  setEditingDisease(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddDisease} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Disease Name *
                </label>
                <input
                  type="text"
                  value={newDisease.name}
                  onChange={(e) => setNewDisease({...newDisease, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="e.g., Type 2 Diabetes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={newDisease.description}
                  onChange={(e) => setNewDisease({...newDisease, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  required
                  placeholder="Detailed description of the disease..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={newDisease.category}
                    onChange={(e) => setNewDisease({...newDisease, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="infectious">Infectious</option>
                    <option value="chronic">Chronic</option>
                    <option value="genetic">Genetic</option>
                    <option value="autoimmune">Autoimmune</option>
                    <option value="cardiovascular">Cardiovascular</option>
                    <option value="respiratory">Respiratory</option>
                    <option value="neurological">Neurological</option>
                    <option value="digestive">Digestive</option>
                    <option value="endocrine">Endocrine</option>
                    <option value="musculoskeletal">Musculoskeletal</option>
                    <option value="mental">Mental Health</option>
                    <option value="cancer">Cancer</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Severity *
                  </label>
                  <select
                    value={newDisease.severity}
                    onChange={(e) => setNewDisease({...newDisease, severity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Symptoms * (comma-separated)
                </label>
                <textarea
                  value={newDisease.symptoms}
                  onChange={(e) => setNewDisease({...newDisease, symptoms: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  required
                  placeholder="e.g., fever, cough, fatigue, headache"
                />
                <p className="mt-1 text-xs text-gray-500">Enter symptoms separated by commas</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prevention Measures (comma-separated)
                </label>
                <textarea
                  value={newDisease.prevention}
                  onChange={(e) => setNewDisease({...newDisease, prevention: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="e.g., regular exercise, healthy diet, vaccination"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Treatment Options (comma-separated)
                </label>
                <textarea
                  value={newDisease.treatment}
                  onChange={(e) => setNewDisease({...newDisease, treatment: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="e.g., medication, physical therapy, surgery"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Risk Factors (comma-separated)
                </label>
                <textarea
                  value={newDisease.riskFactors}
                  onChange={(e) => setNewDisease({...newDisease, riskFactors: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="e.g., obesity, smoking, family history"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddDiseaseModal(false);
                    setEditingDisease(null);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingDisease ? 'Update Disease' : 'Add Disease'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Doctor Details Modal */}
      {showDetailsModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Doctor Verification Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="font-medium">{selectedDoctor.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedDoctor.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Specialty</p>
                    <p className="font-medium">{selectedDoctor.specialty}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Years of Experience</p>
                    <p className="font-medium">{selectedDoctor.yearsOfExperience || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Consultation Fee</p>
                    <p className="font-medium">
                      {selectedDoctor.consultationFee?.amount 
                        ? `${selectedDoctor.consultationFee.currency || '₹'}${selectedDoctor.consultationFee.amount}` 
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Languages Spoken</p>
                    <p className="font-medium">
                      {Array.isArray(selectedDoctor.languagesSpoken) 
                        ? selectedDoctor.languagesSpoken.join(', ') 
                        : selectedDoctor.languagesSpoken || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{selectedDoctor.contact?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Office Address</p>
                    <p className="font-medium">{selectedDoctor.contact?.officeAddress?.street || 'N/A'}</p>
                    {selectedDoctor.contact?.officeAddress?.city && (
                      <p className="text-sm">
                        {selectedDoctor.contact.officeAddress.city}
                        {selectedDoctor.contact.officeAddress.state && `, ${selectedDoctor.contact.officeAddress.state}`}
                        {selectedDoctor.contact.officeAddress.zipCode && ` ${selectedDoctor.contact.officeAddress.zipCode}`}
                      </p>
                    )}
                  </div>
                  {selectedDoctor.contact?.emergencyContact && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Emergency Contact</p>
                      <p className="font-medium">{selectedDoctor.contact.emergencyContact.name} - {selectedDoctor.contact.emergencyContact.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Medical License */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 mr-2" />
                  Medical License
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">License Number</p>
                    <p className="font-medium">{selectedDoctor.medicalLicense?.number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Issuing Authority</p>
                    <p className="font-medium">{selectedDoctor.medicalLicense?.authority || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Issue Date</p>
                    <p className="font-medium">{selectedDoctor.medicalLicense?.issueDate ? new Date(selectedDoctor.medicalLicense.issueDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Expiry Date</p>
                    <p className="font-medium">{selectedDoctor.medicalLicense?.expiryDate ? new Date(selectedDoctor.medicalLicense.expiryDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Medical Council Registration */}
              {selectedDoctor.medicalCouncilRegistration?.number && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical Council Registration</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Registration Number</p>
                      <p className="font-medium">{selectedDoctor.medicalCouncilRegistration.number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Council Name</p>
                      <p className="font-medium">{selectedDoctor.medicalCouncilRegistration.councilName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Registration Date</p>
                      <p className="font-medium">{selectedDoctor.medicalCouncilRegistration.registrationDate ? new Date(selectedDoctor.medicalCouncilRegistration.registrationDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Education */}
              {selectedDoctor.education && selectedDoctor.education.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <AcademicCapIcon className="h-5 w-5 mr-2" />
                    Education
                  </h3>
                  <div className="space-y-3">
                    {selectedDoctor.education.map((edu, index) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4">
                        <p className="font-medium">{edu.degree}</p>
                        <p className="text-sm text-gray-600">{edu.institution}</p>
                        <p className="text-sm text-gray-500">{edu.yearOfCompletion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Professional Experience */}
              {selectedDoctor.professionalExperience && selectedDoctor.professionalExperience.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <BriefcaseIcon className="h-5 w-5 mr-2" />
                    Professional Experience
                  </h3>
                  <div className="space-y-3">
                    {selectedDoctor.professionalExperience.map((exp, index) => (
                      <div key={index} className="border-l-4 border-green-500 pl-4">
                        <p className="font-medium">{exp.position}</p>
                        <p className="text-sm text-gray-600">{exp.hospital}</p>
                        <p className="text-sm text-gray-500">{exp.startYear} - {exp.endYear || 'Present'}</p>
                        {exp.responsibilities && (
                          <p className="text-sm text-gray-600 mt-1">{exp.responsibilities}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Specialty Certifications */}
              {selectedDoctor.specialtyCertifications && selectedDoctor.specialtyCertifications.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Specialty Certifications</h3>
                  <div className="space-y-3">
                    {selectedDoctor.specialtyCertifications.map((cert, index) => (
                      <div key={index} className="border-l-4 border-purple-500 pl-4">
                        <p className="font-medium">{cert.certificationName}</p>
                        <p className="text-sm text-gray-600">{cert.issuingOrganization}</p>
                        <p className="text-sm text-gray-500">Year: {cert.yearObtained}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Publications */}
              {selectedDoctor.publications && selectedDoctor.publications.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Publications</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedDoctor.publications.map((pub, index) => (
                      <li key={index} className="text-sm text-gray-700">{pub}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Awards */}
              {selectedDoctor.awards && selectedDoctor.awards.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Awards & Recognition</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedDoctor.awards.map((award, index) => (
                      <li key={index} className="text-sm text-gray-700">{award}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Bio */}
              {selectedDoctor.bio && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
                  <p className="text-gray-700">{selectedDoctor.bio}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  onClick={() => handleRejectDoctor(selectedDoctor._id)}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                >
                  <XCircleIcon className="h-5 w-5 mr-2" />
                  Reject
                </button>
                <button
                  onClick={() => handleApproveDoctor(selectedDoctor._id)}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                >
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;