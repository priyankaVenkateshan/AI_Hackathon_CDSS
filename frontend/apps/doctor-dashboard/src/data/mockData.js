// Mock data for the CDSS Doctor Dashboard

export const currentDoctor = {
  id: 'DR-001',
  name: 'Dr. Priya Sharma',
  specialization: 'General Medicine',
  department: 'Internal Medicine',
  avatar: null,
  initials: 'PS',
};

export const patients = [
  {
    id: 'PT-1001',
    name: 'Rajesh Kumar',
    age: 45,
    gender: 'Male',
    bloodGroup: 'B+',
    contact: '+91 98765 43210',
    abdmId: 'ABDM-2024-001',
    ward: 'General',
    severity: 'moderate',
    vitals: { hr: 78, bp: '130/85', spo2: 97, temp: 98.6 },
    conditions: ['Type 2 Diabetes', 'Hypertension'],
    lastVisit: '2026-02-28',
    nextAppointment: '2026-03-01T10:30:00',
    nextAppointmentDetails: {
      doctorName: 'Dr. Vikram Mehta',
      department: 'Internal Medicine',
      notes: 'Follow-up for BP and glucose review',
    },
    status: 'waiting',
    adherence: 0.92,
    portal: {
      preferredLanguage: 'en',
      activePrescriptionsCount: 2,
      medicationAdherenceStatus: 'Good compliance',
      weeklyAdherence: 0.86,
      aiVisitSummary: {
        available: true,
        agentName: 'MedAI Summary Agent',
        lastVisitDate: '2026-02-28',
        treatingPhysician: 'Dr. Vikram Mehta',
        sections: {
          abstract: {
            en: 'Your blood pressure was slightly high and your sugar control needs improvement. Your doctor adjusted one medicine and advised diet changes.',
            hi: 'आपका रक्तचाप थोड़ा अधिक था और शुगर नियंत्रण में सुधार की जरूरत है। डॉक्टर ने एक दवा की खुराक बदली और आहार में बदलाव की सलाह दी।',
            ta: 'உங்கள் இரத்த அழுத்தம் சிறிது அதிகமாக இருந்தது; சர்க்கரை கட்டுப்பாட்டில் மேம்பாடு தேவை. மருத்துவர் ஒரு மருந்தை மாற்றி உணவு முறையைப் பற்றி ஆலோசனை வழங்கினார்.',
          },
          reasoning: {
            en: 'The medication dose was increased to improve blood pressure control while keeping your diabetes medicines unchanged for now.',
            hi: 'रक्तचाप को बेहतर नियंत्रित करने के लिए दवा की खुराक बढ़ाई गई, जबकि फिलहाल डायबिटीज़ की दवाएँ वही रखी गईं।',
            ta: 'இரத்த அழுத்தக் கட்டுப்பாட்டை மேம்படுத்த மருந்தளவு உயர்த்தப்பட்டது; நீரிழிவு மருந்துகள் தற்போது மாற்றப்படவில்லை.',
          },
          tips: {
            en: [
              'Take medicines at the same time daily.',
              'Limit salt and sugary foods.',
              'Walk 20–30 minutes most days (if safe for you).',
            ],
            hi: [
              'दवाएँ रोज़ एक ही समय पर लें।',
              'नमक और मीठे खाद्य पदार्थ सीमित करें।',
              'अधिकांश दिनों में 20–30 मिनट टहलें (यदि आपके लिए सुरक्षित हो)।',
            ],
            ta: [
              'மருந்துகளை தினமும் ஒரே நேரத்தில் எடுத்துக் கொள்ளுங்கள்.',
              'உப்பு மற்றும் சர்க்கரை அதிகமான உணவை குறைக்கவும்.',
              'பல நாட்களில் 20–30 நிமிடம் நடைபயிற்சி செய்யுங்கள் (உங்களுக்கு பாதுகாப்பானால்).',
            ],
          },
          cautions: {
            en: [
              'Seek care urgently if you have chest pain, severe breathlessness, or fainting.',
              'Report dizziness or swelling after the dose change.',
            ],
            hi: [
              'सीने में दर्द, तेज़ सांस फूलना, या बेहोशी हो तो तुरंत चिकित्सा लें।',
              'खुराक बदलने के बाद चक्कर या सूजन हो तो डॉक्टर को बताएं।',
            ],
            ta: [
              'மார்பு வலி, கடுமையான மூச்சுத்திணறல், அல்லது மயக்கம் இருந்தால் உடனடி மருத்துவ உதவி பெறுங்கள்.',
              'மருந்தளவு மாற்றத்திற்குப் பிறகு தலைச்சுற்றல் அல்லது வீக்கம் இருந்தால் மருத்துவரிடம் தெரிவிக்கவும்.',
            ],
          },
        },
      },
      todayMedications: [
        { id: 'dose-pt1001-1', medicine: 'Metformin', dosage: '500mg Tab', time: '08:00', status: 'Taken' },
        { id: 'dose-pt1001-2', medicine: 'Metformin', dosage: '500mg Tab', time: '20:00', status: 'Pending' },
        { id: 'dose-pt1001-3', medicine: 'Amlodipine', dosage: '10mg Tab', time: '09:00', status: 'Missed' },
      ],
      appointments: {
        upcoming: [
          {
            id: 'apt-pt1001-1',
            doctorName: 'Dr. Vikram Mehta',
            department: 'Internal Medicine',
            dateTime: '2026-03-01T10:30:00',
            clinicalNotes: 'BP + HbA1c review',
          },
          {
            id: 'apt-pt1001-2',
            doctorName: 'Dr. Priya Sharma',
            department: 'General Medicine',
            dateTime: '2026-03-08T09:30:00',
            clinicalNotes: 'Medication adherence follow-up',
          },
        ],
        past: [
          {
            id: 'visit-pt1001-1',
            doctorName: 'Dr. Priya Sharma',
            department: 'Internal Medicine',
            dateTime: '2026-02-28T10:00:00',
            summaryAvailable: true,
          },
          {
            id: 'visit-pt1001-2',
            doctorName: 'Dr. Priya Sharma',
            department: 'Internal Medicine',
            dateTime: '2026-02-15T10:00:00',
            summaryAvailable: true,
          },
        ],
      },
    },
    surgeryReadiness: {
      preOpStatus: 'pending',
      riskFactors: ['Type 2 Diabetes — glycemic control required', 'Hypertension — BP at 130/85'],
      lastAssessed: '2026-02-28',
    },
  },
  {
    id: 'PT-1002',
    name: 'Ananya Singh',
    age: 32,
    gender: 'Female',
    bloodGroup: 'A+',
    contact: '+91 87654 32100',
    abdmId: 'ABDM-2024-002',
    ward: 'OPD',
    severity: 'low',
    vitals: { hr: 72, bp: '120/80', spo2: 99, temp: 98.2 },
    conditions: ['Migraine'],
    lastVisit: '2026-02-25',
    nextAppointment: '2026-03-01T11:00:00',
    nextAppointmentDetails: {
      doctorName: 'Dr. Priya Sharma',
      department: 'General Medicine',
      notes: 'Migraine follow-up',
    },
    status: 'in-consultation',
    adherence: 1.0,
    portal: {
      preferredLanguage: 'en',
      activePrescriptionsCount: 1,
      medicationAdherenceStatus: 'Excellent',
      weeklyAdherence: 0.95,
      aiVisitSummary: {
        available: true,
        agentName: 'MedAI Summary Agent',
        lastVisitDate: '2026-02-25',
        treatingPhysician: 'Dr. Priya Sharma',
        sections: {
          abstract: 'Your migraine symptoms were reviewed and a trigger-avoidance plan was discussed.',
          reasoning: 'The treatment plan focuses on symptom control and identifying triggers.',
          tips: ['Stay hydrated.', 'Maintain regular sleep.', 'Track triggers in a diary.'],
          cautions: ['Seek care if headaches are sudden/severe or with weakness/vision changes.'],
        },
      },
      todayMedications: [{ id: 'dose-pt1002-1', medicine: 'Naproxen', dosage: '250mg Tab', time: '10:00', status: 'Pending' }],
      appointments: {
        upcoming: [
          {
            id: 'apt-pt1002-1',
            doctorName: 'Dr. Priya Sharma',
            department: 'General Medicine',
            dateTime: '2026-03-01T11:00:00',
            clinicalNotes: 'Migraine check-in',
          },
        ],
        past: [],
      },
    },
  },
  {
    id: 'PT-1003',
    name: 'Mohammed Farhan',
    age: 58,
    gender: 'Male',
    bloodGroup: 'O-',
    contact: '+91 76543 21000',
    abdmId: 'ABDM-2024-003',
    ward: 'ICU',
    severity: 'critical',
    vitals: { hr: 110, bp: '90/60', spo2: 89, temp: 101.2 },
    conditions: ['Pneumonia', 'COPD', 'Sepsis Suspected'],
    lastVisit: '2026-03-01',
    nextAppointment: null,
    status: 'in-consultation',
    adherence: 0.78,
    portal: {
      preferredLanguage: 'en',
      activePrescriptionsCount: 2,
      medicationAdherenceStatus: 'Needs attention',
      weeklyAdherence: 0.7,
      aiVisitSummary: { available: false, agentName: 'MedAI Summary Agent', lastVisitDate: '2026-03-01', treatingPhysician: '—', sections: {} },
      todayMedications: [
        { id: 'dose-pt1003-1', medicine: 'Azithromycin', dosage: '500mg Tab', time: '10:00', status: 'Pending' },
        { id: 'dose-pt1003-2', medicine: 'Salbutamol', dosage: 'Nebulization', time: '12:00', status: 'Pending' },
      ],
      appointments: { upcoming: [], past: [] },
    },
  },
  {
    id: 'PT-1004',
    name: 'Lakshmi Devi',
    age: 67,
    gender: 'Female',
    bloodGroup: 'AB+',
    contact: '+91 65432 10000',
    abdmId: 'ABDM-2024-004',
    ward: 'Cardiology',
    severity: 'high',
    vitals: { hr: 95, bp: '150/95', spo2: 94, temp: 99.1 },
    conditions: ['Atrial Fibrillation', 'Heart Failure (Class II)'],
    lastVisit: '2026-02-27',
    nextAppointment: '2026-03-01T14:00:00',
    nextAppointmentDetails: {
      doctorName: 'Dr. Meena Rao',
      department: 'Cardiology',
      notes: 'INR + medication review',
    },
    status: 'waiting',
    adherence: 0.65,
    portal: {
      preferredLanguage: 'en',
      activePrescriptionsCount: 2,
      medicationAdherenceStatus: 'Low compliance',
      weeklyAdherence: 0.62,
      aiVisitSummary: { available: true, agentName: 'MedAI Summary Agent', lastVisitDate: '2026-02-27', treatingPhysician: 'Dr. Meena Rao', sections: {} },
      todayMedications: [
        { id: 'dose-pt1004-1', medicine: 'Warfarin', dosage: '5mg Tab', time: '20:00', status: 'Pending' },
        { id: 'dose-pt1004-2', medicine: 'Digoxin', dosage: '0.25mg Tab', time: '09:00', status: 'Taken' },
      ],
      appointments: { upcoming: [], past: [] },
    },
  },
  {
    id: 'PT-1005',
    name: 'Arjun Nair',
    age: 28,
    gender: 'Male',
    bloodGroup: 'B-',
    contact: '+91 54321 09876',
    abdmId: 'ABDM-2024-005',
    ward: 'Ortho',
    severity: 'moderate',
    vitals: { hr: 80, bp: '125/82', spo2: 98, temp: 98.8 },
    conditions: ['ACL Tear — Left Knee'],
    lastVisit: '2026-02-20',
    nextAppointment: '2026-03-02T09:00:00',
    nextAppointmentDetails: {
      doctorName: 'Dr. Vikram Patel',
      department: 'Orthopedics',
      notes: 'Pre-op check',
    },
    status: 'scheduled',
    surgeryReadiness: {
      preOpStatus: 'cleared',
      riskFactors: ['ACL reconstruction — routine pre-op done'],
      lastAssessed: '2026-02-25',
    },
    portal: {
      preferredLanguage: 'en',
      activePrescriptionsCount: 1,
      medicationAdherenceStatus: 'Good compliance',
      weeklyAdherence: 0.88,
      aiVisitSummary: { available: false, agentName: 'MedAI Summary Agent', lastVisitDate: '2026-02-20', treatingPhysician: 'Dr. Vikram Patel', sections: {} },
      todayMedications: [{ id: 'dose-pt1005-1', medicine: 'Pain reliever', dosage: 'As prescribed', time: '21:00', status: 'Pending' }],
      appointments: { upcoming: [], past: [] },
    },
  },
  {
    id: 'PT-1006',
    name: 'Fatima Begum',
    age: 40,
    gender: 'Female',
    bloodGroup: 'A-',
    contact: '+91 43210 98765',
    abdmId: 'ABDM-2024-006',
    ward: 'General',
    severity: 'low',
    vitals: { hr: 70, bp: '118/76', spo2: 99, temp: 98.4 },
    conditions: ['Hypothyroidism', 'Vitamin D Deficiency'],
    lastVisit: '2026-02-15',
    nextAppointment: '2026-03-01T15:30:00',
    status: 'waiting',
    portal: {
      preferredLanguage: 'en',
      activePrescriptionsCount: 1,
      medicationAdherenceStatus: 'Good compliance',
      weeklyAdherence: 0.9,
      aiVisitSummary: { available: false, agentName: 'MedAI Summary Agent', lastVisitDate: '2026-02-15', treatingPhysician: '—', sections: {} },
      todayMedications: [{ id: 'dose-pt1006-1', medicine: 'Levothyroxine', dosage: '50mcg Tab', time: '06:00', status: 'Taken' }],
      appointments: { upcoming: [], past: [] },
    },
  },
];

