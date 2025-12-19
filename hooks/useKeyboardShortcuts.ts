import { useEffect, useCallback } from 'react';

export interface ShortcutAction {
    key: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    action: () => void;
    description: string;
}

export const useKeyboardShortcuts = (
    shortcuts: ShortcutAction[],
    enabled: boolean = true
) => {
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!enabled) return;

        // Skip if user is typing in an input field
        const target = event.target as HTMLElement;
        if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
        ) {
            // Only allow Escape to work in input fields
            if (event.key !== 'Escape') return;
        }

        for (const shortcut of shortcuts) {
            const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
            const ctrlMatch = !!shortcut.ctrlKey === event.ctrlKey;
            const shiftMatch = !!shortcut.shiftKey === event.shiftKey;
            const altMatch = !!shortcut.altKey === event.altKey;

            if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
                event.preventDefault();
                shortcut.action();
                return;
            }
        }
    }, [shortcuts, enabled]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
};

export default useKeyboardShortcuts;
