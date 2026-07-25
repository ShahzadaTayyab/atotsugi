export type Msg = {
  role: "system" | "user" | "assistant";
  content: string;
};