export const todaySchedule = [
  { time: '09:00', patient: 'Rajesh Kumar', type: 'Follow-up', status: 'completed' },
  { time: '09:30', patient: 'Walk-in slot', type: 'Open', status: 'open' },
  { time: '10:00', patient: 'Ananya Singh', type: 'Consultation', status: 'in-progress' },
  { time: '10:30', patient: 'Rajesh Kumar', type: 'Lab Review', status: 'upcoming' },
  { time: '11:00', patient: 'Mohammed Farhan', type: 'Emergency', status: 'upcoming' },
  { time: '11:30', patient: 'Lakshmi Devi', type: 'Follow-up', status: 'upcoming' },
  { time: '14:00', patient: 'Fatima Begum', type: 'Consultation', status: 'upcoming' },
  { time: '15:30', patient: 'Arjun Nair', type: 'Pre-op Check', status: 'upcoming' },
];

/** For dashboard: task type, patient, priority, used for surgeons (pre-op clearance) and doctors */
export const pendingClinicalTasks = [
  { id: 't1', patientName: 'Rajesh Kumar', taskType: 'Lab review pending', priority: 'High' },
  { id: 't2', patientName: 'Lakshmi Devi', taskType: 'Prescription approval pending', priority: 'High' },
  { id: 't3', patientName: 'Mohammed Farhan', taskType: 'Discharge summary pending', priority: 'Medium' },
  { id: 't4', patientName: 'Ananya Singh', taskType: 'Consultation follow-ups', priority: 'Low' },
  { id: 't5', patientName: 'Arjun Nair', taskType: 'Pre-op clearance', priority: 'Medium', surgeonOnly: true },
];

