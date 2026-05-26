import React from 'react';
import type { IntlShape } from 'react-intl';
import { MoreHorizontal, Plus, Settings2, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Button, buttonVariants } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import { panelTabDropdownIconRowClass } from './PanelTabAddPanelDefinitionsSubmenus';

const addPanelMenuContentClassName = 'max-h-[min(24rem,70vh)] overflow-y-auto';

const tabIconButtonClassName = cn(
  buttonVariants({ variant: 'ghost', size: 'icon' }),
  'ros-dockview-tab-action h-8 w-8 shrink-0 font-normal focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 ring-offset-background [&_svg]:size-3.5',
);

export interface PanelTabActionsProps {
  compact: boolean;
  hasSettings: boolean;
  onOpenSettings: () => void;
  onClose: () => void;
  addPanelSubmenus: React.ReactNode;
  formatMessage: IntlShape['formatMessage'];
}

export const PanelTabActions: React.FC<PanelTabActionsProps> = ({
  compact,
  hasSettings,
  onOpenSettings,
  onClose,
  addPanelSubmenus,
  formatMessage,
}) => {
  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={tabIconButtonClassName}
            title={formatMessage({ id: 'layout.panelTab.moreTitle' })}
            aria-label={formatMessage({ id: 'layout.panelTab.moreAria' })}
            data-testid="panel-tab-more-button"
          >
            <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className={addPanelMenuContentClassName}
          onClick={(e) => e.stopPropagation()}
        >
          {hasSettings && (
            <DropdownMenuItem
              className={panelTabDropdownIconRowClass}
              data-testid="panel-tab-settings-button"
              onSelect={() => {
                onOpenSettings();
              }}
            >
              <Settings2 className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
              {formatMessage({ id: 'layout.panelTab.openSettings' })}
            </DropdownMenuItem>
          )}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <Plus className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
              {formatMessage({ id: 'layout.panelTab.addPanelSubmenu' })}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className={addPanelMenuContentClassName}>
              {addPanelSubmenus}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem
            className={cn(
              panelTabDropdownIconRowClass,
              'text-destructive focus:bg-destructive/10 focus:text-destructive',
            )}
            data-testid="panel-tab-close-button"
            onSelect={() => {
              onClose();
            }}
          >
            <X className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
            {formatMessage({ id: 'layout.panelTab.closePanel' })}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      {hasSettings && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={tabIconButtonClassName}
          title={formatMessage({ id: 'layout.panelTab.openSettingsTitle' })}
          aria-label={formatMessage({ id: 'layout.panelTab.openSettingsAria' })}
          data-testid="panel-tab-settings-button"
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
            onOpenSettings();
          }}
        >
          <Settings2 className="h-3.5 w-3.5" aria-hidden />
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={tabIconButtonClassName}
            title={formatMessage({ id: 'layout.panelTab.addPanelTitle' })}
            aria-label={formatMessage({ id: 'layout.panelTab.addPanelAria' })}
            data-testid="panel-tab-add-button"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className={addPanelMenuContentClassName}
          onClick={(e) => e.stopPropagation()}
        >
          {addPanelSubmenus}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={tabIconButtonClassName}
        title={formatMessage({ id: 'layout.panelTab.closePanelTitle' })}
        aria-label={formatMessage({ id: 'layout.panelTab.closePanelAria' })}
        data-testid="panel-tab-close-button"
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          onClose();
        }}
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </Button>
    </>
  );
};
