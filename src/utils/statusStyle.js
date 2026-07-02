export const mapStatusLabel = (status) => {
  const mapping = {
    'Reported': 'Issue Raised',
    'Verified': 'Community Verified',
    'In Progress': 'Pending Action',
    'Resolved': 'Resolved'
  };
  return mapping[status] || status;
};

export const getStatusCapsule = (status) => {
  switch (status) {
    case 'Resolved':
      return 'bg-[#edf7ed] text-[#1e4620] border-[#d4edd6]';
    case 'In Progress':
      return 'bg-[#fef3c7] text-[#78350f] border-[#fde68a]';
    case 'Verified':
      return 'bg-[#eff6ff] text-[#1e40af] border-[#dbeafe]';
    case 'Reported':
    default:
      return 'bg-[#fef2f2] text-[#991b1b] border-[#fee2e2]';
  }
};
