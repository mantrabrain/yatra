import { useQuery, UseQueryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { __ } from '../lib/i18n';
import { useToast } from '../components/ui/toast';

export interface ModuleDefinition {
  slug: string;
  name: string;
  description?: string;
  category?: string;
  version?: string;
  docs_url?: string;
  is_core?: boolean;
  is_premium?: boolean;
  is_available?: boolean;
  requires_pro?: boolean;
  purchase_url?: string;
  video_url?: string;
  enabled: boolean;
  tags?: string[];
  updated_at?: string | null;
  settings_page?: string;
}

interface ModulesResponse {
  data?: ModuleDefinition[];
}

const fetchModules = async (): Promise<ModuleDefinition[]> => {
  const response: ModulesResponse = await apiClient.get('/modules');
  if (Array.isArray(response)) {
    return response;
  }
  if (Array.isArray(response?.data)) {
    return response.data;
  }
  return [];
};

export const useModulesQuery = (options?: Partial<UseQueryOptions<ModuleDefinition[], Error>>) => {
  return useQuery<ModuleDefinition[], Error>({
    queryKey: ['modules'],
    queryFn: fetchModules,
    staleTime: 0,
    ...options,
  });
};

interface TogglePayload {
  slug: string;
  enabled: boolean;
  name?: string;
}

const formatNamesList = (names: string[]) => {
  if (names.length <= 2) {
    return names.join(', ');
  }
  return `${names.slice(0, 2).join(', ')} ${__('and', 'and')} ${names.length - 2} ${__('more', 'more')}`;
};

export const useToggleModule = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({ slug, enabled }: TogglePayload) => {
      const response: ModulesResponse = await apiClient.post(`/modules/${slug}/toggle`, { enabled });
      return Array.isArray(response?.data) ? response.data : [];
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['modules'], data);
      
      // Update global admin variables for navigation
      if (window.yatraAdmin) {
        // Update module-specific flags based on the enabled modules
        const enabledModules = data.filter(m => m.enabled);
        
        // Check for specific modules that affect navigation
        window.yatraAdmin.emailAutomationEnabled = enabledModules.some(m => 
          m.slug === 'email_automation' || m.slug === 'email-automation'
        );
        window.yatraAdmin.tripConsentEnabled = enabledModules.some(m => 
          m.slug === 'trip_consent' || m.slug === 'trip-consent'
        );
        window.yatraAdmin.additionalServicesEnabled = enabledModules.some(m => 
          m.slug === 'additional_services' || m.slug === 'additional-services'
        );
        // Note: availabilityModuleEnabled and departuresModuleEnabled removed - now FREE features
        
        // Trigger a navigation refresh by updating a custom event
        window.dispatchEvent(new CustomEvent('yatra-modules-updated', { 
          detail: { 
            enabledModules: enabledModules,
            updatedModule: variables 
          } 
        }));
        
        // Force a layout re-render by updating the URL key
        const urlKey = (window as any).__yatraUrlKey || 0;
        (window as any).__yatraUrlKey = urlKey + 1;
        window.dispatchEvent(new CustomEvent('yatra-force-nav-refresh'));
      }
      
      const label = variables.name || variables.slug;
      showToast(
        variables.enabled
          ? __('{module} enabled successfully.', '{module} enabled successfully.').replace('{module}', label)
          : __('{module} disabled successfully.', '{module} disabled successfully.').replace('{module}', label),
        'success'
      );
    },
    onError: (error: Error) => {
      showToast(error.message || __('Failed to update module.', 'Failed to update module.'), 'error');
    },
  });
};

export const useBulkToggleModules = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (items: TogglePayload[]) => {
      const response: ModulesResponse = await apiClient.post('/modules/bulk-toggle', { items });
      return Array.isArray(response?.data) ? response.data : [];
    },
    onSuccess: (data, variables = []) => {
      queryClient.setQueryData(['modules'], data);
      
      // Update global admin variables for navigation
      if (window.yatraAdmin && data) {
        // Update module-specific flags based on the enabled modules
        const enabledModules = data.filter(m => m.enabled);
        
        // Check for specific modules that affect navigation
        window.yatraAdmin.emailAutomationEnabled = enabledModules.some(m => 
          m.slug === 'email_automation' || m.slug === 'email-automation'
        );
        window.yatraAdmin.tripConsentEnabled = enabledModules.some(m => 
          m.slug === 'trip_consent' || m.slug === 'trip-consent'
        );
        window.yatraAdmin.additionalServicesEnabled = enabledModules.some(m => 
          m.slug === 'additional_services' || m.slug === 'additional-services'
        );
        // Note: availabilityModuleEnabled and departuresModuleEnabled removed - now FREE features
        
        // Trigger a navigation refresh by updating a custom event
        window.dispatchEvent(new CustomEvent('yatra-modules-updated', { 
          detail: { 
            enabledModules: enabledModules,
            updatedModules: variables || []
          } 
        }));
        
        // Force a layout re-render by updating the URL key
        const urlKey = (window as any).__yatraUrlKey || 0;
        (window as any).__yatraUrlKey = urlKey + 1;
        window.dispatchEvent(new CustomEvent('yatra-force-nav-refresh'));
      }
      
      if (variables.length > 0) {
        const names = variables.map((item) => item.name || item.slug);
        const summary = formatNamesList(names);
        const message = variables[0].enabled
          ? __('Enabled: {modules}', 'Enabled: {modules}').replace('{modules}', summary)
          : __('Disabled: {modules}', 'Disabled: {modules}').replace('{modules}', summary);
        showToast(message, 'success');
      } else {
        showToast(__('Modules updated successfully.', 'Modules updated successfully.'), 'success');
      }
    },
    onError: (error: Error) => {
      showToast(error.message || __('Failed to update modules.', 'Failed to update modules.'), 'error');
    },
  });
};