export const aiAlerts = [
  {
    id: 'alert-1',
    type: 'critical',
    title: 'Drug Interaction Warning',
    message: 'Warfarin + Aspirin combination detected for Lakshmi Devi. High bleeding risk.',
    patient: 'Lakshmi Devi',
    time: '2 min ago',
  },
  {
    id: 'alert-2',
    type: 'warning',
    title: 'Abnormal Vitals',
    message: 'Mohammed Farhan SpO2 dropped to 89%. Consider oxygen supplementation.',
    patient: 'Mohammed Farhan',
    time: '5 min ago',
  },
  {
    id: 'alert-3',
    type: 'info',
    title: 'Lab Results Available',
    message: 'HbA1c results for Rajesh Kumar: 7.8% (above target). Consider medication adjustment.',
    patient: 'Rajesh Kumar',
    time: '15 min ago',
  },
  {
    id: 'alert-4',
    type: 'success',
    title: 'Surgery Cleared',
    message: 'Pre-op assessment complete for Arjun Nair ACL reconstruction. OT-3 booked for March 5.',
    patient: 'Arjun Nair',
    time: '30 min ago',
  },
  {
    id: 'alert-5',
    type: 'warning',
    title: 'Adherence escalation',
    message: 'Lakshmi Devi: adherence 65% — 3 missed doses. Consider nudge or follow-up.',
    patient: 'Lakshmi Devi',
    time: '1 hr ago',
  },
  {
    id: 'alert-6',
    type: 'warning',
    title: 'OT conflict',
    message: 'OT-1 double-booked on Mar 5 09:00. Resolve in Admin → Analytics.',
    patient: '—',
    time: '2 hr ago',
  },
];

