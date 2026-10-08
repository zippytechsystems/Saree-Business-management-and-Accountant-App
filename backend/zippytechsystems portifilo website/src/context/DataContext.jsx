import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isBackendConfigured } from '../lib/api';
import { content as initialContent } from '../data/content';
import {
  formatINR,
  getDomains,
  updateDomainPriceApi,
  getServices,
  createServiceApi,
  updateServiceApi,
  deleteServiceApi,
  getPackages,
  createPackageApi,
  updatePackageApi,
  updatePackagePriceApi,
  deletePackageApi,
  getProjects,
  createProjectApi,
  updateProjectApi,
  deleteProjectApi,
  uploadProjectImageApi,
  getTestimonials,
  createTestimonialApi,
  updateTestimonialApi,
  deleteTestimonialApi,
  getFaqs,
  createFaqApi,
  updateFaqApi,
  deleteFaqApi,
  getSettings,
  updateSettingsApi,
  createEnquiry,
  getEnquiriesApi,
  updateEnquiryStatusApi,
  deleteEnquiryApi,
  getPriceHistoryApi,
  getChatbotPublicSettings,
  getAdminChatbotSettings,
  updateChatbotSettingsApi,
  getServiceAreas,
  createServiceAreaApi,
  updateServiceAreaApi,
  deleteServiceAreaApi,
  getChatSessionsApi,
  getChatMessagesApi,
  deleteChatSessionApi,
  getWhatsAppContactsApi,
  getWhatsAppMessagesApi,
  takeOverWhatsAppChatApi,
  resumeWhatsAppChatApi,
  updateWhatsAppContactStatusApi,
  getWhatsAppTemplatesApi,
  sendWhatsAppMessageApi,
  getDesignSettingsApi,
  updateDesignSettingsApi,
  getClientsApi,
  getProcessStepsApi,
  DEFAULT_DESIGN_SETTINGS
} from '../lib/api';

const DataContext = createContext();


