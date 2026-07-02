export const getInitials = (name) => {
  if (!name) return 'US';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

export const getFirstName = (name) => {
  if (!name) return 'User';
  return name.split(' ')[0];
};
