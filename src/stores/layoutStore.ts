import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LayoutState {
  // Panel visibility
  showFilePanel: boolean;
  showSessionList: boolean;
  showChatPane: boolean;
  showFileTree: boolean;
  showNotesList: boolean;
  showWebPreview: boolean;
  
  // Selected file
  selectedFile: string | null;
  
  // Web preview
  webPreviewUrl: string | null;
  
  // Active tab
  activeTab: string;
  
  // Chat conversation list tab
  conversationListTab: string;
  
  // Left panel tab selection
  selectedLeftPanelTab: string;
  
  // Last route
  lastRoute: string;
  
  // Actions
  setFilePanel: (visible: boolean) => void;
  setSessionList: (visible: boolean) => void;
  setNotesList: (visible: boolean) => void;
  setChatPane: (visible: boolean) => void;
  setFileTree: (visible: boolean) => void;
  setWebPreview: (visible: boolean) => void;
  toggleSessionList: () => void;
  toggleNotesList: () => void;
  toggleChatPane: () => void;
  toggleFileTree: () => void;
  toggleWebPreview: () => void;
  setWebPreviewUrl: (url: string | null) => void;
  openFile: (filePath: string) => void;
  closeFile: () => void;
  setActiveTab: (tab: string) => void;
  setConversationListTab: (tab: string) => void;
  setSelectedLeftPanelTab: (tab: string) => void;
  setLastRoute: (route: string) => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set, _get) => ({
      // Initial state
      showFilePanel: false,
      showSessionList: true,
      showChatPane: true,
      showFileTree: true,
      showNotesList: true,
      showWebPreview: false,
      selectedFile: null,
      webPreviewUrl: null,
      activeTab: 'chat',
      conversationListTab: 'sessions',
      selectedLeftPanelTab: 'files',
      lastRoute: '/',
      
      // Actions
      setFilePanel: (visible) => set({ showFilePanel: visible }),
      setSessionList: (visible) => set({ showSessionList: visible }),
      setNotesList: (visible) => set({ showNotesList: visible }),
      setChatPane: (visible) => set({ showChatPane: visible }),
      setFileTree: (visible) => set({ showFileTree: visible }),
      setWebPreview: (visible) => set({ showWebPreview: visible }),
      
      toggleSessionList: () => set((state) => ({ 
        showSessionList: !state.showSessionList 
      })),
      
      toggleNotesList: () => set((state) => ({ 
        showNotesList: !state.showNotesList 
      })),
      
      toggleChatPane: () => set((state) => ({ showChatPane: !state.showChatPane })),
      toggleFileTree: () => set((state) => ({ showFileTree: !state.showFileTree })),
      toggleWebPreview: () => set((state) => ({ showWebPreview: !state.showWebPreview })),
      
      setWebPreviewUrl: (url) => set({ 
        webPreviewUrl: url,
        showWebPreview: url !== null 
      }),
      
      openFile: (filePath) => {
        console.log('layoutStore: openFile called with', filePath);
        set({ 
          selectedFile: filePath, 
          showFilePanel: true 
        });
      },
      
      closeFile: () => set({ 
        selectedFile: null, 
        showFilePanel: false 
      }),
      
      setActiveTab: (tab) => set({ activeTab: tab }),
      
      setConversationListTab: (tab) => set({ conversationListTab: tab }),
      
      setSelectedLeftPanelTab: (tab) => set({ selectedLeftPanelTab: tab }),
      
      setLastRoute: (route) => set({ lastRoute: route }),
    }),
    {
      name: 'layout-store',
      partialize: (state) => ({
        showSessionList: state.showSessionList,
        showChatPane: state.showChatPane,
        showFileTree: state.showFileTree,
        showNotesList: state.showNotesList,
        activeTab: state.activeTab,
        conversationListTab: state.conversationListTab,
        selectedLeftPanelTab: state.selectedLeftPanelTab,
        lastRoute: state.lastRoute,
      }),
    }
  )
);