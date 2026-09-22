import { DiagnosticSnapshot, GigCategory } from '../types';
import { gigApi } from './gigApi';

export const analyzeSnapshot = (snapshot: DiagnosticSnapshot) => {
  let category = 'GENERAL_ISSUE';
  let severityScore = 10;
  let recommendedGigType: GigCategory = GigCategory.SOFTWARE;

  let cpu = 0;
  let ram = 0;
  let temp = 0;
  let latency = 0;

  if (snapshot.sourceModule === 'Health Intelligence') {
    category = 'PERFORMANCE_ISSUE';
    cpu = snapshot.data.stats?.cpu || 0;
    ram = snapshot.data.stats?.ram || 0;
    temp = snapshot.data.stats?.temperature || 0;

    if (cpu > 90 || temp > 85) {
      severityScore = Math.max(90, severityScore);
    } else if (cpu > 70 || ram > 80) {
      severityScore = Math.max(60, severityScore);
    } else {
      severityScore = Math.max(20, severityScore);
    }
    
    if (temp > 80) {
      category = 'HARDWARE_ISSUE';
      recommendedGigType = GigCategory.HARDWARE;
    } else {
      recommendedGigType = GigCategory.SOFTWARE;
    }
  } else if (snapshot.sourceModule === 'Storage Intelligence') {
    category = 'STORAGE_ISSUE';
    recommendedGigType = GigCategory.HARDWARE;
    severityScore = 50; 
  } else if (snapshot.sourceModule === 'Network Diagnostics') {
    category = 'NETWORK_ISSUE';
    recommendedGigType = GigCategory.NETWORK;
    latency = snapshot.data.latency || 0;
    if (latency > 200) {
      severityScore = 80;
    } else if (latency > 100) {
      severityScore = 50;
    } else {
      severityScore = 20;
    }
  } else if (snapshot.sourceModule === 'Hardware Drivers' || snapshot.sourceModule === 'Power Insights') {
    category = 'HARDWARE_ISSUE';
    recommendedGigType = GigCategory.HARDWARE;
    severityScore = 60;
  } else if (snapshot.sourceModule === 'Security Stability') {
    category = 'SECURITY_ISSUE';
    recommendedGigType = GigCategory.SOFTWARE;
    severityScore = 95;
  }

  severityScore = Math.min(100, Math.max(0, severityScore));

  let severityLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (severityScore > 70) severityLevel = 'HIGH';
  else if (severityScore > 30) severityLevel = 'MEDIUM';

  return {
    issueCategory: category,
    severityScore,
    severityLevel,
    recommendedGigType
  };
};

export const findBestGig = async (recommendedGigType: GigCategory) => {
  try {
    const res = await gigApi.list({ category: recommendedGigType });
    const available = res.filter(g => g.isAvailable);
    if (available.length > 0) {
      return available[0];
    }
    return null;
  } catch {
    return null;
  }
};
