/**
 * Navigation hook for updating URL parameters
 */
export const useNavigate = () => {
  const navigate = (params: {
    subpage?: string;
    tab?: string;
    action?: string;
    id?: number | string;
    trip_id?: number | string;
    [key: string]: string | number | undefined;
  }) => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Handle standard parameters
    if (params.subpage !== undefined) {
      urlParams.set('subpage', params.subpage);
    }
    if (params.tab !== undefined) {
      urlParams.set('tab', params.tab);
    }
    if (params.action !== undefined) {
      urlParams.set('action', params.action);
    }
    if (params.id !== undefined) {
      urlParams.set('id', params.id.toString());
    }
    
    // Handle custom parameters (like trip_id)
    Object.keys(params).forEach(key => {
      if (!['subpage', 'tab', 'action', 'id'].includes(key) && params[key] !== undefined) {
        urlParams.set(key, params[key]!.toString());
      }
    });
    
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.pushState({}, '', newUrl);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return { navigate };
};

