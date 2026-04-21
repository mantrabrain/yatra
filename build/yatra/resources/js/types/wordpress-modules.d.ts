declare module "@wordpress/server-side-render" {
  const ServerSideRender: import("react").ComponentType<{
    block: string;
    /** Block attributes are plugin-defined; keep loose for typed block interfaces. */
    attributes?: object;
  }>;
  export default ServerSideRender;
}
