import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useData } from '../context/DataContext';
import {
  LayoutDashboard,
  Layers,
  Briefcase,
  Inbox,
  Settings,
  Lock,
  LogOut,
  Phone,
  MessageCircle,
  Search,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Upload,
  AlertCircle,
  X,
  Globe,
  Smartphone,
  Cpu,
  RefreshCw,
  Eye,
  Star,
  HelpCircle,
  PackageCheck,
  BadgePercent,
  Download,
  History,
  TrendingUp,
  Save,
  Check,
  Bot,
  MessageSquare,
  MapPin,
  Send,
  Sliders,
  Calendar,
  UserCheck,
  Mic,
  Volume2,
  Clock,
  Mail,
  CheckCheck,
  Pause,
  Play,
  SlidersHorizontal,
  Compass
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { buildKnowledge } from '../lib/knowledgeBuilder';
import { DEFAULT_DESIGN_SETTINGS } from '../lib/api';

export default function AdminPage() {

  const { isAuthenticated, adminUser, login, logout, resetPassword, loading: authLoading } = useAdminAuth();
  const {
    domainsData,
    servicesData,
    projectsData,
    testimonialsData,
    faqsData,
    packagesData,
    settingsData,
    enquiries,
    overdueEnquiriesCount,
    isLiveConnected,
    priceHistory,
    updateDomainPrice,
    updatePackagePrice,
    saveAllPrices,
    exportEnquiriesCSV,
    formatINR,
    addServiceItem,
    editServiceItem,
    deleteServiceItem,
    reorderServiceItems,
    addProject,
    editProject,
    deleteProject,
    uploadProjectImage,
    updateEnquiryStatus,
    deleteEnquiry,
    persistSettings,
    addTestimonial,
    editTestimonial,
    deleteTestimonial,
    addFaq,
    editFaq,
    deleteFaq,
    addPackage,
    editPackage,
    deletePackage,
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
    persistDesignSettings
  } = useData();

  // Navigation tab state: 'dashboard' | 'prices' | 'services' | 'packages' | 'portfolio' | 'testimonials' | 'faqs' | 'enquiries' | 'chatbot' | 'conversations' | 'whatsapp' | 'serviceAreas' | 'design' | 'settings'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Phase 2: Design & Motion Settings state
  const [designForm, setDesignForm] = useState(designSettings || DEFAULT_DESIGN_SETTINGS);
  const [savingDesign, setSavingDesign] = useState(false);

  useEffect(() => {
    if (designSettings) {
      setDesignForm(designSettings);
    }
  }, [designSettings]);

  // Login form state

  const [loginEmail, setLoginEmail] = useState('lingaswamymaddeboina@gmail.com');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Toast feedback state
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Delete Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const openConfirm = (title, message, onConfirm) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        await onConfirm();
      }
    });
  };

  // -------------------------------------------------------------
  // Prices Management State & Sync
  // -------------------------------------------------------------
  const [domainPriceInputs, setDomainPriceInputs] = useState({});
  const [packagePriceInputs, setPackagePriceInputs] = useState({});
  const [pricesSaving, setPricesSaving] = useState(false);
  const [pricesSuccessLink, setPricesSuccessLink] = useState(false);

  useEffect(() => {
    if (domainsData && domainsData.length > 0) {
      const initD = {};
      domainsData.forEach((d) => {
        initD[d.key] = d.starting_price;
      });
      setDomainPriceInputs((prev) => ({ ...initD, ...prev }));
    }
  }, [domainsData]);

  useEffect(() => {
    if (packagesData && packagesData.length > 0) {
      const initP = {};
      packagesData.forEach((p) => {
        initP[p.id] = p.price;
      });
      setPackagePriceInputs((prev) => ({ ...initP, ...prev }));
    }
  }, [packagesData]);

  const handleSaveDomainPrice = async (key, name) => {
    const val = Number(domainPriceInputs[key]);
    if (isNaN(val) || val < 0) {
      showToast('Please enter a valid price (0 or positive number).', 'error');
      return;
    }
    const res = await updateDomainPrice(key, val);
    if (res.success) {
      showToast(`Updated ${name} starting price to ${formatINR(val)}!`);
      setPricesSuccessLink(true);
    } else {
      showToast(res.error || 'Failed to update price.', 'error');
    }
  };

  const handleSavePackagePrice = async (pkg) => {
    const val = Number(packagePriceInputs[pkg.id]);
    if (isNaN(val) || val < 0) {
      showToast('Please enter a valid price (0 or positive number).', 'error');
      return;
    }
    const res = await updatePackagePrice(pkg.id, val, pkg.name);
    if (res.success) {
      showToast(`Updated ${pkg.name} package price to ${formatINR(val)}!`);
      setPricesSuccessLink(true);
    } else {
      showToast(res.error || 'Failed to update package price.', 'error');
    }
  };

  const handleSaveAllPrices = async () => {
    setPricesSaving(true);
    const domainsList = domainsData.map((d) => ({
      key: d.key,
      price: Number(domainPriceInputs[d.key] !== undefined ? domainPriceInputs[d.key] : d.starting_price)
    }));
    const packagesList = packagesData.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(packagePriceInputs[p.id] !== undefined ? packagePriceInputs[p.id] : p.price)
    }));
    const res = await saveAllPrices(domainsList, packagesList);
    setPricesSaving(false);
    if (res.success) {
      showToast('All prices saved successfully! Live website updated instantly.');
      setPricesSuccessLink(true);
    } else {
      showToast(res.error || 'Failed to save all prices.', 'error');
    }
  };

  const handleForgotPassword = async () => {
    if (!loginEmail.trim()) {
      setLoginError('Please enter your admin email above first.');
      return;
    }
    setLoginError('');
    setResetLoading(true);
    const res = await resetPassword(loginEmail.trim());
    setResetLoading(false);
    if (res.success) {
      setResetMessage(`Password reset link sent to ${loginEmail}. Please check your inbox.`);
    } else {
      setLoginError(res.error || 'Failed to send reset link.');
    }
  };

  // -------------------------------------------------------------
  // 1. Services Management State
  // -------------------------------------------------------------
  const [selectedDomain, setSelectedDomain] = useState('web-development');
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [serviceModal, setServiceModal] = useState({
    isOpen: false,
    mode: 'add', // 'add' | 'edit'
    domainSlug: 'web-development',
    type: 'main', // 'main' | 'more'
    index: null,
    title: '',
    desc: ''
  });

  // -------------------------------------------------------------
  // 2. Portfolio Management State
  // -------------------------------------------------------------
  const [portfolioFilter, setPortfolioFilter] = useState('all');
  const [projectModal, setProjectModal] = useState({
    isOpen: false,
    mode: 'add', // 'add' | 'edit'
    id: null,
    title: '',
    domain: 'web',
    clientCategory: 'Retail & Business',
    shortDescription: '',
    technologies: 'React, Node.js, Cloud',
    metrics: '',
    image: '/projects/clinic-web.svg',
    imageFile: null
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // -------------------------------------------------------------
  // 3. Enquiries State
  // -------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [serviceFilter, setServiceFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');

  // -------------------------------------------------------------
  // 4. Settings State
  // -------------------------------------------------------------
  const [settingsForm, setSettingsForm] = useState(settingsData);

  useEffect(() => {
    if (settingsData) {
      setSettingsForm(settingsData);
    }
  }, [settingsData]);

  // -------------------------------------------------------------
  // 4B. Chatbot Admin & Sandbox State
  // -------------------------------------------------------------
  const [chatbotForm, setChatbotForm] = useState({
    enabled: true,
    welcomeMessage: '',
    fallbackMessage: '',
    quickReplies: [],
    extraInstructions: '',
    model: 'claude-haiku-4-5-20251001',
    dailyLimit: 500,
    voiceEnabled: true,
    voiceDefaultLang: 'en-IN',
    voiceRate: 1.0,
    voiceNameEn: 'en-IN-NeerjaNeural',
    voiceNameTe: 'te-IN-ShrutiNeural',
    voiceNameHi: 'hi-IN-SwaraNeural'
  });
  const [quickReplyInput, setQuickReplyInput] = useState('');
  const [testChatMessages, setTestChatMessages] = useState([
    { role: 'assistant', content: 'Hi! I am the ZippyTechSystems AI assistant. Test me right here in Admin!' }
  ]);
  const [testChatInput, setTestChatInput] = useState('');
  const [isTestBotSending, setIsTestBotSending] = useState(false);

  // Sync admin chatbot data when tab opens
  useEffect(() => {
    if (activeTab === 'chatbot') {
      loadAdminChatbot().then((data) => {
        if (data) {
          setChatbotForm(data);
        }
      });
    } else if (activeTab === 'conversations') {
      loadChatSessions();
    } else if (activeTab === 'serviceAreas') {
      loadServiceAreasList();
    } else if (activeTab === 'whatsapp') {
      loadWhatsAppContacts();
      loadWhatsAppTemplates();
    }
  }, [activeTab]);

  // Live dynamic knowledge preview generated directly from current database state (buildKnowledge output)
  const currentChatbotKnowledge = buildKnowledge({
    domains: domainsData,
    services: servicesData,
    packages: packagesData,
    projects: projectsData,
    faqs: faqsData,
    serviceAreas: serviceAreas,
    settings: settingsData
  });

  // -------------------------------------------------------------
  // 4C. Conversations State
  // -------------------------------------------------------------
  const [conversationSearch, setConversationSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('all'); // 'all' | 'text' | 'voice'
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [activeSessionMessages, setActiveSessionMessages] = useState([]);
  const [loadingSessionMessages, setLoadingSessionMessages] = useState(false);

  // -------------------------------------------------------------
  // 4C2. WhatsApp Inbox State & Actions
  // -------------------------------------------------------------
  const [selectedWaContactId, setSelectedWaContactId] = useState(null);
  const [waMessages, setWaMessages] = useState([]);
  const [loadingWaMessages, setLoadingWaMessages] = useState(false);
  const [waSearch, setWaSearch] = useState('');
  const [waFilter, setWaFilter] = useState('all'); // 'all' | 'needs_human' | 'app' | 'active' | 'opted_out'
  const [waReplyText, setWaReplyText] = useState('');
  const [waSending, setWaSending] = useState(false);
  const [waSendMode, setWaSendMode] = useState('text'); // 'text' | 'template'
  const [waSelectedTemplateName, setWaSelectedTemplateName] = useState('enquiry_confirmation');
  const [waTemplateVar1, setWaTemplateVar1] = useState('');
  const [waTemplateVar2, setWaTemplateVar2] = useState('');

  // Load transcript when selectedWaContactId changes
  useEffect(() => {
    if (selectedWaContactId) {
      setLoadingWaMessages(true);
      loadWhatsAppMessages(selectedWaContactId)
        .then((msgs) => setWaMessages(msgs || []))
        .finally(() => setLoadingWaMessages(false));
    } else {
      setWaMessages([]);
    }
  }, [selectedWaContactId]);

  // Selected WhatsApp Contact object
  const selectedWaContact = (whatsappContacts || []).find((c) => c.id === selectedWaContactId) || null;

  // Window calculation helper
  const getWaWindowInfo = (lastMsgAt) => {
    if (!lastMsgAt) return { isOpen: false, text: 'No inbound message' };
    const diffMs = 24 * 60 * 60 * 1000 - (Date.now() - new Date(lastMsgAt).getTime());
    if (diffMs <= 0) {
      return { isOpen: false, text: '24h Window Closed (Template required)' };
    }
    const hours = Math.floor(diffMs / (60 * 60 * 1000));
    const mins = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
    return { isOpen: true, hours, mins, text: `24h Window: ${hours}h ${mins}m left` };
  };

  const handleTakeOverChat = async (contactId) => {
    const pauseHours = settingsData?.human_pause_hours || 2;
    const res = await takeOverWhatsAppChat(contactId, pauseHours);
    if (res.success) {
      showToast(`You took over this chat. AI automated replies paused for ${pauseHours} hours.`);
      loadWhatsAppContacts();
    } else {
      showToast(res.error || 'Failed to take over chat.', 'error');
    }
  };

  const handleResumeChatAi = async (contactId) => {
    const res = await resumeWhatsAppChat(contactId);
    if (res.success) {
      showToast('AI automated replies resumed for this contact.');
      loadWhatsAppContacts();
    } else {
      showToast(res.error || 'Failed to resume AI.', 'error');
    }
  };

  const handleSendWaReply = async (e) => {
    if (e) e.preventDefault();
    if (!selectedWaContact) return;

    const windowInfo = getWaWindowInfo(selectedWaContact.last_customer_message_at);

    if (waSendMode === 'text') {
      if (!windowInfo.isOpen) {
        showToast('24-Hour customer window has expired. Meta requires an approved template to message this customer.', 'error');
        setWaSendMode('template');
        return;
      }
      if (!waReplyText.trim()) {
        showToast('Please type a reply message.', 'error');
        return;
      }

      setWaSending(true);
      const res = await sendWhatsAppMessage({
        to: selectedWaContact.phone,
        text: waReplyText.trim()
      });
      setWaSending(false);

      if (res.success) {
        showToast('WhatsApp reply sent successfully!');
        setWaReplyText('');
        const updatedMsgs = await loadWhatsAppMessages(selectedWaContact.id);
        setWaMessages(updatedMsgs || []);
        loadWhatsAppContacts();
      } else {
        showToast(res.error || 'Failed to send WhatsApp message.', 'error');
      }
    } else {
      // Template mode
      if (!waSelectedTemplateName) {
        showToast('Please select a template.', 'error');
        return;
      }

      setWaSending(true);
      const vars = [waTemplateVar1.trim(), waTemplateVar2.trim()].filter(Boolean);
      const res = await sendWhatsAppMessage({
        to: selectedWaContact.phone,
        template_name: waSelectedTemplateName,
        language: selectedWaContact.language || 'en',
        variables: vars
      });
      setWaSending(false);

      if (res.success) {
        showToast(`Template "${waSelectedTemplateName}" sent successfully!`);
        const updatedMsgs = await loadWhatsAppMessages(selectedWaContact.id);
        setWaMessages(updatedMsgs || []);
        loadWhatsAppContacts();
      } else {
        showToast(res.error || 'Failed to send template message.', 'error');
      }
    }
  };

  // -------------------------------------------------------------
  // 4D. Service Areas State
  // -------------------------------------------------------------
  const [serviceAreaModal, setServiceAreaModal] = useState({
    isOpen: false,
    mode: 'add',
    id: null,
    name: '',
    notes: '',
    sort_order: 0,
    is_active: true
  });

  // -------------------------------------------------------------
  // 5. Packages State
  // -------------------------------------------------------------
  const [packageModal, setPackageModal] = useState({
    isOpen: false,
    mode: 'add',
    id: null,
    domain: 'web',
    name: '',
    price: '',
    tagline: '',
    deliverables: '',
    popular: false
  });

  // -------------------------------------------------------------
  // 6. Testimonials State
  // -------------------------------------------------------------
  const [testimonialModal, setTestimonialModal] = useState({
    isOpen: false,
    mode: 'add',
    id: null,
    clientName: '',
    roleOrCompany: '',
    domain: 'web',
    rating: 5,
    content: ''
  });

  // -------------------------------------------------------------
  // 7. FAQs State
  // -------------------------------------------------------------
  const [faqModal, setFaqModal] = useState({
    isOpen: false,
    mode: 'add',
    id: null,
    category: 'General',
    question: '',
    answer: ''
  });

  // -------------------------------------------------------------
  // Handler: Login
  // -------------------------------------------------------------
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    const res = await login(loginEmail, loginPassword);
    if (!res.success) {
      setLoginError(res.error || 'Invalid credentials. Only admin email is authorized.');
    } else {
      showToast('Welcome, Lingaswamy! Logged in to Admin Suite.');
    }
  };

  // -------------------------------------------------------------
  // Render: Login Screen (if not authenticated)
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <main
        style={{
          minHeight: '85vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.25rem',
          background: 'var(--bg-canvas)'
        }}
      >
        <div
          className="card"
          style={{
            width: '100%',
            maxWidth: '430px',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)',
            border: '1px solid var(--border-glass-hover)'
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #0b1b4a 0%, #1d5cf0 100%)',
              color: '#ffe500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
              border: '2px solid rgba(255, 229, 0, 0.4)'
            }}
          >
            <Lock size={28} />
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.35rem' }}>
            Admin Portal
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-body)', marginBottom: '1.5rem' }}>
            ZippyTechSystems Pvt. Ltd. Management Console
          </p>

          {loginError && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#ef4444',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                textAlign: 'left'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit}>
            <div className="form-group" style={{ textAlign: 'left', marginBottom: '1rem' }}>
              <label className="form-label" htmlFor="admin-email">
                Admin Email / Username
              </label>
              <input
                id="admin-email"
                type="text"
                required
                className="form-input"
                placeholder="lingaswamymaddeboina@gmail.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              <label className="form-label" htmlFor="admin-password">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                className="form-input"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="btn btn-cta-yellow"
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: 700 }}
            >
              {authLoading ? 'Verifying...' : 'Sign In to Admin'}
            </button>
          </form>

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            {resetMessage ? (
              <p style={{ color: '#12a150', fontSize: '0.82rem', fontWeight: 600 }}>{resetMessage}</p>
            ) : (
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {resetLoading ? 'Sending link...' : 'Forgot Password? Send Reset Link'}
              </button>
            )}
          </div>

          <div style={{ marginTop: '1.25rem', fontSize: '0.82rem' }}>
            <Link to="/" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>
              ← Return to public website
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------
  // Computed Counts for Dashboard
  // -------------------------------------------------------------
  const totalServicesCount = (servicesData || []).reduce(
    (acc, d) => acc + (d.mainServices?.length || 0) + (d.moreServices?.length || 0),
    0
  );
  const totalProjectsCount = (projectsData || []).length;
  const newEnquiriesCount = (enquiries || []).filter((e) => e.status === 'New').length;
  const totalEnquiriesCount = (enquiries || []).length;

  // Filtered Enquiries
  const filteredEnquiries = (enquiries || []).filter((enq) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (enq.name || '').toLowerCase().includes(query) ||
      (enq.phone || '').includes(query) ||
      (enq.email || '').toLowerCase().includes(query) ||
      (enq.message || '').toLowerCase().includes(query) ||
      (enq.notes || '').toLowerCase().includes(query);

    let matchesStatus = false;
    if (statusFilter === 'All') {
      matchesStatus = true;
    } else if (statusFilter === 'Overdue') {
      matchesStatus =
        enq.status === 'New' &&
        (enq.isOverdue || (enq.created_at && Date.now() - new Date(enq.created_at).getTime() >= 24 * 60 * 60 * 1000));
    } else {
      matchesStatus = enq.status === statusFilter;
    }

    const matchesService =
      serviceFilter === 'All' || (enq.service || '').toLowerCase().includes(serviceFilter.toLowerCase());
    const matchesSource =
      sourceFilter === 'All' || (enq.source || 'contact') === sourceFilter;
    return matchesSearch && matchesStatus && matchesService && matchesSource;
  });

  // Current selected domain for Services Tab
  const currentDomainData =
    servicesData.find((d) => d.slug === selectedDomain) || servicesData[0] || {};

  // -------------------------------------------------------------
  // Services Actions
  // -------------------------------------------------------------
  const handleSavePrice = async () => {
    if (!priceInput.trim()) return;
    await updateDomainPrice(selectedDomain, priceInput.trim());
    setEditingPrice(false);
    showToast(`Updated starting price for ${currentDomainData.domainLabel} to ${priceInput.trim()}`);
  };

  const handleOpenAddService = (type) => {
    setServiceModal({
      isOpen: true,
      mode: 'add',
      domainSlug: selectedDomain,
      type,
      index: null,
      title: '',
      desc: ''
    });
  };

  const handleOpenEditService = (type, index, serviceItem) => {
    setServiceModal({
      isOpen: true,
      mode: 'edit',
      domainSlug: selectedDomain,
      type,
      index,
      title: typeof serviceItem === 'string' ? serviceItem : serviceItem.title,
      desc: typeof serviceItem === 'string' ? '' : serviceItem.desc || ''
    });
  };

  const handleSaveServiceModal = async (e) => {
    e.preventDefault();
    if (!serviceModal.title.trim()) return;

    if (serviceModal.mode === 'add') {
      await addServiceItem(
        serviceModal.domainSlug,
        serviceModal.type,
        serviceModal.title.trim(),
        serviceModal.desc.trim()
      );
      showToast('New service added successfully!');
    } else {
      await editServiceItem(serviceModal.domainSlug, serviceModal.type, serviceModal.index, {
        title: serviceModal.title.trim(),
        desc: serviceModal.desc.trim()
      });
      showToast('Service updated successfully!');
    }
    setServiceModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleDeleteService = (type, index, title) => {
    openConfirm(
      'Delete Service',
      `Are you sure you want to delete "${title}"? This will remove it from the public website.`,
      async () => {
        await deleteServiceItem(selectedDomain, type, index);
        showToast('Service deleted.', 'error');
      }
    );
  };

  // -------------------------------------------------------------
  // Portfolio Actions
  // -------------------------------------------------------------
  const filteredProjects =
    portfolioFilter === 'all'
      ? projectsData
      : projectsData.filter((p) => p.domain === portfolioFilter);

  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const uploadedUrl = await uploadProjectImage(file);
      if (uploadedUrl) {
        setProjectModal((prev) => ({ ...prev, image: uploadedUrl }));
        showToast('Image uploaded successfully!');
      }
    } catch (err) {
      showToast('Image upload failed', 'error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveProjectModal = async (e) => {
    e.preventDefault();
    if (!projectModal.title.trim()) return;

    const projectPayload = {
      title: projectModal.title.trim(),
      domain: projectModal.domain,
      clientCategory: projectModal.clientCategory.trim(),
      shortDescription: projectModal.shortDescription.trim(),
      technologies: projectModal.technologies
        ? projectModal.technologies.split(',').map((t) => t.trim())
        : [],
      metrics: projectModal.metrics.trim(),
      image: projectModal.image || '/projects/clinic-web.svg'
    };

    if (projectModal.mode === 'add') {
      await addProject(projectPayload);
      showToast('New project created and published!');
    } else {
      await editProject(projectModal.id, projectPayload);
      showToast('Project updated successfully!');
    }
    setProjectModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleDeleteProject = (id, title) => {
    openConfirm(
      'Delete Project',
      `Are you sure you want to delete project "${title}"?`,
      async () => {
        await deleteProject(id);
        showToast('Project deleted.', 'error');
      }
    );
  };

  // -------------------------------------------------------------
  // Packages Actions
  // -------------------------------------------------------------
  const [packageDomainFilter, setPackageDomainFilter] = useState('all');

  const handleSavePackageModal = async (e) => {
    e.preventDefault();
    if (!packageModal.name.trim() || !packageModal.price.trim()) return;

    const deliverablesList =
      typeof packageModal.deliverables === 'string'
        ? packageModal.deliverables
            .split('\n')
            .map((d) => d.trim())
            .filter(Boolean)
        : packageModal.deliverables;

    const payload = {
      domain: packageModal.domain,
      name: packageModal.name.trim(),
      price: packageModal.price.trim(),
      tagline: packageModal.tagline.trim(),
      deliverables: deliverablesList,
      popular: Boolean(packageModal.popular)
    };

    if (packageModal.mode === 'add') {
      await addPackage(payload);
      showToast('New package published successfully!');
    } else {
      await editPackage(packageModal.id, payload);
      showToast('Package updated successfully!');
    }
    setPackageModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleDeletePackage = (id, name) => {
    openConfirm(
      'Delete Package',
      `Are you sure you want to delete package "${name}"?`,
      async () => {
        await deletePackage(id);
        showToast('Package deleted.', 'error');
      }
    );
  };

  // -------------------------------------------------------------
  // Testimonials Actions
  // -------------------------------------------------------------
  const [testimonialDomainFilter, setTestimonialDomainFilter] = useState('all');

  const handleSaveTestimonialModal = async (e) => {
    e.preventDefault();
    if (!testimonialModal.clientName.trim() || !testimonialModal.content.trim()) return;

    const payload = {
      clientName: testimonialModal.clientName.trim(),
      roleOrCompany: testimonialModal.roleOrCompany.trim(),
      domain: testimonialModal.domain,
      rating: Number(testimonialModal.rating) || 5,
      content: testimonialModal.content.trim()
    };

    if (testimonialModal.mode === 'add') {
      await addTestimonial(payload);
      showToast('Client review published successfully!');
    } else {
      await editTestimonial(testimonialModal.id, payload);
      showToast('Review updated successfully!');
    }
    setTestimonialModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleDeleteTestimonial = (id, clientName) => {
    openConfirm(
      'Delete Review',
      `Are you sure you want to delete review from "${clientName}"?`,
      async () => {
        await deleteTestimonial(id);
        showToast('Review deleted.', 'error');
      }
    );
  };

  // -------------------------------------------------------------
  // FAQs Actions
  // -------------------------------------------------------------
  const [faqCategoryFilter, setFaqCategoryFilter] = useState('all');

  const handleSaveFaqModal = async (e) => {
    e.preventDefault();
    if (!faqModal.question.trim() || !faqModal.answer.trim()) return;

    const payload = {
      category: faqModal.category.trim() || 'General',
      question: faqModal.question.trim(),
      answer: faqModal.answer.trim()
    };

    if (faqModal.mode === 'add') {
      await addFaq(payload);
      showToast('FAQ added successfully!');
    } else {
      await editFaq(faqModal.id, payload);
      showToast('FAQ updated successfully!');
    }
    setFaqModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleDeleteFaq = (id, question) => {
    openConfirm(
      'Delete FAQ',
      `Are you sure you want to delete FAQ "${question}"?`,
      async () => {
        await deleteFaq(id);
        showToast('FAQ deleted.', 'error');
      }
    );
  };

  // -------------------------------------------------------------
  // Settings Actions
  // -------------------------------------------------------------
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    persistSettings(settingsForm);
    showToast('Site settings updated successfully!');
  };

  // Navigation Items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'prices', label: 'Prices', icon: <BadgePercent size={18} /> },
    { id: 'services', label: 'Services', icon: <Layers size={18} /> },
    { id: 'packages', label: 'Packages', icon: <PackageCheck size={18} /> },
    { id: 'portfolio', label: 'Portfolio', icon: <Briefcase size={18} /> },
    { id: 'testimonials', label: 'Reviews', icon: <Star size={18} /> },
    { id: 'faqs', label: 'FAQs', icon: <HelpCircle size={18} /> },
    {
      id: 'enquiries',
      label: 'Enquiries',
      icon: <Inbox size={18} />,
      badge: newEnquiriesCount > 0 ? newEnquiriesCount : null
    },
    { id: 'chatbot', label: 'AI Chatbot', icon: <Bot size={18} /> },
    { id: 'conversations', label: 'Chats', icon: <MessageSquare size={18} /> },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: <MessageCircle size={18} />,
      badge: (whatsappContacts || []).filter((c) => c.status === 'needs_human').length || null
    },
    { id: 'serviceAreas', label: 'Locations', icon: <MapPin size={18} /> },
    { id: 'design', label: 'Design & Motion', icon: <SlidersHorizontal size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> }
  ];


  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg-canvas)',
        color: 'var(--text-main)',
        position: 'relative'
      }}
    >
      {/* Toast Notification Banner */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            background: toast.type === 'error' ? '#ef4444' : '#12a150',
            color: '#ffffff',
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontWeight: 600,
            fontSize: '0.92rem',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <CheckCircle2 size={18} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '420px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ef4444', marginBottom: '1rem' }}>
              <AlertCircle size={24} />
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{confirmModal.title}</h3>
            </div>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-body)', lineHeight: 1.5, marginBottom: '1.75rem' }}>
              {confirmModal.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                style={{ padding: '0.5rem 1rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                onClick={confirmModal.onConfirm}
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.5rem 1.25rem',
                  fontWeight: 600
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* DESKTOP SIDEBAR (Visible >= 768px) */}
      {/* ------------------------------------------------------------- */}
      <aside
        className="admin-sidebar"
        style={{
          width: '240px',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-glass)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 50
        }}
      >
        <div>
          {/* Brand header */}
          <div
            style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0b1b4a 0%, #1d5cf0 100%)',
                color: '#ffe500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.1rem'
              }}
            >
              Z
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', lineHeight: 1.1 }}>
                Zippy<span style={{ color: '#1d5cf0' }}>Admin</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: isLiveConnected ? '#12a150' : '#eab308', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isLiveConnected ? '#12a150' : '#eab308' }} />
                {isLiveConnected ? 'Live Hostinger API' : 'Local Fallback'}
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.7rem 0.9rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: active ? 'rgba(29, 92, 240, 0.12)' : 'transparent',
                    color: active ? '#1d5cf0' : 'var(--text-body)',
                    fontWeight: active ? 700 : 500,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      style={{
                        background: '#ffe500',
                        color: '#0b1b4a',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '12px'
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--text-dim)',
              fontSize: '0.85rem',
              textDecoration: 'none',
              padding: '0.4rem 0.5rem'
            }}
          >
            <Eye size={15} />
            <span>View Public Site</span>
          </Link>
          <button
            onClick={logout}
            className="btn btn-outline"
            style={{
              width: '100%',
              padding: '0.55rem',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              color: '#ef4444',
              borderColor: 'rgba(239, 68, 68, 0.3)'
            }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTENT AREA */}
      {/* ------------------------------------------------------------- */}
      <main
        style={{
          flex: 1,
          padding: '1.75rem 1.5rem 5rem 1.5rem',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          overflowX: 'hidden'
        }}
      >
        {/* Mobile Header Bar */}
        <div className="mobile-admin-header" style={{ display: 'none', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0b1b4a 0%, #1d5cf0 100%)',
                color: '#ffe500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.95rem'
              }}
            >
              Z
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>
              Zippy<span style={{ color: '#1d5cf0' }}>Admin</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link to="/" style={{ color: 'var(--text-body)', textDecoration: 'none', fontSize: '0.82rem' }}>
              Site
            </Link>
            <button
              onClick={logout}
              className="btn btn-outline"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: '#ef4444' }}
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: DASHBOARD */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, marginBottom: '0.4rem' }}>
                Admin Dashboard
              </h1>
              <p style={{ color: 'var(--text-body)', fontSize: '0.95rem' }}>
                Welcome back, Lingaswamy. Here is an overview of your active services, portfolio, and customer enquiries.
              </p>
            </div>

            {/* Metric Cards Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.25rem',
                marginBottom: '2.5rem'
              }}
            >
              {/* New Enquiries Card */}
              <div
                className="card"
                onClick={() => { setActiveTab('enquiries'); setStatusFilter('New'); }}
                style={{
                  padding: '1.5rem',
                  cursor: 'pointer',
                  borderColor: newEnquiriesCount > 0 ? '#ffe500' : 'var(--border-glass)',
                  background: newEnquiriesCount > 0 ? 'rgba(255, 229, 0, 0.08)' : 'var(--bg-card)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                    NEW ENQUIRIES
                  </span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255, 229, 0, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Inbox size={18} color="#ffe500" />
                  </div>
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: newEnquiriesCount > 0 ? '#ffe500' : 'var(--text-main)' }}>
                  {newEnquiriesCount}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
                  {newEnquiriesCount > 0 ? 'Requires follow-up on WhatsApp' : 'All caught up!'}
                </div>
              </div>

              {/* Overdue Enquiries Card (> 24h) */}
              <div
                className="card"
                onClick={() => { setActiveTab('enquiries'); setStatusFilter('Overdue'); }}
                style={{
                  padding: '1.5rem',
                  cursor: 'pointer',
                  borderColor: overdueEnquiriesCount > 0 ? '#ef4444' : 'var(--border-glass)',
                  background: overdueEnquiriesCount > 0 ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-card)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: overdueEnquiriesCount > 0 ? '#ef4444' : 'var(--text-dim)', fontWeight: 700 }}>
                    OVERDUE (&gt; 24H)
                  </span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: overdueEnquiriesCount > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertCircle size={18} color={overdueEnquiriesCount > 0 ? '#ef4444' : 'var(--text-dim)'} />
                  </div>
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: overdueEnquiriesCount > 0 ? '#ef4444' : 'var(--text-main)' }}>
                  {overdueEnquiriesCount}
                </div>
                <div style={{ fontSize: '0.8rem', color: overdueEnquiriesCount > 0 ? '#ef4444' : 'var(--text-dim)', marginTop: '0.35rem', fontWeight: overdueEnquiriesCount > 0 ? 600 : 400 }}>
                  {overdueEnquiriesCount > 0 ? 'Exceeded 24-hr commitment!' : 'All enquiries on track'}
                </div>
              </div>

              {/* Total Projects Card */}
              <div
                className="card"
                onClick={() => setActiveTab('portfolio')}
                style={{ padding: '1.5rem', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                    PORTFOLIO PROJECTS
                  </span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(29, 92, 240, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Briefcase size={18} color="#1d5cf0" />
                  </div>
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1d5cf0' }}>
                  {totalProjectsCount}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
                  Live showcase items
                </div>
              </div>

              {/* Total Services Card */}
              <div
                className="card"
                onClick={() => setActiveTab('services')}
                style={{ padding: '1.5rem', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                    ACTIVE SERVICES
                  </span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(122, 47, 208, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={18} color="#7a2fd0" />
                  </div>
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#7a2fd0' }}>
                  {totalServicesCount}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
                  Across Web, App &amp; AI
                </div>
              </div>

              {/* Total Enquiries Lifetime */}
              <div
                className="card"
                onClick={() => setActiveTab('enquiries')}
                style={{ padding: '1.5rem', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                    TOTAL LEADS
                  </span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(18, 161, 80, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Phone size={18} color="#12a150" />
                  </div>
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#12a150' }}>
                  {totalEnquiriesCount}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
                  Enquiries received to date
                </div>
              </div>

              {/* Total Packages */}
              <div
                className="card"
                onClick={() => setActiveTab('packages')}
                style={{ padding: '1.5rem', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                    PRICING PACKAGES
                  </span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255, 229, 0, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PackageCheck size={18} color="#ffe500" />
                  </div>
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {(packagesData || []).length}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
                  Web, App &amp; AI packages
                </div>
              </div>

              {/* Total Testimonials */}
              <div
                className="card"
                onClick={() => setActiveTab('testimonials')}
                style={{ padding: '1.5rem', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                    CLIENT REVIEWS
                  </span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255, 229, 0, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Star size={18} color="#ffe500" />
                  </div>
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {(testimonialsData || []).length}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
                  5-star verified ratings
                </div>
              </div>

              {/* Total FAQs */}
              <div
                className="card"
                onClick={() => setActiveTab('faqs')}
                style={{ padding: '1.5rem', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                    FAQS ANSWERED
                  </span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(29, 92, 240, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HelpCircle size={18} color="#1d5cf0" />
                  </div>
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1d5cf0' }}>
                  {(faqsData || []).length}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
                  Pre-sales trust questions
                </div>
              </div>
            </div>

            {/* Quick Domain Starting Prices Bar */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700 }}>
                  Current Starting Prices by Domain
                </h3>
                <button
                  onClick={() => setActiveTab('services')}
                  className="btn btn-outline"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
                >
                  Edit in Services →
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {servicesData.map((d) => (
                  <div
                    key={d.slug}
                    style={{
                      padding: '1rem',
                      borderRadius: '8px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.badgeColor }} />
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{d.domainLabel}</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: d.badgeColor }}>
                        {d.startingPrice}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Enquiries Preview (Last 5) */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700 }}>
                  Last 5 Customer Enquiries
                </h3>
                <button
                  onClick={() => setActiveTab('enquiries')}
                  className="btn btn-outline"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
                >
                  View All Enquiries ({totalEnquiriesCount}) →
                </button>
              </div>

              {enquiries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-dim)' }}>
                  No customer enquiries yet. Submissions through your website contact form will appear here.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {enquiries.slice(0, 5).map((enq) => (
                    <div
                      key={enq.id}
                      style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.98rem' }}>{enq.name}</span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontWeight: 700,
                              background:
                                enq.status === 'New'
                                  ? 'rgba(255, 229, 0, 0.2)'
                                  : enq.status === 'Contacted'
                                  ? 'rgba(29, 92, 240, 0.2)'
                                  : 'rgba(148, 163, 184, 0.2)',
                              color:
                                enq.status === 'New'
                                  ? '#ffe500'
                                  : enq.status === 'Contacted'
                                  ? '#1d5cf0'
                                  : '#94a3b8'
                            }}
                          >
                            {enq.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-body)', marginTop: '0.2rem' }}>
                          {enq.service} • {enq.phone}
                        </div>
                      </div>

                      {/* Direct Call & WhatsApp Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <a
                          href={`tel:${enq.phone}`}
                          className="btn btn-outline"
                          style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <Phone size={14} color="#12a150" />
                          <span>Call</span>
                        </a>
                        <a
                          href={`https://wa.me/91${enq.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(enq.name)}%2C%20Lingaswamy%20from%20ZippyTechSystems%20here.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn"
                          style={{
                            background: '#12a150',
                            color: '#ffffff',
                            padding: '0.45rem 0.85rem',
                            fontSize: '0.82rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            border: 'none',
                            textDecoration: 'none'
                          }}
                        >
                          <MessageCircle size={14} />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB: PRICES MANAGEMENT (LIVE SUPABASE REALTIME AUTO-UPDATE) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'prices' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                  <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, margin: 0 }}>
                    Live Pricing Control
                  </h1>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '12px',
                      background: isLiveConnected ? 'rgba(18, 161, 80, 0.15)' : 'rgba(255, 229, 0, 0.2)',
                      color: isLiveConnected ? '#12a150' : '#ffe500',
                      border: isLiveConnected ? '1px solid rgba(18, 161, 80, 0.3)' : '1px solid rgba(255, 229, 0, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: isLiveConnected ? '#12a150' : '#ffe500' }} />
                    {isLiveConnected ? 'Realtime Auto-Update Active' : 'Fallback Mode'}
                  </span>
                </div>
                <p style={{ color: 'var(--text-body)', fontSize: '0.95rem', margin: 0 }}>
                  Any price saved here updates instantly on the live website (headers, packages, FAQs &amp; WhatsApp greetings) with zero code changes or redeploy.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Link
                  to="/#pricing"
                  target="_blank"
                  className="btn btn-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.88rem' }}
                >
                  <ExternalLink size={15} />
                  <span>View on Website</span>
                </Link>

                <button
                  type="button"
                  onClick={handleSaveAllPrices}
                  disabled={pricesSaving}
                  className="btn btn-cta-yellow"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.92rem', padding: '0.65rem 1.25rem' }}
                >
                  <Save size={16} />
                  <span>{pricesSaving ? 'Saving All...' : 'Save All Prices'}</span>
                </button>
              </div>
            </div>

            {pricesSuccessLink && (
              <div
                style={{
                  background: 'rgba(18, 161, 80, 0.12)',
                  border: '1px solid rgba(18, 161, 80, 0.3)',
                  padding: '1rem 1.25rem',
                  borderRadius: '10px',
                  marginBottom: '1.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#12a150', fontWeight: 600 }}>
                  <CheckCircle2 size={18} />
                  <span>Prices updated and saved to Hostinger MySQL! Live website in sync.</span>
                </div>
                <Link
                  to="/"
                  target="_blank"
                  style={{
                    color: '#12a150',
                    fontWeight: 700,
                    textDecoration: 'underline',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <span>Open Live Website</span>
                  <ExternalLink size={14} />
                </Link>
              </div>
            )}

            {/* DOMAIN STARTING PRICES */}
            <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.35rem 0' }}>
                  1. Domain Starting Prices
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-dim)', margin: 0 }}>
                  These prices appear in the hero section, domain banners, and prefilled quote messages.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {domainsData.map((dom) => {
                  const currentValue = domainPriceInputs[dom.key] !== undefined ? domainPriceInputs[dom.key] : dom.starting_price;
                  return (
                    <div
                      key={dom.key}
                      style={{
                        padding: '1.25rem',
                        borderRadius: '10px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: dom.color
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                            {dom.name}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                            {dom.price_label || 'Starting from'} • Live value: <strong style={{ color: dom.color }}>{formatINR(dom.starting_price)}</strong>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dim)' }}>₹</span>
                          <input
                            type="number"
                            min="0"
                            step="500"
                            className="form-input"
                            style={{ width: '130px', padding: '0.45rem 0.65rem', fontWeight: 700, fontSize: '0.95rem' }}
                            value={currentValue}
                            onChange={(e) =>
                              setDomainPriceInputs((prev) => ({
                                ...prev,
                                [dom.key]: e.target.value
                              }))
                            }
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSaveDomainPrice(dom.key, dom.name)}
                          className="btn btn-outline"
                          style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}
                        >
                          <Save size={14} />
                          <span>Save</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PACKAGE PRICES */}
            <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.35rem 0' }}>
                  2. Pricing Packages
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-dim)', margin: 0 }}>
                  Package prices for Starter, Growth, and Custom tiers across all service domains.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {packagesData.map((pkg) => {
                  const currentValue = packagePriceInputs[pkg.id] !== undefined ? packagePriceInputs[pkg.id] : pkg.price;
                  const domObj = domainsData.find((d) => d.key === pkg.domain_id);
                  const color = domObj ? domObj.color : '#1d5cf0';

                  return (
                    <div
                      key={pkg.id}
                      style={{
                        padding: '1.25rem',
                        borderRadius: '10px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: '8px',
                              background: `${color}20`,
                              color: color
                            }}
                          >
                            {pkg.domain_id}
                          </span>
                          {pkg.is_popular && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                background: '#ffe500',
                                color: '#0b1b4a',
                                padding: '2px 7px',
                                borderRadius: '6px'
                              }}
                            >
                              POPULAR
                            </span>
                          )}
                        </div>

                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>
                          {pkg.name}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                          Live on site: <strong>{formatINR(pkg.price)}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dim)' }}>₹</span>
                        <input
                          type="number"
                          min="0"
                          step="500"
                          className="form-input"
                          style={{ flex: 1, padding: '0.45rem 0.65rem', fontWeight: 700, fontSize: '0.95rem' }}
                          value={currentValue}
                          onChange={(e) =>
                            setPackagePriceInputs((prev) => ({
                              ...prev,
                              [pkg.id]: e.target.value
                            }))
                          }
                        />
                        <button
                          type="button"
                          onClick={() => handleSavePackagePrice(pkg)}
                          className="btn btn-outline"
                          style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}
                        >
                          <Save size={13} />
                          <span>Save</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PRICE HISTORY AUDIT LOG */}
            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                <History size={20} color="#1d5cf0" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  Price Change History Log
                </h3>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-dim)', marginBottom: '1.25rem' }}>
                Automated database triggers record every price revision for audit and transparency.
              </p>

              {priceHistory && priceHistory.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-dim)' }}>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Item</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Previous Price</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>New Price</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Difference</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Changed At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {priceHistory.map((ph, idx) => {
                        const diff = Number(ph.new_price) - Number(ph.old_price);
                        const isIncrease = diff > 0;
                        return (
                          <tr key={ph.id || idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
                              {ph.item_name}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-dim)' }}>
                              {formatINR(ph.old_price)}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: '#1d5cf0' }}>
                              {formatINR(ph.new_price)}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              <span
                                style={{
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  color: isIncrease ? '#ef4444' : '#12a150',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.2rem'
                                }}
                              >
                                {isIncrease ? '+' : ''}{formatINR(diff)}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                              {new Date(ph.changed_at).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                  No price revisions recorded yet. Once you modify and save a price, the audit entry will appear here.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: SERVICES MANAGEMENT */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'services' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, marginBottom: '0.35rem' }}>
                  Services &amp; Pricing
                </h1>
                <p style={{ color: 'var(--text-body)', fontSize: '0.95rem' }}>
                  Manage domains, starting prices, main services, and additional services.
                </p>
              </div>
            </div>

            {/* Domain Selector Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {servicesData.map((d) => {
                const isSelected = selectedDomain === d.slug;
                return (
                  <button
                    key={d.slug}
                    onClick={() => {
                      setSelectedDomain(d.slug);
                      setEditingPrice(false);
                    }}
                    style={{
                      padding: '0.65rem 1.25rem',
                      borderRadius: '8px',
                      border: isSelected ? `2px solid ${d.badgeColor}` : '1px solid var(--border-subtle)',
                      background: isSelected ? 'var(--bg-surface)' : 'transparent',
                      color: isSelected ? d.badgeColor : 'var(--text-body)',
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.badgeColor }} />
                    <span>{d.domainLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Starting Price Editor Card */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', borderColor: currentDomainData.badgeColor }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                    STARTING PRICE FOR {currentDomainData.domainLabel?.toUpperCase()}
                  </div>
                  {!editingPrice ? (
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: currentDomainData.badgeColor, marginTop: '0.25rem' }}>
                      {currentDomainData.startingPrice}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={priceInput}
                        onChange={(e) => setPriceInput(e.target.value)}
                        placeholder="e.g. ₹7,000"
                        style={{ width: '160px', padding: '0.45rem 0.75rem' }}
                      />
                      <button
                        onClick={handleSavePrice}
                        className="btn btn-cta-yellow"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingPrice(false)}
                        className="btn btn-outline"
                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {!editingPrice && (
                  <button
                    onClick={() => {
                      setPriceInput(currentDomainData.startingPrice || '');
                      setEditingPrice(true);
                    }}
                    className="btn btn-outline"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Edit2 size={14} />
                    <span>Edit Starting Price</span>
                  </button>
                )}
              </div>
            </div>

            {/* Main Services Block */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                    Our Main Services ({currentDomainData.mainServices?.length || 0})
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                    Prominently displayed with icons and detailed cards on the public website.
                  </div>
                </div>
                <button
                  onClick={() => handleOpenAddService('main')}
                  className="btn btn-outline"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Plus size={15} />
                  <span>Add Main Service</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(currentDomainData.mainServices || []).map((s, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '1rem',
                      borderRadius: '8px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>{s.title}</div>
                      {s.desc && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-body)', marginTop: '0.2rem' }}>
                          {s.desc}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {/* Reorder Up */}
                      <button
                        title="Move Up"
                        disabled={idx === 0}
                        onClick={() => reorderServiceItems(selectedDomain, 'main', idx, 'up')}
                        className="btn btn-outline"
                        style={{ padding: '0.35rem', opacity: idx === 0 ? 0.3 : 1 }}
                      >
                        <ArrowUp size={14} />
                      </button>
                      {/* Reorder Down */}
                      <button
                        title="Move Down"
                        disabled={idx === currentDomainData.mainServices.length - 1}
                        onClick={() => reorderServiceItems(selectedDomain, 'main', idx, 'down')}
                        className="btn btn-outline"
                        style={{ padding: '0.35rem', opacity: idx === currentDomainData.mainServices.length - 1 ? 0.3 : 1 }}
                      >
                        <ArrowDown size={14} />
                      </button>
                      {/* Edit */}
                      <button
                        title="Edit"
                        onClick={() => handleOpenEditService('main', idx, s)}
                        className="btn btn-outline"
                        style={{ padding: '0.35rem 0.55rem' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      {/* Delete */}
                      <button
                        title="Delete"
                        onClick={() => handleDeleteService('main', idx, s.title)}
                        className="btn btn-outline"
                        style={{ padding: '0.35rem 0.55rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* More Services Block */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                    More Services We Provide ({currentDomainData.moreServices?.length || 0})
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                    Compact checklist items shown in the quieter block below main services.
                  </div>
                </div>
                <button
                  onClick={() => handleOpenAddService('more')}
                  className="btn btn-outline"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Plus size={15} />
                  <span>Add More Service</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {(currentDomainData.moreServices || []).map((title, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    <span style={{ fontSize: '0.92rem', fontWeight: 500 }}>{title}</span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button
                        title="Move Up"
                        disabled={idx === 0}
                        onClick={() => reorderServiceItems(selectedDomain, 'more', idx, 'up')}
                        className="btn btn-outline"
                        style={{ padding: '0.3rem', opacity: idx === 0 ? 0.3 : 1 }}
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        title="Move Down"
                        disabled={idx === currentDomainData.moreServices.length - 1}
                        onClick={() => reorderServiceItems(selectedDomain, 'more', idx, 'down')}
                        className="btn btn-outline"
                        style={{ padding: '0.3rem', opacity: idx === currentDomainData.moreServices.length - 1 ? 0.3 : 1 }}
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        title="Edit"
                        onClick={() => handleOpenEditService('more', idx, title)}
                        className="btn btn-outline"
                        style={{ padding: '0.3rem 0.5rem' }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => handleDeleteService('more', idx, title)}
                        className="btn btn-outline"
                        style={{ padding: '0.3rem 0.5rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Service Modal (Add / Edit) */}
            {serviceModal.isOpen && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 9999,
                  background: 'rgba(0,0,0,0.7)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1rem'
                }}
              >
                <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                      {serviceModal.mode === 'add' ? 'Add Service' : 'Edit Service'}
                    </h3>
                    <button
                      onClick={() => setServiceModal((prev) => ({ ...prev, isOpen: false }))}
                      style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleSaveServiceModal}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label className="form-label">Service Type</label>
                      <select
                        className="form-input"
                        value={serviceModal.type}
                        onChange={(e) => setServiceModal((prev) => ({ ...prev, type: e.target.value }))}
                      >
                        <option value="main">Main Service (Feature Box)</option>
                        <option value="more">More Service (Compact List Item)</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label className="form-label">Service Title / Name *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="e.g. GST Billing & Invoice POS App"
                        value={serviceModal.title}
                        onChange={(e) => setServiceModal((prev) => ({ ...prev, title: e.target.value }))}
                      />
                    </div>

                    {serviceModal.type === 'main' && (
                      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label">Short Description</label>
                        <textarea
                          rows={3}
                          className="form-input"
                          placeholder="Brief summary of what this service delivers..."
                          value={serviceModal.desc}
                          onChange={(e) => setServiceModal((prev) => ({ ...prev, desc: e.target.value }))}
                        />
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setServiceModal((prev) => ({ ...prev, isOpen: false }))}
                        className="btn btn-outline"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-cta-yellow">
                        {serviceModal.mode === 'add' ? 'Save Service' : 'Update Service'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: PORTFOLIO MANAGEMENT */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'portfolio' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, marginBottom: '0.35rem' }}>
                  Portfolio Projects ({projectsData.length})
                </h1>
                <p style={{ color: 'var(--text-body)', fontSize: '0.95rem' }}>
                  Add, edit, and manage projects displayed in your client portfolio.
                </p>
              </div>

              <button
                onClick={() =>
                  setProjectModal({
                    isOpen: true,
                    mode: 'add',
                    id: null,
                    title: '',
                    domain: 'web',
                    clientCategory: 'Retail POS & Business',
                    shortDescription: '',
                    technologies: 'React, Node.js, Cloud',
                    metrics: '',
                    image: '/projects/saree-app.svg',
                    imageFile: null
                  })
                }
                className="btn btn-cta-yellow"
                style={{ padding: '0.65rem 1.25rem', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Plus size={16} />
                <span>Add New Project</span>
              </button>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Projects' },
                { id: 'web', label: 'Web Development' },
                { id: 'app', label: 'App Development' },
                { id: 'ai', label: 'AI Automation' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setPortfolioFilter(tab.id)}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: 'var(--radius-full)',
                    border: portfolioFilter === tab.id ? '1px solid #1d5cf0' : '1px solid var(--border-subtle)',
                    background: portfolioFilter === tab.id ? 'rgba(29,92,240,0.15)' : 'transparent',
                    color: portfolioFilter === tab.id ? '#1d5cf0' : 'var(--text-body)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Projects Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {filteredProjects.map((p) => (
                <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  {/* Thumbnail */}
                  <div style={{ height: '170px', background: 'var(--bg-canvas)', position: 'relative', overflow: 'hidden' }}>
                    <img
                      src={p.image}
                      alt={p.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.src = '/projects/clinic-web.svg'; }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(0,0,0,0.7)',
                        color: p.domainColor || '#ffe500'
                      }}
                    >
                      {p.domainLabel}
                    </span>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
                        {p.clientCategory}
                      </div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        {p.title}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                        {p.shortDescription}
                      </p>

                      {p.metrics && (
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#12a150', marginBottom: '0.75rem' }}>
                          ✓ {p.metrics}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                      <button
                        onClick={() =>
                          setProjectModal({
                            isOpen: true,
                            mode: 'edit',
                            id: p.id,
                            title: p.title,
                            domain: p.domain,
                            clientCategory: p.clientCategory || '',
                            shortDescription: p.shortDescription || '',
                            technologies: Array.isArray(p.technologies) ? p.technologies.join(', ') : '',
                            metrics: p.metrics || '',
                            image: p.image || '/projects/clinic-web.svg',
                            imageFile: null
                          })
                        }
                        className="btn btn-outline"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Edit2 size={13} />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteProject(p.id, p.title)}
                        className="btn btn-outline"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Project Add / Edit Modal */}
            {projectModal.isOpen && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 9999,
                  background: 'rgba(0,0,0,0.7)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1rem'
                }}
              >
                <div
                  className="card"
                  style={{
                    maxWidth: '560px',
                    width: '100%',
                    padding: '2rem',
                    maxHeight: '90vh',
                    overflowY: 'auto'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>
                      {projectModal.mode === 'add' ? 'Add Portfolio Project' : 'Edit Project'}
                    </h3>
                    <button
                      onClick={() => setProjectModal((prev) => ({ ...prev, isOpen: false }))}
                      style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleSaveProjectModal}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label className="form-label">Project Title *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="e.g. Retail POS & Inventory Billing App"
                        value={projectModal.title}
                        onChange={(e) => setProjectModal((prev) => ({ ...prev, title: e.target.value }))}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Domain *</label>
                        <select
                          className="form-input"
                          value={projectModal.domain}
                          onChange={(e) => setProjectModal((prev) => ({ ...prev, domain: e.target.value }))}
                        >
                          <option value="web">Web Development</option>
                          <option value="app">App Development</option>
                          <option value="ai">AI Automation</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Client Category</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Supermarket, Clinic"
                          value={projectModal.clientCategory}
                          onChange={(e) => setProjectModal((prev) => ({ ...prev, clientCategory: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label className="form-label">Short Description *</label>
                      <textarea
                        rows={2}
                        required
                        className="form-input"
                        placeholder="Explain what the system does for the client..."
                        value={projectModal.shortDescription}
                        onChange={(e) => setProjectModal((prev) => ({ ...prev, shortDescription: e.target.value }))}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Key Metric / Result</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Saved ₹35,000/mo"
                          value={projectModal.metrics}
                          onChange={(e) => setProjectModal((prev) => ({ ...prev, metrics: e.target.value }))}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Technologies (comma separated)</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="React, Flutter, PostgreSQL"
                          value={projectModal.technologies}
                          onChange={(e) => setProjectModal((prev) => ({ ...prev, technologies: e.target.value }))}
                        />
                      </div>
                    </div>

                    {/* Image Upload / URL */}
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label className="form-label">Project Image / Screenshot</label>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ width: '80px', height: '60px', borderRadius: '6px', overflow: 'hidden', background: '#0b1b4a' }}>
                          <img
                            src={projectModal.image}
                            alt="Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.target.src = '/projects/clinic-web.svg'; }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label
                            className="btn btn-outline"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              padding: '0.45rem 0.85rem',
                              fontSize: '0.82rem',
                              cursor: 'pointer'
                            }}
                          >
                            <Upload size={14} />
                            <span>{isUploadingImage ? 'Uploading...' : 'Upload Image File'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={handleImageFileChange}
                              disabled={isUploadingImage}
                            />
                          </label>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                            Uploads securely to Hostinger /uploads/ directory
                          </div>
                        </div>
                      </div>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Or enter image URL path (e.g. /projects/saree-app.svg)"
                        value={projectModal.image}
                        onChange={(e) => setProjectModal((prev) => ({ ...prev, image: e.target.value }))}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => setProjectModal((prev) => ({ ...prev, isOpen: false }))}
                        className="btn btn-outline"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-cta-yellow">
                        {projectModal.mode === 'add' ? 'Save Project' : 'Update Project'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB: PACKAGES */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'packages' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, marginBottom: '0.35rem' }}>
                  Transparent Packages ({(packagesData || []).length})
                </h1>
                <p style={{ color: 'var(--text-body)', fontSize: '0.95rem' }}>
                  Manage clear budget packages across Web Development, Mobile Apps, and AI Automation.
                </p>
              </div>

              <button
                onClick={() =>
                  setPackageModal({
                    isOpen: true,
                    mode: 'add',
                    id: null,
                    domain: 'web',
                    name: '',
                    price: '₹9,999',
                    tagline: '',
                    deliverables: '',
                    popular: false
                  })
                }
                className="btn btn-cta-yellow"
                style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <Plus size={16} />
                <span>Add Package</span>
              </button>
            </div>

            {/* Domain Filter Pills */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Packages' },
                { id: 'web', label: 'Web Development' },
                { id: 'app', label: 'App Development' },
                { id: 'ai', label: 'AI Automation' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setPackageDomainFilter(f.id)}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: 'var(--radius-full)',
                    border: packageDomainFilter === f.id ? '1px solid #1d5cf0' : '1px solid var(--border-subtle)',
                    background: packageDomainFilter === f.id ? 'rgba(29, 92, 240, 0.15)' : 'transparent',
                    color: packageDomainFilter === f.id ? '#1d5cf0' : 'var(--text-body)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Packages Grid */}
            {(packagesData || []).filter(p => packageDomainFilter === 'all' || p.domain === packageDomainFilter).length === 0 ? (
              <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                No packages found in this category.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '1.5rem'
                }}
              >
                {(packagesData || [])
                  .filter((p) => packageDomainFilter === 'all' || p.domain === packageDomainFilter)
                  .map((pkg) => {
                    const domainColor =
                      pkg.domain === 'app'
                        ? '#12a150'
                        : pkg.domain === 'ai'
                        ? '#7a2fd0'
                        : '#1d5cf0';

                    return (
                      <div
                        key={pkg.id}
                        className="card"
                        style={{
                          padding: '1.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          borderTop: `4px solid ${domainColor}`,
                          position: 'relative'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                background: `${domainColor}20`,
                                color: domainColor
                              }}
                            >
                              {pkg.domain === 'app' ? 'Mobile App' : pkg.domain === 'ai' ? 'AI System' : 'Web Platform'}
                            </span>
                            {pkg.popular && (
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  background: '#ffe500',
                                  color: '#0b1b4a',
                                  padding: '2px 8px',
                                  borderRadius: '12px'
                                }}
                              >
                                ★ Most Popular
                              </span>
                            )}
                          </div>

                          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                            {pkg.name}
                          </h3>
                          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: domainColor, marginBottom: '0.5rem' }}>
                            {pkg.price}
                          </div>
                          {pkg.tagline && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '1rem', fontStyle: 'italic' }}>
                              {pkg.tagline}
                            </p>
                          )}

                          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem', marginBottom: '1.25rem' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                              Included Deliverables:
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              {(pkg.deliverables || []).map((del, dIdx) => (
                                <li key={dIdx} style={{ fontSize: '0.82rem', color: 'var(--text-body)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                  <span style={{ color: domainColor, fontWeight: 'bold' }}>✓</span>
                                  <span>{del}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                          <button
                            onClick={() =>
                              setPackageModal({
                                isOpen: true,
                                mode: 'edit',
                                id: pkg.id,
                                domain: pkg.domain,
                                name: pkg.name,
                                price: pkg.price,
                                tagline: pkg.tagline || '',
                                deliverables: (pkg.deliverables || []).join('\n'),
                                popular: Boolean(pkg.popular)
                              })
                            }
                            className="btn btn-outline"
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            <Edit2 size={13} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                            className="btn btn-outline"
                            style={{ padding: '0.4rem 0.65rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                            title="Delete Package"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Package Edit/Add Modal */}
            {packageModal.isOpen && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 9998,
                  background: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1rem'
                }}
              >
                <div
                  className="card"
                  style={{
                    maxWidth: '520px',
                    width: '100%',
                    padding: '2rem',
                    maxHeight: '90vh',
                    overflowY: 'auto'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>
                      {packageModal.mode === 'add' ? 'Add Transparent Package' : 'Edit Package'}
                    </h3>
                    <button
                      onClick={() => setPackageModal((prev) => ({ ...prev, isOpen: false }))}
                      style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleSavePackageModal}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Domain *</label>
                        <select
                          className="form-input"
                          value={packageModal.domain}
                          onChange={(e) => setPackageModal((prev) => ({ ...prev, domain: e.target.value }))}
                        >
                          <option value="web">Web Development</option>
                          <option value="app">App Development</option>
                          <option value="ai">AI Automation</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Price Display *</label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          placeholder="e.g. ₹9,999 or ₹29,999"
                          value={packageModal.price}
                          onChange={(e) => setPackageModal((prev) => ({ ...prev, price: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label className="form-label">Package Name *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="e.g. Business Pro Web or Cross-Platform Mobile"
                        value={packageModal.name}
                        onChange={(e) => setPackageModal((prev) => ({ ...prev, name: e.target.value }))}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label className="form-label">Tagline / Short Summary</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. For shops & clinics needing online bookings"
                        value={packageModal.tagline}
                        onChange={(e) => setPackageModal((prev) => ({ ...prev, tagline: e.target.value }))}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label className="form-label">Deliverables (one per line) *</label>
                      <textarea
                        rows={4}
                        required
                        className="form-input"
                        placeholder={"Up to 7 Custom Pages\n100% Mobile Responsive\nWhatsApp Click-to-Chat\nAdmin Lead Management"}
                        value={packageModal.deliverables}
                        onChange={(e) => setPackageModal((prev) => ({ ...prev, deliverables: e.target.value }))}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                      <input
                        type="checkbox"
                        id="package-popular"
                        checked={packageModal.popular}
                        onChange={(e) => setPackageModal((prev) => ({ ...prev, popular: e.target.checked }))}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <label htmlFor="package-popular" style={{ fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600 }}>
                        Mark as "Most Popular" / Recommended Tier
                      </label>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => setPackageModal((prev) => ({ ...prev, isOpen: false }))}
                        className="btn btn-outline"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-cta-yellow">
                        {packageModal.mode === 'add' ? 'Save Package' : 'Update Package'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB: TESTIMONIALS / REVIEWS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'testimonials' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, marginBottom: '0.35rem' }}>
                  Client Reviews &amp; Testimonials ({(testimonialsData || []).length})
                </h1>
                <p style={{ color: 'var(--text-body)', fontSize: '0.95rem' }}>
                  Verified feedback and ratings from business owners who built with ZippyTechSystems.
                </p>
              </div>

              <button
                onClick={() =>
                  setTestimonialModal({
                    isOpen: true,
                    mode: 'add',
                    id: null,
                    clientName: '',
                    roleOrCompany: '',
                    domain: 'web',
                    rating: 5,
                    content: ''
                  })
                }
                className="btn btn-cta-yellow"
                style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <Plus size={16} />
                <span>Add Review</span>
              </button>
            </div>

            {/* Testimonials Filter */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Domains' },
                { id: 'web', label: 'Web' },
                { id: 'app', label: 'App' },
                { id: 'ai', label: 'AI' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setTestimonialDomainFilter(f.id)}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: 'var(--radius-full)',
                    border: testimonialDomainFilter === f.id ? '1px solid #1d5cf0' : '1px solid var(--border-subtle)',
                    background: testimonialDomainFilter === f.id ? 'rgba(29, 92, 240, 0.15)' : 'transparent',
                    color: testimonialDomainFilter === f.id ? '#1d5cf0' : 'var(--text-body)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Testimonials Grid */}
            {(testimonialsData || []).filter(t => testimonialDomainFilter === 'all' || t.domain === testimonialDomainFilter).length === 0 ? (
              <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                No reviews found in this category.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1.5rem'
                }}
              >
                {(testimonialsData || [])
                  .filter((t) => testimonialDomainFilter === 'all' || t.domain === testimonialDomainFilter)
                  .map((rev) => {
                    const domainColor =
                      rev.domain === 'app'
                        ? '#12a150'
                        : rev.domain === 'ai'
                        ? '#7a2fd0'
                        : '#1d5cf0';

                    return (
                      <div
                        key={rev.id}
                        className="card"
                        style={{
                          padding: '1.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          borderLeft: `4px solid ${domainColor}`
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', gap: '2px', color: '#ffe500' }}>
                              {[...Array(rev.rating || 5)].map((_, i) => (
                                <Star key={i} size={15} fill="#ffe500" />
                              ))}
                            </div>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                background: `${domainColor}20`,
                                color: domainColor
                              }}
                            >
                              {rev.domain}
                            </span>
                          </div>

                          <p style={{ fontSize: '0.9rem', color: 'var(--text-body)', lineHeight: 1.5, marginBottom: '1rem', fontStyle: 'italic' }}>
                            "{rev.content}"
                          </p>

                          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                              {rev.clientName}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                              {rev.roleOrCompany}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                          <button
                            onClick={() =>
                              setTestimonialModal({
                                isOpen: true,
                                mode: 'edit',
                                id: rev.id,
                                clientName: rev.clientName,
                                roleOrCompany: rev.roleOrCompany,
                                domain: rev.domain,
                                rating: rev.rating || 5,
                                content: rev.content
                              })
                            }
                            className="btn btn-outline"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            <Edit2 size={13} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteTestimonial(rev.id, rev.clientName)}
                            className="btn btn-outline"
                            style={{ padding: '0.35rem 0.65rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                            title="Delete Review"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Testimonial Edit/Add Modal */}
            {testimonialModal.isOpen && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 9998,
                  background: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1rem'
                }}
              >
                <div
                  className="card"
                  style={{
                    maxWidth: '480px',
                    width: '100%',
                    padding: '2rem',
                    maxHeight: '90vh',
                    overflowY: 'auto'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>
                      {testimonialModal.mode === 'add' ? 'Add Client Review' : 'Edit Review'}
                    </h3>
                    <button
                      onClick={() => setTestimonialModal((prev) => ({ ...prev, isOpen: false }))}
                      style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleSaveTestimonialModal}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Client Name *</label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          placeholder="e.g. Dr. K. Rao"
                          value={testimonialModal.clientName}
                          onChange={(e) => setTestimonialModal((prev) => ({ ...prev, clientName: e.target.value }))}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Role or Company</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Founder, CareClinic"
                          value={testimonialModal.roleOrCompany}
                          onChange={(e) => setTestimonialModal((prev) => ({ ...prev, roleOrCompany: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Domain *</label>
                        <select
                          className="form-input"
                          value={testimonialModal.domain}
                          onChange={(e) => setTestimonialModal((prev) => ({ ...prev, domain: e.target.value }))}
                        >
                          <option value="web">Web Development</option>
                          <option value="app">App Development</option>
                          <option value="ai">AI Automation</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Star Rating *</label>
                        <select
                          className="form-input"
                          value={testimonialModal.rating}
                          onChange={(e) => setTestimonialModal((prev) => ({ ...prev, rating: Number(e.target.value) }))}
                        >
                          <option value={5}>5 Stars ★★★★★</option>
                          <option value={4}>4 Stars ★★★★☆</option>
                          <option value={3}>3 Stars ★★★☆☆</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label className="form-label">Review Content *</label>
                      <textarea
                        rows={3}
                        required
                        className="form-input"
                        placeholder="What did the client say about our speed, communication, and quality?"
                        value={testimonialModal.content}
                        onChange={(e) => setTestimonialModal((prev) => ({ ...prev, content: e.target.value }))}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => setTestimonialModal((prev) => ({ ...prev, isOpen: false }))}
                        className="btn btn-outline"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-cta-yellow">
                        {testimonialModal.mode === 'add' ? 'Save Review' : 'Update Review'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB: FAQS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'faqs' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, marginBottom: '0.35rem' }}>
                  Frequently Asked Questions ({(faqsData || []).length})
                </h1>
                <p style={{ color: 'var(--text-body)', fontSize: '0.95rem' }}>
                  Answers to client queries about low-budget delivery, timelines, hosting, and AI setups.
                </p>
              </div>

              <button
                onClick={() =>
                  setFaqModal({
                    isOpen: true,
                    mode: 'add',
                    id: null,
                    category: 'General',
                    question: '',
                    answer: ''
                  })
                }
                className="btn btn-cta-yellow"
                style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <Plus size={16} />
                <span>Add FAQ</span>
              </button>
            </div>

            {/* Category Filter */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
              {['all', 'Pricing & Budget', 'Timeline & Delivery', 'Technology & Security', 'AI & Automation', 'Support & Maintenance'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFaqCategoryFilter(cat)}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: 'var(--radius-full)',
                    border: faqCategoryFilter === cat ? '1px solid #1d5cf0' : '1px solid var(--border-subtle)',
                    background: faqCategoryFilter === cat ? 'rgba(29, 92, 240, 0.15)' : 'transparent',
                    color: faqCategoryFilter === cat ? '#1d5cf0' : 'var(--text-body)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {cat === 'all' ? 'All Categories' : cat}
                </button>
              ))}
            </div>

            {/* FAQs List */}
            {(faqsData || []).filter(f => faqCategoryFilter === 'all' || f.category === faqCategoryFilter).length === 0 ? (
              <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                No FAQs found in this category.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(faqsData || [])
                  .filter((f) => faqCategoryFilter === 'all' || f.category === faqCategoryFilter)
                  .map((faq) => (
                    <div
                      key={faq.id}
                      className="card"
                      style={{
                        padding: '1.25rem 1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                        <div>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              background: 'rgba(29, 92, 240, 0.1)',
                              color: '#1d5cf0',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              display: 'inline-block',
                              marginBottom: '0.4rem'
                            }}
                          >
                            {faq.category || 'General'}
                          </span>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                            {faq.question}
                          </h3>
                        </div>

                        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                          <button
                            onClick={() =>
                              setFaqModal({
                                isOpen: true,
                                mode: 'edit',
                                id: faq.id,
                                category: faq.category || 'General',
                                question: faq.question,
                                answer: faq.answer
                              })
                            }
                            className="btn btn-outline"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <Edit2 size={13} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteFaq(faq.id, faq.question)}
                            className="btn btn-outline"
                            style={{ padding: '0.35rem 0.6rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                            title="Delete FAQ"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <p style={{ fontSize: '0.9rem', color: 'var(--text-body)', lineHeight: 1.5, margin: 0 }}>
                        {faq.answer}
                      </p>
                    </div>
                  ))}
              </div>
            )}

            {/* FAQ Edit/Add Modal */}
            {faqModal.isOpen && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 9998,
                  background: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1rem'
                }}
              >
                <div
                  className="card"
                  style={{
                    maxWidth: '520px',
                    width: '100%',
                    padding: '2rem',
                    maxHeight: '90vh',
                    overflowY: 'auto'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>
                      {faqModal.mode === 'add' ? 'Add FAQ' : 'Edit FAQ'}
                    </h3>
                    <button
                      onClick={() => setFaqModal((prev) => ({ ...prev, isOpen: false }))}
                      style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleSaveFaqModal}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label className="form-label">Category *</label>
                      <select
                        className="form-input"
                        value={faqModal.category}
                        onChange={(e) => setFaqModal((prev) => ({ ...prev, category: e.target.value }))}
                      >
                        <option value="General">General</option>
                        <option value="Pricing & Budget">Pricing & Budget</option>
                        <option value="Timeline & Delivery">Timeline & Delivery</option>
                        <option value="Technology & Security">Technology & Security</option>
                        <option value="AI & Automation">AI & Automation</option>
                        <option value="Support & Maintenance">Support & Maintenance</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label className="form-label">Question *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="e.g. Can you build a full website in under a week?"
                        value={faqModal.question}
                        onChange={(e) => setFaqModal((prev) => ({ ...prev, question: e.target.value }))}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label className="form-label">Answer *</label>
                      <textarea
                        rows={4}
                        required
                        className="form-input"
                        placeholder="Provide a clear, reassuring answer with specifics..."
                        value={faqModal.answer}
                        onChange={(e) => setFaqModal((prev) => ({ ...prev, answer: e.target.value }))}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => setFaqModal((prev) => ({ ...prev, isOpen: false }))}
                        className="btn btn-outline"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-cta-yellow">
                        {faqModal.mode === 'add' ? 'Save FAQ' : 'Update FAQ'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: ENQUIRIES / LEADS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'enquiries' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, marginBottom: '0.35rem' }}>
                  Customer Enquiries ({enquiries.length})
                </h1>
                <p style={{ color: 'var(--text-body)', fontSize: '0.95rem' }}>
                  Leads generated from the website form. Call or message them immediately on WhatsApp.
                </p>
              </div>

              <button
                type="button"
                onClick={exportEnquiriesCSV}
                className="btn btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.88rem', fontWeight: 600 }}
              >
                <Download size={16} />
                <span>Export to CSV</span>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div
              className="card"
              style={{
                padding: '1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1rem',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              {/* Search */}
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search by name, phone, or requirements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '36px' }}
                />
              </div>

              {/* Status Filter Tabs */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {['All', 'New', 'Overdue', 'Contacted', 'Closed'].map((st) => {
                  const isOverdueTab = st === 'Overdue';
                  const isSelected = statusFilter === st;
                  return (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: 'var(--radius-full)',
                        border: isSelected
                          ? isOverdueTab ? '1px solid #ef4444' : '1px solid #1d5cf0'
                          : isOverdueTab && overdueEnquiriesCount > 0 ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--border-subtle)',
                        background: isSelected
                          ? isOverdueTab ? 'rgba(239,68,68,0.15)' : 'rgba(29,92,240,0.15)'
                          : 'transparent',
                        color: isSelected
                          ? isOverdueTab ? '#ef4444' : '#1d5cf0'
                          : isOverdueTab && overdueEnquiriesCount > 0 ? '#ef4444' : 'var(--text-body)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {st} {isOverdueTab && overdueEnquiriesCount > 0 ? `(${overdueEnquiriesCount})` : ''}
                    </button>
                  );
                })}
              </div>

              {/* Service Filter Dropdown */}
              <select
                className="form-input"
                style={{ width: 'auto', minWidth: '150px' }}
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
              >
                <option value="All">All Services</option>
                <option value="Web">Web Development</option>
                <option value="App">App Development</option>
                <option value="AI">AI Automation</option>
              </select>

              {/* Source Filter Dropdown */}
              <select
                className="form-input"
                style={{ width: 'auto', minWidth: '150px' }}
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <option value="All">All Sources</option>
                <option value="project">Project Builder</option>
                <option value="callback">Callback Request</option>
                <option value="contact">Contact Form</option>
                <option value="quote">Fast Quote</option>
                <option value="chatbot">AI Chatbot Leads</option>
              </select>
            </div>

            {/* Enquiries List */}
            {filteredEnquiries.length === 0 ? (
              <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                No enquiries match your search criteria.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredEnquiries.map((enq) => {
                  const whatsappUrl = `https://wa.me/91${enq.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(enq.name)}%2C%20Lingaswamy%20from%20ZippyTechSystems%20here.%20I%20received%20your%20quote%20request%20for%20${encodeURIComponent(enq.service || 'our services')}.`;

                  const isOverdue =
                    enq.status === 'New' &&
                    (enq.isOverdue ||
                      (enq.created_at && Date.now() - new Date(enq.created_at).getTime() >= 24 * 60 * 60 * 1000));

                  let servicesList = [];
                  if (Array.isArray(enq.selected_services)) {
                    servicesList = enq.selected_services;
                  } else if (typeof enq.selected_services === 'string') {
                    try {
                      servicesList = JSON.parse(enq.selected_services);
                    } catch (e) {
                      servicesList = [];
                    }
                  }

                  return (
                    <div
                      key={enq.id}
                      className="card"
                      style={{
                        padding: '1.25rem 1.5rem',
                        borderLeft: isOverdue
                          ? '4px solid #ef4444'
                          : enq.status === 'New'
                          ? '4px solid #ffe500'
                          : enq.status === 'Contacted'
                          ? '4px solid #1d5cf0'
                          : '4px solid #94a3b8'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                              {enq.name}
                            </h3>

                            {/* 24-Hour SLA / Status Badge */}
                            {isOverdue ? (
                              <span
                                style={{
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  color: '#ef4444',
                                  border: '1px solid rgba(239, 68, 68, 0.35)',
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <AlertCircle size={12} /> Overdue (&gt; 24h)
                              </span>
                            ) : enq.status === 'New' ? (
                              <span
                                style={{
                                  background: 'rgba(18, 161, 80, 0.12)',
                                  color: '#12a150',
                                  border: '1px solid rgba(18, 161, 80, 0.3)',
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Clock size={12} /> Within 24h
                              </span>
                            ) : null}

                            {/* Source Badge */}
                            {enq.source === 'project' ? (
                              <span
                                style={{
                                  background: 'rgba(29, 92, 240, 0.15)',
                                  color: '#60a5fa',
                                  border: '1px solid rgba(96, 165, 250, 0.35)',
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Sliders size={12} /> Project Builder
                              </span>
                            ) : enq.source === 'callback' ? (
                              <span
                                style={{
                                  background: 'rgba(18, 161, 80, 0.15)',
                                  color: '#4ade80',
                                  border: '1px solid rgba(74, 222, 128, 0.35)',
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Phone size={12} /> Callback Request
                              </span>
                            ) : enq.source === 'chatbot' ? (
                              <span
                                style={{
                                  background: 'rgba(122, 47, 208, 0.15)',
                                  color: '#c084fc',
                                  border: '1px solid rgba(168, 85, 247, 0.35)',
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Bot size={12} /> AI Chatbot
                              </span>
                            ) : enq.source === 'quote' ? (
                              <span
                                style={{
                                  background: 'rgba(255, 229, 0, 0.12)',
                                  color: '#ffe500',
                                  border: '1px solid rgba(255, 229, 0, 0.3)',
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <BadgePercent size={12} /> Fast Quote
                              </span>
                            ) : (
                              <span
                                style={{
                                  background: 'rgba(148, 163, 184, 0.15)',
                                  color: '#cbd5e1',
                                  border: '1px solid rgba(148, 163, 184, 0.3)',
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Send size={12} /> Contact Form
                              </span>
                            )}

                            <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                              • {new Date(enq.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.88rem', color: '#1d5cf0', fontWeight: 600, marginTop: '0.25rem' }}>
                            {enq.service}
                          </div>

                          {/* Email & Details */}
                          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '0.35rem', fontSize: '0.85rem' }}>
                            {enq.email && (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-body)' }}>
                                <Mail size={13} color="#94a3b8" />
                                <a href={`mailto:${enq.email}`} style={{ color: '#1d5cf0', textDecoration: 'none' }}>
                                  {enq.email}
                                </a>
                              </div>
                            )}
                            {enq.whatsapp_opt_in && (
                              <span style={{ color: '#12a150', fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Check size={13} /> WhatsApp opt-in confirmed
                              </span>
                            )}
                          </div>

                          {/* Selected Services Tags */}
                          {servicesList.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>Services:</span>
                              {servicesList.map((srv, sIdx) => (
                                <span
                                  key={sIdx}
                                  style={{
                                    background: 'rgba(29, 92, 240, 0.1)',
                                    color: '#60a5fa',
                                    border: '1px solid rgba(29, 92, 240, 0.25)',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600
                                  }}
                                >
                                  {srv}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Notes */}
                          {enq.notes && (
                            <div style={{ marginTop: '0.4rem', fontSize: '0.82rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                              <strong>Notes:</strong> {enq.notes}
                            </div>
                          )}
                        </div>

                        {/* Status Dropdown */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>Status:</span>
                          <select
                            value={enq.status}
                            onChange={(e) => {
                              updateEnquiryStatus(enq.id, e.target.value);
                              showToast(`Lead status updated to ${e.target.value}`);
                            }}
                            className="form-input"
                            style={{
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              width: 'auto',
                              borderColor:
                                enq.status === 'New'
                                  ? '#ffe500'
                                  : enq.status === 'Contacted'
                                  ? '#1d5cf0'
                                  : 'var(--border-subtle)'
                            }}
                          >
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </div>
                      </div>

                      {/* Message Body */}
                      {enq.message && (
                        <div
                          style={{
                            background: 'var(--bg-surface)',
                            padding: '0.85rem 1rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            color: 'var(--text-body)',
                            lineHeight: 1.5,
                            marginBottom: '1rem'
                          }}
                        >
                          "{enq.message}"
                        </div>
                      )}

                      {/* Row Action Footer */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.5rem' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          Phone: <a href={`tel:${enq.phone}`} style={{ color: '#1d5cf0', textDecoration: 'none' }}>{enq.phone}</a>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <a
                            href={`tel:${enq.phone}`}
                            className="btn btn-outline"
                            style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            <Phone size={14} color="#12a150" />
                            <span>Call</span>
                          </a>

                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn"
                            style={{
                              background: '#12a150',
                              color: '#ffffff',
                              padding: '0.45rem 0.95rem',
                              fontSize: '0.82rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              border: 'none',
                              textDecoration: 'none'
                            }}
                          >
                            <MessageCircle size={14} />
                            <span>WhatsApp</span>
                          </a>

                          <button
                            onClick={() =>
                              openConfirm(
                                'Delete Enquiry',
                                `Delete enquiry from ${enq.name}?`,
                                async () => {
                                  await deleteEnquiry(enq.id);
                                  showToast('Enquiry deleted.', 'error');
                                }
                              )
                            }
                            className="btn btn-outline"
                            style={{ padding: '0.45rem 0.65rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                            title="Delete Lead"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5: SETTINGS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'settings' && (
          <div>
            <div style={{ marginBottom: '1.75rem' }}>
              <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, marginBottom: '0.35rem' }}>
                Site &amp; Contact Settings
              </h1>
              <p style={{ color: 'var(--text-body)', fontSize: '0.95rem' }}>
                Configure phone numbers, WhatsApp routing, prefilled message text, and company taglines.
              </p>
            </div>

            <div className="card" style={{ maxWidth: '680px', padding: '2rem' }}>
              <form onSubmit={handleSaveSettings}>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Founder &amp; Solutions Architect Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settingsForm.founderName || 'Lingaswamy Maddeboina'}
                    onChange={(e) => setSettingsForm({ ...settingsForm, founderName: e.target.value })}
                  />
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                    Used across website badges, about pages, chatbot system prompt, and WhatsApp communications.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label">Phone Number (Calling)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={settingsForm.phone || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Business WhatsApp Number (Bot Number)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={settingsForm.whatsappNumber || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Default WhatsApp Prefilled Greeting</label>
                  <textarea
                    rows={2}
                    className="form-input"
                    value={settingsForm.defaultWhatsAppMessage || 'Hi Lingaswamy, I would like to get a quote for my business.'}
                    onChange={(e) => setSettingsForm({ ...settingsForm, defaultWhatsAppMessage: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Primary Brand Tagline</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settingsForm.tagline || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Secondary Tagline</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settingsForm.secondaryTagline || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, secondaryTagline: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Office Location</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settingsForm.location || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, location: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label">Instagram Profile URL</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://www.instagram.com/zippytechsystems"
                      value={settingsForm.instagramUrl || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, instagramUrl: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">YouTube Channel URL</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://www.youtube.com/@zippytechsystems"
                      value={settingsForm.youtubeUrl || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, youtubeUrl: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label">Facebook Page URL</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://www.facebook.com/zippytechsystems"
                      value={settingsForm.facebookUrl || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, facebookUrl: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">LinkedIn Profile / Company URL</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://www.linkedin.com/company/zippytechsystems"
                      value={settingsForm.linkedinUrl || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, linkedinUrl: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                  <label className="form-label">Response Time Target</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="24 hours"
                    value={settingsForm.responseTimeText || '24 hours'}
                    onChange={(e) => setSettingsForm({ ...settingsForm, responseTimeText: e.target.value })}
                  />
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                    Used on customer confirmation banners and Project Builder (e.g. "We will contact you within 24 hours").
                  </div>
                </div>

                {/* Business Info (AI Chatbot Knowledge) */}
                <div style={{ marginTop: '1.75rem', marginBottom: '1.5rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem', color: '#1d5cf0' }}>
                    Business Info (AI Chatbot Knowledge Base)
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                    Leave any field blank if not applicable. The AI Chatbot will ONLY mention non-empty fields. If a client asks about an empty field, the chatbot will politely offer WhatsApp handoff.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div className="form-group">
                      <label className="form-label">Working Hours / Timings</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Mon - Sat: 9:00 AM - 8:00 PM"
                        value={settingsForm.workingHours || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, workingHours: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Support / Business Email</label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="contact@zippysoftwares.in"
                        value={settingsForm.email || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">Office / Physical Address</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Hyderabad, Telangana, India"
                      value={settingsForm.officeAddress || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, officeAddress: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">About ZippyTechSystems / Founder Note</label>
                    <textarea
                      rows={2}
                      className="form-input"
                      placeholder="Brief summary of founder Lingaswamy's focus on affordable web, app & AI solutions..."
                      value={settingsForm.aboutText || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, aboutText: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div className="form-group">
                      <label className="form-label">Languages Supported</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="English, Telugu, Hindi"
                        value={settingsForm.languagesSupported || 'English, Telugu, Hindi'}
                        onChange={(e) => setSettingsForm({ ...settingsForm, languagesSupported: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Delivery &amp; Turnaround Note</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Websites delivered in 3-5 days"
                        value={settingsForm.deliveryNote || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, deliveryNote: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* WhatsApp & Email Automation Settings */}
                <div style={{ marginTop: '1.75rem', marginBottom: '1.5rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem', color: '#12a150' }}>
                    WhatsApp &amp; Communication Automation
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                    Manage the 24/7 AI WhatsApp chatbot, Coexistence app pauses, and notification alerts.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                    {/* Master WhatsApp Bot Switch */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input
                        type="checkbox"
                        checked={settingsForm.whatsappBotEnabled ?? true}
                        onChange={(e) => setSettingsForm({ ...settingsForm, whatsappBotEnabled: e.target.checked })}
                        style={{ width: '18px', height: '18px', accentColor: '#12a150' }}
                      />
                      <span><strong>Enable WhatsApp AI Chatbot</strong> (AI replies automatically to customer WhatsApp messages)</span>
                    </label>

                    {/* Email Alert (Primary) */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input
                        type="checkbox"
                        checked={settingsForm.notifyEmailEnabled ?? true}
                        onChange={(e) => setSettingsForm({ ...settingsForm, notifyEmailEnabled: e.target.checked })}
                        style={{ width: '18px', height: '18px', accentColor: '#1d5cf0' }}
                      />
                      <span><strong>Send Admin Email Alerts (Primary)</strong> (Instant notification via Resend when new enquiry arrives)</span>
                    </label>

                    {/* WhatsApp Admin Alert (Optional, OFF by default) */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(settingsForm.waAdminAlertEnabled)}
                        onChange={(e) => setSettingsForm({ ...settingsForm, waAdminAlertEnabled: e.target.checked })}
                        style={{ width: '18px', height: '18px', accentColor: '#12a150' }}
                      />
                      <span><strong>Optional: WhatsApp Admin Alert</strong> (Requires personal number below; never sends to bot number)</span>
                    </label>
                  </div>

                  {/* Personal Number for WA Alerts */}
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">Personal WhatsApp Number for Admin Alerts (WA_ADMIN_TO)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 9876543210 (your personal number, NOT 6302690251)"
                      value={settingsForm.waAdminTo || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, waAdminTo: e.target.value })}
                    />
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                      <strong>Important:</strong> Must NOT be {settingsForm.whatsappNumber || '6302690251'} because Meta does not allow the bot to message itself. If left blank, WhatsApp admin alerts are skipped silently.
                    </div>
                  </div>

                  {/* Coexistence Pause Duration */}
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">Coexistence Mode: Human Reply Pause Duration (Hours)</label>
                    <input
                      type="number"
                      min={1}
                      max={72}
                      className="form-input"
                      value={settingsForm.humanPauseHours ?? 2}
                      onChange={(e) => setSettingsForm({ ...settingsForm, humanPauseHours: e.target.value })}
                    />
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                      When you reply to a customer from the WhatsApp Business mobile app on your phone, the AI assistant will automatically pause for this contact for {settingsForm.humanPauseHours || 2} hours. You can resume AI at any time in the admin inbox.
                    </div>
                  </div>

                  {/* Additional WhatsApp Automation Toggles */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem', background: 'var(--bg-surface)', padding: '1rem', borderRadius: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(settingsForm.whatsappAutoConfirm)}
                        onChange={(e) => setSettingsForm({ ...settingsForm, whatsappAutoConfirm: e.target.checked })}
                        style={{ accentColor: '#12a150' }}
                      />
                      <span>Enquiry Auto-Confirm</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(settingsForm.whatsappFollowups)}
                        onChange={(e) => setSettingsForm({ ...settingsForm, whatsappFollowups: e.target.checked })}
                        style={{ accentColor: '#12a150' }}
                      />
                      <span>Smart Follow-ups (24h)</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(settingsForm.dailySummaryEnabled)}
                        onChange={(e) => setSettingsForm({ ...settingsForm, dailySummaryEnabled: e.target.checked })}
                        style={{ accentColor: '#12a150' }}
                      />
                      <span>Daily Summary (9 PM)</span>
                    </label>
                  </div>

                  {/* Quiet Hours */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.82rem' }}>Quiet Hours Start (No outbound automations)</label>
                      <input
                        type="time"
                        className="form-input"
                        value={settingsForm.quietHoursStart || '22:00'}
                        onChange={(e) => setSettingsForm({ ...settingsForm, quietHoursStart: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.82rem' }}>Quiet Hours End</label>
                      <input
                        type="time"
                        className="form-input"
                        value={settingsForm.quietHoursEnd || '08:00'}
                        onChange={(e) => setSettingsForm({ ...settingsForm, quietHoursEnd: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Multilingual WhatsApp Auto-reply Templates */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '8px' }}>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                      Customer WhatsApp Message Templates (By Customer Language)
                    </h4>

                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>English Template</label>
                      <textarea
                        rows={2}
                        className="form-input"
                        value={settingsForm.waTemplateEn || 'Thank you for contacting ZippyTechSystems. We received your enquiry and will contact you within 24 hours.'}
                        onChange={(e) => setSettingsForm({ ...settingsForm, waTemplateEn: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Telugu (తెలుగు) Template</label>
                      <textarea
                        rows={2}
                        className="form-input"
                        value={settingsForm.waTemplateTe || 'ZippyTechSystems ను సంప్రదించినందుకు ధన్యవాదాలు. మీ విచారణ మాకు అందింది, మేము 24 గంటల్లో మిమ్మల్ని సంప్రదిస్తాము.'}
                        onChange={(e) => setSettingsForm({ ...settingsForm, waTemplateTe: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Hindi (हिन्दी) Template</label>
                      <textarea
                        rows={2}
                        className="form-input"
                        value={settingsForm.waTemplateHi || 'ZippyTechSystems से संपर्क करने के लिए धन्यवाद। हमें आपकी पूछताछ मिल गई है और हम 24 घंटे के भीतर आपसे संपर्क करेंगे।'}
                        onChange={(e) => setSettingsForm({ ...settingsForm, waTemplateHi: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn btn-cta-yellow" style={{ padding: '0.75rem 1.75rem', fontWeight: 700 }}>
                  Save Site Settings
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 6: AI CHATBOT CONFIGURATION */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'chatbot' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, marginBottom: '0.35rem' }}>
                  AI Chatbot Configuration
                </h1>
                <p style={{ color: 'var(--text-body)', fontSize: '0.95rem' }}>
                  Configure your customer enquiry assistant. Changes saved here take effect immediately on the live website.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span
                  style={{
                    padding: '0.4rem 0.9rem',
                    borderRadius: '9999px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    background: chatbotForm.enabled ? 'rgba(18, 161, 80, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: chatbotForm.enabled ? '#12a150' : '#ef4444',
                    border: chatbotForm.enabled ? '1px solid rgba(18, 161, 80, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                  }}
                >
                  {chatbotForm.enabled ? 'Chatbot Active' : 'Chatbot Disabled'}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.75rem', alignItems: 'start' }}>
              {/* Settings Form */}
              <div className="card" style={{ padding: '2rem' }}>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const res = await persistChatbotSettings(chatbotForm);
                    if (res.success) {
                      showToast('Chatbot settings saved successfully! Live bot updated immediately.');
                    } else {
                      showToast(res.error || 'Failed to save chatbot settings.', 'error');
                    }
                  }}
                >
                  {/* Master Enable/Disable */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Enable AI Chatbot Widget</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        Show floating chatbot on all public pages for customer enquiries
                      </div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={chatbotForm.enabled}
                        onChange={(e) => setChatbotForm({ ...chatbotForm, enabled: e.target.checked })}
                        style={{ width: '20px', height: '20px', accentColor: '#1d5cf0', cursor: 'pointer' }}
                      />
                    </label>
                  </div>

                  {/* Welcome Message */}
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">Welcome Greeting Message</label>
                    <textarea
                      rows={3}
                      className="form-input"
                      value={chatbotForm.welcomeMessage || ''}
                      onChange={(e) => setChatbotForm({ ...chatbotForm, welcomeMessage: e.target.value })}
                      placeholder="Hi! I am the ZippyTechSystems AI assistant..."
                    />
                  </div>

                  {/* Fallback Message */}
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">Fallback &amp; WhatsApp Handoff Message</label>
                    <textarea
                      rows={2}
                      className="form-input"
                      value={chatbotForm.fallbackMessage || ''}
                      onChange={(e) => setChatbotForm({ ...chatbotForm, fallbackMessage: e.target.value })}
                      placeholder="I would be happy to connect you with founder Lingaswamy..."
                    />
                  </div>

                  {/* Quick Replies Manager */}
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">Suggested Quick-Reply Chips</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.75rem' }}>
                      {(chatbotForm.quickReplies || []).map((chip, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: 'rgba(29, 92, 240, 0.15)',
                            color: '#93c5fd',
                            border: '1px solid rgba(29, 92, 240, 0.35)',
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.8rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {chip}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = chatbotForm.quickReplies.filter((_, i) => i !== idx);
                              setChatbotForm({ ...chatbotForm, quickReplies: updated });
                            }}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, display: 'flex' }}
                          >
                            <X size={13} />
                          </button>
                        </span>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Add a new quick reply chip..."
                        value={quickReplyInput}
                        onChange={(e) => setQuickReplyInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (quickReplyInput.trim()) {
                              setChatbotForm({
                                ...chatbotForm,
                                quickReplies: [...(chatbotForm.quickReplies || []), quickReplyInput.trim()]
                              });
                              setQuickReplyInput('');
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ whiteSpace: 'nowrap' }}
                        onClick={() => {
                          if (quickReplyInput.trim()) {
                            setChatbotForm({
                              ...chatbotForm,
                              quickReplies: [...(chatbotForm.quickReplies || []), quickReplyInput.trim()]
                            });
                            setQuickReplyInput('');
                          }
                        }}
                      >
                        <Plus size={16} /> Add
                      </button>
                    </div>
                  </div>

                  {/* Extra Prompt Instructions */}
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">
                      Extra System Instructions (Appended directly to AI prompt)
                    </label>
                    <textarea
                      rows={4}
                      className="form-input"
                      placeholder="Add any special instructions for Claude (e.g. Always emphasize our fast 3-5 day delivery, or remind clients that custom quotes are free on WhatsApp)..."
                      value={chatbotForm.extraInstructions || ''}
                      onChange={(e) => setChatbotForm({ ...chatbotForm, extraInstructions: e.target.value })}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                      These instructions are immediately injected into the Claude API system prompt on the very next message.
                    </div>
                  </div>

                  {/* Model & Daily Limit */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="form-group">
                      <label className="form-label">Claude Model</label>
                      <input
                        type="text"
                        className="form-input"
                        value={chatbotForm.model || 'claude-haiku-4-5-20251001'}
                        onChange={(e) => setChatbotForm({ ...chatbotForm, model: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Daily Calls Limit</label>
                      <input
                        type="number"
                        min="10"
                        max="5000"
                        className="form-input"
                        value={chatbotForm.dailyLimit || 500}
                        onChange={(e) => setChatbotForm({ ...chatbotForm, dailyLimit: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* AI Female Voice Agent Configuration */}
                  <div style={{ marginTop: '0.5rem', marginBottom: '1.5rem', padding: '1.25rem', background: 'rgba(29, 92, 240, 0.05)', borderRadius: '12px', border: '1px solid rgba(29, 92, 240, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                      <Mic size={18} color="#1d5cf0" />
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>AI Female Voice Agent (Azure Neural TTS)</div>
                    </div>

                    {/* Voice Toggle */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Enable Voice Mode</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          Provides floating voice button &amp; natural female speech synthesis
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={chatbotForm.voiceEnabled ?? true}
                        onChange={(e) => setChatbotForm({ ...chatbotForm, voiceEnabled: e.target.checked })}
                        style={{ width: '18px', height: '18px', accentColor: '#1d5cf0', cursor: 'pointer' }}
                      />
                    </div>

                    {/* Default Language & Speed Rate */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Default Voice Language</label>
                        <select
                          className="form-input"
                          style={{ fontSize: '0.85rem' }}
                          value={chatbotForm.voiceDefaultLang || 'en-IN'}
                          onChange={(e) => setChatbotForm({ ...chatbotForm, voiceDefaultLang: e.target.value })}
                        >
                          <option value="en-IN">English (India) - en-IN</option>
                          <option value="te-IN">Telugu (India) - te-IN</option>
                          <option value="hi-IN">Hindi (India) - hi-IN</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Speech Rate ({chatbotForm.voiceRate || 1.0}x)</label>
                        <input
                          type="range"
                          min="0.8"
                          max="1.2"
                          step="0.1"
                          className="form-input"
                          style={{ padding: '4px' }}
                          value={chatbotForm.voiceRate || 1.0}
                          onChange={(e) => setChatbotForm({ ...chatbotForm, voiceRate: parseFloat(e.target.value) })}
                        />
                      </div>
                    </div>

                    {/* Azure Female Voice Names */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>English Female Voice</label>
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: '0.8rem' }}
                          value={chatbotForm.voiceNameEn || 'en-IN-NeerjaNeural'}
                          onChange={(e) => setChatbotForm({ ...chatbotForm, voiceNameEn: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Telugu Female Voice</label>
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: '0.8rem' }}
                          value={chatbotForm.voiceNameTe || 'te-IN-ShrutiNeural'}
                          onChange={(e) => setChatbotForm({ ...chatbotForm, voiceNameTe: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Hindi Female Voice</label>
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: '0.8rem' }}
                          value={chatbotForm.voiceNameHi || 'hi-IN-SwaraNeural'}
                          onChange={(e) => setChatbotForm({ ...chatbotForm, voiceNameHi: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-cta-yellow" style={{ padding: '0.75rem 1.75rem', fontWeight: 700, width: '100%' }}>
                    Save Chatbot Configuration
                  </button>
                </form>
              </div>

              {/* Live Interactive Test Sandbox */}
              <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', height: '620px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Bot size={20} color="#1d5cf0" />
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Test Chatbot Sandbox</h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        Live interactive preview using current backend
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                    onClick={() => {
                      setTestChatMessages([
                        { role: 'assistant', content: chatbotForm.welcomeMessage || 'Hi! I am the ZippyTechSystems AI assistant. Test me right here in Admin!' }
                      ]);
                    }}
                  >
                    Reset Sandbox
                  </button>
                </div>

                {/* Sandbox Message Stream */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
                  {testChatMessages.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        padding: '8px 12px',
                        borderRadius: '12px',
                        background: m.role === 'user' ? '#1d5cf0' : 'var(--bg-surface)',
                        color: '#ffffff',
                        fontSize: '0.85rem',
                        border: m.role === 'user' ? 'none' : '1px solid var(--border-glass)',
                        lineHeight: 1.45,
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {m.content}
                    </div>
                  ))}

                  {isTestBotSending && (
                    <div style={{ alignSelf: 'flex-start', padding: '6px 12px', borderRadius: '12px', background: 'var(--bg-surface)', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                      Assistant is thinking...
                    </div>
                  )}
                </div>

                {/* Sandbox Input */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!testChatInput.trim() || isTestBotSending) return;

                    const userText = testChatInput.trim();
                    setTestChatInput('');

                    const nextMsgs = [...testChatMessages, { role: 'user', content: userText }];
                    setTestChatMessages(nextMsgs);
                    setIsTestBotSending(true);

                    try {
                      const { sendChatMessage } = await import('../lib/chatApi');
                      const res = await sendChatMessage({
                        sessionId: 'admin_test_session',
                        messages: nextMsgs,
                        pageUrl: '/admin'
                      });

                      setTestChatMessages((prev) => [
                        ...prev,
                        { role: 'assistant', content: res.reply }
                      ]);
                    } catch (err) {
                      setTestChatMessages((prev) => [
                        ...prev,
                        { role: 'assistant', content: 'Sandbox connection fallback: Chatbot responded.' }
                      ]);
                    } finally {
                      setIsTestBotSending(false);
                    }
                  }}
                  style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem' }}
                >
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Type a test question (e.g. Website prices?)..."
                    value={testChatInput}
                    onChange={(e) => setTestChatInput(e.target.value)}
                    disabled={isTestBotSending}
                  />
                  <button type="submit" className="btn btn-primary" disabled={isTestBotSending || !testChatInput.trim()} style={{ padding: '0 1rem' }}>
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </div>

            {/* Chatbot Knowledge Preview Box */}
            <div className="card" style={{ marginTop: '1.75rem', padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Eye size={20} color="#1d5cf0" />
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Chatbot Knowledge Preview</h3>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                      Shows exactly the structured live text the chatbot sees right now (output of buildKnowledge).
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    onClick={() => {
                      if (navigator?.clipboard) {
                        navigator.clipboard.writeText(currentChatbotKnowledge);
                      }
                      showToast('Chatbot knowledge preview copied to clipboard!');
                    }}
                  >
                    <Save size={14} /> Copy Knowledge
                  </button>
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <pre
                  style={{
                    background: 'rgba(11, 27, 74, 0.5)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    fontSize: '0.82rem',
                    fontFamily: 'monospace',
                    color: '#e2e8f0',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                    maxHeight: '380px',
                    overflowY: 'auto'
                  }}
                >
                  {currentChatbotKnowledge || 'No active knowledge found in database.'}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 7: CONVERSATIONS & TRANSCRIPTS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'conversations' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, marginBottom: '0.35rem' }}>
                  Customer Conversations ({chatSessions.length})
                </h1>
                <p style={{ color: 'var(--text-body)', fontSize: '0.95rem' }}>
                  Review live visitor questions, session transcripts, and leads captured by the AI chatbot.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-outline"
                onClick={() => loadChatSessions()}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <RefreshCw size={15} /> Refresh List
              </button>
            </div>

            {/* Split Pane: Sessions List & Transcript Viewer */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
              {/* Sessions List */}
              <div className="card" style={{ padding: '1.25rem', maxHeight: '680px', overflowY: 'auto' }}>
                {/* Channel Filter Pills */}
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  {['all', 'text', 'voice'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setChannelFilter(mode)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: '1px solid',
                        cursor: 'pointer',
                        background: channelFilter === mode ? '#1d5cf0' : 'transparent',
                        borderColor: channelFilter === mode ? '#1d5cf0' : 'var(--border-glass)',
                        color: channelFilter === mode ? '#ffffff' : 'var(--text-dim)'
                      }}
                    >
                      {mode === 'all' ? 'All Channels' : mode === 'voice' ? '🎙️ Voice' : '💬 Text'}
                    </button>
                  ))}
                </div>

                <div style={{ marginBottom: '1rem', position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search session or lead..."
                    value={conversationSearch}
                    onChange={(e) => setConversationSearch(e.target.value)}
                    style={{ paddingLeft: '32px', fontSize: '0.85rem' }}
                  />
                </div>

                {chatSessions.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                    No chat conversations recorded yet. Visitors using the widget will appear here.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {chatSessions
                      .filter((s) => {
                        const q = conversationSearch.toLowerCase();
                        return (
                          s.session_id.toLowerCase().includes(q) ||
                          (s.enquiries?.name || '').toLowerCase().includes(q) ||
                          (s.enquiries?.phone || '').includes(q)
                        );
                      })
                      .map((session) => {
                        const isSelected = selectedSessionId === session.session_id;
                        return (
                          <div
                            key={session.session_id}
                            onClick={async () => {
                              setSelectedSessionId(session.session_id);
                              setLoadingSessionMessages(true);
                              const msgs = await loadChatMessages(session.session_id);
                              setActiveSessionMessages(msgs || []);
                              setLoadingSessionMessages(false);
                            }}
                            style={{
                              padding: '0.85rem 1rem',
                              borderRadius: '10px',
                              background: isSelected ? 'rgba(29, 92, 240, 0.15)' : 'var(--bg-surface)',
                              border: isSelected ? '1px solid #1d5cf0' : '1px solid var(--border-glass)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isSelected ? '#1d5cf0' : 'var(--text-main)', fontFamily: 'monospace' }}>
                                {session.session_id.slice(0, 16)}...
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                                {new Date(session.last_message_at || session.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            {session.enquiries ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                <span style={{ background: 'rgba(18, 161, 80, 0.15)', color: '#12a150', border: '1px solid rgba(18, 161, 80, 0.3)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                                  Lead: {session.enquiries.name} ({session.enquiries.phone})
                                </span>
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                                Page: {session.page_url || '/'}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Active Transcript Pane */}
              <div className="card" style={{ padding: '1.5rem', minHeight: '480px', display: 'flex', flexDirection: 'column' }}>
                {!selectedSessionId ? (
                  <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-dim)' }}>
                    <MessageSquare size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>Select a conversation from the list to view the full customer transcript.</p>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                          Session: {selectedSessionId}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {activeSessionMessages.length} messages in conversation
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                        onClick={() => {
                          openConfirm(
                            'Delete Conversation',
                            'Are you sure you want to delete this conversation transcript?',
                            async () => {
                              await deleteChatSession(selectedSessionId);
                              setSelectedSessionId(null);
                              setActiveSessionMessages([]);
                              showToast('Conversation deleted.');
                            }
                          );
                        }}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>

                    {/* Messages List */}
                    {loadingSessionMessages ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>Loading transcript...</div>
                    ) : activeSessionMessages.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>No messages recorded for this session.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
                        {activeSessionMessages
                          .filter((msg) => {
                            if (channelFilter === 'voice') return msg.channel === 'voice';
                            if (channelFilter === 'text') return msg.channel !== 'voice';
                            return true;
                          })
                          .map((msg, i) => (
                            <div
                              key={msg.id || i}
                              style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                                padding: '10px 14px',
                                borderRadius: '12px',
                                background: msg.role === 'user' ? '#1d5cf0' : 'var(--bg-surface)',
                                color: '#ffffff',
                                fontSize: '0.88rem',
                                border: msg.role === 'user' ? 'none' : '1px solid var(--border-glass)',
                                lineHeight: 1.45
                              }}
                            >
                              <div style={{ fontSize: '0.7rem', color: msg.role === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--text-dim)', marginBottom: '3px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>{msg.role === 'user' ? 'Customer' : 'Zippy AI Assistant'}</span>
                                {msg.channel === 'voice' && (
                                  <span style={{ background: 'rgba(255, 229, 0, 0.2)', color: '#ffe500', padding: '1px 5px', borderRadius: '4px', fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                    🎙️ Voice
                                  </span>
                                )}
                                <span>• {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 7B: WHATSAPP LIVE INBOX & TAKEOVER */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'whatsapp' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, marginBottom: '0.35rem' }}>
                  WhatsApp Live Inbox ({whatsappContacts.length})
                </h1>
                <p style={{ color: 'var(--text-body)', fontSize: '0.95rem' }}>
                  Manage WhatsApp customer conversations, view app echoes, take over chats, and send Meta-approved templates.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    loadWhatsAppContacts();
                    if (selectedWaContactId) {
                      loadWhatsAppMessages(selectedWaContactId).then((m) => setWaMessages(m || []));
                    }
                    showToast('WhatsApp contacts refreshed');
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <RefreshCw size={15} /> Refresh Inbox
                </button>
              </div>
            </div>

            {/* Split Pane: Contacts List & Live Conversation */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
              {/* Left Column: Contacts List */}
              <div className="card" style={{ padding: '1.25rem', maxHeight: '720px', overflowY: 'auto' }}>
                {/* Status Filter Tabs */}
                <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'needs_human', label: '⚠️ Needs Human' },
                    { id: 'app', label: '📱 App Replied' },
                    { id: 'active', label: '🤖 AI Active' },
                    { id: 'opted_out', label: 'Opted Out' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setWaFilter(tab.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        border: '1px solid',
                        cursor: 'pointer',
                        background: waFilter === tab.id ? '#12a150' : 'transparent',
                        borderColor: waFilter === tab.id ? '#12a150' : 'var(--border-glass)',
                        color: waFilter === tab.id ? '#ffffff' : 'var(--text-dim)'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div style={{ marginBottom: '1rem', position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search phone or name..."
                    value={waSearch}
                    onChange={(e) => setWaSearch(e.target.value)}
                    style={{ paddingLeft: '32px', fontSize: '0.85rem' }}
                  />
                </div>

                {whatsappContacts.length === 0 ? (
                  <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                    <MessageCircle size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                    <p style={{ margin: 0 }}>No WhatsApp contacts yet. Customer messages to 6302690251 will appear here in real time.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {whatsappContacts
                      .filter((c) => {
                        const q = waSearch.toLowerCase();
                        const matchesSearch =
                          (c.phone || '').includes(q) ||
                          (c.name || '').toLowerCase().includes(q);
                        if (!matchesSearch) return false;

                        if (waFilter === 'needs_human') {
                          return c.status === 'needs_human' || c.isPaused;
                        }
                        if (waFilter === 'app') {
                          return c.isPaused && c.status === 'needs_human';
                        }
                        if (waFilter === 'active') {
                          return c.status === 'active' && !c.isPaused;
                        }
                        if (waFilter === 'opted_out') {
                          return c.opted_out || c.status === 'opted_out';
                        }
                        return true;
                      })
                      .map((c) => {
                        const isSelected = selectedWaContactId === c.id;
                        const windowInfo = getWaWindowInfo(c.last_customer_message_at);

                        return (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedWaContactId(c.id);
                              if (c.name) setWaTemplateVar1(c.name);
                            }}
                            style={{
                              padding: '0.85rem 1rem',
                              borderRadius: '10px',
                              background: isSelected ? 'rgba(18, 161, 80, 0.15)' : 'var(--bg-surface)',
                              border: isSelected ? '1px solid #12a150' : '1px solid var(--border-glass)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: isSelected ? '#12a150' : 'var(--text-main)' }}>
                                {c.name || `+${c.phone}`}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                                {c.language ? c.language.toUpperCase() : 'EN'}
                              </span>
                            </div>

                            {c.name && (
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.35rem', fontFamily: 'monospace' }}>
                                +{c.phone}
                              </div>
                            )}

                            {/* Status Pills */}
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                              {c.opted_out ? (
                                <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700 }}>
                                  Opted Out
                                </span>
                              ) : c.isPaused || c.status === 'needs_human' ? (
                                <span style={{ background: 'rgba(122, 47, 208, 0.15)', color: '#a855f7', border: '1px solid rgba(122, 47, 208, 0.3)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700 }}>
                                  Human Replied (AI Paused)
                                </span>
                              ) : (
                                <span style={{ background: 'rgba(18, 161, 80, 0.15)', color: '#12a150', border: '1px solid rgba(18, 161, 80, 0.3)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700 }}>
                                  AI Active
                                </span>
                              )}

                              <span style={{ background: windowInfo.isOpen ? 'rgba(29, 92, 240, 0.15)' : 'rgba(255, 255, 255, 0.05)', color: windowInfo.isOpen ? '#1d5cf0' : 'var(--text-dim)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.68rem' }}>
                                {windowInfo.isOpen ? `Window: ${windowInfo.hours}h left` : 'Window Closed'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Right Column: Chat Transcript & Actions */}
              <div className="card" style={{ padding: '1.5rem', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
                {!selectedWaContact ? (
                  <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-dim)', padding: '2rem' }}>
                    <MessageCircle size={44} style={{ margin: '0 auto 1rem', opacity: 0.5, color: '#12a150' }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>Select a WhatsApp Conversation</h3>
                    <p style={{ margin: 0, fontSize: '0.88rem', maxWidth: '360px' }}>
                      Pick any contact from the left to view the live message transcript, take over from AI, or reply directly.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
                    {/* Header Bar */}
                    <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                          <div style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{selectedWaContact.name || `+${selectedWaContact.phone}`}</span>
                            <span style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                              Lang: {(selectedWaContact.language || 'en').toUpperCase()}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '2px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <span>+{selectedWaContact.phone}</span>
                            <a href={`https://wa.me/${selectedWaContact.phone}`} target="_blank" rel="noopener noreferrer" style={{ color: '#12a150', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                              <ExternalLink size={12} /> Open WhatsApp App
                            </a>
                            <a href={`tel:+${selectedWaContact.phone}`} style={{ color: '#1d5cf0', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                              <Phone size={12} /> Call Client
                            </a>
                          </div>
                        </div>

                        {/* AI Takeover / Resume Toggle */}
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          {selectedWaContact.isPaused || selectedWaContact.status === 'needs_human' ? (
                            <button
                              type="button"
                              onClick={() => handleResumeChatAi(selectedWaContact.id)}
                              className="btn btn-cta-yellow"
                              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              <Play size={14} /> Resume AI Automation
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleTakeOverChat(selectedWaContact.id)}
                              className="btn btn-outline"
                              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#eab308', borderColor: '#eab308' }}
                            >
                              <Pause size={14} /> Take Over Chat (Pause AI)
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 24-Hour Window & AI Status Banner */}
                      <div style={{ marginTop: '0.85rem' }}>
                        {selectedWaContact.isPaused || selectedWaContact.status === 'needs_human' ? (
                          <div style={{ background: 'rgba(122, 47, 208, 0.12)', border: '1px solid rgba(122, 47, 208, 0.3)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <Smartphone size={16} />
                            <span>
                              <strong>Human Takeover Active:</strong> AI replies are paused for this contact.
                              {selectedWaContact.ai_paused_until && ` Resumes automatically at ${new Date(selectedWaContact.ai_paused_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`}
                            </span>
                          </div>
                        ) : null}

                        {(() => {
                          const windowInfo = getWaWindowInfo(selectedWaContact.last_customer_message_at);
                          return windowInfo.isOpen ? (
                            <div style={{ background: 'rgba(18, 161, 80, 0.1)', border: '1px solid rgba(18, 161, 80, 0.25)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', color: '#12a150', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Clock size={15} />
                              <span>
                                <strong>24-Hour Window Open:</strong> You can send free-form text messages. Remaining: {windowInfo.hours}h {windowInfo.mins}m.
                              </span>
                            </div>
                          ) : (
                            <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.25)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', color: '#eab308', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <AlertCircle size={15} />
                              <span>
                                <strong>24-Hour Window Closed:</strong> More than 24h passed since customer&apos;s last message. Meta requires an approved template to message this contact.
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Messages Transcript Scroll Area */}
                    <div style={{ flex: 1, minHeight: '320px', maxHeight: '420px', overflowY: 'auto', paddingRight: '6px', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                      {loadingWaMessages ? (
                        <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.88rem' }}>Loading conversation history...</div>
                      ) : waMessages.length === 0 ? (
                        <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.88rem' }}>No messages recorded yet with this contact.</div>
                      ) : (
                        waMessages.map((msg) => {
                          const isInbound = msg.direction === 'inbound';
                          const isApp = msg.source === 'app';
                          const isBot = msg.source === 'bot';
                          const isAdmin = msg.source === 'admin';
                          const isAuto = msg.source === 'automation';

                          return (
                            <div
                              key={msg.id}
                              style={{
                                alignSelf: isInbound ? 'flex-start' : 'flex-end',
                                maxWidth: '82%',
                                padding: '10px 14px',
                                borderRadius: '12px',
                                background: isInbound
                                  ? 'var(--bg-surface)'
                                  : isApp
                                  ? 'linear-gradient(135deg, #7a2fd0 0%, #9333ea 100%)'
                                  : isAdmin
                                  ? '#1d5cf0'
                                  : '#0b1b4a',
                                color: '#ffffff',
                                fontSize: '0.88rem',
                                border: isInbound ? '1px solid var(--border-glass)' : '1px solid rgba(255,255,255,0.1)',
                                lineHeight: 1.45,
                                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                              }}
                            >
                              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', marginBottom: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'space-between' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  {isInbound && '👤 Customer'}
                                  {isApp && '📱 Phone App (You)'}
                                  {isBot && '🤖 Zippy AI Assistant'}
                                  {isAdmin && '👨‍💼 Admin Reply'}
                                  {isAuto && '⚡ Automation Queue'}
                                </span>
                                <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>

                              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                {msg.content}
                              </div>

                              {/* Outbound Delivery Status Ticks */}
                              {!isInbound && (
                                <div style={{ fontSize: '0.68rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', marginTop: '4px', color: 'rgba(255,255,255,0.75)' }}>
                                  {msg.status === 'read' ? (
                                    <span style={{ color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 700 }}>
                                      <CheckCheck size={13} /> Read
                                    </span>
                                  ) : msg.status === 'delivered' ? (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                      <CheckCheck size={13} /> Delivered
                                    </span>
                                  ) : msg.status === 'sent' ? (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                      <Check size={13} /> Sent
                                    </span>
                                  ) : msg.status === 'failed' ? (
                                    <span style={{ color: '#fca5a5', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                      <AlertCircle size={13} /> Failed
                                    </span>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Reply & Template Sender Box */}
                    <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1rem', marginTop: 'auto' }}>
                      {/* Mode Tabs */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <button
                          type="button"
                          onClick={() => setWaSendMode('text')}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            border: '1px solid',
                            cursor: 'pointer',
                            background: waSendMode === 'text' ? '#1d5cf0' : 'transparent',
                            borderColor: waSendMode === 'text' ? '#1d5cf0' : 'var(--border-glass)',
                            color: waSendMode === 'text' ? '#ffffff' : 'var(--text-dim)'
                          }}
                        >
                          💬 Free-form Message
                        </button>
                        <button
                          type="button"
                          onClick={() => setWaSendMode('template')}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            border: '1px solid',
                            cursor: 'pointer',
                            background: waSendMode === 'template' ? '#12a150' : 'transparent',
                            borderColor: waSendMode === 'template' ? '#12a150' : 'var(--border-glass)',
                            color: waSendMode === 'template' ? '#ffffff' : 'var(--text-dim)'
                          }}
                        >
                          📋 Meta Approved Template
                        </button>
                      </div>

                      {waSendMode === 'text' ? (
                        <form onSubmit={handleSendWaReply}>
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                            <textarea
                              rows={2}
                              className="form-input"
                              placeholder={
                                getWaWindowInfo(selectedWaContact.last_customer_message_at).isOpen
                                  ? 'Type your reply message to customer...'
                                  : '24-hour window closed. Please switch to "Meta Approved Template" above.'
                              }
                              disabled={!getWaWindowInfo(selectedWaContact.last_customer_message_at).isOpen || waSending}
                              value={waReplyText}
                              onChange={(e) => setWaReplyText(e.target.value)}
                              style={{ flex: 1, resize: 'none', fontSize: '0.88rem' }}
                            />
                            <button
                              type="submit"
                              disabled={!getWaWindowInfo(selectedWaContact.last_customer_message_at).isOpen || waSending || !waReplyText.trim()}
                              className="btn btn-cta-yellow"
                              style={{ padding: '0.65rem 1.25rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                            >
                              <Send size={15} />
                              {waSending ? 'Sending...' : 'Send'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <form onSubmit={handleSendWaReply}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.75rem' }}>Template</label>
                              <select
                                className="form-input"
                                value={waSelectedTemplateName}
                                onChange={(e) => setWaSelectedTemplateName(e.target.value)}
                                style={{ fontSize: '0.82rem' }}
                              >
                                <option value="enquiry_confirmation">enquiry_confirmation (Utility)</option>
                                <option value="follow_up">follow_up (Utility)</option>
                                <option value="thank_you">thank_you (Utility)</option>
                              </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.75rem' }}>Variable 1: Customer Name</label>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Customer Name"
                                value={waTemplateVar1}
                                onChange={(e) => setWaTemplateVar1(e.target.value)}
                                style={{ fontSize: '0.82rem' }}
                              />
                            </div>

                            {waSelectedTemplateName !== 'thank_you' && (
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Variable 2: Service / Project</label>
                                <input
                                  type="text"
                                  className="form-input"
                                  placeholder="Web Development / App / AI"
                                  value={waTemplateVar2}
                                  onChange={(e) => setWaTemplateVar2(e.target.value)}
                                  style={{ fontSize: '0.82rem' }}
                                />
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              type="submit"
                              disabled={waSending}
                              className="btn"
                              style={{ background: '#12a150', color: '#ffffff', padding: '0.65rem 1.25rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                            >
                              <Send size={15} />
                              {waSending ? 'Sending Template...' : 'Send Approved Template'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 8: SERVICE AREAS & OPERATING LOCATIONS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'serviceAreas' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, marginBottom: '0.35rem' }}>
                  Service Areas &amp; Locations ({serviceAreas.length})
                </h1>
                <p style={{ color: 'var(--text-body)', fontSize: '0.95rem' }}>
                  Locations where ZippyTechSystems provides services. The AI Chatbot uses these real locations to answer customer enquiries.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-cta-yellow"
                onClick={() =>
                  setServiceAreaModal({
                    isOpen: true,
                    mode: 'add',
                    id: null,
                    name: '',
                    notes: '',
                    sort_order: serviceAreas.length,
                    is_active: true
                  })
                }
                style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700 }}
              >
                <Plus size={16} /> Add Location
              </button>
            </div>

            {serviceAreas.length === 0 ? (
              <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                No service areas added yet. Click &quot;Add Location&quot; to define your service coverage.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {serviceAreas.map((area) => (
                  <div key={area.id} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MapPin size={18} color="#1d5cf0" />
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{area.name}</h3>
                        </div>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            background: area.is_active ? 'rgba(18, 161, 80, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: area.is_active ? '#12a150' : '#ef4444'
                          }}
                        >
                          {area.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {area.notes && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', margin: '0.5rem 0', lineHeight: 1.4 }}>
                          {area.notes}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem', marginTop: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        Sort order: {area.sort_order}
                      </span>

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ padding: '0.35rem 0.65rem' }}
                          onClick={() =>
                            setServiceAreaModal({
                              isOpen: true,
                              mode: 'edit',
                              id: area.id,
                              name: area.name,
                              notes: area.notes || '',
                              sort_order: area.sort_order,
                              is_active: area.is_active
                            })
                          }
                          title="Edit Location"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ padding: '0.35rem 0.65rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                          onClick={() => {
                            openConfirm(
                              'Delete Location',
                              `Are you sure you want to remove "${area.name}"?`,
                              async () => {
                                await deleteServiceArea(area.id);
                                showToast('Location removed.');
                              }
                            );
                          }}
                          title="Delete Location"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Service Area Modal */}
            {serviceAreaModal.isOpen && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 9999,
                  background: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1rem'
                }}
              >
                <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                      {serviceAreaModal.mode === 'add' ? 'Add Service Area' : 'Edit Service Area'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setServiceAreaModal((prev) => ({ ...prev, isOpen: false }))}
                      style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!serviceAreaModal.name.trim()) return;

                      if (serviceAreaModal.mode === 'add') {
                        await addServiceArea({
                          name: serviceAreaModal.name.trim(),
                          notes: serviceAreaModal.notes.trim(),
                          sort_order: parseInt(serviceAreaModal.sort_order, 10) || 0,
                          is_active: serviceAreaModal.is_active
                        });
                        showToast('New location added successfully!');
                      } else {
                        await editServiceArea(serviceAreaModal.id, {
                          name: serviceAreaModal.name.trim(),
                          notes: serviceAreaModal.notes.trim(),
                          sort_order: parseInt(serviceAreaModal.sort_order, 10) || 0,
                          is_active: serviceAreaModal.is_active
                        });
                        showToast('Location updated successfully!');
                      }

                      setServiceAreaModal((prev) => ({ ...prev, isOpen: false }));
                    }}
                  >
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label className="form-label">City / Region Name</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="e.g. Hyderabad, Secunderabad, Online (All India)"
                        value={serviceAreaModal.name}
                        onChange={(e) => setServiceAreaModal({ ...serviceAreaModal, name: e.target.value })}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label className="form-label">Notes (Optional)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. In-person meetings & remote delivery available"
                        value={serviceAreaModal.notes}
                        onChange={(e) => setServiceAreaModal({ ...serviceAreaModal, notes: e.target.value })}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div className="form-group">
                        <label className="form-label">Sort Order</label>
                        <input
                          type="number"
                          className="form-input"
                          value={serviceAreaModal.sort_order}
                          onChange={(e) => setServiceAreaModal({ ...serviceAreaModal, sort_order: e.target.value })}
                        />
                      </div>

                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <label className="form-label">Status</label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '6px' }}>
                          <input
                            type="checkbox"
                            checked={serviceAreaModal.is_active}
                            onChange={(e) => setServiceAreaModal({ ...serviceAreaModal, is_active: e.target.checked })}
                            style={{ width: '18px', height: '18px', accentColor: '#1d5cf0' }}
                          />
                          <span style={{ fontSize: '0.85rem' }}>Active Location</span>
                        </label>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => setServiceAreaModal((prev) => ({ ...prev, isOpen: false }))}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary">
                        {serviceAreaModal.mode === 'add' ? 'Add Location' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* DESIGN & MOTION SETTINGS TAB (PHASE 2) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'design' && (
          <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <SlidersHorizontal size={24} color="#1d5cf0" />
                  <span>Design &amp; Motion Settings</span>
                </h1>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
                  Control dynamic visual effects and hardware performance tiers. Toggles apply immediately to live visitors.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setDesignForm(DEFAULT_DESIGN_SETTINGS);
                    showToast('Settings reset to system defaults. Click Save to publish.');
                  }}
                  className="btn btn-outline"
                  style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
                >
                  <RefreshCw size={15} />
                  <span>Reset to Defaults</span>
                </button>

                <button
                  type="button"
                  disabled={savingDesign}
                  onClick={async () => {
                    setSavingDesign(true);
                    const res = await persistDesignSettings(designForm);
                    setSavingDesign(false);
                    if (res?.success) {
                      showToast('Design settings saved and live on Hostinger!', 'success');
                    } else {
                      showToast(res?.error || 'Failed to save design settings.', 'error');
                    }
                  }}
                  className="btn btn-primary"
                  style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
                >
                  <Save size={15} />
                  <span>{savingDesign ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>
            </div>

            {/* Performance Tier Card */}
            <div className="card" style={{ padding: '1.75rem', background: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(29, 92, 240, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Compass size={18} color="#1d5cf0" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Device Quality Tier Override</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', margin: 0 }}>
                    Automatically detects visitor hardware capability, network data-saver, and prefers-reduced-motion.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {[
                  { value: 'auto', title: 'Auto (Recommended)', desc: 'Detects GPU, memory & data-saver mode' },
                  { value: 'full', title: 'Force Full Tier', desc: 'Enables all animations on desktop' },
                  { value: 'lite', title: 'Force Lite Tier', desc: 'Conserves mobile battery & data' },
                  { value: 'reduced', title: 'Force Reduced Motion', desc: 'Disables transitions & animations' }
                ].map((tierOpt) => {
                  const isSelected = designForm.quality_override === tierOpt.value;
                  return (
                    <div
                      key={tierOpt.value}
                      onClick={() => setDesignForm((prev) => ({ ...prev, quality_override: tierOpt.value }))}
                      style={{
                        padding: '1rem',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid #1d5cf0' : '1px solid var(--border-subtle)',
                        background: isSelected ? 'rgba(29, 92, 240, 0.08)' : 'var(--bg-card)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? '#1d5cf0' : 'var(--text-main)' }}>
                          {tierOpt.title}
                        </span>
                        {isSelected && <CheckCircle2 size={16} color="#1d5cf0" />}
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.4, display: 'block' }}>
                        {tierOpt.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hero Section Visual Experience */}
            <div className="card" style={{ padding: '1.75rem', background: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(18, 161, 80, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Eye size={18} color="#12a150" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Hero Section Visual Experience</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', margin: 0 }}>
                    Select the background style rendered behind the headline on the home page.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { value: 'mesh', title: 'Ambient Mesh Float', desc: 'Soft floating brand color orbs (Fast, zero layout shift)' },
                  { value: '3d', title: '3D Floating Objects', desc: 'Interactive brand geometric shapes (Full tier only)' },
                  { value: 'gradient', title: 'Clean Linear Gradient', desc: 'Ultra-lightweight static brand gradient' }
                ].map((styleOpt) => {
                  const isSelected = designForm.hero_style === styleOpt.value;
                  return (
                    <div
                      key={styleOpt.value}
                      onClick={() => setDesignForm((prev) => ({ ...prev, hero_style: styleOpt.value }))}
                      style={{
                        padding: '1rem',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid #12a150' : '1px solid var(--border-subtle)',
                        background: isSelected ? 'rgba(18, 161, 80, 0.08)' : 'var(--bg-card)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? '#12a150' : 'var(--text-main)' }}>
                          {styleOpt.title}
                        </span>
                        {isSelected && <CheckCircle2 size={16} color="#12a150" />}
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.4, display: 'block' }}>
                        {styleOpt.desc}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Optional Video Background Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>Optional Video Background URL (.mp4 / .webm)</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://.../video.mp4 (optional)"
                    value={designForm.video_background_url || ''}
                    onChange={(e) => setDesignForm((prev) => ({ ...prev, video_background_url: e.target.value }))}
                    style={{ fontSize: '0.88rem' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>Video Poster Image URL (fallback image)</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://.../poster.webp (optional)"
                    value={designForm.video_poster_url || ''}
                    onChange={(e) => setDesignForm((prev) => ({ ...prev, video_poster_url: e.target.value }))}
                    style={{ fontSize: '0.88rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Individual Feature Toggles */}
            <div className="card" style={{ padding: '1.75rem', background: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(122, 47, 208, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SlidersHorizontal size={18} color="#7a2fd0" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Interactive Effects &amp; Micro-Animations</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', margin: 0 }}>
                    Enable or disable specific visual effects across the entire site with zero redeploy needed.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {[
                  { key: 'magnetic_buttons_enabled', label: 'Magnetic CTA Buttons', desc: 'Pulls primary buttons subtly toward mouse on desktop fine pointer' },
                  { key: 'particles_enabled', label: 'Ambient Particle Drift', desc: 'Floating micro-particles in hero and domain preview sections' },
                  { key: 'cursor_effect_enabled', label: 'Cursor Follower Glow', desc: 'Subtle glowing trail following pointer on capable desktop hardware' },
                  { key: 'parallax_enabled', label: 'Parallax Layer Depth', desc: 'Smooth multi-plane scroll depth on section backgrounds' },
                  { key: 'horizontal_portfolio_enabled', label: 'Horizontal Portfolio Reel', desc: 'Enhanced side-scrolling project reel on wide desktop screens' },
                  { key: 'lottie_enabled', label: 'Lottie Vector Icons', desc: 'Smooth animated SVG icons for domain headers and packages' },
                  { key: 'tooltip_enabled', label: 'Rich Floating Tooltips', desc: 'Interactive info hints on price tags and technology badges' }
                ].map((toggle) => {
                  const isChecked = Boolean(designForm[toggle.key]);
                  return (
                    <div
                      key={toggle.key}
                      onClick={() => setDesignForm((prev) => ({ ...prev, [toggle.key]: !prev[toggle.key] }))}
                      style={{
                        padding: '1rem',
                        borderRadius: '10px',
                        border: isChecked ? '1px solid rgba(122, 47, 208, 0.35)' : '1px solid var(--border-subtle)',
                        background: isChecked ? 'rgba(122, 47, 208, 0.05)' : 'var(--bg-card)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.85rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by parent onClick
                        style={{
                          width: '18px',
                          height: '18px',
                          accentColor: '#7a2fd0',
                          marginTop: '2px',
                          cursor: 'pointer'
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isChecked ? '#c084fc' : 'var(--text-main)', marginBottom: '2px' }}>
                          {toggle.label}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                          {toggle.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Save Reminder */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '2rem' }}>
              <button
                type="button"
                disabled={savingDesign}
                onClick={async () => {
                  setSavingDesign(true);
                  const res = await persistDesignSettings(designForm);
                  setSavingDesign(false);
                  if (res?.success) {
                    showToast('Design settings saved and live on Hostinger!', 'success');
                  } else {
                    showToast(res?.error || 'Failed to save design settings.', 'error');
                  }
                }}
                className="btn btn-primary"
                style={{ padding: '0.7rem 1.75rem', fontSize: '0.92rem' }}
              >
                <Save size={16} />
                <span>{savingDesign ? 'Saving Changes...' : 'Save Design Settings'}</span>
              </button>
            </div>
          </div>
        )}
      </main>


      {/* ------------------------------------------------------------- */}
      {/* MOBILE BOTTOM TAB BAR (Visible on mobile screens < 768px) */}
      {/* ------------------------------------------------------------- */}
      <nav
        className="admin-bottom-nav"
        style={{
          display: 'none',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '64px',
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-glass)',
          zIndex: 1000,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.25)',
          overflowX: 'auto',
          justifyContent: 'flex-start',
          alignItems: 'center',
          gap: '8px',
          padding: '0 0.75rem',
          scrollbarWidth: 'none'
        }}
      >
        {navItems.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                background: 'none',
                border: 'none',
                color: active ? '#1d5cf0' : 'var(--text-dim)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                fontSize: '0.68rem',
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                position: 'relative',
                padding: '6px 8px',
                flexShrink: 0,
                minWidth: '56px'
              }}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '4px',
                    background: '#ffe500',
                    color: '#0b1b4a',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Responsive media styles for Sidebar vs Bottom Nav */}
      <style>{`
        @media (max-width: 768px) {
          .admin-sidebar {
            display: none !important;
          }
          .admin-bottom-nav {
            display: flex !important;
          }
          .mobile-admin-header {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
