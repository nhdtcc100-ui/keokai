import React from 'react';
import { JobPostForm } from '../components/features/missions/JobPostForm';
import { useAppContext } from '../contexts/AppContext';

/**
 * Page layout that respects mobile safe‑area insets and hides native scrollbars.
 */
const JobPostPage: React.FC = () => {
  const { appUser } = useAppContext();

  const [formData, setFormData] = React.useState({
    title: '',
    company: '',
    description: '',
    requirements: '',
    location: '',
    salary: '',
    jobType: 'دوام كامل',
    working_hours: '',
    imageUrl: '',
    is_active: true,
  });

  const handleSubmit = async () => {
    // Post-submit logic if routed as standalone page
  };

  const handleClose = () => {
    if (window.history.length > 1) {
      window.history.back();
    }
  };

  return (
    <JobPostForm
      show={true}
      formData={formData}
      setFormData={setFormData}
      onSubmit={handleSubmit}
      isPosting={false}
      onClose={handleClose}
      isEditing={false}
      appUser={appUser}
    />
  );
};

export default JobPostPage;
