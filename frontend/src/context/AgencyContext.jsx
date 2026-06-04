import React, { createContext, useContext, useState, useEffect } from 'react';
import { configuracionApi } from '../services/configuracionApi';

const AgencyContext = createContext();

export const useAgency = () => useContext(AgencyContext);

export const AgencyProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const res = await configuracionApi.get();
      setConfig(res.data); // will be null if no config
    } catch (err) {
      console.error('Error loading agency config', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    if (config?.colorPrincipal) {
      document.documentElement.style.setProperty('--primary-color', config.colorPrincipal);
      document.documentElement.style.setProperty('--mediterranean', config.colorPrincipal);
    }
  }, [config?.colorPrincipal]);

  const value = {
    config,
    loading,
    refreshConfig: fetchConfig,
    primaryColor: config?.colorPrincipal || '#1890ff',
    logoUrl: config?.logoUrl || '/logo.png' // Fallback to default
  };

  return (
    <AgencyContext.Provider value={value}>
      {children}
    </AgencyContext.Provider>
  );
};
