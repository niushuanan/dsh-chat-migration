import type { ComposerAddOwnerProps, ComposerAddProps } from '../contract/slots.ts';
type ComposerCommandActionProps = ComposerAddOwnerProps & Pick<ComposerAddProps, 't'>;
export declare function ComposerCommandAction({ disabled, commandMenuOpen, onToggleCommandMenu, focusInput, t, }: ComposerCommandActionProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=ComposerCommandAction.d.ts.map