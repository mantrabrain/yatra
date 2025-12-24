/**
 * Navigation hook for updating URL parameters
 */
export const useNavigate = () => {
  const navigate = (params: {
    subpage?: string;
    tab?: string;
    action?: string;
    tabMode?: 'specific' | 'recurring';
    id?: number | string;
    trip_id?: number | string;
    [key: string]: string | number | undefined;
  }) => {
    const urlParams = new URLSearchParams(window.location.search);
    
    const setParam = (key: string, value?: string | number) => {
      if (value === undefined || value === null) {
        urlParams.delete(key);
      } else {
        urlParams.set(key, value.toString());
      }
    };

    const standardKeys = ['subpage', 'tab', 'action', 'id'];

    standardKeys.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(params, key)) {
        setParam(key, params[key]);
      }
    });
    
    // Handle custom parameters (like trip_id, tab_mode)
    Object.keys(params).forEach(key => {
      if (!standardKeys.includes(key)) {
        setParam(key, params[key]);
      }
    });
    
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.pushState({}, '', newUrl);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return { navigate };
};

