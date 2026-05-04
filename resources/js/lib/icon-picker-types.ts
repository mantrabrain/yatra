export type IconProvider = "yatra" | "fa-solid" | "fa-regular";

export type IconPickerValue = {
  type: "icon" | "image";
  value: string;
  /** Defaults to yatra (Lucide / icons.json registry) when omitted */
  provider?: IconProvider;
};
