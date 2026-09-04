import React from 'react';
import type { AppUser, Job } from '../../../types';

export interface MatchedCandidatesBarProps {
  job: Job;
  employerId?: string;
  allUsers?: AppUser[];
  onUserClick: (user: AppUser) => void;
}

export const MatchedCandidatesBar: React.FC<MatchedCandidatesBarProps> = () => null;