export function DataProvider({ children }) {
  // State for all dynamic entities + domains + price history
  const [domainsData, setDomainsData] = useState([
    { id: 'web', key: 'web', name: 'Web Development', starting_price: 6500, price_label: 'Starting from', color: '#1d5cf0' },
    { id: 'app', key: 'app', name: 'App Development', starting_price: 20000, price_label: 'Starting from', color: '#12a150' },
    { id: 'ai', key: 'ai', name: 'AI Automation', starting_price: 7500, price_label: 'Starting from', color: '#7a2fd0' }
  ]);

  const [servicesData, setServicesData] = useState(initialContent.services);
  const [packagesData, setPackagesData] = useState(initialContent.packages || []);
  const [projectsData, setProjectsData] = useState(initialContent.projects || []);
  const [testimonialsData, setTestimonialsData] = useState(initialContent.testimonials || []);
  const [faqsData, setFaqsData] = useState(initialContent.faqs || []);
  const [settingsData, setSettingsData] = useState({
    founderName: 'Lingaswamy Maddeboina',
    phone: initialContent.founder.phone,
    whatsappNumber: initialContent.founder.whatsappNumber,
    defaultWhatsAppMessage: 'Hi Lingaswamy, I visited ZippyTechSystems and would like to get a quote for my business.',
    tagline: initialContent.company.tagline,
    secondaryTagline: initialContent.company.secondaryTagline,
    location: initialContent.company.location,
    instagramUrl: initialContent.social?.instagram || 'https://www.instagram.com/zippytechsystems',
    youtubeUrl: initialContent.social?.youtube || 'https://www.youtube.com/@zippytechsystems',
    facebookUrl: '',
    linkedinUrl: '',
    email: '',
    responseTimeText: '24 hours',
    notifyEmailEnabled: true,
    waAutoReplyEnabled: false,
    waAdminAlertEnabled: false,
    waTemplateEn: 'Thank you for contacting ZippyTechSystems. We received your enquiry and will contact you within 24 hours.',
    waTemplateTe: 'ZippyTechSystems ను సంప్రదించినందుకు ధన్యవాదాలు. మీ విచారణ మాకు అందింది, మేము 24 గంటల్లో మిమ్మల్ని సంప్రదిస్తాము.',
    waTemplateHi: 'ZippyTechSystems से संपर्क करने के लिए धन्यवाद। हमें आपकी पूछताछ मिल गई है और हम 24 घंटे के भीतर आपसे संपर्क करेंगे।',
    whatsappBotEnabled: true,
    whatsappAutoConfirm: false,
    whatsappFollowups: false,
    whatsappStatusUpdates: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    dailySummaryEnabled: false,
    googleSheetExportEnabled: false,
    humanPauseHours: 2,
    waAdminTo: ''
  });
  const [enquiries, setEnquiries] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);

  // Chatbot & Service Areas State
  const [chatbotSettings, setChatbotSettings] = useState({
    enabled: true,
    welcomeMessage:
      'Hi! I am the ZippyTechSystems AI assistant. How can I help you grow your business with Web Development, App Development, or AI Automation today?',
    quickReplies: [
      'Website services',
      'App for my shop',
      'AI chatbot / WhatsApp automation',
      'Prices',
      'Talk to Lingaswamy'
    ],
    voiceEnabled: true,
    voiceDefaultLang: 'en-IN',
    voiceRate: 1.0,
    voiceNameEn: 'en-IN-NeerjaNeural',
    voiceNameTe: 'te-IN-ShrutiNeural',
    voiceNameHi: 'hi-IN-SwaraNeural'
  });
  const [adminChatbotSettings, setAdminChatbotSettings] = useState(null);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [chatSessions, setChatSessions] = useState([]);

  // WhatsApp Automation & Live Inbox State
  const [whatsappContacts, setWhatsappContacts] = useState([]);
  const [whatsappTemplates, setWhatsappTemplates] = useState([]);

  // Phase 2: Design Settings & Dynamic Motion State
  const [designSettings, setDesignSettings] = useState(DEFAULT_DESIGN_SETTINGS);
  const [clientsData, setClientsData] = useState([]);
  const [processStepsData, setProcessStepsData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(true);

  // Fetch all fresh data
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        doms,
        srvs,
        pkgs,
        projs,
        tests,
        fqs,
        sttngs,
        enqs,
        phist,
        botSettings,
        areas,
        waContacts,
        waTemplates,
        dSettings,
        cls,
        pSteps
      ] = await Promise.all([
        getDomains(),
        getServices(),
        getPackages(),
        getProjects(),
        getTestimonials(),
        getFaqs(),
        getSettings(),
        getEnquiriesApi(),
        getPriceHistoryApi(),
        getChatbotPublicSettings(),
        getServiceAreas(),
        getWhatsAppContactsApi(),
        getWhatsAppTemplatesApi(),
        getDesignSettingsApi(),
        getClientsApi(),
        getProcessStepsApi()
      ]);

      if (doms && doms.length > 0) setDomainsData(doms);
      if (srvs && srvs.length > 0) setServicesData(srvs);
      if (pkgs && pkgs.length > 0) setPackagesData(pkgs);
      if (projs && projs.length > 0) setProjectsData(projs);
      if (tests && tests.length > 0) setTestimonialsData(tests);
      if (fqs && fqs.length > 0) setFaqsData(fqs);
      if (sttngs) setSettingsData(sttngs);
      if (enqs) setEnquiries(enqs);
      if (phist) setPriceHistory(phist);
      if (botSettings) setChatbotSettings(botSettings);
      if (areas && areas.length > 0) setServiceAreas(areas);
      if (waContacts) setWhatsappContacts(waContacts);
      if (waTemplates) setWhatsappTemplates(waTemplates);
      if (dSettings) setDesignSettings(dSettings);
      if (cls && cls.length > 0) setClientsData(cls);
      if (pSteps && pSteps.length > 0) setProcessStepsData(pSteps);

      setIsLiveConnected(true);
    } catch (err) {
      console.warn('DataContext synchronization warning:', err);
    } finally {
      setLoading(false);
    }
  }, []);


  // Initial load
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Periodic background refresh (every 3 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      loadAllData();
    }, 180000);
    return () => clearInterval(interval);
  }, [loadAllData]);

  // Helper: Retrieve formatted price for any domain ('web', 'app', 'ai')
  const getDomainPrice = (key) => {
    const d = domainsData.find((item) => item.key === key || item.id === key);
    if (!d) {
      if (key === 'web') return '₹6,500';
      if (key === 'app') return '₹20,000';
      if (key === 'ai') return '₹7,500';
      return '₹6,500';
    }
    return formatINR(d.starting_price);
  };

  const getDomainPriceNum = (key) => {
    const d = domainsData.find((item) => item.key === key || item.id === key);
    if (!d) {
      if (key === 'web') return 6500;
      if (key === 'app') return 20000;
      if (key === 'ai') return 7500;
      return 6500;
    }
    return Number(d.starting_price) || 0;
  };

  // -------------------------------------------------------------
  // Prices Tab Actions
  // -------------------------------------------------------------
  const updateDomainPrice = async (domainId, newPrice) => {
    const numeric = Math.max(0, Number(newPrice) || 0);
    // Optimistic local update
    setDomainsData((prev) =>
      prev.map((d) => (d.id === domainId || d.key === domainId ? { ...d, starting_price: numeric } : d))
    );
    setServicesData((prev) =>
      prev.map((s) => (s.domain === domainId ? { ...s, startingPrice: formatINR(numeric), startingPriceNum: numeric } : s))
    );

    const res = await updateDomainPriceApi(domainId, numeric);
    const hist = await getPriceHistoryApi();
    setPriceHistory(hist);
    return res;
  };

  const updatePackagePrice = async (packageId, newPrice) => {
    const numeric = Math.max(0, Number(newPrice) || 0);
    setPackagesData((prev) =>
      prev.map((p) => (p.id === packageId ? { ...p, price: formatINR(numeric), priceNum: numeric } : p))
    );

    const res = await updatePackagePriceApi(packageId, numeric);
    const hist = await getPriceHistoryApi();
    setPriceHistory(hist);
    return res;
  };

  const saveAllPrices = async (domainPricesObj, packagePricesObj) => {
    const promises = [];
    Object.entries(domainPricesObj).forEach(([dId, price]) => {
      promises.push(updateDomainPrice(dId, price));
    });
    Object.entries(packagePricesObj).forEach(([pkgId, price]) => {
      promises.push(updatePackagePrice(pkgId, price));
    });
    await Promise.all(promises);
    const hist = await getPriceHistoryApi();
    setPriceHistory(hist);
    return { success: true };
  };

  // -------------------------------------------------------------
  // Services Actions
  // -------------------------------------------------------------
  const addServiceItem = async (domainKey, type, name, description = '') => {
    const res = await createServiceApi({
      domain_id: domainKey,
      name,
      description,
      type,
      sort_order: 99
    });
    const fresh = await getServices();
    setServicesData(fresh);
    return res;
  };

  const editServiceItem = async (serviceId, updates) => {
    const res = await updateServiceApi(serviceId, updates);
    const fresh = await getServices();
    setServicesData(fresh);
    return res;
  };

  const deleteServiceItem = async (serviceId) => {
    const res = await deleteServiceApi(serviceId);
    const fresh = await getServices();
    setServicesData(fresh);
    return res;
  };

  // -------------------------------------------------------------
  // Packages Actions
  // -------------------------------------------------------------
  const addPackage = async (payload) => {
    const res = await createPackageApi(payload);
    const fresh = await getPackages();
    setPackagesData(fresh);
    return res;
  };

  const editPackage = async (packageId, payload) => {
    const res = await updatePackageApi(packageId, payload);
    const fresh = await getPackages();
    setPackagesData(fresh);
    return res;
  };

  const deletePackage = async (packageId) => {
    const res = await deletePackageApi(packageId);
    const fresh = await getPackages();
    setPackagesData(fresh);
    return res;
  };

  // -------------------------------------------------------------
  // Portfolio Actions
  // -------------------------------------------------------------
  const addProject = async (payload) => {
    const res = await createProjectApi(payload);
    const fresh = await getProjects();
    setProjectsData(fresh);
    return res;
  };

  const editProject = async (projectId, payload) => {
    const res = await updateProjectApi(projectId, payload);
    const fresh = await getProjects();
    setProjectsData(fresh);
    return res;
  };

  const deleteProject = async (projectId) => {
    const res = await deleteProjectApi(projectId);
    const fresh = await getProjects();
    setProjectsData(fresh);
    return res;
  };

  const uploadProjectImage = async (file) => {
    return await uploadProjectImageApi(file);
  };

  // -------------------------------------------------------------
  // Testimonials Actions
  // -------------------------------------------------------------
  const addTestimonial = async (payload) => {
    const res = await createTestimonialApi(payload);
    const fresh = await getTestimonials();
    setTestimonialsData(fresh);
    return res;
  };

  const editTestimonial = async (id, payload) => {
    const res = await updateTestimonialApi(id, payload);
    const fresh = await getTestimonials();
    setTestimonialsData(fresh);
    return res;
  };

  const deleteTestimonial = async (id) => {
    const res = await deleteTestimonialApi(id);
    const fresh = await getTestimonials();
    setTestimonialsData(fresh);
    return res;
  };

  // -------------------------------------------------------------
  // FAQs Actions
  // -------------------------------------------------------------
  const addFaq = async (payload) => {
    const res = await createFaqApi(payload);
    const fresh = await getFaqs();
    setFaqsData(fresh);
    return res;
  };

  const editFaq = async (id, payload) => {
    const res = await updateFaqApi(id, payload);
    const fresh = await getFaqs();
    setFaqsData(fresh);
    return res;
  };

  const deleteFaq = async (id) => {
    const res = await deleteFaqApi(id);
    const fresh = await getFaqs();
    setFaqsData(fresh);
    return res;
  };

  // -------------------------------------------------------------
  // Settings Actions
  // -------------------------------------------------------------
  const persistSettings = async (data) => {
    setSettingsData(data);
    return await updateSettingsApi(data);
  };

  // -------------------------------------------------------------
  // Enquiries Actions
  // -------------------------------------------------------------
  const saveEnquiry = async (data) => {
    const res = await createEnquiry(data);
    if (res.data) {
      setEnquiries((prev) => [res.data, ...prev]);
    }
    return res;
  };

  const updateEnquiryStatus = async (id, status) => {
    setEnquiries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status } : e))
    );
    return await updateEnquiryStatusApi(id, status);
  };

  const deleteEnquiry = async (id) => {
    setEnquiries((prev) => prev.filter((e) => e.id !== id));
    return await deleteEnquiryApi(id);
  };

  // CSV Export for Enquiries
  const exportEnquiriesCSV = () => {
    if (!enquiries || enquiries.length === 0) return false;

    const headers = ['ID', 'Date', 'Name', 'Phone', 'Service', 'Message', 'Status', 'Source'];
    const rows = enquiries.map((enq) => [
      enq.id,
      new Date(enq.created_at).toLocaleString('en-IN'),
      `"${(enq.name || '').replace(/"/g, '""')}"`,
      `"${enq.phone || ''}"`,
      `"${(enq.service || '').replace(/"/g, '""')}"`,
      `"${(enq.message || '').replace(/"/g, '""')}"`,
      enq.status || 'New',
      enq.source || 'contact'
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `zippy_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  };

  // Chatbot Admin Helpers
  const loadAdminChatbot = async () => {
    const data = await getAdminChatbotSettings();
    setAdminChatbotSettings(data);
    return data;
  };

  const persistChatbotSettings = async (newSettings) => {
    const res = await updateChatbotSettingsApi(newSettings);
    if (res.success) {
      setAdminChatbotSettings(newSettings);
      setChatbotSettings({
        enabled: newSettings.enabled,
        welcomeMessage: newSettings.welcomeMessage,
        quickReplies: newSettings.quickReplies,
        voiceEnabled: newSettings.voiceEnabled,
        voiceDefaultLang: newSettings.voiceDefaultLang,
        voiceRate: newSettings.voiceRate,
        voiceNameEn: newSettings.voiceNameEn,
        voiceNameTe: newSettings.voiceNameTe,
        voiceNameHi: newSettings.voiceNameHi
      });
    }
    return res;
  };

  // Service Areas Helpers
  const loadServiceAreasList = async () => {
    const data = await getServiceAreas();
    setServiceAreas(data);
    return data;
  };

  const addServiceArea = async (area) => {
    const res = await createServiceAreaApi(area);
    if (res.success && res.data) {
      setServiceAreas((prev) => [...prev, res.data]);
    }
    return res;
  };

  const editServiceArea = async (id, updates) => {
    const res = await updateServiceAreaApi(id, updates);
    if (res.success) {
      setServiceAreas((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
      );
    }
    return res;
  };

  const deleteServiceArea = async (id) => {
    const res = await deleteServiceAreaApi(id);
    if (res.success) {
      setServiceAreas((prev) => prev.filter((a) => a.id !== id));
    }
    return res;
  };

  // Chat Sessions & Conversations
  const loadChatSessions = async () => {
    const data = await getChatSessionsApi();
    setChatSessions(data);
    return data;
  };

  const loadChatMessages = async (sessionId) => {
    return await getChatMessagesApi(sessionId);
  };

  const deleteChatSession = async (sessionId) => {
    const res = await deleteChatSessionApi(sessionId);
    if (res.success) {
      setChatSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
    }
    return res;
  };

  // WhatsApp Admin Helpers
  const loadWhatsAppContacts = async () => {
    const data = await getWhatsAppContactsApi();
    setWhatsappContacts(data);
    return data;
  };

  const loadWhatsAppMessages = async (contactId) => {
    return await getWhatsAppMessagesApi(contactId);
  };

  const takeOverWhatsAppChat = async (contactId, pauseHours = 2) => {
    const res = await takeOverWhatsAppChatApi(contactId, pauseHours);
    if (res.success) {
      setWhatsappContacts((prev) =>
        prev.map((c) =>
          c.id === contactId
            ? { ...c, status: 'needs_human', isPaused: true, ai_paused_until: res.ai_paused_until }
            : c
        )
      );
    }
    return res;
  };

  const resumeWhatsAppChat = async (contactId) => {
    const res = await resumeWhatsAppChatApi(contactId);
    if (res.success) {
      setWhatsappContacts((prev) =>
        prev.map((c) =>
          c.id === contactId
            ? { ...c, status: 'active', isPaused: false, ai_paused_until: null }
            : c
        )
      );
    }
    return res;
  };

  const updateWhatsAppContactStatus = async (contactId, status) => {
    const res = await updateWhatsAppContactStatusApi(contactId, status);
    if (res.success) {
      setWhatsappContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, status } : c))
      );
    }
    return res;
  };

  const loadWhatsAppTemplates = async () => {
    const data = await getWhatsAppTemplatesApi();
    setWhatsappTemplates(data);
    return data;
  };

  const sendWhatsAppMessage = async (payload) => {
    return await sendWhatsAppMessageApi(payload);
  };

  // Overdue inquiries count (older than 24 hours and still in 'New' status)
  const overdueEnquiriesCount = enquiries.filter((e) => {
    if (e.status !== 'New') return false;
    if (e.isOverdue) return true;
    const createdTime = new Date(e.created_at).getTime();
    return !isNaN(createdTime) && Date.now() - createdTime >= 24 * 60 * 60 * 1000;
  }).length;

  const persistDesignSettings = async (updates) => {
    try {
      const res = await updateDesignSettingsApi(updates);
      if (res.success && res.data) {
        setDesignSettings(res.data);
      }
      return res;
    } catch (err) {
      console.error('persistDesignSettings error:', err);
      return { success: false, error: err.message };
    }
  };

  return (
    <DataContext.Provider
      value={{
        domainsData,
        servicesData,
        packagesData,
        projectsData,
        testimonialsData,
        faqsData,
        settingsData,
        enquiries,
        overdueEnquiriesCount,
        priceHistory,
        loading,
        isLiveConnected,
        loadAllData,
        formatINR,
        getDomainPrice,
        getDomainPriceNum,
        updateDomainPrice,
        updatePackagePrice,
        saveAllPrices,
        addServiceItem,
        editServiceItem,
        deleteServiceItem,
        addPackage,
        editPackage,
        deletePackage,
        addProject,
        editProject,
        deleteProject,
        uploadProjectImage,
        addTestimonial,
        editTestimonial,
        deleteTestimonial,
        addFaq,
        editFaq,
        deleteFaq,
        persistSettings,
        saveEnquiry,
        updateEnquiryStatus,
        deleteEnquiry,
        exportEnquiriesCSV,
        chatbotSettings,
        adminChatbotSettings,
        serviceAreas,
        chatSessions,
        loadAdminChatbot,
        persistChatbotSettings,
        loadServiceAreasList,
        addServiceArea,
        editServiceArea,
        deleteServiceArea,
        loadChatSessions,
        loadChatMessages,
        deleteChatSession,
        whatsappContacts,
        whatsappTemplates,
        loadWhatsAppContacts,
        loadWhatsAppMessages,
        takeOverWhatsAppChat,
        resumeWhatsAppChat,
        updateWhatsAppContactStatus,
        loadWhatsAppTemplates,
        sendWhatsAppMessage,
        designSettings,
        persistDesignSettings,
        clientsData,
        processStepsData
      }}

    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
