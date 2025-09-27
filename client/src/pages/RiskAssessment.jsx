import { useState } from 'react';
import { riskAPI } from '../utils/api';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

const SYMPTOMS = [
  // Critical/Emergency symptoms
  { id: 'chest pain', label: 'Chest Pain', category: 'critical' },
  { id: 'difficulty breathing', label: 'Difficulty Breathing', category: 'critical' },
  { id: 'severe shortness of breath', label: 'Severe Shortness of Breath', category: 'critical' },
  { id: 'loss of consciousness', label: 'Loss of Consciousness', category: 'critical' },
  { id: 'severe headache', label: 'Severe Headache', category: 'critical' },
  { id: 'fainting', label: 'Fainting', category: 'critical' },
  { id: 'severe abdominal pain', label: 'Severe Abdominal Pain', category: 'critical' },
  
  // Respiratory symptoms
  { id: 'fever', label: 'Fever', category: 'respiratory' },
  { id: 'high fever', label: 'High Fever (>103°F)', category: 'respiratory' },
  { id: 'cough', label: 'Cough', category: 'respiratory' },
  { id: 'severe cough', label: 'Severe Cough', category: 'respiratory' },
  { id: 'shortness of breath', label: 'Shortness of Breath', category: 'respiratory' },
  { id: 'wheezing', label: 'Wheezing', category: 'respiratory' },
  { id: 'chest tightness', label: 'Chest Tightness', category: 'respiratory' },
  { id: 'sore throat', label: 'Sore Throat', category: 'respiratory' },
  { id: 'runny nose', label: 'Runny Nose', category: 'respiratory' },
  { id: 'congestion', label: 'Congestion', category: 'respiratory' },
  
  // Cardiovascular symptoms
  { id: 'palpitations', label: 'Palpitations', category: 'cardiovascular' },
  { id: 'irregular heartbeat', label: 'Irregular Heartbeat', category: 'cardiovascular' },
  { id: 'swelling in legs', label: 'Swelling in Legs', category: 'cardiovascular' },
  { id: 'cold hands/feet', label: 'Cold Hands/Feet', category: 'cardiovascular' },
  
  // Gastrointestinal symptoms
  { id: 'nausea', label: 'Nausea', category: 'gastrointestinal' },
  { id: 'vomiting', label: 'Vomiting', category: 'gastrointestinal' },
  { id: 'persistent vomiting', label: 'Persistent Vomiting', category: 'gastrointestinal' },
  { id: 'diarrhea', label: 'Diarrhea', category: 'gastrointestinal' },
  { id: 'severe diarrhea', label: 'Severe Diarrhea', category: 'gastrointestinal' },
  { id: 'abdominal pain', label: 'Abdominal Pain', category: 'gastrointestinal' },
  { id: 'stomach cramps', label: 'Stomach Cramps', category: 'gastrointestinal' },
  { id: 'loss of appetite', label: 'Loss of Appetite', category: 'gastrointestinal' },
  { id: 'blood in stool', label: 'Blood in Stool', category: 'gastrointestinal' },
  
  // Neurological symptoms
  { id: 'headache', label: 'Headache', category: 'neurological' },
  { id: 'migraine', label: 'Migraine', category: 'neurological' },
  { id: 'confusion', label: 'Confusion', category: 'neurological' },
  { id: 'severe confusion', label: 'Severe Confusion', category: 'neurological' },
  { id: 'dizziness', label: 'Dizziness', category: 'neurological' },
  { id: 'severe dizziness', label: 'Severe Dizziness', category: 'neurological' },
  { id: 'weakness', label: 'Weakness', category: 'neurological' },
  { id: 'severe weakness', label: 'Severe Weakness', category: 'neurological' },
  { id: 'numbness', label: 'Numbness', category: 'neurological' },
  { id: 'vision problems', label: 'Vision Problems', category: 'neurological' },
  { id: 'memory loss', label: 'Memory Loss', category: 'neurological' },
  
  // General symptoms
  { id: 'fatigue', label: 'Fatigue', category: 'general' },
  { id: 'excessive tiredness', label: 'Excessive Tiredness', category: 'general' },
  { id: 'muscle aches', label: 'Muscle Aches', category: 'general' },
  { id: 'joint pain', label: 'Joint Pain', category: 'general' },
  { id: 'severe joint pain', label: 'Severe Joint Pain', category: 'general' },
  { id: 'chills', label: 'Chills', category: 'general' },
  { id: 'sweating', label: 'Sweating', category: 'general' },
  { id: 'night sweats', label: 'Night Sweats', category: 'general' },
  { id: 'weight loss', label: 'Unexplained Weight Loss', category: 'general' },
  { id: 'skin rash', label: 'Skin Rash', category: 'general' },
  { id: 'swollen glands', label: 'Swollen Glands', category: 'general' },
  
  // Sensory symptoms
  { id: 'loss of taste', label: 'Loss of Taste', category: 'sensory' },
  { id: 'loss of smell', label: 'Loss of Smell', category: 'sensory' },
  { id: 'hearing problems', label: 'Hearing Problems', category: 'sensory' },
  { id: 'ear pain', label: 'Ear Pain', category: 'sensory' },
  { id: 'eye pain', label: 'Eye Pain', category: 'sensory' },
  
  // Infection indicators
  { id: 'swelling', label: 'Swelling', category: 'infection' },
  { id: 'skin discoloration', label: 'Skin Discoloration', category: 'infection' },
  { id: 'stiff neck', label: 'Stiff Neck', category: 'infection' },
];

const MEDICAL_CONDITIONS = [
  // High-risk conditions
  'heart disease',
  'diabetes',
  'hypertension',
  'cancer',
  'immunocompromised',
  'organ transplant',
  'kidney disease',
  'liver disease',
  
  // Respiratory conditions
  'asthma',
  'copd',
  'emphysema',
  'pulmonary fibrosis',
  
  // Autoimmune conditions
  'autoimmune disease',
  'rheumatoid arthritis',
  'lupus',
  'multiple sclerosis',
  
  // Metabolic conditions
  'obesity',
  'severe obesity',
  'thyroid disease',
  'metabolic syndrome',
  
  // Neurological conditions
  'stroke history',
  'dementia',
  'parkinson\'s',
  'epilepsy',
  
  // Blood disorders
  'anemia',
  'sickle cell disease',
  'hemophilia',
  
  // Other conditions
  'pregnancy',
  'smoking',
  'sleep apnea',
  'depression',
  'anxiety disorder',
];

function RiskAssessment() {
  const [formData, setFormData] = useState({
    age: '',
    symptoms: [],
    conditions: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [riskResult, setRiskResult] = useState(null);

  const handleSymptomToggle = (symptomId) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptomId)
        ? prev.symptoms.filter(s => s !== symptomId)
        : [...prev.symptoms, symptomId]
    }));
  };

  const handleConditionToggle = (condition) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.includes(condition)
        ? prev.conditions.filter(c => c !== condition)
        : [...prev.conditions, condition]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.age || formData.symptoms.length === 0) {
      toast.error('Please enter your age and select at least one symptom');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Sending risk assessment request:', {
        age: parseInt(formData.age),
        symptoms: formData.symptoms,
        conditions: formData.conditions,
      });
      
      const response = await riskAPI.calculateRisk({
        age: parseInt(formData.age),
        symptoms: formData.symptoms,
        conditions: formData.conditions,
      });
      
      console.log('Full API response:', response);
      console.log('Response data:', response.data);
      
      if (response.data && response.data.success !== false) {
        // The actual risk data is in response.data.data
        setRiskResult(response.data.data);
        toast.success('Risk assessment completed!');
      } else {
        console.error('API returned unsuccessful response:', response.data);
        toast.error(response.data?.message || 'Failed to calculate risk');
      }
    } catch (error) {
      console.error('Risk assessment error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to calculate risk. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (level) => {
    const normalizedLevel = level?.toLowerCase();
    const colors = {
      'critical': 'text-red-600 bg-red-100',
      'high': 'text-orange-600 bg-orange-100',
      'medium': 'text-yellow-600 bg-yellow-100', 
      'moderate': 'text-yellow-600 bg-yellow-100',
      'low': 'text-green-600 bg-green-100',
      'minimal': 'text-emerald-600 bg-emerald-100'
    };
    return colors[normalizedLevel] || 'text-gray-600 bg-gray-100';
  };

  const getRiskIcon = (level) => {
    const normalizedLevel = level?.toLowerCase();
    if (normalizedLevel === 'critical' || normalizedLevel === 'high') {
      return <ExclamationTriangleIcon className="h-6 w-6" />;
    }
    return <CheckCircleIcon className="h-6 w-6" />;
  };

  const groupedSymptoms = SYMPTOMS.reduce((acc, symptom) => {
    if (!acc[symptom.category]) {
      acc[symptom.category] = [];
    }
    acc[symptom.category].push(symptom);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Health Risk Assessment
          </h1>
          <p className="text-lg text-gray-600">
            Get a personalized health risk evaluation based on your symptoms
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="card space-y-6">
              {/* Age Input */}
              <div>
                <label htmlFor="age" className="label">
                  Age *
                </label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  min="1"
                  max="120"
                  className="input"
                  placeholder="Enter your age"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                  required
                />
              </div>

              {/* Symptoms Selection */}
              <div>
                <label className="label mb-4">
                  Current Symptoms * (Select all that apply)
                </label>
                
                {Object.entries(groupedSymptoms).map(([category, symptoms]) => (
                  <div key={category} className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 capitalize">
                      {category.replace('_', ' ')} Symptoms
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {symptoms.map((symptom) => (
                        <label
                          key={symptom.id}
                          className={`
                            relative flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all
                            ${formData.symptoms.includes(symptom.id)
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 hover:border-gray-300'
                            }
                          `}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={formData.symptoms.includes(symptom.id)}
                            onChange={() => handleSymptomToggle(symptom.id)}
                          />
                          <span className="text-sm font-medium">{symptom.label}</span>
                          {formData.symptoms.includes(symptom.id) && (
                            <CheckCircleIcon className="h-4 w-4 ml-auto text-primary-600" />
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Medical Conditions */}
              <div>
                <label className="label mb-4">
                  Existing Medical Conditions (Optional)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {MEDICAL_CONDITIONS.map((condition) => (
                    <label
                      key={condition}
                      className={`
                        relative flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all
                        ${formData.conditions.includes(condition)
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={formData.conditions.includes(condition)}
                        onChange={() => handleConditionToggle(condition)}
                      />
                      <span className="text-sm font-medium capitalize">
                        {condition.replace('_', ' ')}
                      </span>
                      {formData.conditions.includes(condition) && (
                        <CheckCircleIcon className="h-4 w-4 ml-auto text-primary-600" />
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full py-3 text-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Calculating Risk...
                    </div>
                  ) : (
                    'Calculate Risk Assessment'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-1">
            {riskResult ? (
              <div className="card space-y-6">
                <h3 className="text-xl font-bold text-gray-900">Assessment Results</h3>
                
                {/* Critical Warning Banner */}
                {riskResult.hasCriticalCombination && (
                  <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700 font-medium">
                          ⚠️ Critical Symptom Pattern Detected
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                          {riskResult.criticalCombination?.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Risk Level */}
                <div className={`p-4 rounded-lg ${getRiskColor(riskResult.riskLevel)}`}>
                  <div className="flex items-center">
                    {getRiskIcon(riskResult.riskLevel)}
                    <div className="ml-3">
                      <h4 className="text-lg font-semibold">
                        {riskResult.riskLevel?.toUpperCase()} Risk
                      </h4>
                      <p className="text-sm opacity-75">
                        Score: {riskResult.normalizedScore?.toFixed(1)} ({riskResult.riskPercentage}%)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Enhanced Risk Breakdown */}
                <div className="space-y-3">
                  <h5 className="font-semibold text-gray-900">Risk Analysis:</h5>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Symptom Score:</span>
                      <span className="font-medium">{riskResult.breakdown?.baseScore}</span>
                    </div>
                    
                    {riskResult.breakdown?.combinationMultiplier > 1 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Combination Factor:</span>
                        <span className="font-medium text-orange-600">×{riskResult.breakdown.combinationMultiplier}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Age Factor ({riskResult.ageCategory}):</span>
                      <span className="font-medium">×{riskResult.breakdown?.ageFactor}</span>
                    </div>
                    
                    {riskResult.breakdown?.conditionsModifier > 1 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Medical Conditions:</span>
                        <span className="font-medium text-red-600">×{riskResult.breakdown.conditionsModifier?.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <hr className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-900">Final Risk Score:</span>
                      <span className="text-lg">{riskResult.breakdown?.finalScore}</span>
                    </div>
                  </div>
                  
                  {/* Show dangerous combinations if detected */}
                  {riskResult.dangerousCombinations && riskResult.dangerousCombinations.length > 0 && (
                    <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                      <h6 className="text-sm font-medium text-orange-800 mb-2">⚠️ Warning Patterns Detected:</h6>
                      {riskResult.dangerousCombinations.map((combo, index) => (
                        <div key={index} className="text-xs text-orange-700 mb-1">
                          • {combo.description} ({Math.round(combo.confidence * 100)}% match)
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recommendations */}
                <div className="border-t pt-4">
                  <h5 className="font-semibold text-gray-900 mb-2">Recommendations:</h5>
                  <div className="text-sm text-gray-600 space-y-3">
                    
                    {/* Priority recommendations based on risk level */}
                    {riskResult.riskLevel === 'critical' && (
                      <p className="text-red-600 font-medium p-2 bg-red-50 rounded">
                        ⚠️ Seek immediate medical attention
                      </p>
                    )}
                    {riskResult.riskLevel === 'high' && (
                      <p className="text-orange-600 font-medium p-2 bg-orange-50 rounded">
                        📞 Contact a healthcare provider soon
                      </p>
                    )}
                    {riskResult.riskLevel === 'medium' && (
                      <p className="text-yellow-600 font-medium p-2 bg-yellow-50 rounded">
                        🏥 Consider consulting a doctor
                      </p>
                    )}
                    {riskResult.riskLevel === 'low' && (
                      <p className="text-green-600 font-medium p-2 bg-green-50 rounded">
                        ✅ Monitor symptoms and rest
                      </p>
                    )}

                    {/* Immediate recommendations */}
                    {riskResult.recommendations?.immediate && riskResult.recommendations.immediate.length > 0 && (
                      <div>
                        <h6 className="font-medium text-red-700 mb-1">🚨 Immediate Actions:</h6>
                        {riskResult.recommendations.immediate.map((rec, index) => (
                          <div key={index} className="flex items-start ml-2">
                            <span className="text-red-500 mr-2">•</span>
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Short-term recommendations */}
                    {riskResult.recommendations?.shortTerm && riskResult.recommendations.shortTerm.length > 0 && (
                      <div>
                        <h6 className="font-medium text-orange-700 mb-1">📋 Short-term Care:</h6>
                        {riskResult.recommendations.shortTerm.map((rec, index) => (
                          <div key={index} className="flex items-start ml-2">
                            <span className="text-orange-500 mr-2">•</span>
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Lifestyle recommendations */}
                    {riskResult.recommendations?.lifestyle && riskResult.recommendations.lifestyle.length > 0 && (
                      <div>
                        <h6 className="font-medium text-blue-700 mb-1">💡 Lifestyle Tips:</h6>
                        {riskResult.recommendations.lifestyle.map((rec, index) => (
                          <div key={index} className="flex items-start ml-2">
                            <span className="text-blue-500 mr-2">•</span>
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Show general message if no specific recommendations */}
                    {(!riskResult.recommendations?.immediate || riskResult.recommendations.immediate.length === 0) &&
                     (!riskResult.recommendations?.shortTerm || riskResult.recommendations.shortTerm.length === 0) &&
                     (!riskResult.recommendations?.lifestyle || riskResult.recommendations.lifestyle.length === 0) && (
                      <div className="text-center py-2 text-gray-500">
                        <p>Continue monitoring your symptoms and maintain healthy habits.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Potential Diseases */}
                {riskResult.potentialDiseases && riskResult.potentialDiseases.length > 0 && (
                  <div className="border-t pt-4">
                    <h5 className="font-semibold text-gray-900 mb-2">Potential Conditions:</h5>
                    <div className="space-y-2">
                      {riskResult.potentialDiseases.slice(0, 3).map((disease, index) => (
                        <div key={index} className="text-sm p-2 bg-blue-50 rounded">
                          <div className="font-medium text-blue-900">{disease.name}</div>
                          <div className="text-blue-700 text-xs">
                            Matching symptoms: {disease.matchingSymptoms?.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nearby Hospitals */}
                {riskResult.nearbyHospitals && riskResult.nearbyHospitals.length > 0 && (
                  <div className="border-t pt-4">
                    <h5 className="font-semibold text-gray-900 mb-2">Nearby Hospitals:</h5>
                    <div className="space-y-2">
                      {riskResult.nearbyHospitals.slice(0, 2).map((hospital, index) => (
                        <div key={index} className="text-sm p-2 bg-green-50 rounded">
                          <div className="font-medium text-green-900">{hospital.name}</div>
                          <div className="text-green-700 text-xs">
                            {hospital.distance?.toFixed(1)} km • {hospital.phone}
                            {hospital.hasEmergency && <span className="ml-1 text-red-600">🚨 Emergency</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hospital Finder Link */}
                <div className="border-t pt-4">
                  <button className="btn btn-outline w-full">
                    Find More Hospitals
                  </button>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="text-center text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-2 text-sm">
                    Complete the assessment form to see your personalized risk evaluation
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RiskAssessment;