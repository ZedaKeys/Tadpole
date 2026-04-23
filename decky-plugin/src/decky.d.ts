// Extend ButtonItem to include the `smol` prop used by Decky UI
// This prop is supported at runtime but missing from the type definitions
declare module "@decky/ui" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface ButtonItemProps extends Record<string, any> {
    smol?: boolean;
  }
}
