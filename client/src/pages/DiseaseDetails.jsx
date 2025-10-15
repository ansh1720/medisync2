import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { 
  HeartIcon, 
  ExclamationTriangleIcon, 
  ShieldCheckIcon,
  BeakerIcon,
  MapPinIcon,
  ChartBarIcon,
  ArrowLeftIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function DiseaseDetails() {
  const { diseaseId } = useParams();
  const location = useLocation();
  const [disease, setDisease] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [relatedDiseases, setRelatedDiseases] = useState([]);

  // Mock disease data (in real app, this would come from API)
  const mockDiseases = {
    'diabetes': {
      id: 'diabetes',
      name: 'Diabetes Mellitus',
      category: 'endocrine',
      severity: 'high',
      description: 'Diabetes is a group of metabolic disorders characterized by a high blood sugar level over a prolonged period of time.',
      symptoms: [
        'frequent urination', 'increased thirst', 'increased hunger', 
        'weight loss', 'fatigue', 'blurred vision', 'slow healing wounds'
      ],
      causes: [
        'Insulin resistance', 'Beta cell dysfunction', 'Genetic factors',
        'Obesity', 'Physical inactivity', 'Poor diet', 'Age'
      ],
      prevention: [
        'Maintain healthy weight', 'Regular physical exercise', 'Balanced diet',
        'Limit sugar intake', 'Regular health checkups', 'Manage stress'
      ],
      treatment: [
        'Blood sugar monitoring', 'Insulin therapy', 'Oral medications',
        'Diet modification', 'Exercise program', 'Weight management'
      ],
      riskFactors: [
        'Family history', 'Obesity', 'Age over 45', 'Sedentary lifestyle',
        'High blood pressure', 'Gestational diabetes history'
      ],
      prevalence: {
        global: 8.5,
        byRegion: [
          { region: 'North America', rate: 11.1 },
          { region: 'Europe', rate: 6.8 },
          { region: 'Asia', rate: 8.7 },
          { region: 'Africa', rate: 4.0 }
        ]
      },
      statistics: {
        affectedPopulation: 463000000,
        yearlyDeaths: 1500000,
        economicImpact: 760000000000
      }
    },
    'hypertension': {
      id: 'hypertension',
      name: 'Hypertension (High Blood Pressure)',
      category: 'cardiovascular',
      severity: 'high',
      description: 'Hypertension is a long-term medical condition in which blood pressure in the arteries is persistently elevated.',
      symptoms: [
        'headaches', 'shortness of breath', 'nosebleeds', 'chest pain',
        'vision changes', 'fatigue', 'irregular heartbeat'
      ],
      causes: [
        'Arterial stiffness', 'Increased blood volume', 'Kidney disease',
        'Hormonal disorders', 'Medications', 'Sleep apnea'
      ],
      prevention: [
        'Reduce sodium intake', 'Regular exercise', 'Maintain healthy weight',
        'Limit alcohol', 'Quit smoking', 'Manage stress', 'Adequate sleep'
      ],
      treatment: [
        'ACE inhibitors', 'Beta blockers', 'Diuretics', 'Calcium channel blockers',
        'Lifestyle modifications', 'Regular monitoring'
      ],
      riskFactors: [
        'Age', 'Race', 'Family history', 'Obesity', 'Smoking',
        'Excessive salt intake', 'Lack of physical activity'
      ],
      prevalence: {
        global: 22.1,
        byRegion: [
          { region: 'North America', rate: 19.5 },
          { region: 'Europe', rate: 23.2 },
          { region: 'Asia', rate: 24.9 },
          { region: 'Africa', rate: 27.0 }
        ]
      },
      statistics: {
        affectedPopulation: 1280000000,
        yearlyDeaths: 8800000,
        economicImpact: 200000000000
      }
    },
    'asthma': {
      id: 'asthma',
      name: 'Asthma',
      category: 'respiratory',
      severity: 'medium',
      description: 'Asthma is a respiratory condition marked by attacks of spasm in the bronchi of the lungs.',
      symptoms: [
        'wheezing', 'shortness of breath', 'chest tightness', 'coughing',
        'difficulty breathing', 'fatigue during exercise'
      ],
      causes: [
        'Allergic reactions', 'Environmental factors', 'Respiratory infections',
        'Physical activity', 'Weather changes', 'Strong emotions'
      ],
      prevention: [
        'Avoid triggers', 'Use air purifiers', 'Regular cleaning',
        'Vaccination', 'Manage allergies', 'Monitor air quality'
      ],
      treatment: [
        'Inhaled bronchodilators', 'Corticosteroids', 'Leukotriene modifiers',
        'Long-acting beta agonists', 'Immunotherapy', 'Emergency inhalers'
      ],
      riskFactors: [
        'Family history', 'Allergies', 'Childhood respiratory infections',
        'Exposure to smoke', 'Occupational hazards', 'Obesity'
      ],
      prevalence: {
        global: 4.3,
        byRegion: [
          { region: 'North America', rate: 7.7 },
          { region: 'Europe', rate: 5.4 },
          { region: 'Asia', rate: 2.8 },
          { region: 'Africa', rate: 3.5 }
        ]
      },
      statistics: {
        affectedPopulation: 339000000,
        yearlyDeaths: 461000,
        economicImpact: 82000000000
      }
    },
    'common-cold': {
      id: 'common-cold',
      name: 'Common Cold',
      category: 'infectious',
      severity: 'low',
      description: 'The common cold is a viral infection of the upper respiratory tract that is very common and usually mild.',
      symptoms: [
        'runny nose', 'sneezing', 'sore throat', 'mild cough',
        'congestion', 'mild headache', 'low fever', 'fatigue'
      ],
      causes: [
        'Rhinoviruses', 'Coronaviruses', 'Respiratory syncytial virus',
        'Parainfluenza viruses', 'Adenoviruses'
      ],
      prevention: [
        'Wash hands frequently', 'Avoid close contact with infected people',
        'Don\'t touch face', 'Maintain good hygiene', 'Get adequate sleep'
      ],
      treatment: [
        'Rest and sleep', 'Drink plenty of fluids', 'Use humidifier',
        'Gargle with salt water', 'Over-the-counter pain relievers'
      ],
      riskFactors: [
        'Weakened immune system', 'Age (children and elderly)',
        'Seasonal changes', 'Stress', 'Poor nutrition'
      ],
      prevalence: {
        global: 95.0,
        byRegion: [
          { region: 'North America', rate: 98.0 },
          { region: 'Europe', rate: 97.0 },
          { region: 'Asia', rate: 94.0 },
          { region: 'Africa', rate: 92.0 }
        ]
      },
      statistics: {
        affectedPopulation: 7000000000,
        yearlyDeaths: 5000,
        economicImpact: 40000000000
      }
    },
    'migraine': {
      id: 'migraine',
      name: 'Migraine',
      category: 'neurological',
      severity: 'medium',
      description: 'Migraine is a primary headache disorder characterized by recurrent headaches that are moderate to severe.',
      symptoms: [
        'severe headache', 'nausea', 'vomiting', 'sensitivity to light',
        'sensitivity to sound', 'visual disturbances', 'fatigue', 'dizziness'
      ],
      causes: [
        'Genetic factors', 'Hormonal changes', 'Stress', 'Food triggers',
        'Sleep disturbances', 'Weather changes', 'Environmental factors'
      ],
      prevention: [
        'Identify and avoid triggers', 'Maintain regular sleep schedule',
        'Manage stress', 'Stay hydrated', 'Regular exercise', 'Limit caffeine'
      ],
      treatment: [
        'Rest in dark, quiet room', 'Pain medications', 'Anti-nausea medications',
        'Preventive medications', 'Lifestyle modifications', 'Stress management'
      ],
      riskFactors: [
        'Family history', 'Age (most common 10-40)', 'Gender (more common in women)',
        'Hormonal changes', 'Stress', 'Certain foods'
      ],
      prevalence: {
        global: 14.4,
        byRegion: [
          { region: 'North America', rate: 17.1 },
          { region: 'Europe', rate: 15.2 },
          { region: 'Asia', rate: 11.2 },
          { region: 'Africa', rate: 13.8 }
        ]
      },
      statistics: {
        affectedPopulation: 1120000000,
        yearlyDeaths: 500,
        economicImpact: 78000000000
      }
    }
  };

  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const searchQuery = location.state?.searchQuery || diseaseId;
      
      // Try multiple ways to find the disease
      let foundDisease = mockDiseases[diseaseId]; // Direct ID match
      
      if (!foundDisease) {
        // Try to find by name match
        foundDisease = Object.values(mockDiseases).find(d => 
          d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.id === searchQuery.toLowerCase() ||
          d.id === diseaseId
        );
      }
      
      if (foundDisease) {
        setDisease(foundDisease);
        // Set related diseases
        setRelatedDiseases(
          Object.values(mockDiseases)
            .filter(d => d.id !== foundDisease.id && d.category === foundDisease.category)
            .slice(0, 3)
        );
        toast.success(`Loaded information for ${foundDisease.name}`);
      } else {
        console.error(`Disease not found for ID: ${diseaseId}, search: ${searchQuery}`);
        toast.error('Disease not found');
      }
      setIsLoading(false);
    }, 500);
  }, [diseaseId, location.state]);

  // Chart configurations
  const prevalenceChartData = {
    labels: disease?.prevalence.byRegion.map(r => r.region) || [],
    datasets: [
      {
        label: 'Prevalence Rate (%)',
        data: disease?.prevalence.byRegion.map(r => r.rate) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const symptomsChartData = {
    labels: disease?.symptoms.slice(0, 6) || [],
    datasets: [
      {
        label: 'Symptom Frequency (%)',
        data: disease?.symptoms.slice(0, 6).map(() => Math.floor(Math.random() * 40) + 60) || [],
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 2,
      },
    ],
  };

  const severityChartData = {
    labels: ['Mild', 'Moderate', 'Severe'],
    datasets: [
      {
        data: [45, 35, 20],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading disease information...</p>
        </div>
      </div>
    );
  }

  if (!disease) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Disease Not Found</h1>
          <p className="text-gray-600 mb-6">The disease you're looking for doesn't exist or has been removed.</p>
          <Link to="/dashboard" className="btn btn-primary">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'critical': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: InformationCircleIcon },
    { id: 'symptoms', label: 'Symptoms & Causes', icon: HeartIcon },
    { id: 'prevention', label: 'Prevention & Treatment', icon: ShieldCheckIcon },
    { id: 'statistics', label: 'Statistics & Charts', icon: ChartBarIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link 
              to="/dashboard" 
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            <Link 
              to="/risk-assessment" 
              state={{ diseaseQuery: disease.name }}
              className="btn btn-primary"
            >
              Check Risk Assessment
            </Link>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 mr-4">{disease.name}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(disease.severity)}`}>
                    {disease.severity} severity
                  </span>
                </div>
                <p className="text-lg text-gray-600 mb-4">{disease.description}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full mr-3">
                    {disease.category}
                  </span>
                  <span>Global prevalence: {disease.prevalence.global}%</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-600 mb-1">
                  {(disease.statistics.affectedPopulation / 1000000).toFixed(0)}M
                </div>
                <div className="text-sm text-gray-500">People affected globally</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className={`-ml-0.5 mr-2 h-5 w-5 ${
                    activeTab === tab.id ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Disease Overview</h3>
                  <p className="text-gray-700 leading-relaxed">{disease.description}</p>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {(disease.statistics.affectedPopulation / 1000000).toFixed(0)}M
                      </div>
                      <div className="text-sm text-gray-600">People Affected</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600 mb-1">
                        {(disease.statistics.yearlyDeaths / 1000).toFixed(0)}K
                      </div>
                      <div className="text-sm text-gray-600">Annual Deaths</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        ${(disease.statistics.economicImpact / 1000000000).toFixed(0)}B
                      </div>
                      <div className="text-sm text-gray-600">Economic Impact</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'symptoms' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                    Common Symptoms
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {disease.symptoms.map((symptom, index) => (
                      <div key={index} className="flex items-center p-3 bg-red-50 rounded-lg">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                        <span className="text-gray-700 capitalize">{symptom}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <BeakerIcon className="h-5 w-5 text-blue-500 mr-2" />
                    Causes & Risk Factors
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Primary Causes:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {disease.causes.map((cause, index) => (
                          <div key={index} className="flex items-center p-2 bg-blue-50 rounded">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                            <span className="text-sm text-gray-700">{cause}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Risk Factors:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {disease.riskFactors.map((factor, index) => (
                          <div key={index} className="flex items-center p-2 bg-yellow-50 rounded">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                            <span className="text-sm text-gray-700">{factor}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'prevention' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <ShieldCheckIcon className="h-5 w-5 text-green-500 mr-2" />
                    Prevention Methods
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {disease.prevention.map((method, index) => (
                      <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <span className="text-gray-700">{method}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <HeartIcon className="h-5 w-5 text-purple-500 mr-2" />
                    Treatment Options
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {disease.treatment.map((treatment, index) => (
                      <div key={index} className="flex items-center p-3 bg-purple-50 rounded-lg">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                        <span className="text-gray-700">{treatment}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'statistics' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Global Prevalence by Region</h3>
                  <div className="h-64">
                    <Bar data={prevalenceChartData} options={chartOptions} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Symptom Frequency</h3>
                    <div className="h-48">
                      <Bar data={symptomsChartData} options={{...chartOptions, indexAxis: 'y'}} />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Severity Distribution</h3>
                    <div className="h-48">
                      <Doughnut data={severityChartData} options={doughnutOptions} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link 
                  to="/risk-assessment" 
                  state={{ diseaseQuery: disease.name }}
                  className="block w-full btn btn-primary text-center"
                >
                  Risk Assessment
                </Link>
                <Link 
                  to="/hospitals" 
                  className="block w-full btn btn-secondary text-center"
                >
                  Find Specialists
                </Link>
                <Link 
                  to="/consultations" 
                  className="block w-full btn btn-outline text-center"
                >
                  Book Consultation
                </Link>
              </div>
            </div>

            {/* Related Diseases */}
            {relatedDiseases.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Conditions</h3>
                <div className="space-y-3">
                  {relatedDiseases.map((related) => (
                    <Link
                      key={related.id}
                      to={`/disease/${related.id}`}
                      className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{related.name}</div>
                      <div className="text-sm text-gray-500">{related.category}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Emergency Info */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2 flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                Emergency Signs
              </h3>
              <p className="text-sm text-red-700 mb-3">
                Seek immediate medical attention if you experience:
              </p>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Severe symptoms</li>
                <li>• Difficulty breathing</li>
                <li>• Chest pain</li>
                <li>• Loss of consciousness</li>
              </ul>
              <button className="mt-3 w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                Call Emergency: 911
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiseaseDetails;