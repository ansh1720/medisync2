import { useState } from 'react';
import { equipmentAPI } from '../utils/api';
import { ExclamationTriangleIcon, CheckCircleIcon, HeartIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

const EQUIPMENT_TYPES = [
  {
    id: 'blood_pressure',
    name: 'Blood Pressure',
    icon: '🩺',
    description: 'Monitor systolic and diastolic blood pressure',
    fields: [
      { name: 'systolic', label: 'Systolic (mmHg)', type: 'number', min: 50, max: 300, placeholder: '120' },
      { name: 'diastolic', label: 'Diastolic (mmHg)', type: 'number', min: 30, max: 200, placeholder: '80' }
    ]
  },
  {
    id: 'glucometer',
    name: 'Blood Sugar',
    icon: '🩸',
    description: 'Record blood glucose levels',
    fields: [
      { name: 'glucoseLevel', label: 'Glucose (mg/dL)', type: 'number', min: 20, max: 600, placeholder: '100' }
    ],
    contexts: [
      { value: 'fasting', label: 'Fasting' },
      { value: 'non_fasting', label: 'Non-Fasting' },
      { value: 'random', label: 'Random' }
    ]
  },
  {
    id: 'pulse_oximeter',
    name: 'Blood Oxygen',
    icon: '🫁',
    description: 'Measure oxygen saturation (SpO2) and heart rate',
    fields: [
      { name: 'oxygenSaturation', label: 'Oxygen Saturation (%)', type: 'number', min: 70, max: 100, placeholder: '98' },
      { name: 'heartRate', label: 'Heart Rate (BPM)', type: 'number', min: 30, max: 250, placeholder: '72' }
    ]
  },
  {
    id: 'thermometer',
    name: 'Body Temperature',
    icon: '🌡️',
    description: 'Record body temperature',
    fields: [
      { name: 'temperature', label: 'Temperature (°F)', type: 'number', min: 90, max: 110, step: 0.1, placeholder: '98.6' }
    ]
  },
  {
    id: 'heart_rate_monitor',
    name: 'Heart Rate',
    icon: '❤️',
    description: 'Monitor pulse and heart rate',
    fields: [
      { name: 'heartRate', label: 'Heart Rate (BPM)', type: 'number', min: 30, max: 250, placeholder: '72' }
    ]
  }
];

function EquipmentReadings() {
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({});
  const [context, setContext] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setFormData({});
    setContext(type.contexts ? type.contexts[0].value : '');
    setResult(null);
  };

  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: parseFloat(value) || value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedType) {
      toast.error('Please select an equipment type');
      return;
    }

    // Validate required fields
    const hasAllFields = selectedType.fields.every(field => 
      formData[field.name] !== undefined && formData[field.name] !== ''
    );

    if (!hasAllFields) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const submitData = {
        equipmentType: selectedType.id,
        readings: formData
      };

      // Add context if available
      if (context) {
        submitData.readings.context = context;
      }

      console.log('Submitting reading:', submitData);

      const response = await equipmentAPI.addReading(submitData);
      
      console.log('Equipment reading response:', response.data);
      setResult(response.data.data);
      toast.success('Reading recorded successfully!');
    } catch (error) {
      console.error('Equipment reading error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to record reading. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'normal': 'text-green-600 bg-green-100',
      'abnormal': 'text-yellow-600 bg-yellow-100',
      'critical': 'text-red-600 bg-red-100',
      'warning': 'text-yellow-600 bg-yellow-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const getStatusIcon = (status) => {
    if (status === 'critical' || status === 'abnormal' || status === 'warning') {
      return <ExclamationTriangleIcon className="h-6 w-6" />;
    }
    return <CheckCircleIcon className="h-6 w-6" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Equipment Readings
          </h1>
          <p className="text-lg text-gray-600">
            Record and interpret your vital signs and medical device readings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Equipment Selection */}
          <div className="lg:col-span-1">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Equipment Type</h3>
              <div className="space-y-3">
                {EQUIPMENT_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleTypeSelect(type)}
                    className={`
                      w-full text-left p-4 rounded-lg border transition-all
                      ${selectedType?.id === type.id
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{type.icon}</span>
                      <div>
                        <div className="font-medium">{type.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reading Form */}
          <div className="lg:col-span-1">
            {selectedType ? (
              <form onSubmit={handleSubmit} className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Record {selectedType.name}
                </h3>

                {/* Context Selection */}
                {selectedType.contexts && (
                  <div className="mb-4">
                    <label className="label">
                      Context
                    </label>
                    <select
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      className="input"
                    >
                      {selectedType.contexts.map((ctx) => (
                        <option key={ctx.value} value={ctx.value}>
                          {ctx.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Input Fields */}
                {selectedType.fields.map((field) => (
                  <div key={field.name} className="mb-4">
                    <label htmlFor={field.name} className="label">
                      {field.label} *
                    </label>
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      className="input"
                      placeholder={field.placeholder}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      required
                    />
                  </div>
                ))}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    'Record Reading'
                  )}
                </button>
              </form>
            ) : (
              <div className="card">
                <div className="text-center text-gray-500 py-8">
                  <HeartIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>Select an equipment type to start recording readings</p>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="lg:col-span-1">
            {result ? (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reading Results</h3>
                
                {/* Status */}
                <div className={`p-4 rounded-lg mb-4 ${getStatusColor(result.interpretation?.status || 'normal')}`}>
                  <div className="flex items-center">
                    {getStatusIcon(result.interpretation?.status || 'normal')}
                    <div className="ml-3">
                      <h4 className="text-lg font-semibold capitalize">
                        {result.interpretation?.status || 'Normal'} Reading
                      </h4>
                      <p className="text-sm opacity-75">
                        {new Date(result.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reading Value */}
                <div className="mb-4">
                  <h5 className="font-semibold text-gray-900 mb-2">Reading:</h5>
                  <div className="text-lg font-mono bg-gray-100 p-2 rounded">
                    {result.equipmentType === 'blood_pressure' 
                      ? `${result.readings.systolic}/${result.readings.diastolic} mmHg`
                      : result.equipmentType === 'glucometer'
                      ? `${result.readings.glucoseLevel} mg/dL`
                      : result.equipmentType === 'pulse_oximeter'
                      ? `SpO2: ${result.readings.oxygenSaturation}%, HR: ${result.readings.heartRate} BPM`
                      : result.equipmentType === 'thermometer'
                      ? `${result.readings.temperature}°F`
                      : result.equipmentType === 'heart_rate_monitor'
                      ? `${result.readings.heartRate} BPM`
                      : JSON.stringify(result.readings)
                    }
                  </div>
                </div>

                {/* Interpretation */}
                {result.interpretation && (
                  <div className="mb-4">
                    <h5 className="font-semibold text-gray-900 mb-2">Interpretation:</h5>
                    <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded">
                      {result.interpretation.message}
                    </p>
                    {result.interpretation.category && (
                      <p className="text-xs text-gray-500 mt-1 capitalize">
                        Category: {result.interpretation.category.replace('_', ' ')}
                      </p>
                    )}
                  </div>
                )}

                {/* Recommendations */}
                {result.interpretation?.recommendations && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">Recommendations:</h5>
                    <div className="text-sm text-gray-700 bg-green-50 p-3 rounded">
                      {result.interpretation.recommendations.map((rec, index) => (
                        <p key={index} className="mb-1">• {rec}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card">
                <div className="text-center text-gray-500 py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p>Record a reading to see the interpretation and recommendations</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EquipmentReadings;