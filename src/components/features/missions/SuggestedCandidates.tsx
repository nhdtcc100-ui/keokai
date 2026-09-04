import React from 'react';
import type { AppUser, Job } from '../../../types';

interface SuggestedCandidatesProps {
  job: Job;
  allUsers?: AppUser[];
  onViewProfile?: (user: AppUser) => void;
}

export const SuggestedCandidates: React.FC<SuggestedCandidatesProps> = () => null;
