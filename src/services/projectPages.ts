import { Linking } from 'react-native';
import pages from '../../desktop/project-links.json';
import { getDesktopBridge } from './desktop';
export type ProjectPage = keyof typeof pages;
export async function openProjectPage(page: ProjectPage): Promise<void> {
  const bridge = getDesktopBridge();
  if (bridge) await bridge.openProjectPage(page);
  else await Linking.openURL(pages[page]);
}
