interface BackendContext {
  playSound(filePath: string): Promise<void>;
}

let _context: BackendContext = {
  playSound: async () => {},
};

export function setBackendContext(context: BackendContext) {
  _context = context;
}

export const backendContext = new Proxy(
  {},
  {
    get: (_, prop) => {
      if (prop in _context) {
        return _context[prop as keyof BackendContext];
      }
      throw new Error(
        `Property ${String(prop)} does not exist on BackendContext`
      );
    },
  }
) as BackendContext;
