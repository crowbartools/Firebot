export type BaseParameter = {
  /**
   * The title of the parameter
   */
  title: string;
  /**
   * The description of the parameter
   */
  description?: string;
  /**
   * Shown under the parameter as muted text
   */
  tip?: string;
  sortOrder?: number;
  validation?: {
    required?: boolean;
  };
};

export type StringParameter = BaseParameter & {
  type: "string";
  placeholder?: string;
  useTextArea?: boolean;
  default: string;
};

export type BooleanParameter = BaseParameter & {
  type: "boolean";
  default: boolean;
};

export type NumberParameter = BaseParameter & {
  type: "number";
  placeholder?: string;
  default: number;
  validation?: {
    min?: number;
    max?: number;
  };
};

export type FilepathParameter = BaseParameter & {
  type: "filepath";
  fileOptions?: {
    directoryOnly: boolean;
    filters: Array<{
      name: string;
      extensions: string[];
    }>;
    title: string;
    buttonLabel: string;
  };
};

export type FirebotParameter =
  | StringParameter
  | NumberParameter
  | BooleanParameter
  | FilepathParameter;

export type ParametersConfig<P> = {
  [K in keyof P]: P[K] extends string
    ? StringParameter | FilepathParameter
    : P[K] extends number
      ? NumberParameter
      : P[K] extends boolean
        ? BooleanParameter
        : FirebotParameter;
};

export type FirebotParamCategory<ParamConfig extends Record<string, unknown>> =
  {
    title?: string;
    /**
     * Used to sort the category in the UI
     * Lower numbers are shown first, higher numbers are shown last.
     */
    sortOrder?: number;
    parameters: ParametersConfig<ParamConfig>;
  };

export type FirebotParams = Record<string, Record<string, unknown>>;

export type FirebotParameterCategories<Config extends FirebotParams> = {
  [Category in keyof Config]: FirebotParamCategory<Config[Category]>;
};
