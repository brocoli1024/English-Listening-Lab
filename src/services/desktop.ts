import { Platform } from 'react-native';
import type { DesktopBridge } from '../../desktop/contracts';
export function getDesktopBridge(): DesktopBridge | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  return (window as Window & { listeningLab?: DesktopBridge }).listeningLab ?? null;
}