/** Clinical alerts only (no AI marketing / Global Risk Pulse) for dashboard */
export const clinicalAlerts = aiAlerts.filter(
  (a) => ['critical', 'warning', 'info', 'success'].includes(a.type)
);

export const consultationHistory = [
  {
    id: 'consult-1',
    patientId: 'PT-1001',
    date: '2026-02-28',
    doctor: 'Dr. Priya Sharma',
    notes: 'Patient reports persistent headaches. BP elevated at 130/85. Adjusted Amlodipine from 5mg to 10mg. Advised low-sodium diet.',
    aiSummary: 'Hypertensive patient with suboptimal BP control. Medication dose escalated. Diet counseling provided.',
    prescriptions: [
      { medication: 'Amlodipine', dosage: '10mg', frequency: 'Once daily', duration: '30 days' },
      { medication: 'Metformin', dosage: '500mg', frequency: 'Twice daily', duration: '30 days' },
    ],
  },
  {
    id: 'consult-2',
    patientId: 'PT-1001',
    date: '2026-02-15',
    doctor: 'Dr. Priya Sharma',
    notes: 'Routine follow-up. Blood sugar fasting: 145mg/dL. HbA1c: 7.2%. Continue current medications.',
    aiSummary: 'Diabetic control is moderate. Glycemic targets not yet achieved. Current regimen maintained.',
    prescriptions: [
      { medication: 'Metformin', dosage: '500mg', frequency: 'Twice daily', duration: '30 days' },
      { medication: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '30 days' },
    ],
  },
];

export const surgeries = [
  { id: 'SRG-001', patient: 'Arjun Nair', type: 'ACL Reconstruction', complexity: 'Moderate', estimatedDuration: '90 min', ot: 'OT-3', date: '2026-03-05', time: '09:00', status: 'scheduled', surgeon: 'Dr. Vikram Patel' },
  { id: 'SRG-002', patient: 'Lakshmi Devi', type: 'Cardiac Catheterization', complexity: 'High', estimatedDuration: '120 min', ot: 'OT-1', date: '2026-03-06', time: '10:00', status: 'pre-op', surgeon: 'Dr. Meena Rao' },
  { id: 'SRG-003', patient: 'Unknown', type: 'Appendectomy', complexity: 'Low', estimatedDuration: '60 min', ot: 'OT-2', date: '2026-03-04', time: '14:00', status: 'in-prep', surgeon: 'Dr. Priya Sharma' },
];

export const medications = [
  { id: 'MED-001', patient: 'Rajesh Kumar', medication: 'Metformin 500mg', frequency: 'Twice daily', nextDose: '2026-03-01T13:00:00', status: 'on-time', interactions: [] },
  { id: 'MED-002', patient: 'Rajesh Kumar', medication: 'Amlodipine 10mg', frequency: 'Once daily', nextDose: '2026-03-01T08:00:00', status: 'overdue', interactions: [] },
  { id: 'MED-003', patient: 'Lakshmi Devi', medication: 'Warfarin 5mg', frequency: 'Once daily', nextDose: '2026-03-01T20:00:00', status: 'on-time', interactions: ['Aspirin — HIGH RISK'] },
  { id: 'MED-004', patient: 'Lakshmi Devi', medication: 'Digoxin 0.25mg', frequency: 'Once daily', nextDose: '2026-03-01T09:00:00', status: 'given', interactions: [] },
  { id: 'MED-005', patient: 'Mohammed Farhan', medication: 'Azithromycin 500mg', frequency: 'Once daily', nextDose: '2026-03-01T10:00:00', status: 'on-time', interactions: [] },
  { id: 'MED-006', patient: 'Mohammed Farhan', medication: 'Salbutamol Nebulization', frequency: 'Every 6 hours', nextDose: '2026-03-01T12:00:00', status: 'on-time', interactions: [] },
  { id: 'MED-007', patient: 'Fatima Begum', medication: 'Levothyroxine 50mcg', frequency: 'Once daily (empty stomach)', nextDose: '2026-03-02T06:00:00', status: 'on-time', interactions: [] },
];
