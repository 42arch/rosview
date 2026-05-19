import React from 'react';
import type { RosViewExtensionContext, SidebarTabContribution } from '@/core/extensions/types';

interface SidebarExtensionHostProps {
  contribution: SidebarTabContribution;
  context: RosViewExtensionContext;
}

class ExtensionRenderBoundary extends React.Component<{ extensionId: string; children: React.ReactNode }, { hasError: boolean }> {
  state: { hasError: boolean } = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    console.error(`[RosView] sidebar extension "${this.props.extensionId}" crashed`, error);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

export const SidebarExtensionHost: React.FC<SidebarExtensionHostProps> = ({ contribution, context }) => {
  return (
    <ExtensionRenderBoundary extensionId={contribution.id}>
      {contribution.render(context)}
    </ExtensionRenderBoundary>
  );
};
