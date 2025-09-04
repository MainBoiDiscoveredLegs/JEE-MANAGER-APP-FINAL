// Allow importing .jsx modules without explicit type declarations
declare module '*.jsx' {
  const Component: any;
  export default Component;
}