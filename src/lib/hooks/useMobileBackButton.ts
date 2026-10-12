import { useEffect, useRef } from 'react';
import { App as CapApp } from '@capacitor/app';

export interface BackButtonHandlers {
  activeCall?: any;
  endCall?: () => void;
  detailFeed?: any;
  setDetailFeed?: (v: any) => void;
  selectedPostDetail?: any;
  setSelectedPostDetail?: (v: any) => void;
  selectedJobDetail?: any;
  setSelectedJobDetail?: (v: any) => void;
  applyingJob?: any;
  setApplyingJob?: (v: any) => void;
  editingFeedJob?: any;
  setEditingFeedJob?: (v: any) => void;
  editingFeedPost?: any;
  setEditingFeedPost?: (v: any) => void;
  showPostFormGlobal?: boolean;
  setShowPostFormGlobal?: (v: boolean) => void;
  relocatingPost?: any;
  setRelocatingPost?: (v: any) => void;
  sharingJob?: any;
  setSharingJob?: (v: any) => void;
  showMobileMenu?: boolean;
  setShowMobileMenu?: (v: boolean) => void;
  showNotifications?: boolean;
  setShowNotifications?: (v: boolean) => void;
  showAdmin?: boolean;
  setShowAdmin?: (v: boolean) => void;
  selectedChat?: any;
  setSelectedChat?: (v: any) => void;
  selectedProfile?: any;
  setSelectedProfile?: (v: any) => void;
  isEditingProfile?: boolean;
  setIsEditingProfile?: (v: boolean) => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  addToast?: (msg: string, type?: any) => void;
}

/**
 * Universal Mobile Hardware & Browser Back Button Hook.
 * Handles the Android exit/back button step-by-step like social media apps:
 * 1. Closes open overlays / modal sheets.
 * 2. Returns from chats / profiles / tabs back to home.
 * 3. On root home screen: prompts "Press again to exit" before exiting.
 */
export function useMobileBackButton(handlers: BackButtonHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const lastBackPressTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleBackAction = () => {
      const h = handlersRef.current;

      // 1. Calling overlay
      if (h.activeCall?.show && h.endCall) {
        h.endCall();
        return true;
      }

      // 2. Full-screen detail feeds & modals
      if (h.detailFeed && h.setDetailFeed) {
        h.setDetailFeed(null);
        return true;
      }

      if (h.applyingJob && h.setApplyingJob) {
        h.setApplyingJob(null);
        return true;
      }

      if (h.selectedPostDetail && h.setSelectedPostDetail) {
        h.setSelectedPostDetail(null);
        return true;
      }

      if (h.selectedJobDetail && h.setSelectedJobDetail) {
        h.setSelectedJobDetail(null);
        return true;
      }

      // 3. Edit & creation modals
      if (h.editingFeedJob && h.setEditingFeedJob) {
        h.setEditingFeedJob(null);
        return true;
      }

      if (h.editingFeedPost && h.setEditingFeedPost) {
        h.setEditingFeedPost(null);
        return true;
      }

      if (h.showPostFormGlobal && h.setShowPostFormGlobal) {
        h.setShowPostFormGlobal(false);
        return true;
      }

      if (h.relocatingPost && h.setRelocatingPost) {
        h.setRelocatingPost(null);
        return true;
      }

      if (h.sharingJob && h.setSharingJob) {
        h.setSharingJob(null);
        return true;
      }

      // 4. Drawers & side menus
      if (h.showMobileMenu && h.setShowMobileMenu) {
        h.setShowMobileMenu(false);
        return true;
      }

      if (h.showNotifications && h.setShowNotifications) {
        h.setShowNotifications(false);
        return true;
      }

      if (h.showAdmin && h.setShowAdmin) {
        h.setShowAdmin(false);
        return true;
      }

      // 5. In-app sub-views & conversations
      if (h.selectedChat && h.setSelectedChat) {
        h.setSelectedChat(null);
        return true;
      }

      if (h.isEditingProfile && h.setIsEditingProfile) {
        h.setIsEditingProfile(false);
        return true;
      }

      if (h.selectedProfile && h.setSelectedProfile) {
        h.setSelectedProfile(null);
        if (h.setActiveTab) h.setActiveTab('home');
        return true;
      }

      // 6. Non-home tabs -> return to home tab
      if (h.activeTab && h.activeTab !== 'home' && h.setActiveTab) {
        h.setActiveTab('home');
        return true;
      }

      // 7. At Root Home view: Double-tap back to exit
      const now = Date.now();
      if (now - lastBackPressTimeRef.current < 2000) {
        // Exit app on native Capacitor
        try {
          CapApp.exitApp();
        } catch (_) {
          // In browser, allow default exit
        }
        return false;
      } else {
        lastBackPressTimeRef.current = now;
        if (h.addToast) {
          h.addToast('اضغط مرة أخرى للخروج من التطبيق ↩️');
        }
        return true;
      }
    };

    // ── 1. Capacitor Native Hardware Back Button (Android) ──
    let capListenerHandle: any = null;
    try {
      CapApp.addListener('backButton', () => {
        handleBackAction();
      }).then(handle => {
        capListenerHandle = handle;
      }).catch(err => {
        // Fallback silently if not in native environment
      });
    } catch (_) {}

    // ── 2. Web Browser popstate (Mobile Browser / PWA) ──
    const handlePopState = (e: PopStateEvent) => {
      const handled = handleBackAction();
      if (handled) {
        // Push a state back so the history stack remains alive for future back presses
        window.history.pushState({ prolinkBackHandled: true }, document.title);
      }
    };

    // Seed an initial history entry so popstate fires reliably
    window.history.pushState({ prolinkRoot: true }, document.title);
    window.addEventListener('popstate', handlePopState);

    return () => {
      if (capListenerHandle && typeof capListenerHandle.remove === 'function') {
        capListenerHandle.remove();
      }
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
}
