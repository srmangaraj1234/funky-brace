import { useState, useEffect, useRef } from 'react';

export default function useResolutionBanner(issues) {
  const [resolutionBannerText, setResolutionBannerText] = useState(null);
  const prevResolvedIdsRef = useRef(null);

  useEffect(() => {
    // Collect all currently resolved IDs
    const currentResolvedIds = new Set(
      issues.filter(i => i.status === 'Resolved').map(i => i.id)
    );

    // If it's the first time we load the issues, just initialize the ref and don't trigger banner
    if (prevResolvedIdsRef.current === null) {
      prevResolvedIdsRef.current = currentResolvedIds;
      return;
    }

    // Find any issue that is newly resolved
    const newlyResolvedId = [...currentResolvedIds].find(id => !prevResolvedIdsRef.current.has(id));
    if (newlyResolvedId) {
      const issue = issues.find(i => i.id === newlyResolvedId);
      if (issue) {
        setResolutionBannerText(`"${issue.title}" has been resolved!`);
        // Auto-dismiss after 5 seconds
        const timer = setTimeout(() => {
          setResolutionBannerText(null);
        }, 5000);
        
        // Always update the ref
        prevResolvedIdsRef.current = currentResolvedIds;
        return () => clearTimeout(timer);
      }
    }

    // Always update the ref
    prevResolvedIdsRef.current = currentResolvedIds;
  }, [issues]);

  return { resolutionBannerText, setResolutionBannerText };
}
